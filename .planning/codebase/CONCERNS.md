# Codebase Concerns

**Analysis Date:** 2026-04-07

---

## Tech Debt

**Stripe Payment Links Not Configured:**
- Issue: All eight Stripe checkout URLs in `pay.html` contain `REPLACE_` placeholder strings. The payment page is live and accessible to clients, but every checkout attempt triggers an `alert()` error instead of completing a payment.
- Files: `pay.html` lines 468–480
- Impact: The entire payment flow is non-functional. Clients cannot pay via the web portal; they must use Zelle/PayPal fallbacks.
- Fix approach: Generate real Stripe Payment Links (or Checkout Session URLs) in the Stripe dashboard and replace each `REPLACE_*` constant in the `STRIPE_LINKS` object.

**`window.RUUTDEV_CHECKOUT_LINKS` Is Always Empty:**
- Issue: `js/main.js` defines `window.RUUTDEV_CHECKOUT_LINKS = window.RUUTDEV_CHECKOUT_LINKS || {}` and wires `[data-checkout-id]` links to it, but the object is never populated anywhere in the codebase. The commented-out example block (lines 6–11) shows the intended pattern but it was never implemented.
- Files: `js/main.js` lines 6–12, `pricing.html` lines 506, 526, 551, 575
- Impact: All "Choose Plan" buttons on `pricing.html` fall through to their `data-fallback-href` (contact page), meaning Stripe is effectively bypassed on the pricing page as well.
- Fix approach: Populate `window.RUUTDEV_CHECKOUT_LINKS` with real Stripe URLs before `<script src="js/main.js">` loads, or inline the object assignment in a `<script>` block per page.

**Duplicated Page-Level CSS in Every HTML File:**
- Issue: Each HTML file contains hundreds of lines of page-specific `<style>` blocks embedded in `<head>`. This creates duplication of layout primitives (`.payment-wrapper`, `.contact-wrapper`, `.pricing-overview`, etc.) that are only used on one page each, and makes global style changes require edits to multiple files.
- Files: `index.html` (inline styles start at line 22), `pay.html` (line 22), `contact.html` (line 22), `pricing.html` (line 22), `about.html`, `services.html`
- Impact: Maintaining consistent spacing, breakpoints, and card styles requires touching every file. Risk of drift between pages.
- Fix approach: Extract page-specific component classes into `css/styles.css` or dedicated per-page CSS files (e.g. `css/pay.css`).

**Duplicated Nav and Footer HTML Across Every Page:**
- Issue: The full nav markup (desktop + mobile menu, language toggle) and the four-column footer are copy-pasted verbatim into all eight HTML files with no shared include mechanism.
- Files: `index.html`, `pay.html`, `contact.html`, `pricing.html`, `about.html`, `services.html`, `privacy.html`, `terms.html`
- Impact: Any nav or footer change (adding a link, updating a phone number, changing copy) requires editing eight files. This is the primary source of inconsistency risk.
- Fix approach: Introduce a static site generator (11ty, Astro, Hugo) or a minimal JS-based include system (`fetch()` partials) to centralize nav/footer.

**`qualifier.html` Is Entirely Spanish with No i18n Support:**
- Issue: The sales qualifier tool at `qualifier.html` has all UI text hardcoded in Spanish. Unlike every other page, it has zero `data-en`/`data-es` attributes and does not participate in the shared `applyLang()` system from `js/main.js`. The `<html lang="en">` declaration contradicts the Spanish content.
- Files: `qualifier.html` (entire file)
- Impact: English-speaking visitors who land on this page receive an entirely Spanish UI with no toggle. The `<html lang="en">` tag also gives screen readers and search engines incorrect language metadata.
- Fix approach: Either add bilingual `data-en`/`data-es` attributes to all qualifier strings and call `applyLang()` on load, or change `<html lang="es">` to reflect actual content language.

---

## Known Bugs

**Potential Null Reference Crash on Mobile Menu Close:**
- Symptoms: If a page loads without a `.hamburger` element (e.g. on pages where the nav markup differs), clicking anywhere triggers `Cannot read properties of null (reading 'contains')` and the document-level click handler throws.
- Files: `js/main.js` line 196–199
- Trigger: `document.querySelector('.hamburger')` returns `null` if `.hamburger` is absent; the code does not guard `hamburger` before calling `.contains()`.
- Current workaround: All pages currently have `.hamburger`, so it does not crash in practice — but adding a new page without the full nav block would break it.
- Fix: Add `if (!hamburger) return;` guard before line 198.

**`markActiveLink()` Runs Before DOMContentLoaded:**
- Issue: The IIFE `markActiveLink()` at `js/main.js` line 22 executes at script parse time, before the DOM is guaranteed to be available. The script is loaded at the bottom of `<body>` so this works in practice, but relies on load-order behavior rather than an explicit DOM-ready guarantee.
- Files: `js/main.js` lines 22–30
- Trigger: Moving `<script src="js/main.js">` to `<head>` would break active-link detection.
- Fix: Wrap `markActiveLink()` inside the existing `DOMContentLoaded` listener at line 178.

**`applyLang()` Uses `innerHTML` to Set Translated Content:**
- Issue: `js/main.js` line 89 sets `el.innerHTML` from `data-en`/`data-es` attribute values. Several elements use HTML inside these attributes (e.g. `<em>` tags in headings). If any translated string were ever supplied from external input, this would be an XSS vector. Currently safe because all strings are static HTML attributes, but the pattern is inherently unsafe.
- Files: `js/main.js` line 89, `index.html` line 342 (example of embedded HTML in `data-en`)
- Fix: For text-only nodes use `el.textContent`. For nodes that need HTML (headings with `<em>`), explicitly whitelist them or sanitize with a library.

**Contact Form Error Message Is English-Only:**
- Issue: `submitContactForm()` calls `alert('Please fill in your name and email.')` and `alert('Please enter a valid email address.')` in hardcoded English regardless of the active language setting.
- Files: `js/main.js` lines 216, 220, 248
- Impact: Spanish-language users see English validation errors.
- Fix: Read the current lang from `localStorage.getItem(LANG_KEY)` and provide translated strings.

---

## Security Considerations

**Web3Forms API Key Exposed in Client-Side JavaScript:**
- Risk: The Web3Forms `access_key` value (`337075f5-4f51-4287-85f9-71d03aee9283`) is hardcoded in plaintext in the public JavaScript file. Anyone who views page source can copy the key and submit arbitrary form submissions attributed to RuutDev, potentially exhausting submission quotas or generating spam.
- Files: `js/main.js` line 235
- Current mitigation: Web3Forms keys are designed for client-side use and submissions are rate-limited by the provider. Form data goes to the account email rather than a sensitive system.
- Recommendations: Enable domain-locking in the Web3Forms dashboard so submissions are only accepted from `ruutdev.com`. Add honeypot fields (Web3Forms supports `_honey`) to reduce bot submissions. Consider server-side form proxying (Netlify Functions, Cloudflare Worker) to fully hide the key.

**No Content Security Policy (CSP) Header:**
- Risk: No `Content-Security-Policy` meta tag or server header is defined. This leaves the site open to inline script injection and unauthorized script sources.
- Files: All HTML files
- Current mitigation: None detected.
- Recommendations: Add a `<meta http-equiv="Content-Security-Policy">` tag at minimum, or configure CSP via hosting platform headers. Start with `default-src 'self'; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com`.

**Query Parameter Values Injected into Form Fields Without Sanitization:**
- Risk: `initContactPrefill()` reads `intent`, `plan`, and `source` from `window.location.search` and sets them as field values and `contextBox.textContent`. The `textContent` assignment is safe, but the code path is close to patterns that use `innerHTML` elsewhere.
- Files: `js/main.js` lines 131–174
- Current mitigation: `contextBox.textContent` (safe) is used for display; `messageField.value` assignment is also safe. Risk is low in current form.
- Recommendations: Keep using `textContent`/`.value` assignment (not `innerHTML`) for any user-controlled or URL-sourced string.

**Payment Amount Is Editable by the User Before Stripe Redirect:**
- Risk: `pay.html` auto-fills the `pay-amount` field from `PLAN_AMOUNTS` but the field is a standard `<input type="number">` that users can freely edit. The amount passed to Stripe is whatever the user typed, not the canonical plan price.
- Files: `pay.html` lines 351, 580–582
- Current mitigation: The Stripe Payment Link itself enforces the price on Stripe's side; user-edited amounts are only used to set `prefilled_email` in the redirect URL and do not override Stripe's price.
- Recommendations: Remove the editable amount field when a plan tier is selected, or display it as read-only. Make clear the Stripe session price is authoritative.

---

## Performance Bottlenecks

**Font Awesome Loaded from CDN on Every Page:**
- Problem: All pages load the full Font Awesome 6.5.0 CSS bundle (`all.min.css`) from Cloudflare CDN. This is a ~32 KB compressed stylesheet that declares thousands of icon classes; only a small subset are used.
- Files: Every HTML file, line 19 (e.g. `index.html`, `pay.html`, `contact.html`)
- Cause: Convenience — full CDN bundle rather than a custom SVG subset.
- Improvement path: Switch to individual SVG icon imports or Font Awesome Kit (only loads glyphs actually used). Alternatively, inline the ~10 SVG icons used across the site directly.

**Google Fonts Double Request Waterfall:**
- Problem: Every page loads two Google Fonts families (Syne + DM Sans) using `<link rel="stylesheet">` which adds a render-blocking request. The `qualifier.html` also loads a third family (JetBrains Mono), creating a three-family load.
- Files: All HTML files, lines 17–20
- Improvement path: Self-host font files in a `/fonts/` directory and serve them with proper cache headers. Alternatively, use `font-display: swap` (already partially addressed by Google Fonts URL) and ensure the font CSS is preloaded.

**All Page Styles Are Render-Blocking Inline `<style>` Blocks:**
- Problem: Hundreds of lines of CSS per page are in `<style>` blocks inside `<head>`. While this avoids an extra CSS request per page, the CSS is not shared across pages so there is no cross-page caching benefit for page-specific styles.
- Files: `index.html`, `pay.html`, `contact.html`, `pricing.html`, `about.html`, `services.html`
- Improvement path: Extract into page-specific external CSS files that can be cached by the browser.

**Large `qualifier.html` Single File (1,277 Lines):**
- Problem: `qualifier.html` contains all CSS (in a `<style>` block), all HTML structure, and ~900 lines of JavaScript in a single file. The JavaScript includes all question definitions, multi-select logic, scoring/recommendation engine, brief generator, and clipboard formatter.
- Files: `qualifier.html`
- Improvement path: Split into `qualifier.css`, `qualifier.js`, and the HTML shell. This enables browser caching of JS/CSS separately from HTML on revisits.

---

## Fragile Areas

**Language System State Is Split Across localStorage and DOM Attributes:**
- Files: `js/main.js` lines 54–100, all HTML files
- Why fragile: Language state is persisted to `localStorage` but DOM application depends on the presence of `data-en`/`data-es` attributes on elements. Adding new text to any page requires remembering to add both attributes; missing one silently shows `undefined` (the missing attribute returns `undefined` and `innerHTML` is set to the string `"undefined"`).
- Safe modification: Always add both `data-en` and `data-es` attributes to any new text element. Test by toggling language in the browser console with `applyLang('es')`.
- Test coverage: None — no automated tests exist.

**Pay Page JavaScript Is Inlined and Separate from `main.js`:**
- Files: `pay.html` lines 461–586
- Why fragile: `pay.html` has its own `<script>` block with `STRIPE_LINKS`, `PLAN_AMOUNTS`, `selectPaymentType()`, `selectTier()`, `goToCheckout()`, and `applyQueryContext()` — none of which live in `js/main.js`. If pricing changes, amounts must be updated in both `pay.html` (the PLAN_AMOUNTS table) and wherever Stripe Payment Links are configured, with no shared source of truth.
- Safe modification: Update all three places when pricing changes: `PLAN_AMOUNTS` in `pay.html`, `STRIPE_LINKS` in `pay.html`, and the pricing display in `pricing.html`.

**Active Nav Link Is Hardcoded on `contact.html`:**
- Files: `contact.html` line 85
- Why fragile: `contact.html` has `class="active"` hardcoded on the Contact `<a>` tag, bypassing the dynamic `markActiveLink()` logic. This means if the `markActiveLink()` behavior ever changes or the href changes, the contact page will have double-active states or stale hardcoded state.
- Fix: Remove the hardcoded `active` class and let `markActiveLink()` handle it uniformly.

**`qualifier.html` Has No Connection to the Rest of the Site's Data:**
- Files: `qualifier.html`
- Why fragile: The price ranges in `qualifier.html` (lines 1010–1013, e.g. `'$800 – $1,500'`) are hardcoded separately from the prices shown on `pricing.html` and `pay.html`. If pricing changes, the qualifier will show stale estimates.
- Safe modification: Any pricing update requires manually syncing three locations: `pricing.html`, `pay.html` (`PLAN_AMOUNTS`), and `qualifier.html` (`priceMap`).

---

## Missing Critical Features

**No Favicon:**
- Problem: No `.ico`, `.png`, or SVG favicon file exists anywhere in the project. No `<link rel="icon">` tag is present in any HTML file.
- Impact: Browsers show a generic blank tab icon. OG/social previews also lack a logo image (`og:image` is absent from all pages).
- Blocks: Professional appearance, brand recognition in browser tabs, social share previews.

**No `og:image` on Any Page:**
- Problem: All pages have `og:title` and `og:description` but no `og:image` meta tag.
- Files: All HTML files
- Impact: Social media shares (WhatsApp, LinkedIn, Twitter) show no preview image, significantly reducing click-through rates.

**No Error Tracking or Analytics:**
- Problem: No analytics script (Google Analytics, Plausible, etc.) and no error tracking (Sentry, etc.) is installed on any page.
- Impact: There is no visibility into which pages receive traffic, where users drop off in the payment flow, or whether JavaScript errors are occurring in production for real users.

**`qualifier.html` Not Linked from Any Navigation:**
- Problem: `qualifier.html` has `meta name="robots" content="noindex, nofollow"` and is correctly excluded from `robots.txt`, but it is also not linked from any page in the nav or footer. Access requires knowing the direct URL.
- Files: `robots.txt`, `sitemap.xml` (qualifier is absent), all nav HTML
- Impact: The tool is inaccessible to users unless the URL is shared manually, which limits its use as a sales tool.

---

## Test Coverage Gaps

**No Tests of Any Kind:**
- What's not tested: All JavaScript in `js/main.js` and inline page scripts — language switching, contact form validation, Stripe redirect logic, mobile menu behavior, active link detection, query string prefill.
- Files: All `.js` code and inline `<script>` blocks across all HTML files.
- Risk: Regressions in the payment or contact form flows go undetected until a client reports a broken experience.
- Priority: High — the contact form (`submitContactForm`) and `goToCheckout()` are revenue-critical code paths with zero test coverage.

---

*Concerns audit: 2026-04-07*
