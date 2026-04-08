# Architecture Patterns

**Project:** RuutDev Website — v2 Backend Layer
**Domain:** Vanilla HTML/CSS/JS static site + Supabase + Vercel serverless functions + admin panel
**Researched:** 2026-04-07
**Overall confidence:** HIGH (Vercel conventions verified via official docs; Supabase client pattern from training knowledge, HIGH confidence for v2 stable API)

---

## Recommended Architecture

The architecture adds a backend layer on top of the existing static site without migrating to a framework. Three distinct zones coexist in the same repository and deployment:

```
Zone A — Public Static Pages  (existing, unchanged)
  index.html, pricing.html, contact.html, services.html, pay.html, about.html
  css/styles.css, js/main.js

Zone B — API Layer  (new)
  api/reviews.js
  api/portfolio.js
  api/prices.js
  api/content.js
  api/auth.js
  api/webhooks/stripe.js

Zone C — Admin Panel  (new)
  admin/index.html
  admin/js/admin.js
  admin/css/admin.css
```

Vercel serves Zone A as static files and Zone B as serverless functions automatically — no vercel.json routing rules are needed for this separation. Zone C is served as static HTML but is guarded at runtime by a token check in `admin/js/admin.js`.

---

## Component Boundaries

| Component | Location | Responsibility | Communicates With |
|-----------|----------|---------------|-------------------|
| Public Pages | `/*.html` | Marketing, portfolio display, reviews display, Stripe CTAs | Browser → API (reads only) |
| Shared JS | `js/main.js` | Nav, lang switch, scroll reveal, Stripe CTA wiring | DOM, localStorage, Web3Forms |
| Public API client | `js/api-client.js` (new) | Fetch wrappers for public read endpoints | Browser → `/api/*` |
| Admin Panel HTML | `admin/index.html` | SPA-lite admin UI (login screen + dashboard) | Browser |
| Admin JS | `admin/js/admin.js` | Auth guard, CRUD UI logic, API calls with token | Browser → `/api/*` (write) |
| Vercel Functions | `api/*.js` | Business logic, auth enforcement, DB access, webhook handling | Supabase, Stripe |
| Supabase | External (hosted) | Postgres database: reviews, portfolio, prices, content | Vercel Functions only |
| Stripe | External (hosted) | Payment links, checkout sessions, webhook events | Browser (redirect), `/api/webhooks/stripe` |

### Strict boundary rules

- **Public pages never write to Supabase directly.** All writes (review submission) go through an API function.
- **Supabase service role key is never exposed to the browser.** It lives only in Vercel environment variables, accessible only to serverless functions.
- **Supabase anon key** may be used in the browser for public read operations, but Row Level Security (RLS) must be configured so anon can only SELECT published/approved rows.
- **Admin panel never calls Supabase directly from the browser.** All admin actions go through API functions that verify the admin token server-side before executing writes.
- **Stripe webhook secret is only in the Vercel function.** The webhook signature is verified inside `api/webhooks/stripe.js` before any action is taken.

---

## Data Flow

### Public read flow (reviews, portfolio display)

```
Browser
  → GET /api/reviews?status=approved
  → api/reviews.js
    → Supabase (SELECT * FROM reviews WHERE status='approved')
  → JSON response
  → public page renders data via vanilla JS DOM manipulation
```

### Review submission flow

```
Browser (visitor fills out review form)
  → POST /api/reviews { name, rating, text }
  → api/reviews.js
    → validates input (no auth required — public submission)
    → Supabase INSERT reviews (status='pending')
  → 201 response → UI shows "Thanks, your review is pending approval"
```

### Admin authentication flow

```
Admin navigates to /admin/
  → admin/index.html loads
  → admin/js/admin.js checks localStorage for 'ruutdev_admin_token'
  → if missing/invalid: renders login form, blocks dashboard
  → Admin enters master password
  → POST /api/auth { password }
  → api/auth.js
    → compares against process.env.ADMIN_PASSWORD (constant-time compare)
    → if match: returns { token: <signed JWT or opaque secret> }
  → admin/js/admin.js stores token in localStorage
  → all subsequent admin API calls send: Authorization: Bearer <token>
```

### Admin CRUD flow (example: approve review)

```
Admin clicks "Approve" on a pending review
  → PATCH /api/reviews/:id { status: 'approved' }
    Authorization: Bearer <token>
  → api/reviews.js
    → verifyAdminToken(request) — checks Authorization header
    → if invalid: 401 response
    → if valid: Supabase UPDATE reviews SET status='approved' WHERE id=:id
  → 200 response → admin JS removes row from pending list
```

### Stripe payment flow (existing pattern, fully wired)

```
Visitor clicks pricing CTA (data-checkout-id="plan-basic")
  → js/main.js initStripeReadyCtas() resolves URL from window.RUUTDEV_CHECKOUT_LINKS
  → Browser redirects to buy.stripe.com/<link-id>
  → Stripe handles checkout, collects payment
  → Stripe POST → /api/webhooks/stripe
  → api/webhooks/stripe.js
    → reads raw request body (required for signature verification)
    → stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    → if signature invalid: 400 response
    → switch(event.type):
        case 'checkout.session.completed': log payment, optional notification
        case 'payment_intent.succeeded': optional future use
  → 200 response (Stripe retries on non-200)
```

**Critical Stripe webhook requirement:** The raw request body must be read as a Buffer/string before any JSON parsing. Vercel functions receive the raw body via `request.text()` or `request.arrayBuffer()` — do not call `request.json()` before `stripe.webhooks.constructEvent`.

### Content edit flow (admin edits hero text, prices, etc.)

```
Admin edits a price in the admin panel
  → PUT /api/prices/:id { amount, label }
    Authorization: Bearer <token>
  → api/prices.js verifies token → Supabase UPDATE
  → Public pricing page re-fetches on next load from /api/prices
```

---

## File Structure (target state)

```
ruutdev-website/
├── api/                          ← Vercel serverless functions (auto-detected)
│   ├── auth.js                   ← POST /api/auth — password verify, token issue
│   ├── reviews.js                ← GET/POST/PATCH/DELETE /api/reviews
│   ├── portfolio.js              ← GET/POST/PATCH/DELETE /api/portfolio
│   ├── prices.js                 ← GET/PUT /api/prices
│   ├── content.js                ← GET/PUT /api/content (hero text, etc.)
│   └── webhooks/
│       └── stripe.js             ← POST /api/webhooks/stripe
├── admin/
│   ├── index.html                ← Admin SPA shell (login + dashboard)
│   ├── js/
│   │   └── admin.js              ← Auth guard + CRUD UI logic
│   └── css/
│       └── admin.css             ← Admin-only styles
├── js/
│   ├── main.js                   ← Existing shared JS (unchanged)
│   └── api-client.js             ← Public API fetch helpers (new)
├── css/
│   └── styles.css                ← Existing shared styles (unchanged)
├── pages/                        ← (optional reorganization of .html files)
│   or *.html at root (current)
├── vercel.json                   ← cleanUrls, CORS headers for /api, Stripe webhook maxDuration
└── package.json                  ← Only needed if npm deps for API functions
```

---

## Vercel Configuration (`vercel.json`)

No complex routing rules are needed. Vercel auto-detects `/api` as serverless functions and serves everything else as static. The minimal config needed:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "functions": {
    "api/webhooks/stripe.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://ruutdev.com" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PATCH,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type,Authorization" }
      ]
    }
  ]
}
```

`cleanUrls: true` allows `/admin` to serve `admin/index.html` without the `.html` extension.

---

## Supabase Schema (target)

```sql
-- Reviews submitted by site visitors
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  rating      INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Portfolio projects managed by admin
CREATE TABLE portfolio (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  title_es    TEXT,
  description TEXT,
  description_es TEXT,
  url         TEXT,
  demo_url    TEXT,
  image_url   TEXT,
  visible     BOOLEAN DEFAULT true,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Pricing packages (admin editable)
CREATE TABLE prices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key    TEXT UNIQUE NOT NULL,   -- matches data-checkout-id
  label_en    TEXT NOT NULL,
  label_es    TEXT,
  amount_usd  INT  NOT NULL,          -- in cents
  stripe_link TEXT,
  visible     BOOLEAN DEFAULT true,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- General site content (hero text, about blurb, etc.)
CREATE TABLE content (
  key         TEXT PRIMARY KEY,
  value_en    TEXT NOT NULL,
  value_es    TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

**Row Level Security policy:** Anon role can SELECT from reviews WHERE status='approved', portfolio WHERE visible=true, prices WHERE visible=true, and all content rows. All writes require service role (only accessible server-side).

---

## Admin Panel Integration Without Breaking Public Pages

The admin panel is a separate section at `/admin/` that has zero coupling to public pages.

**Why it does not break existing pages:**
- `admin/index.html` is an independent HTML file. It does not include `css/styles.css` or `js/main.js` — it has its own styles and scripts.
- No existing HTML file links to or depends on anything in `/admin/`.
- Vercel serves it as a regular static file alongside the other pages.
- No nav changes are required on public pages (admin is not linked from public nav).

**How the auth guard works (application-level, not infrastructure-level):**
- When `/admin/` loads, `admin/js/admin.js` runs immediately.
- It checks `localStorage.getItem('ruutdev_admin_token')`.
- If missing or the token fails server-side validation on first API call, it hides the dashboard and shows the login form.
- The password is never stored — only the token (a short-lived opaque string or HMAC-signed value).
- Vercel does not natively gate static file access by password at the file level (Password Protection is a paid Pro feature). For Hobby/free tier, application-level guarding in JS is the approach — this is acceptable because the admin panel does not itself expose sensitive data: it only makes API calls that are token-verified server-side.

**Practical implication for the roadmap:** Admin panel can be built and deployed without touching any public HTML file. It is a greenfield addition.

---

## Suggested Build Order (Phase Dependencies)

The following order reflects hard dependencies — each layer is required before the next is useful:

### Layer 1 — Foundation (must be first)
1. Create `package.json` + install `@supabase/supabase-js` and `stripe` as dev/API dependencies
2. Create Supabase project, run schema migrations, configure RLS
3. Set Vercel environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `STRIPE_WEBHOOK_SECRET`
4. Create `vercel.json` with CORS headers
5. Create a shared `api/_supabase.js` utility that initializes the Supabase client from env vars (used by all API functions)

**Rationale:** Nothing else can work without the DB schema and credentials.

### Layer 2 — Public read API (unblocks public page features)
1. `api/reviews.js` — GET (approved reviews), POST (submit review)
2. `api/portfolio.js` — GET (visible projects)
3. `api/prices.js` — GET (visible prices)
4. Update `js/api-client.js` to fetch and render reviews + portfolio on public pages

**Rationale:** Portfolio and reviews sections on public pages are blocked on these endpoints. Build these before admin so public visitors get value early.

### Layer 3 — Admin auth (unblocks all admin work)
1. `api/auth.js` — POST (verify password, return token)
2. `admin/index.html` + `admin/js/admin.js` (login form + auth guard only)

**Rationale:** All admin write endpoints require the token verification pattern. Establish auth before writing any admin CRUD.

### Layer 4 — Admin CRUD (sequentially after auth)
1. Add write methods to `api/reviews.js` (PATCH status, DELETE)
2. Add write methods to `api/portfolio.js` (POST, PATCH, DELETE)
3. Add write methods to `api/prices.js` (PUT)
4. Add write methods to `api/content.js` (PUT)
5. Build admin dashboard UI sections for each entity

**Rationale:** Each admin section is independent — they can be built in any sub-order within this layer.

### Layer 5 — Stripe integration (last, depends on prices being in DB)
1. Wire live Stripe payment link URLs into the prices table (or `window.RUUTDEV_CHECKOUT_LINKS`)
2. Create `api/webhooks/stripe.js` with signature verification
3. Register webhook endpoint in Stripe dashboard (points to `https://ruutdev.com/api/webhooks/stripe`)
4. Test with Stripe CLI locally (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)

**Rationale:** Stripe webhooks are the most isolated component — they only need the serverless function layer, not the admin panel. But they depend on knowing which Stripe products/prices exist, which is decided when wiring the prices table.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling Supabase directly from the browser with service role key
**What goes wrong:** The service role key bypasses Row Level Security. If included in browser JS, any visitor can read/write all data.
**Instead:** Keep service role key in Vercel env vars only. Use anon key in browser for public reads (with RLS), and proxy all writes through API functions.

### Anti-Pattern 2: Parsing the Stripe webhook body as JSON before signature verification
**What goes wrong:** `stripe.webhooks.constructEvent` requires the raw body bytes. Parsing JSON first converts it to an object and breaks the HMAC signature check.
**Instead:** Read the raw body with `await request.text()` or `await request.arrayBuffer()`, verify signature, then parse JSON.

### Anti-Pattern 3: Storing the admin password in client-side code or localStorage
**What goes wrong:** Anyone who opens devtools can read the password and directly log in.
**Instead:** Store only the token in localStorage. The password is entered, POSTed to `api/auth.js`, and never stored. The token should have an expiry (even if just 24h).

### Anti-Pattern 4: Embedding admin UI logic in existing `js/main.js`
**What goes wrong:** Public pages load the admin code on every page visit for all visitors, increasing bundle size and exposing admin code surface.
**Instead:** Keep admin JS in `admin/js/admin.js`, loaded only when visiting `/admin/`.

### Anti-Pattern 5: Using the `routes` key in vercel.json alongside serverless functions
**What goes wrong:** The legacy `routes` key conflicts with the automatic `/api` function detection and can cause functions to not be served correctly.
**Instead:** Use `rewrites`, `redirects`, and `headers` — all of which are compatible with automatic function detection. Do not use `routes` (deprecated).

---

## Scalability Notes

This architecture is intentionally simple and appropriate for a single-owner freelance site. For reference:

| Concern | At current scale | If traffic grows significantly |
|---------|-----------------|-------------------------------|
| DB reads | Supabase free tier handles thousands of requests/day | Add Supabase connection pooling (PgBouncer, built in to Supabase) |
| Serverless cold starts | Acceptable for low-traffic admin | Not a concern for a business site |
| Review spam | Rate limiting in `api/reviews.js` (IP-based or simple honeypot) | Add Cloudflare Turnstile (free) |
| Content delivery | Vercel CDN caches static assets globally | Already solved |
| DB writes | Single-owner admin — effectively zero contention | Not a concern |

---

## Sources

- Vercel Functions — official docs: https://vercel.com/docs/functions (verified 2026-04-07)
- Vercel Functions API Reference — `/api` directory convention for no-framework projects: https://vercel.com/docs/functions/functions-api-reference (verified 2026-04-07)
- Vercel project configuration — `vercel.json` `headers`, `cleanUrls`, `functions`, `rewrites`: https://vercel.com/docs/project-configuration/vercel-json (verified 2026-04-07)
- Supabase JS v2 client — ESM CDN and `createClient` pattern: training knowledge (HIGH confidence, v2 stable API since 2022, CDN at `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm`)
- Stripe webhook signature verification — training knowledge (HIGH confidence, stable API, `stripe.webhooks.constructEvent` pattern unchanged since Stripe API v2016-07-06)
