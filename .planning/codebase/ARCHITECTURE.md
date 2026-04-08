# Architecture

**Analysis Date:** 2026-04-07

## Pattern Overview

**Overall:** Static multi-page website (MPA) with shared vanilla JavaScript and CSS

**Key Characteristics:**
- No build step, no framework — raw HTML/CSS/JS files served statically
- All pages share a single CSS file (`css/styles.css`) and a single JS file (`js/main.js`)
- Page-specific styles are written as inline `<style>` blocks inside each HTML file's `<head>`
- No server-side rendering, no API routes — all interactions are client-side or delegated to third-party services

## Layers

**Pages (Presentation):**
- Purpose: Each `.html` file is a self-contained page with its own markup, inline styles, and semantic structure
- Location: `/` (project root)
- Contains: HTML structure, page-specific `<style>` blocks, nav, footer, sections
- Depends on: `css/styles.css`, `js/main.js`, Google Fonts CDN, Font Awesome CDN
- Used by: Browser directly (static hosting)

**Shared Styles:**
- Purpose: Design system tokens, reusable component classes, layout primitives, animations
- Location: `css/styles.css`
- Contains: CSS custom properties (design tokens), nav, buttons, forms, footer, scroll-reveal, media queries
- Depends on: Nothing (pure CSS)
- Used by: All HTML pages via `<link rel="stylesheet" href="css/styles.css" />`

**Shared JavaScript:**
- Purpose: Cross-page behavior — nav toggle, language switching, Stripe CTA wiring, contact form submission
- Location: `js/main.js`
- Contains: `toggleMenu()`, `applyLang()`, `initStripeReadyCtas()`, `initContactPrefill()`, `submitContactForm()`, scroll-reveal observer, FAQ accordion
- Depends on: Browser DOM APIs, `window.RUUTDEV_CHECKOUT_LINKS` global, Web3Forms API, localStorage
- Used by: All HTML pages via `<script src="js/main.js"></script>` at end of `<body>`

**Internal Tool (Sales Qualifier):**
- Purpose: Internal-only interactive sales qualification flow, not indexed by search engines
- Location: `qualifier.html`
- Contains: Standalone self-contained page with its own inline styles and inline `<script>` — does NOT use `css/styles.css` or `js/main.js`
- Used by: Internal sales team only (`<meta name="robots" content="noindex, nofollow" />`)

## Data Flow

**Language Switching:**

1. User clicks a `.lang-btn[data-lang]` button
2. `toggleLang(lang)` calls `applyLang(lang)`
3. `applyLang` iterates all `[data-en]` elements and swaps `innerHTML` to `data-en` or `data-es` attribute value
4. Selection is persisted to `localStorage` under key `ruutdev_lang`
5. On next page load, `DOMContentLoaded` reads saved lang and calls `applyLang` again

**Contact Form Prefill (URL-to-Form):**

1. Pricing/services pages link to `contact.html?intent=monthly&plan=simple-site&source=pricing`
2. On `contact.html`, `initContactPrefill()` reads `URLSearchParams`
3. Selects the matching `<option>` in `#ftype`, injects a prefill message into `#fmessage`, shows `#contact-context`
4. User submits form → `submitContactForm()` POSTs JSON to Web3Forms API (`https://api.web3forms.com/submit`)
5. On success, hides `#form-body` and shows `#form-success`

**Stripe CTA Wiring:**

1. `window.RUUTDEV_CHECKOUT_LINKS` object defined at top of `js/main.js` (currently empty `{}`)
2. `initStripeReadyCtas()` iterates all `[data-checkout-id]` elements
3. If a matching live URL exists in the lookup object, it sets `href` to that URL; otherwise falls back to `data-fallback-href`
4. CTAs tagged with `data-checkout-state="live"` or `"fallback"` accordingly

**Scroll Reveal:**

1. Elements with class `.reveal` start with `opacity: 0; transform: translateY(30px)` (from `css/styles.css`)
2. `IntersectionObserver` in `js/main.js` watches all `.reveal` elements
3. When element enters viewport (threshold 0.1), class `visible` is added after a staggered `setTimeout(i * 80ms)`
4. CSS transition on `.reveal.visible` animates to full opacity and zero translate

## Key Abstractions

**Design Token System:**
- Purpose: Consistent color, font, spacing, and radius values shared across all pages
- Location: `css/styles.css` — `:root` block (lines 5–20)
- Key tokens: `--bg`, `--bg2`, `--surface`, `--border`, `--text`, `--text2`, `--blue`, `--font-display`, `--font-body`, `--radius`, `--transition`
- Pattern: All components reference tokens via `var(--token-name)` — never raw values

**Bilingual Content System:**
- Purpose: EN/ES language support without a framework
- Pattern: Every user-visible string is expressed as `data-en="..."` and `data-es="..."` HTML attributes on the element; `applyLang()` in `js/main.js` does the swap at runtime
- Example: `<span data-en="Services" data-es="Servicios">Services</span>`

**Stripe-Ready CTA Pattern:**
- Purpose: Allow Stripe checkout URLs to be wired in without touching HTML markup
- Pattern: Anchor tags carry `data-checkout-id="plan-key"` and `data-fallback-href="contact.html?..."` attributes; `js/main.js` resolves the live URL from `window.RUUTDEV_CHECKOUT_LINKS`
- Files: `pricing.html` (4 instances), `js/main.js` (`initStripeReadyCtas`)

**URL Query Param Prefill:**
- Purpose: Context-aware contact form — CTAs across site pass intent/plan via query string
- Pattern: `contact.html?intent=monthly&plan=simple-site&source=pricing`
- Implemented in: `js/main.js` — `initContactPrefill()`, `getLeadType()`, `getPlanLabel()`

## Entry Points

**Homepage:**
- Location: `index.html`
- Triggers: Direct browser navigation to `ruutdev.com/`
- Responsibilities: Hero, why-us section, services overview, pricing teaser, process, CTA, footer

**Pricing:**
- Location: `pricing.html`
- Triggers: Navigation from hero CTA, nav links
- Responsibilities: Detailed monthly plans, buyout pricing, plan comparison, Stripe CTA wiring

**Contact:**
- Location: `contact.html`
- Triggers: All "Start Your Project" / "Book a Call" CTAs across the site
- Responsibilities: Contact methods display, form prefill from URL params, Web3Forms submission

**Pay:**
- Location: `pay.html`
- Triggers: Direct nav or client instructions for payment
- Responsibilities: Payment type selection UI (monthly plan, deposit, invoice), links to Stripe payment options

**Qualifier (Internal):**
- Location: `qualifier.html`
- Triggers: Internal team use only, not linked from public nav
- Responsibilities: Multi-step sales qualification flow; standalone page with its own styles and scripts

## Error Handling

**Strategy:** Minimal — alerts and button state resets

**Patterns:**
- Contact form uses try/catch around `fetch` with 8-second `AbortController` timeout
- On failure: `alert('There was an error. Please try via WhatsApp.')` and button re-enabled
- No global error boundary; no logging service

## Cross-Cutting Concerns

**Multilingual:** `data-en` / `data-es` attribute pattern on all user-facing text; `applyLang()` in `js/main.js`
**Forms:** Single shared `submitContactForm()` in `js/main.js` handles all contact form pages
**Navigation:** Shared nav markup duplicated in every HTML file; active link highlighted by `js/main.js` based on `window.location.pathname`
**SEO:** Each page has canonical URL, Open Graph tags, Twitter Card tags, and descriptive meta descriptions defined inline in `<head>`

---

*Architecture analysis: 2026-04-07*
