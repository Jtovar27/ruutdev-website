# Technology Stack

**Analysis Date:** 2026-04-07

## Languages

**Primary:**
- HTML5 - All page structure and content (`index.html`, `about.html`, `contact.html`, `services.html`, `pricing.html`, `pay.html`, `qualifier.html`, `privacy.html`, `terms.html`)
- CSS3 - All styling via single shared stylesheet (`css/styles.css`)
- JavaScript (ES2020+) - All interactivity and integrations via single shared script (`js/main.js`)

**Secondary:**
- XML - Sitemap (`sitemap.xml`)

## Runtime

**Environment:**
- Static site — no server-side runtime required
- Runs entirely in the browser; no Node.js, Python, or server process needed

**Package Manager:**
- None — no package.json, no lockfile
- All dependencies loaded via CDN links embedded in HTML `<head>` tags

## Frameworks

**Core:**
- None — pure vanilla HTML/CSS/JavaScript, no frontend framework (no React, Vue, Angular, etc.)

**Testing:**
- None detected

**Build/Dev:**
- None — no build step, no bundler (no Webpack, Vite, Parcel, esbuild, etc.)
- Files are served directly as-is

## Key Dependencies (CDN-loaded)

**Icons:**
- Font Awesome 6.5.0 — icon library loaded from `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css`
  - Used sitewide for UI icons, brand icons (Stripe, WhatsApp, etc.)

**Typography:**
- Google Fonts — loaded from `https://fonts.googleapis.com`
  - `Syne` (weights 400, 600, 700, 800) — display/heading font, mapped to `--font-display` CSS variable
  - `DM Sans` (weights 300, 400, 500, italic variants) — body font, mapped to `--font-body` CSS variable
  - `JetBrains Mono` — loaded on `qualifier.html` only

## CSS Design System

**Variables defined in `css/styles.css` `:root`:**
- `--bg`, `--bg2`, `--surface`, `--border` — background/surface tokens
- `--text`, `--text2` — typography color tokens
- `--blue`, `--blue-glow`, `--blue-soft`, `--blue-border` — brand color tokens
- `--font-display`, `--font-body` — typography tokens
- `--radius` (`16px`) — border radius token
- `--transition` (`0.3s cubic-bezier(0.4,0,0.2,1)`) — animation token

## JavaScript Architecture

**Single shared file:** `js/main.js` (252 lines)

**Key subsystems implemented:**
- `window.RUUTDEV_CHECKOUT_LINKS` — global object; populate with live `buy.stripe.com/...` URLs to activate Stripe checkout CTAs
- `toggleMenu()` — mobile nav hamburger toggle
- `markActiveLink()` — active nav link detection via `window.location.pathname`
- `revealObserver` — IntersectionObserver-based scroll reveal (`.reveal` class)
- FAQ accordion toggle
- Language system (`applyLang`, `toggleLang`) — EN/ES bilingual support using `data-en`/`data-es` attributes; persisted to `localStorage` under key `ruutdev_lang`
- `initStripeReadyCtas()` — wires `[data-checkout-id]` elements to `RUUTDEV_CHECKOUT_LINKS` at page load
- `initContactPrefill()` — reads URL query params (`intent`, `plan`, `source`) to prefill contact form
- `window.submitContactForm()` — async form submission to Web3Forms API with 8-second timeout and abort controller

**Page-specific scripts:** `pay.html` contains an inline `<script>` block managing payment type selection, tier selection, Stripe link routing, and URL query param context (`type`, `tier`, `amount`, `notes`)

## Configuration

**Environment:**
- No `.env` files present
- Stripe payment links are hardcoded as placeholder strings (e.g., `'https://buy.stripe.com/REPLACE_MONTHLY_SIMPLE_SETUP'`) in `pay.html` inline script
- Checkout links intended to be set via `window.RUUTDEV_CHECKOUT_LINKS` object in `js/main.js`
- Web3Forms `access_key` is hardcoded in `js/main.js` line 235

**Build:**
- No build config files (no `tsconfig.json`, `webpack.config.js`, `vite.config.js`, etc.)

## SEO & Discoverability

- `sitemap.xml` — lists 8 pages with change frequencies and priorities
- `robots.txt` — allows all crawlers; disallows `/qualifier.html`; references sitemap at `https://ruutdev.com/sitemap.xml`
- Each HTML page includes `<meta name="description">`, `<link rel="canonical">`, Open Graph (`og:*`) and Twitter Card meta tags

## Platform Requirements

**Development:**
- Any static file server or direct browser file open; no build or install step required

**Production:**
- Vercel (confirmed in `privacy.html`: "Vercel: Hosts our website and processes standard web traffic")
- Domain: `ruutdev.com`

---

*Stack analysis: 2026-04-07*
