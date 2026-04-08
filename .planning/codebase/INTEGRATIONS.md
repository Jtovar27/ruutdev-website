# External Integrations

**Analysis Date:** 2026-04-07

## APIs & External Services

**Form Submission:**
- Web3Forms — processes contact form submissions without a backend
  - Endpoint: `https://api.web3forms.com/submit` (POST, JSON)
  - Auth: `access_key` hardcoded in `js/main.js` line 235 — value `337075f5-4f51-4287-85f9-71d03aee9283`
  - Fields submitted: `name`, `email`, `business`, `type`, `message`
  - Called from: `window.submitContactForm()` in `js/main.js`
  - Timeout: 8 seconds via `AbortController`

**Payment Processing:**
- Stripe — payment links via `buy.stripe.com` hosted checkout pages
  - Integration type: redirect-based (no Stripe.js SDK, no embedded elements)
  - Links are set via `window.RUUTDEV_CHECKOUT_LINKS` in `js/main.js` and wired to `[data-checkout-id]` elements by `initStripeReadyCtas()`
  - Payment link slots defined in `pay.html` inline script (lines 468-480):
    - `monthly_setup.simple` → `https://buy.stripe.com/REPLACE_MONTHLY_SIMPLE_SETUP`
    - `monthly_setup.standard` → `https://buy.stripe.com/REPLACE_MONTHLY_STANDARD_SETUP`
    - `monthly_setup.growth` → `https://buy.stripe.com/REPLACE_MONTHLY_GROWTH_SETUP`
    - `monthly_recurring.simple` → `https://buy.stripe.com/REPLACE_MONTHLY_SIMPLE_RECURRING`
    - `monthly_recurring.standard` → `https://buy.stripe.com/REPLACE_MONTHLY_STANDARD_RECURRING`
    - `monthly_recurring.growth` → `https://buy.stripe.com/REPLACE_MONTHLY_GROWTH_RECURRING`
    - `project` → `https://buy.stripe.com/REPLACE_PROJECT_PAYMENT_LINK`
    - `invoice` → `https://buy.stripe.com/REPLACE_INVOICE_LINK`
  - Status: all links are placeholders — Stripe is NOT yet live
  - Mentioned in: `pay.html`, `pricing.html`, `privacy.html`, `terms.html`, `js/main.js`

**Icon Library:**
- Font Awesome 6.5.0 — loaded from Cloudflare CDN
  - URL: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css`
  - Used on all pages

**Fonts:**
- Google Fonts — loaded from `https://fonts.googleapis.com` and `https://fonts.gstatic.com`
  - Fonts: `Syne`, `DM Sans`, `JetBrains Mono` (qualifier.html only)
  - Used on all pages via `<link rel="preconnect">` and `<link rel="stylesheet">`

## Data Storage

**Databases:**
- None — no database, no backend, no server-side storage

**File Storage:**
- None — static files only

**Caching / Browser Storage:**
- `localStorage` — used for persisting language preference
  - Key: `ruutdev_lang`
  - Values: `'en'` or `'es'`
  - Set/read in `js/main.js` via `applyLang()` and `initContactPrefill()`

## Authentication & Identity

**Auth Provider:**
- None — no user accounts, no login system

## Communication Channels

**WhatsApp:**
- Phone: `+1 (407) 694-6371`
- Links use `https://wa.me/14076946371` format with optional pre-filled `text` query param
- Used as primary sales/support contact across all pages
- Pre-filled message examples:
  - `index.html`: "Hi RuutDev, I'd like to talk about a website or software project."
  - `services.html`: "Hi RuutDev, I'd like to discuss a project."
  - `about.html`: "Hi RuutDev, I'd like to talk about a project."
  - `pricing.html`: "Hi RuutDev, I'd like help choosing the right pricing option."
  - `contact.html`: "Hi RuutDev, I'm interested in a free demo."

**Email:**
- Address: `helloruutdev@hotmail.com`
- Used for Zelle payments, PayPal, privacy rights requests, and general contact
- Appears in `privacy.html`, `terms.html`, `contact.html`, `pay.html`

## Alternate Payment Methods (Manual / Non-API)

These are not API integrations but are offered to clients per `pay.html` and `terms.html`:
- **Zelle** — `helloruutdev@hotmail.com`
- **PayPal** — `helloruutdev@hotmail.com`
- **Bank Transfer (USD)** — details provided on request

## Monitoring & Observability

**Error Tracking:**
- None detected — no Sentry, Datadog, or similar

**Analytics:**
- None active — privacy policy explicitly states "We do not use tracking pixels, behavioral analytics, or data brokers"
- `qualifier.html` references Google Analytics and Facebook/Meta Pixel as integration options for client projects (not for ruutdev.com itself)

**Logs:**
- None — static site, no server-side logging

## Hosting & Deployment

**Hosting:**
- Vercel — confirmed as production host in `privacy.html`
- Domain: `ruutdev.com`

**CI/CD:**
- Not detected — no GitHub Actions, Vercel config files, or deployment scripts present in repository

## Webhooks & Callbacks

**Incoming:**
- None — no webhook endpoints (static site)

**Outgoing:**
- None — no outbound webhook calls

## Integrations Referenced for Client Projects (Not Used by This Site)

The `qualifier.html` lead qualifier and `terms.html` mention these as services RuutDev builds for clients, not integrations used by this website:
- Calendly — appointment scheduling widget
- Google Analytics — visitor tracking
- Facebook/Meta Pixel — ad retargeting
- Google Maps — embedded maps
- Zapier / Make — automation workflows
- OpenAI — AI integrations
- Cloudflare — infrastructure
- Vercel — client hosting

## Environment Configuration

**Required for production activation:**
- Stripe payment links must replace all `REPLACE_*` placeholders in `pay.html` lines 470-480
- `window.RUUTDEV_CHECKOUT_LINKS` in `js/main.js` must be populated with live `buy.stripe.com/...` URLs to activate pricing page CTAs

**Secrets / keys present in source:**
- Web3Forms `access_key` (`337075f5-4f51-4287-85f9-71d03aee9283`) is hardcoded in `js/main.js` line 235 — this is a public-facing key by Web3Forms design, but should be noted

---

*Integration audit: 2026-04-07*
