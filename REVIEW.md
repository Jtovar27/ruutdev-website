---
phase: code-review
reviewed: 2026-04-08T00:00:00Z
depth: deep
files_reviewed: 17
files_reviewed_list:
  - index.html
  - qualifier.html
  - assets/js/main.js
  - assets/js/effects.js
  - assets/css/styles.css
  - api/_supabase.js
  - api/contact.js
  - api/reviews.js
  - pages/privacy.html
  - pages/terms.html
  - pages/about.html
  - pages/contact.html
  - pages/pay.html
  - pages/pricing.html
  - pages/services.html
  - pages/portfolio.html
  - components/nav.html
findings:
  critical: 3
  warning: 9
  info: 7
  total: 19
status: issues_found
---

# RuutDev Website — Code Review Report

**Reviewed:** 2026-04-08
**Depth:** deep (cross-file analysis)
**Files Reviewed:** 17
**Status:** issues_found

## Summary

The site is well-structured for a vanilla HTML/CSS/JS stack — clean architecture, consistent i18n patterns, and sensible serverless API design. Three critical issues were found: reviews are auto-approved on submission (spam/abuse risk), a Swiper CDN conflict causes a double-load, and the `applyLang` function uses `innerHTML` to inject translation strings from HTML attributes (potential XSS via DOM manipulation). Nine warnings cover functional bugs including a broken nav active-link detection, a race condition in nav initialization, an unsanitized query-param injection into a form field, missing CORS header on the reviews endpoint, missing amount validation in the payment form, and several cross-file selector mismatches. Seven info-level items address code quality and maintainability.

---

## Critical Issues

### CR-01: Reviews Auto-Approved — Unauthenticated Public Submissions Immediately Visible

**File:** `api/reviews.js:59`
**Severity:** CRITICAL — Security / Abuse
**Issue:** The POST handler for review submissions sets `is_approved: true` unconditionally. Any visitor can submit any review text and it will appear publicly on the site immediately, with no moderation step. Combined with the lack of rate limiting, this is a trivially exploitable spam and reputation-damage vector. A competitor or bot could flood the live reviews feed with fabricated 1-star reviews within seconds.

```js
// Current — line 59
is_approved: true   // any submission goes live instantly
```

**Fix:** Default new submissions to `is_approved: false`. Add a separate admin-only endpoint or a Supabase dashboard query to approve reviews manually before they are returned by the GET handler.

```js
// api/reviews.js — POST body, line 59
is_approved: false,   // requires manual approval before appearing publicly
```

The GET query already filters on `is_approved=eq.true`, so the read path needs no change — only the write path.

---

### CR-02: `applyLang` Writes Untrusted `data-es` / `data-en` Attribute Values via `innerHTML`

**File:** `assets/js/main.js:121`
**Severity:** CRITICAL — XSS
**Issue:** The language-swap function unconditionally assigns `el.innerHTML` from `el.dataset.es` or `el.dataset.en`. All current attribute values are authored by the developer and safe, but the pattern itself is dangerous: any future content dynamically injected into these attributes from an external source (URL params, database content, CMS) would become an XSS sink. More immediately: the `initContactPrefill` function (line 205) sets `contextBox.textContent` safely, but earlier passes a URL query-param derived string directly into `messageField.value` without stripping HTML — a lower-risk but still inconsistent boundary.

The structural issue is that `innerHTML` as a translation mechanism bypasses all browser XSS protections for the element's subtree.

```js
// Current — assets/js/main.js line 121
el.innerHTML = lang === 'es' ? (el.dataset.es || el.dataset.en) : el.dataset.en;
```

**Fix:** Use `el.textContent` for elements that contain only text. For elements that legitimately need child HTML (e.g., a `<strong>` tag inside translated copy), explicitly opt in with a comment and validate the attribute is developer-controlled.

```js
// Safer default
el.textContent = lang === 'es' ? (el.dataset.es || el.dataset.en) : el.dataset.en;
```

Note: Several page headings use `<br />` and `<em>` tags inside translated strings (e.g., `data-en="Projects That <em>Convert</em>"`). For those specific elements, `innerHTML` is required — annotate them and audit that no user-controlled data ever populates those specific attributes.

---

### CR-03: Swiper Loaded Twice — Second Load Overwrites Global `Swiper` Constructor, Silently Breaking Carousels

**File:** `index.html:778` and `index.html:22`
**Severity:** CRITICAL — Functional Bug (broken carousels on index page)
**Issue:** `index.html` loads Swiper twice from two different CDN sources. The first load is a `<script defer>` in `<head>` (line 22, Cloudflare CDN, version 11.0.5). The second is a non-deferred `<script>` at the bottom of `<body>` just before `</body>` (line 778, jsDelivr CDN, also `swiper@11`). Because the second load is not deferred, it executes synchronously after the DOM is ready. When `main.js` calls `initSwipers()` inside `DOMContentLoaded`, the first Swiper load (deferred) may not yet have executed, so `Swiper` is undefined — or the two script loads race. In either case, carousels on `index.html` are unreliable.

`portfolio.html` has the same duplicate pattern (jsDelivr inline `<script>` at line 430 alongside a Cloudflare `<link rel="stylesheet">` in `<head>`).

```html
<!-- index.html head — line 22 (deferred, Cloudflare) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.0.5/swiper-bundle.min.js" defer></script>

<!-- index.html body end — line 778 (NOT deferred, jsDelivr) -->
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
```

**Fix:** Remove the duplicate. Keep one source only — the non-deferred jsDelivr `<script>` at the bottom of `<body>` is adequate because `initSwipers()` is called inside `DOMContentLoaded`. Remove the `<script defer>` from `<head>` in both `index.html` and `portfolio.html`. Also remove the Cloudflare CSS in `portfolio.html` and use one consistent CDN throughout.

```html
<!-- Keep only this at bottom of <body> — remove the deferred copy in <head> -->
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
```

---

## Warnings

### WR-01: `initSwipers()` Called Before Swiper Script May Be Ready — Race Condition

**File:** `assets/js/main.js:216`
**Severity:** WARNING — Functional Bug
**Issue:** `initSwipers()` is called inside `DOMContentLoaded`. In `index.html`, the Swiper `<script>` tag has `defer`, meaning it is guaranteed to execute after `DOMContentLoaded`. This means `Swiper` is undefined at the time `initSwipers()` runs, and `new Swiper(...)` throws a ReferenceError silently.

**Fix:** Either place the Swiper `<script>` without `defer` at the bottom of `<body>` (before `main.js`), or add a guard inside `initSwipers()`:

```js
function initSwipers() {
  if (typeof Swiper === 'undefined') {
    console.warn('RuutDev: Swiper not loaded, skipping carousel init');
    return;
  }
  // ... rest of function
}
```

The permanent fix is ensuring Swiper is loaded synchronously before `main.js` (non-deferred script at bottom of `<body>`, in correct order).

---

### WR-02: `markActiveNavLink` Path Detection Fails for All Sub-Pages

**File:** `assets/js/main.js:55`
**Severity:** WARNING — Functional Bug
**Issue:** The active nav detection uses `window.location.pathname.split('/').pop()`. For URLs like `https://ruutdev.com/contact`, `.pop()` returns `"contact"` (no extension). But every nav anchor in `components/nav.html` uses paths like `/services`, `/portfolio`, `/contact` — so `href` is `/services` but `path` is `"contact"`. The comparison `href === path` compares `/services` against `contact` — never equal. The active class is never applied on any page.

Additionally, `markActiveNavLink()` is called inside the `.then()` of the nav fetch, which is correct for timing, but the path comparison logic itself is broken.

```js
// assets/js/main.js line 55-61
const path = window.location.pathname.split('/').pop() || 'index.html';
// For /contact → path = "contact"
// href in nav = "/contact"
// "contact" !== "/contact" → no match
```

**Fix:**

```js
function markActiveNavLink() {
  const pathname = window.location.pathname; // e.g. "/contact" or "/"
  document.querySelectorAll('.nav-links a, #nav-mobile a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const isHome = (pathname === '/' || pathname === '/index.html') && (href === '/' || href === 'index.html');
    if (isHome || (href !== '/' && pathname.startsWith(href))) {
      a.classList.add('active');
    }
  });
}
```

---

### WR-03: Nav Initialization Race — `applyLang` Called Before Nav HTML Is Injected

**File:** `assets/js/main.js:25` and `assets/js/main.js:212`
**Severity:** WARNING — Functional Bug (language toggle flicker / broken on first load)
**Issue:** `initNav()` is called immediately (line 36, outside any event listener). The `fetch('/components/nav.html')` is async. Meanwhile, `DOMContentLoaded` fires and calls `applyLang(saved)` at line 213 — but the nav partial may not yet be in the DOM, so all `.lang-btn` and `[data-en]` elements inside the nav are not found, and the saved language is not applied to the nav until the fetch resolves and calls `applyLang(saved)` a second time (line 25). This creates a flash where the nav always shows "EN" active regardless of the saved language, then snaps.

More critically, if the fetch fails (network error, dev environment), `DOMContentLoaded` applies the language to the page body but the nav never loads — `toggleMenu()` and `toggleLang()` are unreachable (no hamburger, no lang buttons in DOM).

**Fix:** Apply lang only after the nav partial is confirmed injected. Move the `DOMContentLoaded` `applyLang` call to run after nav fetch resolves, or add a retry mechanism. The existing code already calls `applyLang(saved)` in the `.then()` callback — but also calls it redundantly in `DOMContentLoaded`. Consider removing the `DOMContentLoaded` call and relying solely on the post-fetch call, with a fallback applied only to non-nav elements.

---

### WR-04: `api/reviews.js` Uses `Access-Control-Allow-Origin: *` — Should Be Restricted

**File:** `api/reviews.js:13`
**Severity:** WARNING — Security
**Issue:** The reviews API sets `Access-Control-Allow-Origin: '*'`, allowing any domain to POST reviews to the endpoint. This means any third-party website can submit reviews from a visitor's browser. For a public GET this is acceptable, but for the POST (submission) route the wildcard origin means any origin can write data.

Compare to `api/contact.js:9` which correctly restricts to `'https://ruutdev.com'`.

```js
// api/reviews.js line 13 — overly permissive
res.setHeader('Access-Control-Allow-Origin', '*');
```

**Fix:** Restrict to the production origin, same as contact.js:

```js
res.setHeader('Access-Control-Allow-Origin', 'https://ruutdev.com');
```

---

### WR-05: `api/reviews.js` — Module Style Mismatch With `api/_supabase.js`

**File:** `api/reviews.js:12`, `api/_supabase.js:6`
**Severity:** WARNING — Functional Bug (may fail on Vercel depending on runtime config)
**Issue:** `api/_supabase.js` uses ES Module syntax (`import`/`export`), while `api/reviews.js` uses CommonJS (`module.exports`). These cannot be mixed in the same Node.js module system without explicit configuration. If Vercel's runtime resolves both under the same module system, one will fail. Specifically, `_supabase.js` uses `import { createClient }` and `export const supabase`, but `reviews.js` uses `module.exports` — meaning `reviews.js` cannot `import` from `_supabase.js`. (Currently `reviews.js` does not import from `_supabase.js` — it reimplements the Supabase call via raw `fetch` — but the inconsistency is a latent trap and indicates the files were written independently.)

**Fix:** Standardize all `api/` files on one module format. Given `_supabase.js` already uses ESM, convert `reviews.js` to ESM and import the shared client to avoid duplicating the Supabase header-building logic:

```js
// api/reviews.js — top
import { supabase } from './_supabase.js';
export default async function handler(req, res) { ... }
```

---

### WR-06: `pay.html` — `effects.js` Loaded With Wrong Relative Path

**File:** `pages/pay.html:345`
**Severity:** WARNING — Functional Bug (effects broken on pay page)
**Issue:** `pay.html` loads effects.js with a relative path:
```html
<script src="js/effects.js" defer></script>
```
All other pages use the absolute path `/assets/js/effects.js`. Because `pay.html` lives in `/pages/`, a relative `js/effects.js` resolves to `/pages/js/effects.js` which does not exist. The cursor glow and GSAP animations will silently fail on the pay page.

**Fix:**
```html
<script src="/assets/js/effects.js" defer></script>
```

---

### WR-07: `pay.html` — `goToCheckout()` Does Not Validate Amount Field

**File:** `pages/pay.html:312`
**Severity:** WARNING — Functional Bug
**Issue:** `goToCheckout()` validates name and email but never validates the `pay-amount` field. A user can proceed to Stripe checkout with an empty, zero, or negative amount value. The amount field is only pre-filled suggestively for monthly plan types — for `project` and `invoice` types it is left blank, and the function does not enforce a minimum.

```js
// pages/pay.html goToCheckout() — no amount check
function goToCheckout() {
  const email = document.getElementById('pay-email').value.trim();
  const name = document.getElementById('pay-name').value.trim();
  // amount never checked
```

**Fix:** Add amount validation before navigating:

```js
const amount = parseFloat(document.getElementById('pay-amount').value);
if (!amount || amount < 1) {
  alert('Please enter a valid payment amount (minimum $1).');
  return;
}
```

---

### WR-08: `initContactPrefill` — URL Query Params Injected Into Form Fields Without Sanitization

**File:** `assets/js/main.js:198-206`
**Severity:** WARNING — XSS / Injection Risk
**Issue:** The `intent`, `plan`, and `source` query parameters from `window.location.search` are processed through `getPlanLabel()` and embedded into the `messageField.value` (line 199) and `contextBox.textContent` (line 205). The `textContent` assignment is safe. However, the `messageField.value` assignment at line 199 inserts the plan label string directly into the textarea value. Plan labels are derived from the internal `LEAD_PLAN_LABELS` map (safe), but the `source` string from the URL (`params.get('source')`) is used in a conditional at line 190 without sanitization. If a future change uses `source` content in an `innerHTML` context, it becomes a stored-in-DOM injection.

More immediately: `params.get('plan')` is passed directly to `getPlanLabel()`, which looks it up in a static map — returning `''` for unknown values. This is safe as-is. However, `params.get('source')` has no such mapping — its raw value is tested only for `=== 'pricing'` but any value passes into the conditional block. The current code path is safe, but the pattern should be documented as requiring a whitelist if extended.

**Fix:** Add explicit whitelisting for query param values that inform UI state:

```js
const ALLOWED_SOURCES = ['pricing', 'services', 'about', 'index'];
const source = ALLOWED_SOURCES.includes(params.get('source')) ? params.get('source') : null;
```

---

### WR-09: `submitLiveReview` — `btn.querySelector('span')` Throws If Button Has No `<span>`

**File:** `assets/js/main.js:469`
**Severity:** WARNING — Functional Bug (uncaught TypeError)
**Issue:** The submit button in `index.html` has the structure `<button class="btn-primary rv-submit"><i ...></i><span>Submit Review</span></button>`. The JS assumes this span always exists:

```js
if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Sending…'; }
```

If `btn.querySelector('span')` returns `null` (e.g., button is rendered differently, or the span is removed during an edit), calling `.textContent` on null throws a TypeError that propagates out of the try/catch's success path (it's outside the try block at line 469 — it's at the top of the function). The error would leave the button stuck in a disabled state with no feedback.

**Fix:**

```js
const btnSpan = btn ? btn.querySelector('span') : null;
if (btn) btn.disabled = true;
if (btnSpan) btnSpan.textContent = 'Sending…';
```

Apply the same pattern to the re-enable at line 485.

---

## Info

### IN-01: `portfolio.html` — Missing Swiper JS Script (Swiper CSS Loaded, JS Never Loaded)

**File:** `pages/portfolio.html:21`
**Severity:** INFO — The portfolio page loads the Swiper CSS from jsDelivr but does not include the Swiper JS in `<head>`. The JS is loaded at line 430 (`<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js">`), which is after `</section>` — this works but is inconsistent with the pattern. The Cloudflare CSS `<link>` in `<head>` is unused (the jsDelivr CSS at line 21 is what's actually applied). The redundant Cloudflare CSS link should be removed.

**Fix:** Remove the Cloudflare CSS link from `<head>`. Keep only the jsDelivr CSS and JS. Move the JS before `main.js` to ensure `Swiper` is available when `initSwipers()` runs.

---

### IN-02: `api/reviews.js` — Raw `req.on('data')` Streaming for POST Body Is Unnecessary

**File:** `api/reviews.js:40-42`
**Severity:** INFO — Code Quality
**Issue:** The POST handler manually streams the request body via `req.on('data')` and `req.on('end')`. Vercel serverless functions parse the request body automatically and expose it as `req.body` (the same way `api/contact.js` uses `req.body` at line 19). This manual streaming is unnecessary, inconsistent, and skips Vercel's built-in JSON parsing — meaning `Content-Type: application/json` from the client is ignored and `JSON.parse(body)` could fail if the body includes encoding variations.

```js
// Unnecessary manual streaming in reviews.js:40-42
let body = '';
await new Promise(resolve => { req.on('data', c => (body += c)); req.on('end', resolve); });
const { name, business, rating, review } = JSON.parse(body || '{}');
```

**Fix:** Use `req.body` directly, as `contact.js` does:

```js
const { name, business, rating, review } = req.body || {};
```

---

### IN-03: `effects.js` — `initFullpageSwipe` Not Cleaned Up on Repeated Resize

**File:** `assets/js/effects.js:277-288`
**Severity:** INFO — Code Quality / Edge Case
**Issue:** The `resize` event listener inside `initFullpageSwipe` attempts to undo the fullpage layout when `window.innerWidth > 768`. However, it does not remove the `resize` listener itself after triggering, meaning on every subsequent resize event above 768px, the cleanup code runs again on already-removed elements (calling `container.remove()` when `container` is no longer in the DOM). This throws a silent DOM error. Additionally, after cleanup the `touchstart`/`touchend` listeners on `document` are never removed, so swipe handling code remains attached even after the layout is reverted.

**Fix:** Remove the event listener after first cleanup, and remove touch/keyboard listeners:

```js
function handleResize() {
  if (window.innerWidth > 768) {
    // ... cleanup code ...
    window.removeEventListener('resize', handleResize);
    // Also remove touch and keyboard listeners
  }
}
window.addEventListener('resize', handleResize);
```

---

### IN-04: `nav.html` — `<div>` Inside `<ul>` Is Invalid HTML

**File:** `components/nav.html:12`
**Severity:** INFO — HTML Validity
**Issue:** The lang toggle `<div class="lang-toggle">` is a direct child of `<ul class="nav-links">`, which is invalid HTML (only `<li>` elements are valid direct children of `<ul>`). Most browsers render it correctly, but screen readers and validators will flag this, and CSS selectors that rely on valid list structure may behave unexpectedly.

```html
<!-- components/nav.html lines 4-16 -->
<ul class="nav-links">
  <li>...</li>
  <div class="lang-toggle">  <!-- Invalid: div inside ul -->
```

**Fix:** Wrap the lang-toggle in a `<li>`:

```html
<li class="nav-lang-item">
  <div class="lang-toggle">
    <button ...>EN</button>
    <button ...>ES</button>
  </div>
</li>
```

---

### IN-05: `index.html` — Two Separate Review Sections Exist (Duplicate Content / Confusing UX)

**File:** `index.html:288` and `index.html:660`
**Severity:** INFO — Content / UX
**Issue:** `index.html` contains two distinct review sections:
1. Lines ~288-347: A static "testimonials" section (`#reviews`) with hardcoded fictional testimonials (Carlos Mendoza, Miguel Torres, Ana González) presented as real social proof.
2. Lines 660-717: A live Supabase-backed "Client Reviews" section (`#client-reviews`) with dynamic fetch and submission form.

Having both creates duplicate "social proof" sections on a single page. The static testimonials may be perceived as fabricated when live reviews are also present. Neither section links to the other, and the static section has no indication it is not from verified clients.

**Recommendation:** Remove the static testimonial section or clearly label it "Sample feedback" / "Early clients" if reviews have not yet been collected via Supabase. Once the live reviews feed has real content, remove the static section entirely.

---

### IN-06: `contact.html` — Form Submit Button Missing `type="button"`

**File:** `pages/contact.html:171`
**Severity:** INFO — HTML Correctness
**Issue:** The form submit button uses `onclick="submitContactForm()"` but does not specify `type="button"`. A button inside a `<form>` element (if one existed as a wrapper) defaults to `type="submit"`, which would cause a full page reload before the JS handler runs. The current markup has no wrapping `<form>` element, so the default behavior is currently safe — but the missing `type` attribute is a fragile assumption.

```html
<!-- pages/contact.html line 171 -->
<button class="btn-primary form-submit" onclick="submitContactForm()">
```

**Fix:**

```html
<button type="button" class="btn-primary form-submit" onclick="submitContactForm()">
```

---

### IN-07: `effects.js` — GSAP `section h2.section-title` Word-Split Clobbers i18n `data-en`/`data-es` Attributes

**File:** `assets/js/effects.js:67-85`
**Severity:** INFO — i18n Bug (subtle)
**Issue:** The GSAP word-reveal animation splits `h2.section-title` element text using `heading.innerText`, then rewrites `heading.innerHTML` with `<span>` wrappers. This destroys the `data-en` and `data-es` attributes on the heading element, replacing its content with raw HTML spans. If the user switches language after GSAP has run the animation, `applyLang()` will try to set `el.innerHTML` from `el.dataset.es` — but the element no longer has those attributes on the `h2` itself (the attribute is preserved on the element, but the content has been overwritten with spans).

This means language-switching on desktop (where GSAP runs) will re-render `h2.section-title` elements with the raw translated text, losing the word-span structure used for the animation — visible as a layout jump. Conversely, the spans contain the EN text baked in at init time, so an ES-speaking user who loads the page on desktop will initially see EN text in headings until they toggle (because GSAP runs after the lang is applied, baking in whatever text was there).

**Fix:** Exclude `section-title` elements from the `applyLang` innerHTML swap, or apply GSAP word-split after language has been set and run only once:

```js
// In applyLang — skip elements already processed by GSAP
document.querySelectorAll('[data-en]').forEach(el => {
  if (el.classList.contains('gsap-word-split')) return; // skip already-animated
  el.innerHTML = lang === 'es' ? (el.dataset.es || el.dataset.en) : el.dataset.en;
});
```

And in effects.js, mark headings after splitting:

```js
heading.classList.add('gsap-word-split');
```

---

_Reviewed: 2026-04-08_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
