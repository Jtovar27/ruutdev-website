# Technology Stack

**Project:** RuutDev Website v2
**Researched:** 2026-04-07
**Research mode:** Ecosystem — adding backend/admin/CMS layer to existing vanilla static site on Vercel

---

## Context Constraints (non-negotiable)

These are fixed by PROJECT.md and cannot be changed without a full platform migration:

- Public pages stay vanilla HTML/CSS/JS — no build step, no framework, no bundler
- Hosting: Vercel Hobby plan (free tier)
- Database: Supabase (free tier)
- Payment: Stripe Payment Links (buy.stripe.com URLs already wired via `data-checkout-id`)
- Single-owner admin panel — no multi-user auth needed

---

## Recommended Stack

### Backend Runtime

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel Serverless Functions (Node.js) | Node.js 22.x LTS | API routes for CRUD, auth token validation, Stripe webhook | Already on Vercel — zero infra overhead. Node.js 22.x is the current LTS; 24.x is the new default but 22.x is more stable for production. Place all functions in `/api/` directory. Vercel auto-detects them with no framework config needed. |

**Why not Edge Runtime:** Edge runtime has no full Node.js API access and a 25s streaming limit. Functions here call Supabase (needs full `fetch`, `crypto`, response helpers). Node.js runtime is correct for this project.

**Vercel Hobby plan limits confirmed from official docs (2026-04-07):**
- 1,000,000 function invocations/month included
- 4 CPU-hrs active compute/month included
- 2 GB memory per function
- 300s max duration per function
- 4.5 MB max request/response body
- Runtime logs retained 1 hour only (use console.log sparingly in production)

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase (PostgreSQL) | supabase-js v2 (current as of research) | Store reviews, portfolio projects, pricing packages, site content | Postgres is the right shape for this relational data. Supabase free tier is generous for a low-traffic agency site. Row-Level Security (RLS) means the database enforces permissions at the data layer — critical when using the anon key from serverless functions. |

**Installation (server-side in `/api/` functions only):**
```bash
npm install @supabase/supabase-js
```

**Setup pattern for serverless functions:**
```js
// api/_lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role key — server only, never exposed to browser
)
```

**Why service role key in functions, not anon key:** The admin panel operations (approve/delete reviews, edit content) need to bypass RLS. Service role key grants that. It must only live in Vercel environment variables, never in any client-side JS.

**Why NOT use Supabase client in browser for public pages:** The anon key would be exposed. Public data (approved reviews, portfolio) should be fetched from your own `/api/` endpoints which act as a controlled proxy. This also lets you cache responses.

**Supabase free tier (training data, MEDIUM confidence — verify at supabase.com/pricing):**
- 500 MB database storage
- 5 GB bandwidth
- 50,000 monthly active users (not relevant — no auth for visitors)
- 2 projects included
- Paused after 1 week of inactivity on free tier (CRITICAL pitfall — see PITFALLS.md)

### Authentication (Admin Panel)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom token auth via Vercel function | — | Protect `/admin` routes | Vercel's built-in password protection is Pro/Enterprise only (confirmed from official docs). A single master password + signed token stored in `sessionStorage` is the correct pattern for single-owner admin. No auth library needed — implementation is ~30 lines. |

**Pattern:**
```
POST /api/admin/auth
  body: { password: "..." }
  validates against process.env.ADMIN_PASSWORD (hashed with crypto.subtle SHA-256)
  returns: { token: "<random 32-byte hex>" }
  token stored server-side in memory (or Supabase sessions table for persistence)

All /api/admin/* routes check Authorization: Bearer <token> header
Admin panel JS checks sessionStorage for token before rendering UI
```

**Why NOT localStorage for token:** sessionStorage clears on tab close — appropriate security posture for a local admin panel. localStorage persists indefinitely, which is a larger attack surface.

**Why NOT a full auth library (Auth.js, Clerk, etc.):** They add significant bundle complexity for a use case that is literally one user, one password. The crypto.subtle SHA-256 approach uses browser/Node.js built-ins, zero dependencies.

### Payments

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Stripe Payment Links | — | Package purchases, custom invoices | Already wired in the codebase via `window.RUUTDEV_CHECKOUT_LINKS` and `data-checkout-id`. Payment Links are just `buy.stripe.com/*` URLs — no Stripe.js, no SDK, no PCI scope on your server. Click → Stripe-hosted page → done. |
| Stripe Node.js SDK | stripe@^17 (latest major, MEDIUM confidence on exact version) | Serverless function: verify webhooks, create custom payment links via API | Only needed server-side for: (1) Stripe webhook signature verification, (2) programmatic payment link creation if admin can set custom amounts. |

**Installation (server-side only):**
```bash
npm install stripe
```

**What NOT to use:** Do not use `@stripe/stripe-js` (the browser SDK) unless you need to collect card details on your own page. Since all payments go through `buy.stripe.com` hosted pages, there is no need for Stripe.js on the frontend at all.

**Custom invoice flow:** Admin sets amount + client email → `/api/admin/create-payment-link` calls Stripe API to generate a `buy.stripe.com` URL → admin sends URL to client. No frontend Stripe integration needed.

### Frontend Animations

| Technology | CDN Version | Purpose | Why |
|------------|-------------|---------|-----|
| GSAP (GreenSock) | 3.x (load from cdn.jsdelivr.net/npm/gsap@3) | Hero entrance animations, scroll-driven timeline effects, smooth micro-interactions | GSAP 3 is the industry standard for high-performance web animation. As of 2024-2025, GSAP is free for all use including commercial projects (licensing changed — all plugins including ScrollTrigger are now free). CDN load fits the no-build-step constraint perfectly. |
| GSAP ScrollTrigger plugin | Bundled with GSAP 3 CDN | Scroll-linked animations, section reveals | Replaces and supersedes the existing `IntersectionObserver` scroll reveal in `main.js`. More control, better performance, no dependency conflicts. |
| tsParticles | 2.x (cdn.jsdelivr.net/npm/tsparticles) | Particle background effect for hero section | The maintained successor to particles.js (which is abandoned, last commit 2016). tsParticles is actively developed, smaller bundles via slim preset, and the CDN slim build is ~40 KB vs the full 200 KB. Use the slim preset. |

**Why NOT AOS (Animate on Scroll):** AOS is fine for simple projects but GSAP ScrollTrigger is strictly more powerful. Since we're already bringing in GSAP for micro-interactions, using ScrollTrigger for scroll reveals means one library does both jobs. AOS would be a redundant dependency.

**Why NOT Lottie:** Requires After Effects exports. No design workflow exists for this project. GSAP CSS/SVG animations cover all described effects.

**Why NOT particles.js:** Abandoned since 2016. No maintenance, known performance issues on mobile. tsParticles is the official spiritual successor with active development.

**CDN load order:**
```html
<!-- In <head> or before </body> -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<!-- Only on pages with particle effect -->
<script src="https://cdn.jsdelivr.net/npm/tsparticles-slim@2/tsparticles.slim.bundle.min.js"></script>
```

### Admin Panel Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vanilla HTML/CSS/JS | ES2020+ | `/admin/index.html` single-page admin UI | Keeping the admin panel as vanilla JS is consistent with the project constraint and avoids introducing a framework build step. The admin is single-owner, low complexity — a React SPA would be overengineering. Fetch API for all CRUD calls to `/api/admin/*` endpoints. |

**Pattern:** Single `admin/index.html` with token check at load, tab-based sections (Reviews, Portfolio, Pricing, Content), inline fetch calls to API routes.

**Why NOT a headless CMS (Contentful, Sanity):** PROJECT.md explicitly rules this out. The custom admin panel is the CMS.

### Infrastructure / Configuration

| Technology | Purpose | Why |
|------------|---------|-----|
| `vercel.json` | Route rewrites, function config, CORS headers | Required to wire `/api/*` routes, add CORS headers for admin panel API calls, and set `maxDuration` per function |
| `package.json` | Declare Node.js dependencies for serverless functions | Vercel auto-installs from `package.json` at deploy time. Only server-side deps go here. |
| Vercel Environment Variables | Store secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Never hardcode secrets. Set in Vercel dashboard → available to all `/api/` functions at runtime via `process.env.*` |

**`vercel.json` minimum config:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://ruutdev.com" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Authorization, Content-Type" }
      ]
    }
  ]
}
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Database | Supabase | PlanetScale (MySQL), Neon (Postgres), Turso (SQLite) | Supabase is already decided in PROJECT.md and has the best free tier for this use case. PlanetScale removed its free tier in 2024. |
| Auth | Custom token | Clerk, Auth.js, Supabase Auth | Single-owner use case makes any auth library severe overkill. Supabase Auth adds complexity (magic links, OAuth flows) that are unnecessary when there's one person with one password. |
| Animations | GSAP + tsParticles | Framer Motion, Motion One, AOS | Framer Motion requires React. Motion One is excellent but less community support. AOS is redundant if GSAP ScrollTrigger is present. |
| Payments | Stripe Payment Links | Stripe Elements, Stripe Checkout (hosted) | Payment Links require zero frontend integration — just URLs. Stripe Elements requires collecting card data on your domain (adds PCI scope). Stripe Checkout is similar to Payment Links but less flexible for pre-configured packages. |
| Admin UI | Vanilla JS | React, Alpine.js, Preact | React requires a build step. Alpine.js is a reasonable alternative but adds another CDN dependency. Vanilla JS is sufficient for the admin complexity level described. |
| Background particles | tsParticles | particles.js, canvas-confetti | particles.js is abandoned (2016). canvas-confetti is for celebration effects only, not ambient backgrounds. |
| Serverless runtime | Vercel Functions | Supabase Edge Functions | Supabase Edge Functions are Deno-based and require a separate deploy pipeline. Vercel Functions live in the same repo and deploy automatically. |

---

## Full Dependency List

### Server-side (`package.json` — installed by Vercel at deploy)

```json
{
  "engines": { "node": "22.x" },
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "stripe": "^17"
  }
}
```

### Client-side (CDN in HTML — no npm, no build step)

```html
<!-- Existing -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

<!-- New: Animations (all public pages) -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>

<!-- New: Particle effect (hero page only) -->
<script src="https://cdn.jsdelivr.net/npm/tsparticles-slim@2/tsparticles.slim.bundle.min.js"></script>
```

No Stripe.js CDN needed — all payments go through buy.stripe.com URLs.

---

## Environment Variables Reference

| Variable | Where Set | Used By | Notes |
|----------|-----------|---------|-------|
| `SUPABASE_URL` | Vercel dashboard | All `/api/` functions | Public project URL from Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel dashboard | All `/api/` functions | Secret — server only, bypasses RLS |
| `ADMIN_PASSWORD` | Vercel dashboard | `api/admin/auth.js` | Store as SHA-256 hash, not plaintext |
| `STRIPE_SECRET_KEY` | Vercel dashboard | `api/admin/create-payment-link.js` | Starts with `sk_live_` in production |
| `STRIPE_WEBHOOK_SECRET` | Vercel dashboard | `api/stripe/webhook.js` | From Stripe dashboard webhook settings |

---

## What NOT to Build

| Anti-Pattern | Why | What to Do Instead |
|--------------|-----|--------------------|
| Supabase client in browser JS | Exposes service role key or requires anon key with complex RLS rules | All Supabase calls go through `/api/` serverless functions |
| Stripe.js on frontend | Adds PCI scope complexity; not needed for Payment Links | Just redirect to `buy.stripe.com/*` URLs |
| React/Vue for admin panel | Requires build step, contradicts project constraints | Vanilla JS + Fetch API is sufficient |
| particles.js (the original) | Abandoned, performance issues on mobile | tsParticles slim preset |
| `localStorage` for admin token | Persists after browser close, wider attack surface | `sessionStorage` — clears on tab close |
| Vercel password protection (dashboard feature) | Pro/Enterprise plan only — confirmed from official docs | Self-implemented token auth in `/api/admin/auth.js` |
| Hardcoding API keys in JS files | Current anti-pattern in codebase (Web3Forms key in `main.js`, Stripe URLs in `pay.html`) | Move all secrets to Vercel environment variables |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Vercel Functions (Node.js, limits, env vars) | HIGH | Verified directly from official Vercel docs 2026-04-07 |
| Vercel password protection — Pro only | HIGH | Verified directly from official Vercel docs 2026-04-07 |
| Vercel Hobby plan invocation limits (1M/month) | HIGH | Verified directly from official Vercel docs 2026-04-07 |
| Node.js 22.x as recommended runtime | HIGH | Verified from Vercel Node.js versions doc — 24.x is new default, 22.x is current LTS |
| Supabase free tier limits | MEDIUM | Could not fetch supabase.com/pricing (permission denied); using training data. Verify before committing to free tier assumptions. |
| @supabase/supabase-js exact version | MEDIUM | Training data indicates v2.x is current stable; npmjs.com fetch was denied. Install `@supabase/supabase-js@^2` and verify latest at time of implementation. |
| Stripe SDK exact version | MEDIUM | Training data indicates stripe@^17; npmjs.com fetch was denied. Run `npm info stripe version` at implementation time. |
| GSAP 3 licensing (free for commercial) | MEDIUM | Known from training data (2024 license change made all plugins free); gsap.com/pricing was inaccessible. Verify at gsap.com/licensing before use. |
| tsParticles as particles.js successor | HIGH | Well-established community consensus; particles.js last commit 2016 is a verifiable public fact |
| GSAP vs AOS recommendation | HIGH | GSAP ScrollTrigger strictly supersedes AOS's feature set; this is architectural reasoning, not version-dependent |

---

## Sources

- Vercel Node.js Runtime docs: https://vercel.com/docs/functions/runtimes/node-js (fetched 2026-04-07)
- Vercel Node.js Versions: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions (fetched 2026-04-07)
- Vercel Functions Limits: https://vercel.com/docs/functions/limitations (fetched 2026-04-07)
- Vercel Platform Limits (invocations, build limits): https://vercel.com/docs/limits/overview (fetched 2026-04-07)
- Vercel Password Protection — Pro/Enterprise only: https://vercel.com/docs/security/access-control (fetched 2026-04-07)
- Vercel Environment Variables: https://vercel.com/docs/environment-variables (fetched 2026-04-07)
- Project context: /Users/jtovar_27/Desktop/ruutdev-website/.planning/PROJECT.md
- Codebase audit: /Users/jtovar_27/Desktop/ruutdev-website/.planning/codebase/STACK.md
