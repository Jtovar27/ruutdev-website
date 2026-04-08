# Coding Conventions

**Analysis Date:** 2026-04-07

## Overview

This is a static HTML/CSS/JS website with no build tooling, no package manager, no linting config,
and no transpilation. All conventions are hand-enforced through consistent patterns in the source files.

## Naming Patterns

**HTML Files:**
- Lowercase, no hyphens: `index.html`, `about.html`, `contact.html`, `pricing.html`, `pay.html`, `terms.html`, `privacy.html`, `services.html`, `qualifier.html`
- Page title pattern: `{Page Name} — RuutDev` (em-dash separator)

**CSS Classes:**
- Kebab-case: `.nav-links`, `.btn-primary`, `.hero-badge`, `.section-label`, `.page-hero`, `.contact-method`
- BEM-adjacent naming with modifier suffix: `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-back`, `.btn-next`
- State classes use single word: `.open`, `.active`, `.selected`, `.visible`
- Component variants use suffix: `.overview-card.featured`, `.contact-method.wa`, `.badge-green`, `.badge-blue`, `.badge-yellow`

**JavaScript Identifiers:**
- Functions: camelCase — `toggleMenu()`, `applyLang()`, `toggleLang()`, `initStripeReadyCtas()`, `initContactPrefill()`, `getLeadType()`, `getPlanLabel()`, `submitContactForm()`
- Constants: SCREAMING_SNAKE_CASE for module-level config — `LANG_KEY`, `LEAD_PLAN_LABELS`, `RUUTDEV_CHECKOUT_LINKS`
- Variables: camelCase — `revealObserver`, `checkoutId`, `fallbackHref`, `liveHref`, `contextLines`
- `qualifier.html` short helpers: `getEl(id)`, `app()` (exception to verbosity, scoped to that file)

**CSS Custom Properties (Design Tokens):**
- Defined in `:root` in `css/styles.css`
- Format: `--{name}` in shorthand: `--bg`, `--bg2`, `--surface`, `--border`, `--text`, `--text2`, `--blue`, `--blue-glow`, `--blue-soft`, `--blue-border`, `--font-display`, `--font-body`, `--radius`, `--transition`
- `qualifier.html` extends with its own `:root` block (dark theme) without overriding the shared file

**HTML Data Attributes:**
- i18n content: `data-en="..."` and `data-es="..."` on any element that needs translation
- Stripe checkout: `data-checkout-id="..."` and `data-fallback-href="..."` on anchor tags
- State tracking: `data-checkout-state="live|fallback"` set by JS
- Language toggle: `data-lang="en|es"` on `.lang-btn` buttons

## Code Style

**Formatting:**
- No automated formatter (no Prettier, Biome, or ESLint config present)
- Shared JS (`js/main.js`): 2-space indent, consistent spacing around operators
- Inline `<style>` blocks in HTML: 2-space indent throughout
- `qualifier.html` CSS: minified-adjacent (no spaces after colons, compact declarations), e.g. `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}`
- `css/styles.css`: expanded format with spaces after colons and between declarations

**Section Delimiters (CSS):**
- Section headers use ASCII art banners:
  ```css
  /* ─────────────────────────────────────────
     NAV
     ───────────────────────────────────────── */
  ```
- Subsection comments use short em-dash style: `/* ── Mobile Menu ── */`
- This pattern is consistent across both `css/styles.css` and `js/main.js`

**JS Structure:**
- IIFEs used for self-contained initialization that should not pollute global scope: `(function markActiveLink() { ... })()`
- Module-level state: plain `const`/`let` at the top of `<script>` blocks
- Event registration: `DOMContentLoaded` listener in `js/main.js` for all initialization that requires DOM access
- Global functions exposed as `window.X` when called from HTML `onclick`: `window.submitContactForm`, `window.RUUTDEV_CHECKOUT_LINKS`

## Import / Script Organization

**Load Order (all HTML pages):**
1. Google Fonts `<link>` in `<head>`
2. Font Awesome CDN `<link>` in `<head>`
3. `css/styles.css` `<link>` in `<head>`
4. Page-specific `<style>` block inline in `<head>` (always comes after shared CSS)
5. `js/main.js` `<script>` at bottom of `<body>` (no `defer` or `type="module"`)

**`qualifier.html` exception:** Self-contained page — loads fonts in `<head>`, all CSS is inline in a `<style>` block, all JS is in an inline `<script>` at the end of `<body>`. Does not load `css/styles.css` or `js/main.js`.

## HTML Structure Pattern (Standard Pages)

Every standard page follows this shell:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- charset, viewport, title, description -->
  <!-- canonical, og:*, twitter:* meta tags -->
  <!-- Google Fonts preconnect + link -->
  <!-- Font Awesome CDN -->
  <!-- css/styles.css -->
  <!-- page-specific <style> block -->
</head>
<body>
  <nav> ... </nav>            <!-- identical across all pages -->
  <ul class="nav-mobile"> ... </ul>  <!-- identical across all pages -->
  <!-- page content sections -->
  <footer class="site-footer"> ... </footer>
  <script src="js/main.js"></script>
</body>
</html>
```

Nav and footer are copy-pasted across all pages (no server-side includes or templating).

## Bilingual (i18n) Pattern

All user-visible text that needs translation uses `data-en` / `data-es` attributes:
```html
<span data-en="Services" data-es="Servicios">Services</span>
```

The `applyLang(lang)` function in `js/main.js` queries all `[data-en]` elements and sets `innerHTML`
to the appropriate dataset value. Language preference is persisted to `localStorage` under key `ruutdev_lang`.
Language toggle buttons carry `data-lang="en|es"` and call `toggleLang(lang)` via `onclick`.

## Error Handling

**Form Submission (`submitContactForm`):**
- Validates required fields (`name`, `email`) with `alert()` on failure
- Email validated via regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- `AbortController` with 8-second timeout on fetch
- `try/catch` wraps the fetch — on failure, shows `alert()` and re-enables the button
- On success: hides form div, shows success div via `display` style toggle
- No custom error UI components; raw `alert()` used throughout

**Null Guards:**
- DOM queries followed by early-return null guards: `if (!mobile) return;` and optional chaining `?.value`
- Pattern in `js/main.js`: `document.getElementById('X')?.value`

## Event Handling

**Inline `onclick` in HTML** for simple UI actions:
```html
<div class="hamburger" onclick="toggleMenu()">
<button class="lang-btn" onclick="toggleLang('en')">
<button class="btn-primary form-submit" onclick="submitContactForm()">
```

**`addEventListener` in JS** for complex or dynamic listeners (added inside `DOMContentLoaded`):
```js
document.querySelectorAll('#nav-mobile a').forEach(link => {
  link.addEventListener('click', () => { ... });
});
```

**`IntersectionObserver`** for scroll reveal (module-level, not inside DOMContentLoaded):
```js
const revealObserver = new IntersectionObserver((entries) => { ... }, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
```

## CSS Design System

All visual values are CSS custom properties defined in `css/styles.css :root`. Pages must not
hardcode color values that duplicate a token. New UI components must use `var(--blue)`, `var(--text)`,
`var(--surface)`, etc. rather than raw hex.

**Animation:** Keyframes defined in `css/styles.css`: `fadeUp`, `float`, `pulse`, `pulse-dot`.
`qualifier.html` defines its own `slideIn` keyframe locally.

**Responsive:** Media queries in page-specific `<style>` blocks. Shared breakpoints in `css/styles.css`.
No CSS framework or grid system; pure CSS Grid and Flexbox.

**Hover/Transition:** All interactive elements use `transition: all var(--transition)` where `--transition: 0.3s cubic-bezier(0.4,0,0.2,1)`.

## Stripe / Checkout Integration Pattern

Checkout links are managed via a global registry object:
```js
window.RUUTDEV_CHECKOUT_LINKS = {
  'monthly-simple-setup': 'https://buy.stripe.com/...',
  ...
};
```
Anchor tags carry `data-checkout-id` and `data-fallback-href`. `initStripeReadyCtas()` rewrites
`href` at page load. Currently the registry is empty (placeholder comment in `js/main.js` lines 5–11),
so all CTAs fall back to their `data-fallback-href` or `href`.

## Comments

**When to comment:**
- Section delimiters always use the `/* ── Name ── */` style
- Inline comments for non-obvious logic only
- Placeholder comments mark future integration points (e.g., Stripe URL block at top of `js/main.js`)
- `qualifier.html` uses Spanish comments for question block labels: `// ── BLOQUE 1: NEGOCIO ──`

---

*Convention analysis: 2026-04-07*
