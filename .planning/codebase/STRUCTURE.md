# Codebase Structure

**Analysis Date:** 2026-04-07

## Directory Layout

```
ruutdev-website/
├── css/
│   └── styles.css        # Shared design system and component styles
├── js/
│   └── main.js           # Shared JavaScript — nav, lang, forms, Stripe CTAs
├── index.html            # Homepage (671 lines)
├── services.html         # Services detail page (362 lines)
├── pricing.html          # Pricing — monthly plans + buyout (858 lines)
├── about.html            # About page (359 lines)
├── contact.html          # Contact form + prefill logic (283 lines)
├── pay.html              # Client payment portal (588 lines)
├── qualifier.html        # Internal sales qualifier tool (1277 lines, noindex)
├── privacy.html          # Privacy policy (247 lines)
├── terms.html            # Terms of service (546 lines)
├── sitemap.xml           # XML sitemap for SEO
├── robots.txt            # Crawler directives
└── .planning/
    └── codebase/         # GSD analysis documents
```

## Directory Purposes

**`css/`:**
- Purpose: Shared stylesheet consumed by all public-facing pages
- Contains: One file — `styles.css` (689 lines)
- Key sections: `:root` design tokens, nav, buttons, forms, footer, scroll-reveal animation, media queries
- Note: `qualifier.html` has its own standalone inline styles and does NOT import this file

**`js/`:**
- Purpose: Shared JavaScript consumed by all public-facing pages
- Contains: One file — `main.js` (251 lines)
- Key functions: `toggleMenu`, `applyLang`, `toggleLang`, `initStripeReadyCtas`, `initContactPrefill`, `submitContactForm`
- Note: `qualifier.html` has its own inline `<script>` and does NOT import this file

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents
- Generated: By GSD mapper agents
- Committed: Yes (planning artifacts)

## Key File Locations

**Entry Points:**
- `index.html`: Homepage — primary public-facing entry point
- `services.html`: Services detail
- `pricing.html`: Pricing page — contains Stripe CTA wiring via `data-checkout-id`
- `contact.html`: Contact form — reads URL params for prefill
- `pay.html`: Client payment portal
- `about.html`: About / company page
- `qualifier.html`: Internal sales tool, not in public nav

**Shared Assets:**
- `css/styles.css`: The one shared stylesheet — must be updated for any global visual change
- `js/main.js`: The one shared script — must be updated for any cross-page behavior

**SEO & Crawl:**
- `sitemap.xml`: Lists all public URLs with priority and changefreq
- `robots.txt`: Controls crawler access

**Legal:**
- `privacy.html`: Privacy policy
- `terms.html`: Terms of service

## Naming Conventions

**Files:**
- All lowercase, hyphen-separated: `styles.css`, `main.js`
- HTML pages named after their primary purpose: `pricing.html`, `contact.html`, `pay.html`
- No versioning suffix in filenames

**Directories:**
- Lowercase, short, singular: `css/`, `js/`

**CSS Classes:**
- BEM-like but informal: `nav-logo`, `btn-primary`, `cta-section`, `why-card`, `form-group`
- Component prefix grouping: `.faq-item`, `.faq-answer`; `.plan-card`, `.plan-price`
- State classes: `.open` (mobile nav, FAQ), `.active` (nav link, lang button), `.visible` (scroll-reveal)

**HTML Data Attributes:**
- `data-en` / `data-es`: Bilingual string values on any user-visible element
- `data-checkout-id`: Key into `window.RUUTDEV_CHECKOUT_LINKS` for Stripe URL resolution
- `data-fallback-href`: Fallback URL when Stripe link is not yet configured
- `data-checkout-state`: Set at runtime to `"live"` or `"fallback"` by `initStripeReadyCtas()`
- `data-lang`: Value on language toggle buttons (e.g., `"en"`, `"es"`)

## Where to Add New Code

**New public page:**
- Create `newpage.html` at project root
- Copy the shared nav and footer HTML blocks from `index.html` (lines 300–680 area for nav/footer pattern)
- Include `<link rel="stylesheet" href="css/styles.css" />` in `<head>`
- Include `<script src="js/main.js"></script>` at end of `<body>`
- Add page-specific styles as an inline `<style>` block in `<head>` after the shared stylesheet link
- Add entry to `sitemap.xml`

**New shared component style:**
- Add to `css/styles.css` with a section comment header: `/* ── COMPONENT NAME ── */`
- Use existing CSS custom properties (`var(--blue)`, `var(--radius)`, etc.) — never hardcode colors or radii

**New cross-page behavior:**
- Add function to `js/main.js`
- Initialize inside the `DOMContentLoaded` listener at bottom of `js/main.js` if startup-required

**New Stripe CTA:**
- Add `data-checkout-id="your-plan-key"` and `data-fallback-href="contact.html?intent=..."` to the anchor tag in the relevant HTML file
- Add the matching key to `window.RUUTDEV_CHECKOUT_LINKS` in `js/main.js` when the Stripe link is ready

**New bilingual string:**
- Add `data-en="English text"` and `data-es="Spanish text"` to the element
- Set the element's `textContent` / `innerHTML` to the English default (it will be replaced at runtime)
- If the string represents a plan label used in contact prefill, add it to `LEAD_PLAN_LABELS` in `js/main.js`

**New internal tool:**
- Create a standalone HTML file (like `qualifier.html`) with `<meta name="robots" content="noindex, nofollow" />`
- Self-contain all styles and scripts inline — do not depend on shared `css/styles.css` or `js/main.js`
- Do not add to `sitemap.xml` or public nav

## Special Directories

**`.planning/`:**
- Purpose: GSD planning and analysis artifacts
- Generated: By GSD commands
- Committed: Yes

**`.claude/`:**
- Purpose: Claude/GSD configuration
- Committed: Yes

---

*Structure analysis: 2026-04-07*
