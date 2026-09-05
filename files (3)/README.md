# Neha Kumari — Portfolio

## About

A personal portfolio site for Neha Kumari, a dual-degree Computer Science engineer
at NIT Patna focused on Generative AI, LLM applications, and full-stack development.
Built entirely with semantic HTML5, modern CSS3, and vanilla JavaScript — no
frameworks or build step required.

## Features

- Sticky, scroll-aware navigation with active-section highlighting (IntersectionObserver)
- Accessible mobile hamburger menu
- Dark/light theme toggle, persisted in `localStorage`, respecting system preference on first load
- Lightweight canvas node-network animation in the hero (no external animation library)
- Scroll-triggered reveal animations, fully disabled under `prefers-reduced-motion`
- Data-driven project grid with category filtering and an accessible detail modal
- Client-side contact form validation with a `mailto:` hand-off (no backend required)
- Scroll progress indicator and back-to-top button
- Fully responsive from 375px to 1440px+

## Tech Stack

HTML5 · CSS3 (custom properties, Grid, Flexbox) · Vanilla JavaScript (ES6+)
Fonts: Fraunces (display), Inter (body), JetBrains Mono (labels/tags) via Google Fonts.

## Sections

Hero · About · Skills · Projects (with filtering + modal) · Achievements ·
Learning & Building (Experience) · Education · Resume · Contact · Footer

## Projects

Project content lives in a single `PROJECTS` array at the top of `script.js`.
The grid, the category filters, and the detail modal all read from this one
array — to add, edit, or remove a project, edit that array only.

Each project entry supports a `github` and `demo` URL field. Both are left as
empty strings (`''`) until you have real links — the UI automatically shows a
"GitHub — Add repository" placeholder instead of a dead or fabricated link.
**Fill in `github`/`demo` as your repositories go live.**

Project visuals are abstract CSS gradients (a stand-in, not a fake screenshot).
Swap them for real screenshots by replacing `.project-card__visual`'s markup
with an `<img>` pointing at a file in `assets/images/`.

## Responsive Design

Tested breakpoints: 1440px, 1200px, 1024px, 768px, 480px, 375px. Below 900px
the nav collapses to a hamburger menu; below 1024px the hero's decorative
canvas is dropped (kept for wider screens) so hero text keeps a readable line length.

## Accessibility

Semantic landmarks (`header`, `nav`, `main`, `section`, `article`, `footer`),
a logical heading hierarchy, `aria-label`s on icon-only buttons, a real focus
trap in both the project modal, visible focus rings everywhere, labeled form
fields with inline error messages, and full `prefers-reduced-motion` support
(animations are disabled outright, not just shortened).

## Performance

No external JS/CSS frameworks. Images use `loading="lazy"` where applicable.
The hero animation is plain `<canvas>` with ~26 nodes — no WebGL or 3D engine.
Fonts are loaded once via `<link rel="preconnect">` + a single Google Fonts request.

## Local Development

No build step. Just open `index.html` in a browser, or serve the folder locally:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

## Customization

**Content:** All personal copy lives directly in `index.html`. Update the hero
heading/subtext, About section copy, and Skills chips in place.

**Projects:** Edit the `PROJECTS` array in `script.js` (see [Projects](#projects) above).

**Resume:** Add your PDF at `assets/resume/resume.pdf` — the Download/View
Resume buttons already point there.

**Social links:** Replace the placeholder `href="#"` on the GitHub/LinkedIn
links in `index.html` (marked with `data-placeholder-link` and `[ADD YOUR ... URL]`
text) with your real profile URLs, then remove the `is-placeholder` class.

**Contact form backend:** The form currently opens a pre-filled `mailto:` link
on submit since there's no backend. To get real form submissions without
writing a server:
1. Sign up for [Formspree](https://formspree.io) or enable **Netlify Forms**.
2. Point the `<form>`'s `action` at your Formspree endpoint (or add
   `data-netlify="true"` for Netlify Forms) and remove the `mailto:` logic
   in `initializeContactForm()` inside `script.js`.

**Theme colors:** All colors are CSS custom properties in `style.css` under
`:root` and `[data-theme="light"]` — change the `--accent` value to re-theme
the whole site.

## How to Add Projects

Add a new object to the `PROJECTS` array in `script.js` following the shape
of the existing entries (`id`, `title`, `categoryLabel`, `categories`,
`description`, `tech`, `features`, `problem`, `solution`, `learned`, `github`,
`demo`). The grid and filters update automatically — no HTML edits needed.

## Deployment

### GitHub Pages
1. Push this folder to a GitHub repository.
2. In the repository, go to **Settings → Pages**.
3. Under **Source**, select your default branch and the root folder.
4. Save — GitHub Pages will publish `index.html` at
   `https://<your-username>.github.io/<repo-name>/`.

### Netlify
**Option A — drag and drop:** go to [app.netlify.com/drop](https://app.netlify.com/drop)
and drag the `portfolio/` folder in directly.

**Option B — Git-based:** connect the repository in the Netlify dashboard,
leave the build command empty (there is no build step), and set the publish
directory to the repository root.

## Future Improvements

- Replace abstract project visuals with real screenshots once available
- Wire the contact form to Formspree/Netlify Forms for direct submissions
- Add real GitHub/live-demo URLs as repositories are published
- Add resume.pdf

## License

Personal portfolio content and code — feel free to reference the structure,
but the content (name, projects, copy) belongs to Neha Kumari.
