(function () {
  'use strict';

  const TRACKS = [
    { title: 'Midnight Frequency', artist: 'Nocturne Collective', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&q=80' },
    { title: 'Neon Static', artist: 'Vela Kite', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80' },
    { title: 'Glass Horizon', artist: 'Nocturne Collective', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', cover: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&q=80' },
    { title: 'Low Orbit', artist: 'Reiko Tide', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500&q=80' },
    { title: 'Afterglow', artist: 'Vela Kite', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', cover: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=500&q=80' },
    { title: 'Static Bloom', artist: 'Reiko Tide', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80' }
  ];

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
  let isScrubbing = false;       
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

  function getCurrentTrack() {
    return playerState.tracks[playerState.currentTrackIndex];
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function safePlay() {
    currentPlayPromise = els.audio.play();
    if (currentPlayPromise === undefined) {
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
    if (els.audio.currentTime > 3) {
      els.audio.currentTime = 0;
      return;
    }
    const prevIndex = (playerState.currentTrackIndex - 1 + playerState.tracks.length) % playerState.tracks.length;
    loadTrack(prevIndex, { autoplay: playerState.isPlaying });
  }

  function handleTrackEnded() {
    if (playerState.isRepeat) {
      els.audio.currentTime = 0;
      safePlay();
      return;
    }
    const isLastTrack = !playerState.isShuffle && playerState.currentTrackIndex === playerState.tracks.length - 1;
    if (isLastTrack) {
      loadTrack(0, { autoplay: false });
      return;
    }
    nextTrack();
  }
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
  document.addEventListener('click', (event) => {
    if (!els.queuePanel.classList.contains('is-open')) return;
    if (event.target.closest('#queuePanel') || event.target.closest('#queueToggle')) return;
    closeQueue();
  });

  function init() {
    els.audio.volume = playerState.previousVolume;
    els.volumeSlider.style.setProperty('--fill', `${playerState.previousVolume * 100}%`);
    renderQueue();
    loadTrack(0, { autoplay: false });
  }

  init();
})();
