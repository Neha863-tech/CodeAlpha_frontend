/**
 * ============================================================================
 * NOCTURNE MUSIC PLAYER — script.js
 * ----------------------------------------------------------------------------
 * ENGINEERING NOTES (for the interview writeup):
 *
 * 1. STATE-DRIVEN PLAYLIST ENGINE
 *    `playerState` is the only source of truth for which track is loaded,
 *    whether it's playing, shuffle/repeat, and volume. The native <audio>
 *    element is the actual playback engine; every button, slider, and the
 *    queue list are just views wired to read and write this one object.
 *    Switching tracks is one function (`loadTrack`) that updates state,
 *    reassigns `audio.src`, and re-renders — never a chain of ad-hoc DOM
 *    edits scattered across click handlers.
 *
 * 2. AUDIO PROMISE SAFETY (the "Uncaught (in promise) DOMException" fix)
 *    HTMLMediaElement.play() returns a Promise that only resolves once the
 *    browser has actually started playback. If a user double-clicks play/
 *    pause fast, or code calls .pause() while that promise is still
 *    pending, Chrome throws an AbortError. `safePlay()` keeps a reference
 *    to the in-flight promise; `safePause()` checks that reference and, if
 *    a play() is still pending, chains the pause *after* it settles instead
 *    of calling pause() on top of it. AbortErrors that do surface are
 *    caught and treated as expected control flow, not logged as bugs.
 *
 * 3. PROGRESS BAR AS A DERIVED VIEW
 *    The slider's fill is a single CSS custom property (--fill) written on
 *    every `timeupdate` tick — no extra DOM nodes for "elapsed" vs
 *    "remaining" bars. While the user is actively dragging the slider
 *    (`isScrubbing`), the `timeupdate` handler backs off so it doesn't
 *    fight the user's own input events for control of the thumb position.
 *
 * 4. EVENT DELEGATION
 *    The queue list gets ONE click listener on its <ul>, not one per <li>.
 *    Re-rendering the queue (e.g. after a shuffle) never requires rewiring
 *    listeners, because there aren't any per-item listeners to rewire.
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. TRACK DATA
     Publicly streamable placeholder audio (SoundHelix's open test tracks)
     paired with royalty-free Unsplash cover art, requested at a fixed
     width so covers never over-fetch pixels for a 240px vinyl.
     ========================================================================== */
  const TRACKS = [
    { title: 'Midnight Frequency', artist: 'Nocturne Collective', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&q=80' },
    { title: 'Neon Static', artist: 'Vela Kite', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80' },
    { title: 'Glass Horizon', artist: 'Nocturne Collective', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', cover: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&q=80' },
    { title: 'Low Orbit', artist: 'Reiko Tide', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500&q=80' },
    { title: 'Afterglow', artist: 'Vela Kite', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', cover: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=500&q=80' },
    { title: 'Static Bloom', artist: 'Reiko Tide', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80' }
  ];

  /* ==========================================================================
     2. CENTRALIZED STATE
     ========================================================================== */
  const playerState = {
    tracks: TRACKS,
    currentTrackIndex: 0,
    isPlaying: false,
    isMuted: false,
    isShuffle: false,
    isRepeat: false,
    previousVolume: 0.75
  };

  let currentPlayPromise = null; // tracked for the promise-safety pattern, note #2
  let isScrubbing = false;       // true while the user is dragging the progress thumb

  /* ==========================================================================
     3. DOM REFERENCES
     ========================================================================== */
  const els = {
    audio: document.getElementById('audioEl'),
    vinyl: document.getElementById('vinyl'),
    coverArt: document.getElementById('coverArt'),
    eq: document.getElementById('eq'),
    trackTitle: document.getElementById('trackTitle'),
    trackArtist: document.getElementById('trackArtist'),

    progressSlider: document.getElementById('progressSlider'),
    currentTime: document.getElementById('currentTime'),
    remainingTime: document.getElementById('remainingTime'),

    playBtn: document.getElementById('playBtn'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    repeatBtn: document.getElementById('repeatBtn'),

    muteBtn: document.getElementById('muteBtn'),
    volIconHigh: document.getElementById('volIconHigh'),
    volIconMuted: document.getElementById('volIconMuted'),
    volumeSlider: document.getElementById('volumeSlider'),

    queueList: document.getElementById('queueList'),
    queueCount: document.getElementById('queueCount'),
    queuePanel: document.getElementById('queuePanel'),
    queueToggle: document.getElementById('queueToggle'),
    queueClose: document.getElementById('queueClose')
  };

  /* ==========================================================================
     4. HELPERS
     ========================================================================== */
  function getCurrentTrack() {
    return playerState.tracks[playerState.currentTrackIndex];
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  /* ==========================================================================
     5. PLAYBACK ENGINE
     ========================================================================== */

  /** Promise-safe play (see file header, note #2). */
  function safePlay() {
    currentPlayPromise = els.audio.play();
    if (currentPlayPromise === undefined) {
      // Older browsers: play() doesn't return a promise at all.
      playerState.isPlaying = true;
      syncPlayVisuals();
      return;
    }
    currentPlayPromise
      .then(() => {
        currentPlayPromise = null;
        playerState.isPlaying = true;
        syncPlayVisuals();
      })
      .catch((err) => {
        currentPlayPromise = null;
        if (err.name === 'AbortError') return; // interrupted by a rapid pause()/track change — expected
        console.error('Playback failed:', err);
        playerState.isPlaying = false;
        syncPlayVisuals();
      });
  }

  /** Promise-safe pause (see file header, note #2). */
  function safePause() {
    if (currentPlayPromise) {
      currentPlayPromise.then(() => els.audio.pause()).catch(() => {});
    } else {
      els.audio.pause();
    }
    playerState.isPlaying = false;
    syncPlayVisuals();
  }

  function togglePlay() {
    if (playerState.isPlaying) safePause();
    else safePlay();
  }

  function loadTrack(index, options) {
    const autoplay = options && options.autoplay;
    playerState.currentTrackIndex = index;
    const track = getCurrentTrack();

    els.audio.src = track.src;
    els.coverArt.src = track.cover;
    els.coverArt.alt = `${track.title} album cover`;
    els.trackTitle.textContent = track.title;
    els.trackArtist.textContent = track.artist;

    // Reset the progress UI immediately rather than waiting for the new
    // track's first timeupdate tick, so switching tracks never leaves the
    // old song's progress bar visible for a frame.
    els.progressSlider.value = 0;
    els.progressSlider.style.setProperty('--fill', '0%');
    els.currentTime.textContent = '0:00';
    els.remainingTime.textContent = '-0:00';

    renderQueueActiveState();

    if (autoplay) safePlay();
    else { playerState.isPlaying = false; syncPlayVisuals(); }
  }

  function nextTrack() {
    let nextIndex;
    if (playerState.isShuffle && playerState.tracks.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * playerState.tracks.length);
      } while (nextIndex === playerState.currentTrackIndex);
    } else {
      nextIndex = (playerState.currentTrackIndex + 1) % playerState.tracks.length;
    }
    loadTrack(nextIndex, { autoplay: true });
  }

  function prevTrack() {
    // Standard media-player convention: restart the current track if
    // meaningfully into it, only step backward if near the start.
    if (els.audio.currentTime > 3) {
      els.audio.currentTime = 0;
      return;
    }
    const prevIndex = (playerState.currentTrackIndex - 1 + playerState.tracks.length) % playerState.tracks.length;
    loadTrack(prevIndex, { autoplay: playerState.isPlaying });
  }

  /** Native 'ended' event hook — the autoplay engine (bonus feature §3). */
  function handleTrackEnded() {
    if (playerState.isRepeat) {
      els.audio.currentTime = 0;
      safePlay();
      return;
    }
    const isLastTrack = !playerState.isShuffle && playerState.currentTrackIndex === playerState.tracks.length - 1;
    if (isLastTrack) {
      // End of queue, no repeat: wrap the UI back to track one but don't
      // resume playback — the standard "reached the end" behavior.
      loadTrack(0, { autoplay: false });
      return;
    }
    nextTrack();
  }

  /* ==========================================================================
     6. VISUAL SYNC — the only functions that write to the DOM
     ========================================================================== */
  function syncPlayVisuals() {
    els.playIcon.hidden = playerState.isPlaying;
    els.pauseIcon.hidden = !playerState.isPlaying;
    els.playBtn.setAttribute('aria-label', playerState.isPlaying ? 'Pause' : 'Play');
    els.vinyl.classList.toggle('is-spinning', playerState.isPlaying);
    els.eq.classList.toggle('is-active', playerState.isPlaying);
  }

  function syncVolumeVisuals() {
    els.volIconHigh.hidden = playerState.isMuted;
    els.volIconMuted.hidden = !playerState.isMuted;
    els.muteBtn.setAttribute('aria-label', playerState.isMuted ? 'Unmute' : 'Mute');
  }

  function renderQueue() {
    els.queueList.innerHTML = playerState.tracks
      .map((track, index) => `
        <li class="queue-item" data-index="${index}" role="listitem" tabindex="0"
            aria-label="Play ${track.title} by ${track.artist}">
          <img class="queue-item__art" src="${track.cover}" alt="" loading="lazy" />
          <div class="queue-item__meta">
            <span class="queue-item__title">${track.title}</span>
            <span class="queue-item__artist">${track.artist}</span>
          </div>
        </li>`)
      .join('');
    els.queueCount.textContent = String(playerState.tracks.length);
    renderQueueActiveState();
  }

  function renderQueueActiveState() {
    els.queueList.querySelectorAll('.queue-item').forEach((item) => {
      const isActive = Number(item.dataset.index) === playerState.currentTrackIndex;
      item.classList.toggle('is-active', isActive);
      if (isActive) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
  }

  /* ==========================================================================
     7. EVENT WIRING
     ========================================================================== */

  els.playBtn.addEventListener('click', togglePlay);
  els.nextBtn.addEventListener('click', () => nextTrack());
  els.prevBtn.addEventListener('click', () => prevTrack());

  els.shuffleBtn.addEventListener('click', () => {
    playerState.isShuffle = !playerState.isShuffle;
    els.shuffleBtn.setAttribute('aria-pressed', String(playerState.isShuffle));
  });

  els.repeatBtn.addEventListener('click', () => {
    playerState.isRepeat = !playerState.isRepeat;
    els.repeatBtn.setAttribute('aria-pressed', String(playerState.isRepeat));
  });

  els.audio.addEventListener('ended', handleTrackEnded);

  // --- Progress bar: scrub/seek ---
  els.progressSlider.addEventListener('input', () => {
    isScrubbing = true;
    const pct = Number(els.progressSlider.value);
    els.progressSlider.style.setProperty('--fill', `${pct}%`);
    if (Number.isFinite(els.audio.duration)) {
      els.audio.currentTime = (pct / 100) * els.audio.duration;
    }
    els.currentTime.textContent = formatTime(els.audio.currentTime);
    els.remainingTime.textContent = `-${formatTime(els.audio.duration - els.audio.currentTime)}`;
  });
  els.progressSlider.addEventListener('change', () => { isScrubbing = false; });

  els.audio.addEventListener('timeupdate', () => {
    if (isScrubbing) return; // don't fight the user's own drag input
    const duration = els.audio.duration || 0;
    const current = els.audio.currentTime || 0;
    const pct = duration ? (current / duration) * 100 : 0;

    els.progressSlider.value = pct;
    els.progressSlider.style.setProperty('--fill', `${pct}%`);
    els.currentTime.textContent = formatTime(current);
    els.remainingTime.textContent = `-${formatTime(duration - current)}`;
  });

  els.audio.addEventListener('loadedmetadata', () => {
    els.remainingTime.textContent = `-${formatTime(els.audio.duration)}`;
  });

  // --- Volume + mute ---
  els.volumeSlider.addEventListener('input', () => {
    const vol = Number(els.volumeSlider.value);
    els.audio.volume = vol;
    playerState.isMuted = vol === 0;
    if (vol > 0) playerState.previousVolume = vol;
    els.volumeSlider.style.setProperty('--fill', `${vol * 100}%`);
    syncVolumeVisuals();
  });

  els.muteBtn.addEventListener('click', () => {
    if (playerState.isMuted) {
      const restored = playerState.previousVolume > 0 ? playerState.previousVolume : 0.75;
      els.audio.volume = restored;
      els.volumeSlider.value = restored;
      els.volumeSlider.style.setProperty('--fill', `${restored * 100}%`);
      playerState.isMuted = false;
    } else {
      playerState.previousVolume = els.audio.volume > 0 ? els.audio.volume : playerState.previousVolume;
      els.audio.volume = 0;
      els.volumeSlider.value = 0;
      els.volumeSlider.style.setProperty('--fill', '0%');
      playerState.isMuted = true;
    }
    syncVolumeVisuals();
  });

  // --- Queue: ONE delegated listener for every track row (see note #4) ---
  els.queueList.addEventListener('click', (event) => {
    const item = event.target.closest('.queue-item');
    if (!item) return;
    loadTrack(Number(item.dataset.index), { autoplay: true });
  });
  els.queueList.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const item = event.target.closest('.queue-item');
    if (!item) return;
    event.preventDefault();
    loadTrack(Number(item.dataset.index), { autoplay: true });
  });

  // --- Mobile slide-up queue sheet ---
  function openQueue() {
    els.queuePanel.classList.add('is-open');
    els.queueToggle.setAttribute('aria-expanded', 'true');
  }
  function closeQueue() {
    els.queuePanel.classList.remove('is-open');
    els.queueToggle.setAttribute('aria-expanded', 'false');
  }
  els.queueToggle.addEventListener('click', () => {
    els.queuePanel.classList.contains('is-open') ? closeQueue() : openQueue();
  });
  els.queueClose.addEventListener('click', closeQueue);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && els.queuePanel.classList.contains('is-open')) closeQueue();
  });
  // Click-outside-to-close, but only relevant while the mobile sheet is open.
  document.addEventListener('click', (event) => {
    if (!els.queuePanel.classList.contains('is-open')) return;
    if (event.target.closest('#queuePanel') || event.target.closest('#queueToggle')) return;
    closeQueue();
  });

  /* ==========================================================================
     8. INIT
     ========================================================================== */
  function init() {
    els.audio.volume = playerState.previousVolume;
    els.volumeSlider.style.setProperty('--fill', `${playerState.previousVolume * 100}%`);
    renderQueue();
    loadTrack(0, { autoplay: false });
  }

  init();
})();
