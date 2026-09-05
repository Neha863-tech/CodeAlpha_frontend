
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PROJECTS = [
    {
      id: 1,
      featured: true,
      title: 'AI Chatbot using RAG and LLMs',
      categoryLabel: 'Generative AI · NLP · LLM',
      categories: ['ai-ml', 'genai'],
      description: 'A retrieval-augmented chatbot that pulls relevant context from a knowledge source before an LLM generates its response, instead of relying on the model\u2019s parametric memory alone.',
      tech: ['Python', 'LLMs', 'RAG', 'LangChain', 'FAISS', 'Embeddings'],
      features: [
        'Retrieval step over a vector store before every generation call',
        'Embedding-based similarity search for relevant context',
        'Context-aware responses instead of ungrounded LLM output'
      ],
      problem: 'A general-purpose LLM answers from what it was trained on, which means it can\u2019t reliably answer questions about a specific, current, or private knowledge source without help.',
      solution: 'Built a retrieval-augmented generation pipeline: incoming queries are embedded, matched against a FAISS vector store of source documents, and the retrieved passages are passed to the LLM as grounding context before it generates a response.',
      learned: 'How much a RAG system\u2019s output quality depends on decisions upstream of the LLM \u2014 chunking strategy and embedding choice affect retrieval relevance more than prompt wording does.',
      github: '',
      demo: ''
    },
    {
      id: 2,
      title: 'MCP-Based AI Chatbot',
      categoryLabel: 'Generative AI · AI Agents',
      categories: ['ai-ml', 'genai'],
      description: 'An AI application exploring Model Context Protocol concepts \u2014 letting an LLM call external tools as part of answering a request, rather than responding from text alone.',
      tech: ['Python', 'MCP', 'LLMs', 'LangChain / LangGraph'],
      features: [
        'Tool-calling workflow built around MCP concepts',
        'LLM-driven decisions about when to invoke a tool',
        'Context passed between conversation turns and tool calls'
      ],
      problem: 'A chatbot limited to its own training data can\u2019t take real actions or fetch live information \u2014 it can only talk about them.',
      solution: 'Implemented a tool-calling layer following Model Context Protocol concepts, so the LLM can decide mid-conversation to invoke an external tool and use the result to inform its next response.',
      learned: 'The practical difference between a chatbot that talks about doing something and an agent that can actually call a tool and act on the result \u2014 and how much more careful the prompting has to be once the model has real actions available.',
      github: '',
      demo: ''
    },
    {
      id: 3,
      title: 'PDF Digital Signature Application',
      categoryLabel: 'Full Stack Web Application',
      categories: ['fullstack'],
      description: 'A full-stack web application for uploading, signing, and managing PDF documents, with authenticated user accounts behind it.',
      tech: ['React', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'bcrypt', 'Multer', 'PDF-Lib'],
      features: [
        'JWT-based authentication with bcrypt password hashing',
        'File upload and storage handling with Multer',
        'PDF manipulation and signature placement with PDF-Lib',
        'REST API backed by a MongoDB data layer'
      ],
      problem: 'Signing a document usually means leaving the app to a third-party tool, breaking whatever workflow the document was part of.',
      solution: 'Built a self-contained React + Express application that handles the full loop \u2014 authenticated upload, PDF processing with PDF-Lib, and signature placement \u2014 backed by MongoDB and JWT-secured routes.',
      learned: 'How much of a \u201csimple\u201d file-handling feature is actually authentication, validation, and edge-case handling around the upload \u2014 the PDF manipulation itself was the smaller half of the work.',
      github: '',
      demo: ''
    },
    {
      id: 4,
      title: 'JOBJET \u2014 Job Portal',
      categoryLabel: 'Full Stack · Web Development',
      categories: ['fullstack', 'webdev'],
      description: 'A job portal web application giving users an interface to browse and interact with job listings through a component-based React front end.',
      tech: ['React.js', 'JavaScript', 'REST APIs'],
      features: [
        'Component-based React front end',
        'REST API integration for listing data',
        'Responsive layout across device sizes'
      ],
      problem: 'A job board needs to stay legible and fast while displaying a large, filterable set of listings.',
      solution: 'Structured the front end around reusable React components consuming a REST API, keeping listing, filtering, and detail views separated and independently maintainable.',
      learned: 'How component boundaries in React map to real UI seams \u2014 splitting the listing card, filter panel, and detail view early made later changes much cheaper.',
      github: '',
      demo: ''
    },
    {
      id: 5,
      title: 'Online Shopping Website',
      categoryLabel: 'Web Development · E-Commerce',
      categories: ['webdev'],
      description: 'A responsive online shopping interface covering product browsing and the core interaction patterns of an e-commerce front end.',
      tech: ['HTML', 'CSS', 'JavaScript'],
      features: [
        'Responsive product browsing layout',
        'Client-side interaction for product exploration',
        'Front-end e-commerce UI patterns'
      ],
      problem: 'An e-commerce front end needs to stay clear and fast on any screen size, without a framework doing the layout work for you.',
      solution: 'Built the product browsing interface with plain HTML, CSS, and JavaScript, focusing on responsive layout and clean interaction patterns.',
      learned: 'How far you can get on e-commerce UI patterns \u2014 grids, product cards, responsive navigation \u2014 with fundamentals alone, before reaching for a framework.',
      github: '',
      demo: ''
    },
    {
      id: 6,
      title: 'Hand Gesture Controlled Game',
      categoryLabel: 'Computer Vision · Interactive Application',
      categories: ['cv'],
      description: 'An interactive game controlled through hand gestures, using computer vision to translate physical movement into in-game input.',
      tech: ['Python', 'Computer Vision', 'Hand Gesture Recognition'],
      features: [
        'Real-time hand gesture recognition as game input',
        'Computer-vision-driven interaction loop',
        'Python-based gesture-to-action mapping'
      ],
      problem: 'Traditional keyboard/mouse input is a layer of abstraction between a player and the game \u2014 gesture control removes it.',
      solution: 'Built a computer-vision pipeline that recognizes hand gestures in real time and maps them directly to in-game actions.',
      learned: 'How much latency and false-positive tolerance matters in a real-time CV interaction loop \u2014 a technically \u201caccurate\u201d gesture detector still feels bad to play against if it isn\u2019t fast and stable.',
      github: '',
      demo: ''
    }
  ];

  /* ==========================================================================
     initializeLoader — brief page-load moment, removed quickly
     ========================================================================== */
  function initializeLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    const hide = () => loader.classList.add('is-hidden');
    // Hide as soon as the page is interactive; a minimum visible time keeps
    // it from being a jarring one-frame flash on fast connections.
    window.setTimeout(hide, prefersReducedMotion ? 120 : 650);
  }

  /* ==========================================================================
     initializeScrollProgress — thin top bar tracking scroll position
     ========================================================================== */
  function initializeScrollProgress() {
    const fill = document.getElementById('scrollProgressFill');
    if (!fill) return;
    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      fill.style.width = `${pct}%`;
    }
    document.addEventListener('scroll', update, { passive: true });
    update();
  }
  function initializeNavigation() {
    const nav = document.getElementById('siteNav');
    const navLinks = document.getElementById('navLinks');
    const navToggle = document.getElementById('navToggle');
    const links = Array.from(document.querySelectorAll('.nav-link'));
    const sections = links
      .map((link) => document.getElementById(link.dataset.nav))
      .filter(Boolean);
    function updateNavBackground() {
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    document.addEventListener('scroll', updateNavBackground, { passive: true });
    updateNavBackground();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => link.classList.toggle('is-active', link.dataset.nav === entry.target.id));
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
    function closeMenu() {
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    }
    function openMenu() {
      navLinks.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Close menu');
    }
    navToggle.addEventListener('click', () => {
      navLinks.classList.contains('is-open') ? closeMenu() : openMenu();
    });
    navLinks.addEventListener('click', (event) => {
      if (event.target.closest('.nav-link')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navLinks.classList.contains('is-open')) closeMenu();
    });
  }
  function initializeTheme() {
    const toggle = document.getElementById('themeToggle');
    const sunIcon = toggle.querySelector('.theme-toggle__sun');
    const moonIcon = toggle.querySelector('.theme-toggle__moon');
    const STORAGE_KEY = 'nk-portfolio-theme';

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const isLight = theme === 'light';
      sunIcon.hidden = !isLight;
      moonIcon.hidden = isLight;
      toggle.setAttribute('aria-pressed', String(isLight));
      toggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(stored || (systemPrefersLight ? 'light' : 'dark'));

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
      // Re-tint the hero canvas so its node/line colors track the new theme.
      if (window.__redrawHeroVisual) window.__redrawHeroVisual();
    });
  }
  function initializeRevealAnimations() {
    const targets = document.querySelectorAll('.reveal');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target); // one-time reveal, not a repeating effect
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((el) => observer.observe(el));
  }
  function initializeHeroVisual() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    const NODE_COUNT = 26;
    const LINK_DISTANCE = 120;
    let nodes = [];
    let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationFrame = null;

    function getAccentColor() {
      return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7d5fff';
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createNodes() {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const accent = getAccentColor();

      // Links first (so nodes render on top)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DISTANCE) {
            ctx.strokeStyle = accent;
            ctx.globalAlpha = (1 - dist / LINK_DISTANCE) * 0.35;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      ctx.globalAlpha = 1;
      nodes.forEach((node) => {
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function step() {
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      });
      draw();
      animationFrame = requestAnimationFrame(step);
    }

    resize();
    createNodes();

    if (prefersReducedMotion) {
      draw(); // static single frame — no rAF loop
    } else {
      step();
    }

    window.addEventListener('resize', () => {
      resize();
      createNodes();
      if (prefersReducedMotion) draw();
    });
    window.__redrawHeroVisual = draw;
  }
  let activeFilter = 'all';

  function projectCardMarkup(project, index) {
    const isFeatured = Boolean(project.featured);
    const techList = project.tech.map((t) => `<li>${t}</li>`).join('');
    return `
      <article class="project-card${isFeatured ? ' project-card--featured' : ''}"
               data-id="${project.id}"
               data-categories="${project.categories.join(' ')}"
               style="--vx:${20 + (index * 17) % 60}%; --vy:${25 + (index * 23) % 55}%"
               tabindex="0" role="button"
               aria-label="View details for ${project.title}">
        <div class="project-card__visual">
          <span class="project-card__visual-index">0${project.id}</span>
        </div>
        <div class="project-card__body">
          <span class="project-card__number">0${project.id}</span>
          <h3 class="project-card__title">${project.title}</h3>
          <p class="project-card__category">${project.categoryLabel}</p>
          <p class="project-card__desc">${project.description}</p>
          <ul class="project-card__tech">${techList}</ul>
          <div class="project-card__footer">
            <span class="project-link--placeholder">GitHub \u2014 Add repository</span>
            <span class="project-card__arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 17L17 7M9 7h8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            </span>
          </div>
        </div>
      </article>`;
  }

  function moreProjectsCardMarkup() {
    return `
      <article class="project-card project-card--more" data-categories="">
        <p>More projects will be added here as they're built.</p>
      </article>`;
  }

  function renderProjects() {
    const grid = document.getElementById('projectGrid');
    grid.innerHTML = PROJECTS.map(projectCardMarkup).join('') + moreProjectsCardMarkup();
  }

  function initializeProjectFilters() {
    const filterBar = document.getElementById('projectFilters');
    const grid = document.getElementById('projectGrid');
    const emptyState = document.getElementById('projectEmpty');

    function applyFilter(filterValue) {
      activeFilter = filterValue;
      const cards = grid.querySelectorAll('.project-card');
      let visibleCount = 0;

      cards.forEach((card) => {
        const categories = (card.dataset.categories || '').split(' ').filter(Boolean);
        const isMoreCard = card.classList.contains('project-card--more');
        // The "more projects" placeholder only makes sense in the unfiltered
        // view; real cards match when "all" is selected or their categories
        // include the active filter.
        const shouldShow = isMoreCard ? filterValue === 'all' : (filterValue === 'all' || categories.includes(filterValue));
        card.classList.toggle('is-filtered-out', !shouldShow);
        if (shouldShow && !isMoreCard) visibleCount += 1;
      });

      emptyState.hidden = visibleCount > 0;

      filterBar.querySelectorAll('.filter-chip').forEach((chip) => {
        const isActive = chip.dataset.filter === filterValue;
        chip.classList.toggle('is-active', isActive);
        chip.setAttribute('aria-pressed', String(isActive));
      });
    }
    filterBar.addEventListener('click', (event) => {
      const chip = event.target.closest('.filter-chip');
      if (!chip) return;
      applyFilter(chip.dataset.filter);
    });
  }
  function initializeProjectModal() {
    const modal = document.getElementById('projectModal');
    const backdrop = document.getElementById('modalBackdrop');
    const closeBtn = document.getElementById('modalClose');
    const grid = document.getElementById('projectGrid');
    let lastFocused = null;

    const fields = {
      number: document.getElementById('modalNumber'),
      title: document.getElementById('modalTitle'),
      category: document.getElementById('modalCategory'),
      problem: document.getElementById('modalProblem'),
      solution: document.getElementById('modalSolution'),
      tech: document.getElementById('modalTech'),
      features: document.getElementById('modalFeatures'),
      learned: document.getElementById('modalLearned'),
      links: document.getElementById('modalLinks')
    };

    function populate(project) {
      fields.number.textContent = `0${project.id}`;
      fields.title.textContent = project.title;
      fields.category.textContent = project.categoryLabel;
      fields.problem.textContent = project.problem;
      fields.solution.textContent = project.solution;
      fields.tech.innerHTML = project.tech.map((t) => `<li>${t}</li>`).join('');
      fields.features.innerHTML = project.features.map((f) => `<li>${f}</li>`).join('');
      fields.learned.textContent = project.learned;
      fields.links.innerHTML = project.github
        ? `<a class="btn btn--secondary" href="${project.github}" target="_blank" rel="noopener">View on GitHub</a>`
        : `<span class="project-link--placeholder">GitHub \u2014 Add repository</span>`;
      if (project.demo) {
        fields.links.innerHTML += `<a class="btn btn--ghost" href="${project.demo}" target="_blank" rel="noopener">Live Demo</a>`;
      }
    }

    function openModal(project, triggerEl) {
      populate(project);
      lastFocused = triggerEl;
      modal.hidden = false;
      void modal.offsetWidth; // flush layout so the open transition actually plays
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
      document.addEventListener('keydown', handleKeydown);
    }

    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeydown);
      window.setTimeout(() => { if (!modal.classList.contains('is-open')) modal.hidden = true; }, 320);
      if (lastFocused) lastFocused.focus();
    }

    function trapFocus(event) {
      const focusable = modal.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') closeModal();
      else if (event.key === 'Tab') trapFocus(event);
    }
    grid.addEventListener('click', (event) => {
      const card = event.target.closest('.project-card[data-id]');
      if (!card) return;
      const project = PROJECTS.find((p) => String(p.id) === card.dataset.id);
      if (project) openModal(project, card);
    });
    grid.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('.project-card[data-id]');
      if (!card) return;
      event.preventDefault();
      const project = PROJECTS.find((p) => String(p.id) === card.dataset.id);
      if (project) openModal(project, card);
    });

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
  }
  function initializeContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const status = document.getElementById('formStatus');

    const validators = {
      fieldName: (value) => value.trim().length > 0 || 'Please enter your name.',
      fieldEmail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Please enter a valid email address.',
      fieldMessage: (value) => value.trim().length >= 10 || 'Message should be at least 10 characters.'
    };

    function validateField(id) {
      const input = document.getElementById(id);
      const errorEl = document.getElementById(`error${id.replace('field', '')}`);
      const result = validators[id](input.value);
      const isValid = result === true;
      input.closest('.field').classList.toggle('has-error', !isValid);
      errorEl.textContent = isValid ? '' : result;
      return isValid;
    }

    ['fieldName', 'fieldEmail', 'fieldMessage'].forEach((id) => {
      document.getElementById(id).addEventListener('blur', () => validateField(id));
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const results = ['fieldName', 'fieldEmail', 'fieldMessage'].map(validateField);
      if (results.includes(false)) {
        status.textContent = 'Please fix the highlighted fields.';
        return;
      }

      const name = document.getElementById('fieldName').value.trim();
      const email = document.getElementById('fieldEmail').value.trim();
      const message = document.getElementById('fieldMessage').value.trim();

      const subject = encodeURIComponent(`Portfolio contact from ${name}`);
      const body = encodeURIComponent(`${message}\n\n\u2014 ${name} (${email})`);
      window.location.href = `mailto:nehak.dd24.cs@nitp.ac.in?subject=${subject}&body=${body}`;

      status.textContent = 'Opening your email client with this message pre-filled\u2026';
      form.reset();
    });
  }
  function initializeBackToTop() {
    const btn = document.getElementById('backToTop');
    document.addEventListener('scroll', () => {
      btn.hidden = window.scrollY < 600;
      if (window.scrollY >= 600) btn.classList.add('is-visible');
      else btn.classList.remove('is-visible');
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }
  function initializeMisc() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    document.querySelectorAll('[data-placeholder-link]').forEach((link) => {
      link.addEventListener('click', (event) => event.preventDefault());
    });
  }
  function init() {
    initializeLoader();
    initializeScrollProgress();
    initializeNavigation();
    initializeTheme();
    initializeHeroVisual();
    renderProjects();
    initializeProjectFilters();
    initializeProjectModal();
    initializeRevealAnimations();
    initializeContactForm();
    initializeBackToTop();
    initializeMisc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
