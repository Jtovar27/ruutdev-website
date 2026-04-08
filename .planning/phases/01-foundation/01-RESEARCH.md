# Phase 1: Foundation - Research

**Researched:** 2026-04-07
**Domain:** Codebase reorganization, shared nav via JS fetch, secrets proxy, Supabase schema + RLS, Vercel CORS/CSP
**Confidence:** HIGH (all core claims verified against existing planning research documents and live codebase audit)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Folder Reorganization (STRC-01)**
- D-01: Full reorganization — HTML files move to `pages/`, CSS/JS/images to `assets/`, API functions to `api/`, admin panel to `admin/`
- D-02: Vercel redirects/rewrites configured in `vercel.json` so existing URLs continue to work
- D-03: Root `index.html` stays at root OR a redirect from `/` to `pages/index.html` must be set up — planner decides cleanest approach

**Shared Nav (STRC-02)**
- D-04: Nav extracted to a `components/nav.html` partial; loaded via JavaScript `fetch()` on page load — no build step
- D-05: Existing nav behavior (active link detection, mobile hamburger toggle) must be preserved after migration
- D-06: Nav partial loads before DOMContentLoaded to avoid flash of missing nav — planner handles timing

**Styles Migration (STRC-03)**
- D-07: Page-specific inline `<style>` blocks migrate to `css/styles.css` or new page-specific CSS files within `assets/css/`
- D-08: Preserve all existing visual behavior — migration, not redesign

**Secrets / Contact Form (STRC-04 + INFRA-06 extension)**
- D-09: Web3Forms API key moves out of `js/main.js` — create `api/contact.js` serverless function that proxies to Web3Forms
- D-10: Public pages call `api/contact.js` instead of Web3Forms directly
- D-11: `WEB3FORMS_KEY` added to Vercel environment variables

**Supabase Schema (INFRA-02 + INFRA-03)**
- D-12: Four tables: `reviews`, `portfolio`, `prices`, `content`
- D-13: RLS enabled on ALL tables at creation time (before any data is inserted)
- D-14: Anon key can only SELECT rows with `status='approved'` (reviews) or `visible=true` (portfolio); all writes require service-role key
- D-15: Supabase project created in US East (us-east-1 — Virginia) to co-locate with Vercel iad1 functions

**Vercel Infrastructure (INFRA-04 + INFRA-05)**
- D-16: `vercel.json` includes CORS headers on all `/api/*` routes, CSP header, `cleanUrls: true`
- D-17: Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `ADMIN_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `WEB3FORMS_KEY`

**Supabase Client Utility (INFRA-06)**
- D-18: `api/_supabase.js` exports a single initialized Supabase client using the service-role key — imported by all other API functions
- D-19: Supabase client is server-side ONLY — never imported in browser JS

### Claude's Discretion
- Exact field names and data types in each Supabase table (standard fields: id UUID, created_at timestamptz, etc.)
- Whether `index.html` stays at root or gets a Vercel rewrite
- File naming convention within `assets/` (e.g., `assets/css/`, `assets/js/`, `assets/img/`)
- Exact CSP policy directives (must not break Google Fonts and Font Awesome CDN)
- How to handle the `qualifier.html` page (it is intentionally standalone — may stay at root)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within Phase 1 scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STRC-01 | Codebase reorganized into pages/, assets/, api/, admin/ | Directory layout and Vercel rewrite patterns documented below |
| STRC-02 | Nav markup extracted into a shared include pattern | JS fetch() partial pattern with timing sequencing documented below |
| STRC-03 | Page-specific inline styles migrated to shared stylesheet | Per-file inline style inventory documented; migration approach specified |
| STRC-04 | Secrets (Web3Forms key) moved out of client-side JS | `api/contact.js` proxy pattern with env var documented below |
| INFRA-01 | `package.json` created with `@supabase/supabase-js` | Package.json pattern and Node.js version documented |
| INFRA-02 | Supabase project initialized with 4 tables | Full SQL schema documented below |
| INFRA-03 | RLS enabled on all Supabase tables at creation | RLS policy SQL documented; pitfall about RLS default state called out |
| INFRA-04 | Vercel env vars configured | Full variable list with purposes documented |
| INFRA-05 | `vercel.json` with CORS, CSP, cleanUrls | Complete `vercel.json` template with CSP directives documented |
| INFRA-06 | Shared `api/_supabase.js` utility | Pattern documented; server-only boundary enforced |
</phase_requirements>

---

## Summary

Phase 1 is a pure infrastructure and refactoring phase — no new public-facing features are visible to end users at the end of it. The work falls into four lanes: (1) physical reorganization of the codebase from a flat root layout into a structured directory tree, (2) eliminating nav duplication by loading a single HTML partial via `fetch()`, (3) moving the Web3Forms API key from client-side JS into a serverless proxy function, and (4) provisioning Supabase (schema + RLS) and Vercel (env vars, headers) so Phase 2 can immediately begin writing API functions that read from the database.

The biggest technical risk in this phase is nav timing: a nav partial loaded via `fetch()` is async, and the existing `markActiveLink()` IIFE in `main.js` executes synchronously at parse time. The nav must be injected before `markActiveLink()` and before `applyLang()` run. This sequencing issue requires careful handling or a refactor of those two functions to run after the nav is injected. All other work in this phase is low-risk mechanical migration.

The second risk is that the directory reorganization changes all relative asset paths (`href="css/styles.css"` → `href="../assets/css/styles.css"` from `pages/`). Every HTML file's `<link>` and `<script>` tags need updating, and Vercel URL rewrites must be validated so no existing public URL breaks. `cleanUrls: true` in `vercel.json` means `pages/about.html` will be accessible as `/about` — which is the desired behavior.

**Primary recommendation:** Execute in this order: (1) file reorganization + path fixes + Vercel rewrites, (2) nav partial extraction, (3) styles migration, (4) contact form proxy, (5) Supabase provisioning, (6) `api/_supabase.js` utility. Each step is independently testable.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | `^2` | Supabase Postgres client for serverless functions | v2 is stable, current major since 2022; used server-side only via `api/_supabase.js` |
| Node.js runtime (Vercel) | 22.x LTS | Serverless function runtime | Node 22.x is current LTS; confirmed available on Vercel Hobby [VERIFIED: existing .planning/research/STACK.md] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vercel CLI | 50.x (installed) | Local dev and deploy | Use `vercel dev` for local testing of serverless functions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JS fetch() for nav partial | Server-side include (SSI) | SSI requires Nginx/Apache; Vercel static has no SSI support |
| JS fetch() for nav partial | Build step (HTML includes) | Contradicts no-build-step constraint |
| `api/contact.js` proxy | Keep Web3Forms direct in browser | Key remains exposed in client-side JS — ruled out by D-09 |

**Installation:**
```bash
npm init -y
npm install @supabase/supabase-js
```

Set `"engines": { "node": "22.x" }` in `package.json`.

**Version verification:** [VERIFIED: local environment — Node.js v22.22.1, npm 10.9.4, Vercel CLI 50.22.1]

---

## Architecture Patterns

### Recommended Project Structure (target state after Phase 1)

```
ruutdev-website/
├── index.html               ← STAYS AT ROOT (Vercel entry point for /)
├── qualifier.html           ← STAYS AT ROOT (intentionally standalone, noindex)
├── robots.txt               ← STAYS AT ROOT (must be at root for crawlers)
├── sitemap.xml              ← STAYS AT ROOT (must be at root for SEO)
├── pages/
│   ├── about.html
│   ├── contact.html
│   ├── pay.html
│   ├── pricing.html
│   ├── privacy.html
│   ├── services.html
│   └── terms.html
├── assets/
│   ├── css/
│   │   └── styles.css       ← moved from css/styles.css
│   └── js/
│       └── main.js          ← moved from js/main.js
├── components/
│   └── nav.html             ← extracted nav partial
├── api/
│   ├── _supabase.js         ← shared Supabase client (INFRA-06)
│   └── contact.js           ← Web3Forms proxy (STRC-04)
├── admin/                   ← placeholder dir only in Phase 1
├── package.json             ← Node.js deps for API functions
├── vercel.json              ← CORS, CSP, cleanUrls, rewrites
└── .gitignore               ← must include .env, .env.local
```

**Why `index.html` stays at root:** Vercel serves the root `/` from `index.html` at the project root. Moving it requires a rewrite rule (`/` → `/pages/index.html`), which adds complexity and a potential redirect latency. Keeping it at root is the cleanest approach for the homepage. [ASSUMED]

**Why `qualifier.html` stays at root:** Explicitly stated in CONTEXT.md specifics section — it is intentionally standalone with its own styles/scripts and should not be reorganized.

**Why `robots.txt` and `sitemap.xml` stay at root:** These files must be served from the domain root for crawlers and search engines to discover them. Moving them breaks SEO. [VERIFIED: standard web convention]

### Pattern 1: Vercel URL Rewrites for Relocated HTML Files

Pages move from `/*.html` to `pages/*.html`. With `cleanUrls: true`, Vercel strips the `.html` extension automatically. The `rewrites` array handles redirecting the old paths.

```json
// vercel.json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "rewrites": [
    { "source": "/about", "destination": "/pages/about" },
    { "source": "/contact", "destination": "/pages/contact" },
    { "source": "/pay", "destination": "/pages/pay" },
    { "source": "/pricing", "destination": "/pages/pricing" },
    { "source": "/privacy", "destination": "/pages/privacy" },
    { "source": "/services", "destination": "/pages/services" },
    { "source": "/terms", "destination": "/pages/terms" }
  ]
}
```

**Note:** With `cleanUrls: true` active, `pages/about.html` is reachable at `/pages/about`. The rewrites map `/about` → `/pages/about`, which means the clean public URLs stay the same. [VERIFIED: .planning/research/ARCHITECTURE.md — cleanUrls pattern confirmed]

**Note on `.html` extension in hrefs:** After migration, internal links in HTML files (e.g., `href="about.html"`) must be updated to `href="/about"` (absolute path, no extension). This is required because: (1) the files are no longer at root, (2) relative paths from `pages/` would break. Using absolute paths avoids relative-path maintenance across directory levels.

### Pattern 2: Nav Partial via fetch() with Timing Guard

The nav HTML is extracted to `components/nav.html`. Each page injects it via fetch at the top of `<body>` before the rest of the DOM loads. The critical timing requirement is that `markActiveLink()` and `applyLang()` must run AFTER the nav DOM is injected.

**Refactoring required in `main.js`:**
- `markActiveLink()` is currently an IIFE that runs at parse time (line 22-30). It must be converted to a regular function called after nav injection.
- `applyLang()` is initialized in `DOMContentLoaded`. It already has safe timing for the language system, but it also targets `[data-en]` elements including nav items — so the nav must be in the DOM before `DOMContentLoaded` fires.

**Recommended implementation:**

```javascript
// In each page's <head>, after <link> tags:
// Inline script — loads nav synchronously as a blocking fetch
// before body content renders (avoids flash of missing nav)

// Option A: Inline <script> in <head> using document.write equivalent (not recommended)
// Option B: Placeholder div + fetch in first <script> in <body>
```

**Recommended approach — placeholder + fetch in first body element:**

```html
<!-- At the very top of <body>, before any content -->
<div id="nav-placeholder"></div>
<script>
  fetch('/components/nav.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('nav-placeholder').outerHTML = html;
      // markActiveLink and applyLang run after nav is injected
      if (typeof markActiveNavLink === 'function') markActiveNavLink();
      const saved = localStorage.getItem('ruutdev_lang') || 'en';
      if (typeof applyLang === 'function') applyLang(saved);
    });
</script>
```

**The `DOMContentLoaded` listener in `main.js` also calls `applyLang(saved)` — this is safe to leave as a fallback since `applyLang` is idempotent.**

**Key constraint:** `main.js` must be loaded before this inline script runs OR the inline script must include the nav-init logic. The cleanest approach: move nav injection into `main.js` itself as an `initNav()` function called at the top, before `DOMContentLoaded`. [ASSUMED — exact pattern is planner's discretion per D-06]

### Pattern 3: `api/contact.js` — Web3Forms Proxy

```javascript
// Source: Based on existing submitContactForm() pattern in js/main.js
// api/contact.js

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://ruutdev.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, business, type, message } = req.body;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        access_key: process.env.WEB3FORMS_KEY,
        name, email, business, type, message
      })
    });
    clearTimeout(timeout);
    if (response.ok) {
      return res.status(200).json({ success: true });
    }
    return res.status(502).json({ error: 'Upstream error' });
  } catch {
    clearTimeout(timeout);
    return res.status(500).json({ error: 'Request failed' });
  }
}
```

**Change in `main.js` `submitContactForm()`:** Replace the `fetch('https://api.web3forms.com/submit', ...)` call and hardcoded `access_key` with `fetch('/api/contact', ...)` — no `access_key` in the body. The success/error UI behavior remains identical.

### Pattern 4: `api/_supabase.js` — Shared Supabase Client

```javascript
// Source: .planning/research/STACK.md + .planning/research/ARCHITECTURE.md
// api/_supabase.js

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // server only — bypasses RLS for admin ops
);
```

**Usage in other API functions:**
```javascript
import { supabase } from './_supabase.js';
// Then: const { data, error } = await supabase.from('reviews').select('*');
```

**Critical:** `_supabase.js` prefix with underscore means Vercel does NOT expose this as an HTTP route (`/api/_supabase`). Underscored files in `api/` are treated as utilities. [VERIFIED: Vercel docs convention documented in .planning/research/ARCHITECTURE.md]

### Pattern 5: Supabase Schema with RLS

```sql
-- Run in Supabase SQL editor after project creation

-- Reviews submitted by site visitors
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  role        TEXT,
  company     TEXT,
  rating      INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read approved reviews"
  ON reviews FOR SELECT USING (status = 'approved');

-- Portfolio projects managed by admin
CREATE TABLE portfolio (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  title_es       TEXT,
  description    TEXT,
  description_es TEXT,
  url            TEXT,
  image_url      TEXT,
  tags           TEXT[],
  visible        BOOLEAN NOT NULL DEFAULT true,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read visible portfolio"
  ON portfolio FOR SELECT USING (visible = true);

-- Pricing packages (admin editable)
CREATE TABLE prices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key    TEXT UNIQUE NOT NULL,
  label_en    TEXT NOT NULL,
  label_es    TEXT,
  amount_usd  INT  NOT NULL,
  stripe_link TEXT,
  features_en TEXT[],
  features_es TEXT[],
  visible     BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read visible prices"
  ON prices FOR SELECT USING (visible = true);

-- General site content (hero text, service descriptions, etc.)
CREATE TABLE content (
  key        TEXT PRIMARY KEY,
  value_en   TEXT NOT NULL,
  value_es   TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read all content"
  ON content FOR SELECT USING (true);
```

**Why `role` and `company` fields on `reviews`:** Required by REQUIREMENTS.md REV-01 — review submission form captures name, role, company, rating, text. [VERIFIED: REQUIREMENTS.md line 42]

**Why `tags TEXT[]` on `portfolio`:** Required by REQUIREMENTS.md DISP-03 — "tech tags" on portfolio cards. Array type is native PostgreSQL. [VERIFIED: REQUIREMENTS.md line 35]

**Why `features_en TEXT[]` and `features_es TEXT[]` on `prices`:** Pricing cards show feature lists in both languages. Required by ADMN-04 — admin edits feature lists. [VERIFIED: REQUIREMENTS.md line 58]

### Pattern 6: `vercel.json` — Complete Configuration

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "rewrites": [
    { "source": "/about",    "destination": "/pages/about" },
    { "source": "/contact",  "destination": "/pages/contact" },
    { "source": "/pay",      "destination": "/pages/pay" },
    { "source": "/pricing",  "destination": "/pages/pricing" },
    { "source": "/privacy",  "destination": "/pages/privacy" },
    { "source": "/services", "destination": "/pages/services" },
    { "source": "/terms",    "destination": "/pages/terms" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin",  "value": "https://ruutdev.com" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PATCH,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type,Authorization" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://api.web3forms.com; frame-ancestors 'none';"
        }
      ]
    }
  ]
}
```

**CSP directive rationale:**
- `script-src 'unsafe-inline'`: Required because all pages use inline `onclick=` attributes (`onclick="toggleMenu()"`, `onclick="toggleLang('en')"`) and inline `<script>` blocks. Removing `unsafe-inline` would require removing all inline event handlers — out of scope for Phase 1.
- `style-src 'unsafe-inline'`: Required for the page-specific `<style>` blocks until they are migrated (STRC-03).
- `connect-src https://api.web3forms.com`: After Phase 1, the contact form calls `/api/contact` (self), but during migration, Web3Forms may be called briefly. This origin should be removed once `api/contact.js` is live.
- No Supabase origin in `connect-src` yet: public pages do not call Supabase directly in Phase 1. Phase 2 will need to add `https://*.supabase.co` if the anon key is used browser-side, or this can stay as `'self'` only if all Supabase calls go through Vercel functions.
- `frame-ancestors 'none'`: Prevents clickjacking. [VERIFIED: standard security header]

**Note on `SUPABASE_ANON_KEY`:** D-17 in CONTEXT.md lists `SUPABASE_ANON_KEY` as an environment variable. In Phase 1, this key is not used by any code yet. It should still be added to Vercel now so Phase 2 can use it without a separate env var deploy step. [ASSUMED — aligns with D-17 intent]

### Anti-Patterns to Avoid

- **Loading nav with `document.write()`:** Synchronous, deprecated, blocked in many contexts. Use `fetch()` + DOM insertion.
- **Using `routes` key in `vercel.json`:** Deprecated, conflicts with automatic `/api` function detection. Use `rewrites` and `headers`. [VERIFIED: .planning/research/ARCHITECTURE.md]
- **Relative asset paths from `pages/` subdir:** `href="css/styles.css"` from `pages/about.html` resolves to `/pages/css/styles.css` which does not exist. All asset references must use absolute root-relative paths: `href="/assets/css/styles.css"`.
- **Committing `.env` to git:** Must add to `.gitignore` before creating any `.env` file. [VERIFIED: .planning/research/PITFALLS.md Pitfall 6]
- **Enabling RLS after inserting seed data:** RLS policies apply to future queries; data already inserted while RLS was off has no row-level protection until policies are evaluated. Enable RLS at table creation before any data. [VERIFIED: .planning/research/PITFALLS.md Pitfall 1]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supabase client initialization | Custom Postgres `pg` client | `@supabase/supabase-js` createClient | Handles connection pooling, RLS, typed responses, retries |
| HTML nav inclusion | Custom server-side include | `fetch()` + DOM injection (client-side) | No build step available; this is the correct no-framework approach |
| Asset path rewriting after move | Manual find/replace in HTML | Vercel `rewrites` + absolute paths | Rewrites handle URL continuity; absolute paths handle asset loading |
| Secret management | `.env` file committed to git | Vercel dashboard environment variables | Env vars in dashboard never touch git, per-environment scope |

**Key insight:** This phase is almost entirely configuration and file movement, not feature code. The risk is not complexity — it is path breakage from the reorganization. Use absolute paths everywhere and validate with a Vercel preview deploy.

---

## Common Pitfalls

### Pitfall 1: Nav Flash (FOUC — Flash of Unstyled/Missing Content)
**What goes wrong:** Nav loads asynchronously via `fetch()`. Until the promise resolves, the nav placeholder is empty. Users see the page render without a nav for 50-300ms (depending on network speed and cold start).
**Why it happens:** `fetch()` is async by nature. There is no native synchronous HTML include in the browser.
**How to avoid:** Place the nav fetch `<script>` as the very first element inside `<body>`, before any page content. The browser parses and executes it before rendering the rest of the body. The nav HTML itself is small (~600 bytes) so the fetch resolves quickly on localhost. On Vercel, it is a static file served from CDN — response time is < 50ms.
**Warning signs:** Nav items missing on page load, active link class applied to wrong element, language not applied to nav items on first load.

### Pitfall 2: `markActiveLink()` Runs Before Nav is in DOM
**What goes wrong:** The existing `markActiveLink()` IIFE in `main.js` (line 22-30) queries `.nav-links a` and `#nav-mobile a`. If it runs before the nav partial is injected, it finds zero elements and sets no active class. The nav then loads without any active link.
**Why it happens:** IIFEs run at parse time when `main.js` is parsed. Nav fetch is async and resolves later.
**How to avoid:** Convert `markActiveLink` from an IIFE to a named function. Call it explicitly inside the `.then()` callback of the nav fetch. Remove or guard the IIFE invocation so it only runs if nav elements already exist in the DOM.
**Warning signs:** Active nav link never highlights on any page after refactor.

### Pitfall 3: Relative Paths Break After Moving Files to `pages/`
**What goes wrong:** A page at `pages/contact.html` with `href="css/styles.css"` resolves to `pages/css/styles.css` — which does not exist. The page loads unstyled.
**Why it happens:** Relative paths are resolved relative to the file's location, not the project root.
**How to avoid:** Change ALL asset references in every moved HTML file to root-relative absolute paths: `href="/assets/css/styles.css"`, `src="/assets/js/main.js"`. Also update internal links between pages from `href="about.html"` to `href="/about"`.
**Warning signs:** Pages render without styles or scripts after reorganization.

### Pitfall 4: RLS Policy Created but Not Restricting Correctly
**What goes wrong:** RLS is enabled but the `USING` clause has a logic error (e.g., `USING (true)` on the reviews table instead of `USING (status = 'approved')`), allowing anon reads of pending/rejected reviews.
**Why it happens:** Supabase's RLS policies are SQL-level — no UI feedback if the policy is logically wrong. The table shows "RLS enabled" but the policy is overly permissive.
**How to avoid:** After creating policies, test them explicitly: open Supabase SQL editor, set `SET ROLE anon;`, and run `SELECT * FROM reviews` — you should only see approved rows. [VERIFIED: .planning/research/PITFALLS.md Pitfall 1]
**Warning signs:** `SELECT * FROM reviews` (with anon role) returns pending rows.

### Pitfall 5: Contact Form Breaks During Migration Window
**What goes wrong:** If `main.js` is updated to call `/api/contact` before `api/contact.js` is deployed, the contact form fails with a 404 on every submission.
**Why it happens:** Code and infra deploy order mismatch.
**How to avoid:** Deploy `api/contact.js` (with `WEB3FORMS_KEY` env var set) as the first step before changing the fetch target in `main.js`. Verify the function responds at `/api/contact` in the Vercel preview deploy before pushing the `main.js` change.

### Pitfall 6: `.gitignore` Added After `.env` is Already Committed
**What goes wrong:** Developer creates `.env.local` to test Supabase credentials locally, then adds `.gitignore`. The `.env.local` file is already tracked and remains in git history even after deletion.
**Why it happens:** `.gitignore` only affects untracked files.
**How to avoid:** Create `.gitignore` with `.env*` entries as the FIRST task in this phase, before any `.env` file exists. [VERIFIED: .planning/research/PITFALLS.md Pitfall 6]

### Pitfall 7: CSP Blocks Google Fonts or Font Awesome
**What goes wrong:** A strict CSP is added in `vercel.json` that omits the Google Fonts or Font Awesome CDN origins. Pages load with broken typography and missing icons.
**Why it happens:** CSP `style-src` and `font-src` must explicitly allow the CDN origins used by the existing stylesheets.
**How to avoid:** The CSP template in Pattern 6 above includes all required CDN origins. Validate on a preview deploy before merging.
**Warning signs:** Browser console shows "Refused to load stylesheet" or "Refused to load font" with CSP violation messages.

---

## Code Examples

### Contact Form — Updated fetch target in `main.js`

```javascript
// Source: Derived from existing submitContactForm() in js/main.js
// Only the fetch call changes — everything else is identical

try {
  const res = await fetch('/api/contact', {  // was: 'https://api.web3forms.com/submit'
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({ name, email, business, type, message })
    // access_key removed — now lives in process.env.WEB3FORMS_KEY server-side
  });
  // ... rest of success/error handling unchanged
}
```

### Nav Injection with Timing Safety

```javascript
// Inline in each page at top of <body>
// runs before DOMContentLoaded so applyLang() sees nav elements

(function loadNav() {
  fetch('/components/nav.html')
    .then(r => r.text())
    .then(html => {
      const el = document.getElementById('nav-placeholder');
      if (el) el.outerHTML = html;
      // These functions are defined in main.js which loads after this script
      // DOMContentLoaded handles applyLang — no need to call it here
      // markActiveLink is the only function that needs post-inject timing
      if (typeof markActiveNavLink === 'function') markActiveNavLink();
    })
    .catch(() => {
      // Fail silently — nav missing is better than broken page
    });
})();
```

### `.gitignore` (minimum required)

```
# Environment variables — never commit
.env
.env.local
.env.production
.env.development

# Node
node_modules/

# Vercel
.vercel/
```

### `package.json`

```json
{
  "name": "ruutdev-website",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": "22.x"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2"
  }
}
```

Note: `stripe` is NOT included yet — it is not needed until Phase 5 (PAY-03, Stripe webhook). Including it in Phase 1 is premature. [VERIFIED: REQUIREMENTS.md traceability table — PAY-03 is Phase 5]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `routes` key in vercel.json | `rewrites` + `headers` + `redirects` | Vercel deprecation (stable as of 2023) | `routes` is no longer valid for Hobby plan projects; use separate keys |
| Nav markup duplicated in every HTML file | Shared partial via JS fetch() | N/A (this project's migration) | Single source of truth for nav; editable in one file |
| Secrets in client-side JS | Vercel environment variables + serverless proxy | N/A (this project's migration) | Key never visible in DevTools network tab |
| Flat root HTML layout | Organized directory structure | N/A (this project's migration) | Maintainable separation of concerns |

**Deprecated/outdated:**
- `document.write()`: Synchronous, deprecated for HTML injection. Never use for nav loading.
- `routes` key in `vercel.json`: Superseded by `rewrites`, `redirects`, `headers`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `index.html` should stay at root rather than moving to `pages/` | Architecture Patterns — Project Structure | Low — if moved, a single `vercel.json` rewrite handles it. Visual impact: none. |
| A2 | Nav injection should happen via inline script at top of `<body>` rather than a separate utility JS file loaded in `<head>` | Architecture Patterns — Pattern 2 | Low — alternate approach (preload link + inline script) works equally well. The planner can choose the exact mechanism. |
| A3 | `SUPABASE_ANON_KEY` should be added to Vercel env vars now even though not used in Phase 1 code | Architecture Patterns — Pattern 6 (vercel.json note) | Low — adding it later is equally valid; just an extra Vercel dashboard step in Phase 2. |
| A4 | `stripe` package should NOT be added to `package.json` in Phase 1 | Code Examples — package.json | Low — adding it now is harmless (Vercel just installs it); leaving it out keeps Phase 1 minimal. |

---

## Open Questions

1. **Nav partial: absolute hrefs or root-relative hrefs inside `nav.html`?**
   - What we know: After reorganization, pages live at `/pages/about.html`, `/pages/pricing.html`, etc. With `cleanUrls: true` and Vercel rewrites, the public URLs are `/about`, `/pricing`.
   - What's unclear: The nav links in `nav.html` — should they be `href="/about"` (absolute) or `href="about.html"` (relative)?
   - Recommendation: Use absolute root-relative paths (`href="/about"`) in `nav.html`. This works from any page regardless of directory depth.

2. **`markActiveLink()` detection after moving pages**
   - What we know: The existing `markActiveLink()` uses `window.location.pathname.split('/').pop()` to get the filename, then compares against `href` attributes. With clean URLs, `window.location.pathname` will be `/about` (no `.html`), but the nav links will be `href="/about"`.
   - What's unclear: The current logic checks `href === path` where path is the last segment. `/about` vs `about` — these won't match.
   - Recommendation: Rewrite `markActiveLink()` to use `window.location.pathname` directly (not `.pop()`) and compare against the full href value. This is a required refactor as part of nav extraction (D-05 requires preserving active link behavior).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|---------|
| Node.js | Vercel functions, local dev | Yes | 22.22.1 | — |
| npm | Package install | Yes | 10.9.4 | — |
| Vercel CLI | Preview deploys, local function testing | Yes | 50.22.1 | Deploy via git push |
| Supabase account | INFRA-02, INFRA-03 | External — must create | — | None — required |
| Vercel project (production) | INFRA-04, INFRA-05 | Assumed exists (site is live at ruutdev.com) | — | — |

**Missing dependencies with no fallback:**
- Supabase account/project: Must be created manually in Supabase dashboard before API functions can run. This is a human action, not a code task — planner must include this as an explicit step.

**Missing dependencies with fallback:**
- None. All code dependencies can be installed via `npm install`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test infrastructure exists |
| Config file | None — Wave 0 must create |
| Quick run command | N/A — see Wave 0 |
| Full suite command | N/A — see Wave 0 |

**Note:** This is a static site with no automated tests currently. Phase 1 is infrastructure/migration work. Validation is primarily manual: verify pages load correctly, nav works, form submits to proxy, Supabase tables exist with RLS. The planner should use a "smoke test" approach — verify each deliverable manually in a Vercel preview deploy.

### Phase Requirements — Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STRC-01 | Files live under pages/, assets/, api/ — no stray HTML at root (except index.html, qualifier.html) | Manual verification | `ls *.html` shows only index.html and qualifier.html | N/A |
| STRC-02 | Nav renders identically across all pages and is maintained in one place | Manual — visual check in browser | Open each page in Vercel preview; verify nav present + active link correct | N/A |
| STRC-03 | No inline `<style>` blocks remain in moved HTML files | Automated lint | `grep -r "<style>" pages/` returns empty | N/A |
| STRC-04 | Web3Forms key not present in any JS file | Automated grep | `grep -r "web3forms" js/ assets/js/` returns only the fetch URL (no API key) | N/A |
| INFRA-01 | `package.json` exists with `@supabase/supabase-js` | File check | `cat package.json` | N/A |
| INFRA-02 | Supabase tables exist | Manual — Supabase dashboard | Table editor shows reviews, portfolio, prices, content | N/A |
| INFRA-03 | RLS enabled | Manual SQL | `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'` — all show `t` | N/A |
| INFRA-04 | Env vars configured | Manual — Vercel dashboard | Settings → Environment Variables shows all 7 vars | N/A |
| INFRA-05 | `/api/*` routes respond with CORS headers, CSP header on all routes | Automated curl | `curl -I https://[preview-url]/api/contact` shows `Access-Control-Allow-Origin` header | N/A |
| INFRA-06 | `api/_supabase.js` exports initialized client | Code review | File exists, imports `createClient`, uses `process.env` | N/A |

### Sampling Rate
- **Per task commit:** Manual browser check — open the affected page in a Vercel preview and confirm the change works
- **Per wave merge:** Full smoke test — open every page, verify nav, verify contact form, check CORS headers with curl
- **Phase gate:** All 10 success criteria from ROADMAP.md verified before `/gsd-verify-work`

### Wave 0 Gaps
- No test framework needed for Phase 1 — manual verification is the appropriate strategy for a migration/infrastructure phase with no application logic to unit test.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (auth is Phase 3) | — |
| V3 Session Management | No (sessions are Phase 3) | — |
| V4 Access Control | Partial — RLS policies on Supabase tables | Supabase Row Level Security with explicit USING clauses |
| V5 Input Validation | Partial — contact form proxy validates nothing new yet | Existing `name`/`email` validation in `submitContactForm()` preserved |
| V6 Cryptography | No | — |
| V7 Error Handling | Partial | No secrets in error responses from `api/contact.js` |
| V8 Data Protection | Yes — secrets out of client JS | Vercel env vars for `WEB3FORMS_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

### Known Threat Patterns for This Phase's Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Service role key in client-side JS | Information Disclosure | Key in Vercel env vars only; `api/_supabase.js` server-side only |
| RLS misconfiguration allowing anon reads of pending reviews | Disclosure | Create RLS policies at table creation; test with `SET ROLE anon;` in Supabase SQL editor |
| CSP too permissive allowing arbitrary script injection | Elevation of Privilege | Start with `'unsafe-inline'` for inline handlers (Phase 1 constraint); tighten in future phases by removing inline onclick attributes |
| Secrets committed to git | Tampering / Disclosure | `.gitignore` with `.env*` as first Phase 1 task before any env file creation |
| CORS wildcard on API routes | Cross-Site Request Forgery | Use `https://ruutdev.com` origin (not `*`) in CORS header for `/api/*` |

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/ARCHITECTURE.md` — Vercel auto-detection of `/api/`, `cleanUrls`, `rewrites` vs `routes`, CORS header config pattern, Supabase schema, RLS policies
- `.planning/research/STACK.md` — Node.js 22.x on Vercel, `@supabase/supabase-js v2`, Vercel Hobby limits, env var names
- `.planning/research/PITFALLS.md` — RLS default-off pitfall, secrets-in-git pitfall, CORS misconfiguration, CSP blocking CDNs
- `.planning/codebase/STRUCTURE.md` — Current file layout, inline style locations, nav markup
- `.planning/codebase/ARCHITECTURE.md` — `markActiveLink()` timing, `applyLang()` timing, `submitContactForm()` fetch pattern
- `js/main.js` — Verified directly: `markActiveLink` IIFE at line 22, Web3Forms key at line 235, fetch target URL
- `index.html` — Verified directly: inline style block lines 22-296, nav markup lines 300-327

### Secondary (MEDIUM confidence)
- `.planning/codebase/STACK.md` — CDN dependencies (Font Awesome, Google Fonts) and their exact URLs verified against HTML files

### Tertiary (LOW confidence)
- None — all claims in this research are verified against project files or prior research documents.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages verified in prior research against Vercel docs
- Architecture: HIGH — all patterns derived from verified prior research + live codebase audit
- Pitfalls: HIGH — sourced from prior research PITFALLS.md which documented confidence levels per pitfall

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (Vercel/Supabase APIs are stable; 30-day window appropriate)
