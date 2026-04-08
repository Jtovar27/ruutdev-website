<!-- GSD:project-start source:PROJECT.md -->
## Project

**RuutDev Website — v2**

RuutDev is a freelance web development services website targeting a broad range of clients (small businesses, startups, freelancers, and creators). The v2 upgrade transforms the existing static marketing site into a dynamic, self-managed platform with an admin panel, client reviews, a portfolio showcase, Stripe payments, and a modern tech-forward visual experience.

**Core Value:** Convert visitors into paying clients — the site must look credible, showcase real work, and make it trivially easy to pay.

### Constraints

- **Stack**: Vanilla HTML/CSS/JS preserved for public pages — no React/Vue (keeps deploy simple on Vercel)
- **Backend**: Vercel serverless functions + Supabase — free tier compatible
- **Auth**: Single master password for admin panel — no multi-user auth needed
- **Hosting**: Vercel — no server management required
- **Bilingual**: All new public-facing content must support EN/ES
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- HTML5 - All page structure and content (`index.html`, `about.html`, `contact.html`, `services.html`, `pricing.html`, `pay.html`, `qualifier.html`, `privacy.html`, `terms.html`)
- CSS3 - All styling via single shared stylesheet (`css/styles.css`)
- JavaScript (ES2020+) - All interactivity and integrations via single shared script (`js/main.js`)
- XML - Sitemap (`sitemap.xml`)
## Runtime
- Static site — no server-side runtime required
- Runs entirely in the browser; no Node.js, Python, or server process needed
- None — no package.json, no lockfile
- All dependencies loaded via CDN links embedded in HTML `<head>` tags
## Frameworks
- None — pure vanilla HTML/CSS/JavaScript, no frontend framework (no React, Vue, Angular, etc.)
- None detected
- None — no build step, no bundler (no Webpack, Vite, Parcel, esbuild, etc.)
- Files are served directly as-is
## Key Dependencies (CDN-loaded)
- Font Awesome 6.5.0 — icon library loaded from `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css`
- Google Fonts — loaded from `https://fonts.googleapis.com`
## CSS Design System
- `--bg`, `--bg2`, `--surface`, `--border` — background/surface tokens
- `--text`, `--text2` — typography color tokens
- `--blue`, `--blue-glow`, `--blue-soft`, `--blue-border` — brand color tokens
- `--font-display`, `--font-body` — typography tokens
- `--radius` (`16px`) — border radius token
- `--transition` (`0.3s cubic-bezier(0.4,0,0.2,1)`) — animation token
## JavaScript Architecture
- `window.RUUTDEV_CHECKOUT_LINKS` — global object; populate with live `buy.stripe.com/...` URLs to activate Stripe checkout CTAs
- `toggleMenu()` — mobile nav hamburger toggle
- `markActiveLink()` — active nav link detection via `window.location.pathname`
- `revealObserver` — IntersectionObserver-based scroll reveal (`.reveal` class)
- FAQ accordion toggle
- Language system (`applyLang`, `toggleLang`) — EN/ES bilingual support using `data-en`/`data-es` attributes; persisted to `localStorage` under key `ruutdev_lang`
- `initStripeReadyCtas()` — wires `[data-checkout-id]` elements to `RUUTDEV_CHECKOUT_LINKS` at page load
- `initContactPrefill()` — reads URL query params (`intent`, `plan`, `source`) to prefill contact form
- `window.submitContactForm()` — async form submission to Web3Forms API with 8-second timeout and abort controller
## Configuration
- No `.env` files present
- Stripe payment links are hardcoded as placeholder strings (e.g., `'https://buy.stripe.com/REPLACE_MONTHLY_SIMPLE_SETUP'`) in `pay.html` inline script
- Checkout links intended to be set via `window.RUUTDEV_CHECKOUT_LINKS` object in `js/main.js`
- Web3Forms `access_key` is hardcoded in `js/main.js` line 235
- No build config files (no `tsconfig.json`, `webpack.config.js`, `vite.config.js`, etc.)
## SEO & Discoverability
- `sitemap.xml` — lists 8 pages with change frequencies and priorities
- `robots.txt` — allows all crawlers; disallows `/qualifier.html`; references sitemap at `https://ruutdev.com/sitemap.xml`
- Each HTML page includes `<meta name="description">`, `<link rel="canonical">`, Open Graph (`og:*`) and Twitter Card meta tags
## Platform Requirements
- Any static file server or direct browser file open; no build or install step required
- Vercel (confirmed in `privacy.html`: "Vercel: Hosts our website and processes standard web traffic")
- Domain: `ruutdev.com`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Overview
## Naming Patterns
- Lowercase, no hyphens: `index.html`, `about.html`, `contact.html`, `pricing.html`, `pay.html`, `terms.html`, `privacy.html`, `services.html`, `qualifier.html`
- Page title pattern: `{Page Name} — RuutDev` (em-dash separator)
- Kebab-case: `.nav-links`, `.btn-primary`, `.hero-badge`, `.section-label`, `.page-hero`, `.contact-method`
- BEM-adjacent naming with modifier suffix: `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-back`, `.btn-next`
- State classes use single word: `.open`, `.active`, `.selected`, `.visible`
- Component variants use suffix: `.overview-card.featured`, `.contact-method.wa`, `.badge-green`, `.badge-blue`, `.badge-yellow`
- Functions: camelCase — `toggleMenu()`, `applyLang()`, `toggleLang()`, `initStripeReadyCtas()`, `initContactPrefill()`, `getLeadType()`, `getPlanLabel()`, `submitContactForm()`
- Constants: SCREAMING_SNAKE_CASE for module-level config — `LANG_KEY`, `LEAD_PLAN_LABELS`, `RUUTDEV_CHECKOUT_LINKS`
- Variables: camelCase — `revealObserver`, `checkoutId`, `fallbackHref`, `liveHref`, `contextLines`
- `qualifier.html` short helpers: `getEl(id)`, `app()` (exception to verbosity, scoped to that file)
- Defined in `:root` in `css/styles.css`
- Format: `--{name}` in shorthand: `--bg`, `--bg2`, `--surface`, `--border`, `--text`, `--text2`, `--blue`, `--blue-glow`, `--blue-soft`, `--blue-border`, `--font-display`, `--font-body`, `--radius`, `--transition`
- `qualifier.html` extends with its own `:root` block (dark theme) without overriding the shared file
- i18n content: `data-en="..."` and `data-es="..."` on any element that needs translation
- Stripe checkout: `data-checkout-id="..."` and `data-fallback-href="..."` on anchor tags
- State tracking: `data-checkout-state="live|fallback"` set by JS
- Language toggle: `data-lang="en|es"` on `.lang-btn` buttons
## Code Style
- No automated formatter (no Prettier, Biome, or ESLint config present)
- Shared JS (`js/main.js`): 2-space indent, consistent spacing around operators
- Inline `<style>` blocks in HTML: 2-space indent throughout
- `qualifier.html` CSS: minified-adjacent (no spaces after colons, compact declarations), e.g. `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}`
- `css/styles.css`: expanded format with spaces after colons and between declarations
- Section headers use ASCII art banners:
- Subsection comments use short em-dash style: `/* ── Mobile Menu ── */`
- This pattern is consistent across both `css/styles.css` and `js/main.js`
- IIFEs used for self-contained initialization that should not pollute global scope: `(function markActiveLink() { ... })()`
- Module-level state: plain `const`/`let` at the top of `<script>` blocks
- Event registration: `DOMContentLoaded` listener in `js/main.js` for all initialization that requires DOM access
- Global functions exposed as `window.X` when called from HTML `onclick`: `window.submitContactForm`, `window.RUUTDEV_CHECKOUT_LINKS`
## Import / Script Organization
## HTML Structure Pattern (Standard Pages)
## Bilingual (i18n) Pattern
## Error Handling
- Validates required fields (`name`, `email`) with `alert()` on failure
- Email validated via regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- `AbortController` with 8-second timeout on fetch
- `try/catch` wraps the fetch — on failure, shows `alert()` and re-enables the button
- On success: hides form div, shows success div via `display` style toggle
- No custom error UI components; raw `alert()` used throughout
- DOM queries followed by early-return null guards: `if (!mobile) return;` and optional chaining `?.value`
- Pattern in `js/main.js`: `document.getElementById('X')?.value`
## Event Handling
## CSS Design System
## Stripe / Checkout Integration Pattern
## Comments
- Section delimiters always use the `/* ── Name ── */` style
- Inline comments for non-obvious logic only
- Placeholder comments mark future integration points (e.g., Stripe URL block at top of `js/main.js`)
- `qualifier.html` uses Spanish comments for question block labels: `// ── BLOQUE 1: NEGOCIO ──`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- No build step, no framework — raw HTML/CSS/JS files served statically
- All pages share a single CSS file (`css/styles.css`) and a single JS file (`js/main.js`)
- Page-specific styles are written as inline `<style>` blocks inside each HTML file's `<head>`
- No server-side rendering, no API routes — all interactions are client-side or delegated to third-party services
## Layers
- Purpose: Each `.html` file is a self-contained page with its own markup, inline styles, and semantic structure
- Location: `/` (project root)
- Contains: HTML structure, page-specific `<style>` blocks, nav, footer, sections
- Depends on: `css/styles.css`, `js/main.js`, Google Fonts CDN, Font Awesome CDN
- Used by: Browser directly (static hosting)
- Purpose: Design system tokens, reusable component classes, layout primitives, animations
- Location: `css/styles.css`
- Contains: CSS custom properties (design tokens), nav, buttons, forms, footer, scroll-reveal, media queries
- Depends on: Nothing (pure CSS)
- Used by: All HTML pages via `<link rel="stylesheet" href="css/styles.css" />`
- Purpose: Cross-page behavior — nav toggle, language switching, Stripe CTA wiring, contact form submission
- Location: `js/main.js`
- Contains: `toggleMenu()`, `applyLang()`, `initStripeReadyCtas()`, `initContactPrefill()`, `submitContactForm()`, scroll-reveal observer, FAQ accordion
- Depends on: Browser DOM APIs, `window.RUUTDEV_CHECKOUT_LINKS` global, Web3Forms API, localStorage
- Used by: All HTML pages via `<script src="js/main.js"></script>` at end of `<body>`
- Purpose: Internal-only interactive sales qualification flow, not indexed by search engines
- Location: `qualifier.html`
- Contains: Standalone self-contained page with its own inline styles and inline `<script>` — does NOT use `css/styles.css` or `js/main.js`
- Used by: Internal sales team only (`<meta name="robots" content="noindex, nofollow" />`)
## Data Flow
## Key Abstractions
- Purpose: Consistent color, font, spacing, and radius values shared across all pages
- Location: `css/styles.css` — `:root` block (lines 5–20)
- Key tokens: `--bg`, `--bg2`, `--surface`, `--border`, `--text`, `--text2`, `--blue`, `--font-display`, `--font-body`, `--radius`, `--transition`
- Pattern: All components reference tokens via `var(--token-name)` — never raw values
- Purpose: EN/ES language support without a framework
- Pattern: Every user-visible string is expressed as `data-en="..."` and `data-es="..."` HTML attributes on the element; `applyLang()` in `js/main.js` does the swap at runtime
- Example: `<span data-en="Services" data-es="Servicios">Services</span>`
- Purpose: Allow Stripe checkout URLs to be wired in without touching HTML markup
- Pattern: Anchor tags carry `data-checkout-id="plan-key"` and `data-fallback-href="contact.html?..."` attributes; `js/main.js` resolves the live URL from `window.RUUTDEV_CHECKOUT_LINKS`
- Files: `pricing.html` (4 instances), `js/main.js` (`initStripeReadyCtas`)
- Purpose: Context-aware contact form — CTAs across site pass intent/plan via query string
- Pattern: `contact.html?intent=monthly&plan=simple-site&source=pricing`
- Implemented in: `js/main.js` — `initContactPrefill()`, `getLeadType()`, `getPlanLabel()`
## Entry Points
- Location: `index.html`
- Triggers: Direct browser navigation to `ruutdev.com/`
- Responsibilities: Hero, why-us section, services overview, pricing teaser, process, CTA, footer
- Location: `pricing.html`
- Triggers: Navigation from hero CTA, nav links
- Responsibilities: Detailed monthly plans, buyout pricing, plan comparison, Stripe CTA wiring
- Location: `contact.html`
- Triggers: All "Start Your Project" / "Book a Call" CTAs across the site
- Responsibilities: Contact methods display, form prefill from URL params, Web3Forms submission
- Location: `pay.html`
- Triggers: Direct nav or client instructions for payment
- Responsibilities: Payment type selection UI (monthly plan, deposit, invoice), links to Stripe payment options
- Location: `qualifier.html`
- Triggers: Internal team use only, not linked from public nav
- Responsibilities: Multi-step sales qualification flow; standalone page with its own styles and scripts
## Error Handling
- Contact form uses try/catch around `fetch` with 8-second `AbortController` timeout
- On failure: `alert('There was an error. Please try via WhatsApp.')` and button re-enabled
- No global error boundary; no logging service
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
