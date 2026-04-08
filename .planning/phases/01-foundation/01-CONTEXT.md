# Phase 1: Foundation - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Clean up the existing codebase structure and stand up the full backend infrastructure. This phase delivers: reorganized folder layout, shared nav component, secrets out of client-side JS, and a live Supabase database with schema + RLS ready for Phase 2 to consume. No dynamic content appears on the public site yet — that's Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Folder Reorganization (STRC-01)
- **D-01:** Full reorganization — HTML files move to `pages/`, CSS/JS/images to `assets/`, API functions to `api/`, admin panel to `admin/`
- **D-02:** Vercel redirects/rewrites configured in `vercel.json` so existing URLs continue to work (ruutdev.com/index.html → pages/index.html, etc.)
- **D-03:** Root `index.html` stays at root (Vercel needs it there OR a redirect from `/` → `pages/index.html` must be set up — planner should decide the cleanest approach)

### Shared Nav (STRC-02)
- **D-04:** Nav extracted to a `components/nav.html` partial; loaded via JavaScript `fetch()` on page load — no build step needed
- **D-05:** Existing nav behavior (active link detection via `window.location.pathname`, mobile hamburger toggle) must be preserved after migration
- **D-06:** Nav partial loads before DOMContentLoaded to avoid flash of missing nav — planner should handle timing

### Styles Migration (STRC-03)
- **D-07:** Page-specific inline `<style>` blocks migrate to `css/styles.css` (or new page-specific CSS files within `assets/css/`)
- **D-08:** Preserve all existing visual behavior — this is a migration, not a redesign

### Secrets / Contact Form (STRC-04 + INFRA-06 extension)
- **D-09:** Web3Forms API key moves out of `js/main.js` — create `api/contact.js` serverless function that proxies the form submission to Web3Forms
- **D-10:** Public pages call `api/contact.js` instead of Web3Forms directly
- **D-11:** `WEB3FORMS_KEY` added to Vercel environment variables

### Supabase Schema (INFRA-02 + INFRA-03)
- **D-12:** Four tables: `reviews`, `portfolio`, `prices`, `content`
- **D-13:** RLS enabled on ALL tables at creation time (before any data is inserted)
- **D-14:** Anon key can only SELECT rows with `status='approved'` (reviews) or `visible=true` (portfolio); all writes require service-role key
- **D-15:** Supabase project created in **US East (us-east-1) — Virginia** to co-locate with Vercel iad1 functions

### Vercel Infrastructure (INFRA-04 + INFRA-05)
- **D-16:** `vercel.json` includes: CORS headers on all `/api/*` routes, CSP header, `cleanUrls: true`
- **D-17:** Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `ADMIN_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `WEB3FORMS_KEY`

### Supabase Client Utility (INFRA-06)
- **D-18:** `api/_supabase.js` exports a single initialized Supabase client using the service-role key from env vars — imported by all other API functions
- **D-19:** Supabase client is server-side ONLY — never imported in browser JS

### Claude's Discretion
- Exact field names and data types in each Supabase table (standard fields: id UUID, created_at timestamptz, etc.)
- Whether `index.html` stays at root or gets a Vercel rewrite
- File naming convention within `assets/` (e.g., `assets/css/`, `assets/js/`, `assets/img/`)
- Exact CSP policy directives (must not break Google Fonts and Font Awesome CDN)
- How to handle the `qualifier.html` page (it's intentionally standalone — may stay at root)

</decisions>

<specifics>
## Specific Ideas

- The `qualifier.html` page is intentionally standalone (noindex, own styles/scripts) — it should NOT be reorganized into pages/ or have its styles extracted. Leave it as-is.
- The contact form currently uses Web3Forms API. After migration to `api/contact.js`, the existing success/error UI behavior in main.js must remain identical — only the fetch target URL changes.
- Vercel `cleanUrls: true` means `pages/about.html` is accessible as `/about` — this is the desired behavior.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project vision, tech stack decisions, key decisions table
- `.planning/REQUIREMENTS.md` — v1 requirements STRC-01 through INFRA-06 (Phase 1 scope)
- `.planning/research/ARCHITECTURE.md` — Vercel /api auto-detection, vercel.json config patterns, Supabase security boundary
- `.planning/research/STACK.md` — Node.js version, Supabase client version, Vercel limits, auth pattern
- `.planning/research/PITFALLS.md` — RLS off-by-default pitfall, secrets-in-git pitfall, CORS pitfall

### Existing codebase
- `.planning/codebase/ARCHITECTURE.md` — Current page structure, data flow, Stripe CTA wiring, contact form submit pattern
- `.planning/codebase/STRUCTURE.md` — Current directory layout and file locations
- `.planning/codebase/STACK.md` — Current CDN dependencies, CSS design tokens, JS subsystems

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `css/styles.css` — Design token system (CSS custom properties), shared component styles. All reorganized pages must continue linking to this.
- `js/main.js` — `toggleMenu()`, `markActiveLink()`, `applyLang()`, scroll reveal observer, FAQ accordion. These subsystems must survive the nav extraction refactor.
- `js/main.js:submitContactForm()` — This function will be refactored to call `api/contact.js` instead of Web3Forms directly.

### Established Patterns
- `data-en` / `data-es` attributes on all user-facing text — must be preserved in nav partial
- `window.RUUTDEV_CHECKOUT_LINKS` global — lives in main.js, survives this phase unchanged
- `[data-checkout-id]` elements — not touched in Phase 1

### Integration Points
- Nav partial fetch must complete before `markActiveLink()` runs — sequence matters
- `api/contact.js` replaces direct Web3Forms call; response shape must match what `submitContactForm()` expects (success boolean)
- `api/_supabase.js` is the foundation for all subsequent API functions in Phases 2–5

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 1 scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-07*
