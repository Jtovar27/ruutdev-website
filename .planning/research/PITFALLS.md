# Domain Pitfalls

**Domain:** Vanilla static site → Supabase + Vercel serverless functions + admin panel + Stripe
**Project:** RuutDev Website v2
**Researched:** 2026-04-07
**Confidence:** MEDIUM-HIGH (training data through Aug 2025, verified against known Supabase/Stripe/Vercel docs patterns; WebSearch unavailable for live verification)

---

## Critical Pitfalls

Mistakes that cause security breaches, rewrites, or broken payment flows.

---

### Pitfall 1: Supabase RLS Disabled on Tables That Hold Public Write Data

**What goes wrong:** When you create the `reviews` or `contact_submissions` table in Supabase, the default state is RLS disabled. The Supabase dashboard shows a warning, but it is easy to dismiss. If RLS is off, any authenticated request (or even anon-key request, depending on table grants) can read, update, or delete every row. An attacker with your `SUPABASE_ANON_KEY` — which will be embedded in your public Vercel serverless functions — can wipe the reviews table or exfiltrate all submitted contact data.

**Why it happens:** Developers enable RLS later "once things are working" and forget. The Supabase anon key is intentionally designed for client-side use, but only safe when RLS policies are correctly configured. The key itself is not a secret; the policies are the guard.

**Consequences:** Any visitor who reads your serverless function source (or finds the key via DevTools network tab) can delete all approved reviews, inject fake reviews, or read private contact form submissions.

**Prevention:**
- Enable RLS on every table at creation time, before writing any data.
- Minimum policy set for this project:
  - `reviews`: INSERT allowed for anon (public submissions), SELECT allowed for anon only where `status = 'approved'`, UPDATE/DELETE only via service-role key (admin API routes).
  - `portfolio`: SELECT for anon, all writes via service-role key only.
  - `content`: SELECT for anon, all writes via service-role key only.
- Never expose the `SUPABASE_SERVICE_ROLE_KEY` in client-side code or public serverless function responses. Use it only in server-side Vercel API routes with `Authorization` gating.
- Verify RLS is active: run `SELECT * FROM pg_tables WHERE schemaname = 'public'` and check the `rowsecurity` column.

**Warning signs:**
- Supabase dashboard shows orange "RLS disabled" badge on any table.
- Your Vercel function uses `supabase.from('reviews').delete()` without any auth check before it.
- The anon key is in a `fetch()` call from a public JS file (this is the pattern you'll use — it is fine only when RLS is correctly set).

**Phase mapping:** Must be addressed in the phase that creates Supabase tables (backend setup), not retrofitted later.

---

### Pitfall 2: Admin Auth Bypass via localStorage Token Forgery

**What goes wrong:** The PROJECT.md decision is "master password auth via simple token in localStorage." The pitfall is implementing this as: user submits password → if correct, write `adminToken = true` to localStorage → every admin route checks `localStorage.getItem('adminToken')`. This is bypassable in one DevTools console command: `localStorage.setItem('adminToken', 'true')`.

**Why it happens:** Token-in-localStorage feels equivalent to a session, but the check is entirely client-side. There is no server verifying the token on each admin request.

**Consequences:** Anyone who opens DevTools can set the localStorage value and access the admin panel UI. All admin reads still go through the API, but if the API routes do not independently verify the token, they are also unprotected.

**Prevention:**
- The admin panel UI being accessible without a real token is acceptable for this single-owner site (the UI itself has no sensitive data, only content management forms). The critical requirement is that every Vercel API route that mutates data (approve review, delete review, update portfolio, update content) independently verifies a signed token.
- Pattern: Admin login → POST to `/api/admin/auth` with password → server compares `bcrypt.compare(password, ADMIN_PASSWORD_HASH)` or simply `password === process.env.ADMIN_PASSWORD` → if valid, return a signed JWT (use `jose` or `jsonwebtoken`) with short expiry (24h) → store JWT in localStorage → every admin API call sends `Authorization: Bearer <jwt>` → Vercel function verifies JWT signature using `process.env.JWT_SECRET`.
- The JWT secret and admin password live only in Vercel environment variables, never in source code.
- This is lightweight (no Supabase Auth needed, no OAuth) and fully closes the bypass.

**Warning signs:**
- Admin API routes check `req.headers['x-admin'] === 'true'` or any client-supplied boolean.
- No JWT or HMAC signature verification in admin API routes.
- Admin password is hardcoded in a JS file committed to the repo.

**Phase mapping:** Admin auth architecture must be locked in the admin panel phase. Do not build admin CRUD routes before auth middleware exists.

---

### Pitfall 3: Stripe Webhook Signature Not Verified

**What goes wrong:** Stripe sends POST requests to your `/api/webhooks/stripe` Vercel function when payments complete, fail, or are disputed. If you do not verify the `Stripe-Signature` header using your webhook signing secret, any actor can POST a fake `payment_intent.succeeded` event to that endpoint and trigger fulfillment logic (e.g., marking an invoice as paid, sending a confirmation email).

**Why it happens:** The verification step requires reading the raw request body as a buffer (not parsed JSON), which clashes with Vercel's default body parsing. Developers skip this step when testing locally because they control the test events.

**Consequences:** Fake payment confirmations. If the webhook triggers any action (email, order status update, access grant), that action fires on fraudulent events.

**Prevention:**
- In Vercel, disable body parsing for the webhook route by exporting `export const config = { api: { bodyParser: false } }` from the function file.
- Read raw body: collect chunks from `req` readable stream into a Buffer.
- Verify: `stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)`.
- If `constructEvent` throws, return 400 immediately — do not process the event.
- Use a separate webhook secret per environment (Stripe dashboard generates one for each endpoint). The test secret and live secret are different.

**Warning signs:**
- Webhook function receives `req.body` (already parsed JSON) instead of raw buffer.
- No try/catch around `constructEvent`.
- Single webhook secret used for both test and production.
- Webhook endpoint is reachable without any signature check during local dev (the Stripe CLI handles this correctly — make sure the CLI secret is used, not hardcoded).

**Phase mapping:** Stripe webhook implementation phase. Must be done before any live payment link is activated.

---

### Pitfall 4: CORS Misconfiguration Locking Out the Admin Panel or Exposing APIs

**What goes wrong:** Vercel serverless functions do not set CORS headers by default. Two failure modes:

1. **Too restrictive:** Admin panel at `/admin/index.html` calls `/api/admin/reviews` — if the function returns no CORS headers, browsers block the response. You see a CORS error in DevTools and the admin panel shows no data. This is caught immediately in dev but easy to forget.

2. **Too permissive:** You fix the CORS error by returning `Access-Control-Allow-Origin: *`. This is fine for read-only public endpoints (`/api/reviews`, `/api/portfolio`). It is dangerous for mutating admin endpoints — any origin can now craft requests against your admin API (though the JWT check is the real guard; `*` CORS on admin routes is defense-in-depth failure, not an immediate vulnerability).

**Why it happens:** Copy-pasting CORS headers without thinking about which routes need what policy.

**Prevention:**
- Public read endpoints (`GET /api/reviews`, `GET /api/portfolio`): `Access-Control-Allow-Origin: *`
- Admin mutating endpoints (`POST/PUT/DELETE /api/admin/*`): `Access-Control-Allow-Origin: https://ruutdev.com` (or your Vercel preview domain during dev). Also require JWT verification — CORS is not the auth mechanism.
- Handle `OPTIONS` preflight requests: return 200 with CORS headers and no body.
- In Vercel, create a helper `withCors(handler, origin)` wrapper to keep this consistent across all functions rather than copy-pasting headers.

**Warning signs:**
- Admin panel fetch calls fail with "has been blocked by CORS policy" in console.
- All API routes return `Access-Control-Allow-Origin: *` including admin mutation routes.
- No OPTIONS handler — some browsers send preflight before POST, causing 404/405.

**Phase mapping:** Backend API phase (set correctly from the start). Easy to retrofit but catches developers off-guard.

---

### Pitfall 5: Review Spam and Abuse — No Rate Limiting or Honeypot

**What goes wrong:** The public review submission form (`POST /api/reviews`) accepts name, email, rating, and text. Without rate limiting, a bot can submit thousands of fake reviews overnight, filling the admin queue with spam that must be manually deleted before legitimate reviews can be found. This is a solved problem that is frequently skipped on small sites.

**Why it happens:** Single-owner sites feel too small to attract abuse, but public POST endpoints are discovered by automated crawlers constantly.

**Consequences:** Admin queue flooded with spam. Risk of Supabase free-tier row limits being hit. If review content is ever cached or displayed before approval (accidental policy gap), injected content appears on the site.

**Prevention:**
- Add a honeypot field: a hidden `<input name="website">` field that real users leave blank; bots fill it. Vercel function returns 200 (silently drops) if honeypot is populated — do not return 400 (tells bots to adapt).
- Rate limit by IP: Vercel does not provide built-in rate limiting. Use Upstash Redis (free tier) with the `@upstash/ratelimit` library. Limit: 3 review submissions per IP per 24 hours. This is ~5 lines of code and free.
- Minimum review length validation: reject submissions under 20 characters or over 2000 characters server-side.
- Never display reviews without `status = 'approved'` — the RLS policy enforces this, but the admin panel must also default to showing pending reviews first, not approved ones.

**Warning signs:**
- No server-side field length validation (only client-side `maxlength` attributes).
- No honeypot field in the review form.
- No rate limiting header or IP check on the review submission endpoint.
- `status` field is writable by the submitter (RLS policy gap — submitter should not be able to set `status = 'approved'` themselves).

**Phase mapping:** Review submission feature phase. Rate limiting can be added after, but the honeypot and RLS status policy must be in place at launch.

---

### Pitfall 6: Supabase Anon Key Leakage via Git

**What goes wrong:** The existing codebase already has a Web3Forms API key hardcoded in `js/main.js` (noted in CONCERNS.md). The same pattern will be repeated if Supabase credentials are put into HTML or JS files. Even the anon key — which is safe to use client-side when RLS is configured — should not be committed to git if it is stored in a Vercel environment variable, because it breaks the principle of consistent secret management.

**Why it happens:** The anon key is described in Supabase docs as "safe for client use," so developers include it directly in frontend code. The risk is not the anon key itself, but the adjacent service-role key being committed by accident (one wrong copy-paste in a `.env` file that gets committed, or in a JS config object).

**Consequences:** If the service-role key is committed, an attacker has full database access — bypassing all RLS. Rotating the key requires updating every Vercel environment variable and potentially invalidating existing sessions.

**Prevention:**
- All Supabase keys, Stripe keys, JWT secrets, and admin passwords go in Vercel environment variables only.
- Add `.env`, `.env.local`, `.env.production` to `.gitignore` immediately, before creating any env file.
- For the public site (vanilla JS calling Vercel API routes), the frontend never directly calls Supabase — it calls `/api/*` Vercel functions which hold the Supabase credentials server-side. This is the correct architecture: the anon key does not appear in frontend code at all.
- Add a `.env.example` file with placeholder values to document required variables without exposing real values.

**Warning signs:**
- Any `SUPABASE_` or `STRIPE_` value appears in a `.js`, `.html`, or non-`.env` file.
- `.env` is not in `.gitignore`.
- `git log --all -S "SUPABASE_SERVICE_ROLE"` returns results.

**Phase mapping:** Project setup phase (before any backend code is written). Non-negotiable first step.

---

## Moderate Pitfalls

### Pitfall 7: Vercel Serverless Cold Start Latency on Admin Actions

**What goes wrong:** Vercel serverless functions on the free/hobby tier can have cold start latency of 200–800ms on the first invocation after a period of inactivity. For the admin panel — used infrequently by a single person — nearly every load will be a cold start. Admin actions will feel sluggish unless the UI is designed to handle latency gracefully.

**Prevention:**
- Add loading states to all admin fetch calls — a spinner or disabled button state between click and response.
- Batch admin data fetches: load reviews + portfolio in a single page load rather than separate requests per section.
- Do not add optimistic UI for destructive admin actions (deleting a review) — wait for server confirmation before removing from the UI.
- Vercel's fluid compute (available on Pro tier) eliminates cold starts, but is not needed here — just design for latency.

**Phase mapping:** Admin panel UI phase.

---

### Pitfall 8: Pricing Desync — Three Sources of Truth for Prices

**What goes wrong:** CONCERNS.md already identifies this: prices live in `pricing.html` (display), `pay.html` (PLAN_AMOUNTS + STRIPE_LINKS), and `qualifier.html` (priceMap). Adding a Supabase `pricing` table as a fourth source compounds this. If the admin panel edits prices in the database but the hardcoded fallbacks in HTML are not removed, the site will show outdated prices from cache or when the API call fails.

**Prevention:**
- Choose one source of truth: the Supabase `pricing` table, loaded at page render via `/api/pricing`.
- Remove all hardcoded price values from HTML files when the API is live.
- Add a fallback: if the API call fails, display a "contact us for pricing" message rather than stale prices from a hardcoded fallback.
- The Stripe Payment Link URL is not dynamic (it is a fixed `buy.stripe.com` URL for each package) — store these in the `pricing` table too, so changing them only requires one update in the admin panel.

**Warning signs:**
- `PLAN_AMOUNTS` object still exists in `pay.html` after the database is live.
- `priceMap` still exists in `qualifier.html` with hardcoded strings.
- Price displayed on `pricing.html` differs from price displayed on `pay.html`.

**Phase mapping:** Admin content management phase (when the pricing editor is built).

---

### Pitfall 9: Admin Panel Accessible at a Guessable Route

**What goes wrong:** `/admin` is the first path any attacker tries. If the JWT verification on API routes is solid, the admin UI being guessable is acceptable — but it still invites brute-force password attempts and unwanted attention.

**Prevention:**
- Keep `/admin` as the route (obscurity is not security and a complex path is forgotten).
- Rate-limit the `/api/admin/auth` endpoint: 5 failed attempts per IP per 15 minutes, then 429. Use Upstash Redis (same instance used for review rate limiting).
- Add a short lockout period (15 minutes) after 5 failed login attempts — return a generic "too many attempts" error without revealing whether the password was wrong.
- Do not implement account lockout permanently — a single owner locking themselves out is a support burden.

**Phase mapping:** Admin auth phase.

---

### Pitfall 10: Stripe Payment Links vs. Checkout Sessions — Wrong Tool for Custom Invoices

**What goes wrong:** The current codebase uses `buy.stripe.com` Payment Links (fixed price, fixed product). This works perfectly for the four pricing packages. It does not work for custom project invoices (variable amount, client-specific). A common mistake is trying to use a Payment Link for custom amounts by making it "customer chooses price" — this allows clients to set their own price to $0.01.

**Prevention:**
- Fixed packages: use Stripe Payment Links (`buy.stripe.com`). Set "customer chooses quantity" to OFF.
- Custom invoices: use Stripe Invoices (create in dashboard, send via email to client). Do not expose a custom-amount input on the public pay page — this is the existing security concern in CONCERNS.md. Remove the editable amount field.
- If a programmatic checkout flow is needed in the future (not scoped for this milestone), use Stripe Checkout Sessions created server-side via `/api/create-checkout-session` with amount validated server-side against a pricing table.

**Warning signs:**
- A `<input type="number">` for payment amount on the public pay page that is read by the Stripe redirect logic.
- "Customer chooses price" enabled on a Stripe Payment Link for a fixed-tier package.

**Phase mapping:** Stripe wiring phase (when real Payment Link URLs replace `REPLACE_*` placeholders).

---

### Pitfall 11: Missing Content Security Policy Breaks Supabase or Stripe Embeds

**What goes wrong:** CONCERNS.md notes there is no CSP header. When Supabase JS client is added (even just to API calls), or when Stripe.js is loaded for future embedded payment forms, a strict CSP that was added hastily will block these scripts. Conversely, adding Supabase/Stripe without updating the CSP leaves the existing XSS exposure.

**Prevention:**
- Set CSP in `vercel.json` headers config (applies to all routes, not just HTML meta tags which only apply to the page they are on).
- Required additions for this project: `connect-src` must include `*.supabase.co`; `script-src` must include `js.stripe.com` if Stripe.js is ever used client-side; `frame-src` must include `js.stripe.com` for Stripe embedded elements.
- Implement CSP in report-only mode first (`Content-Security-Policy-Report-Only`) in development to catch violations before going live.

**Warning signs:**
- Console shows "Refused to connect to `*.supabase.co` because it violates the Content Security Policy."
- Stripe.js fails to load with a CSP violation.
- CSP is set as a `<meta>` tag rather than an HTTP header (meta CSP cannot restrict framing or navigation, and some directives are ignored).

**Phase mapping:** Backend setup phase (when Supabase connections are first established).

---

## Minor Pitfalls

### Pitfall 12: Supabase Free Tier Limits Not Monitored

**What goes wrong:** Supabase free tier includes 500MB database, 1GB file storage, 50,000 monthly active users for auth (not used here), and 5GB egress. For this site the limits are generous, but the database pauses after 7 days of inactivity (free tier behavior as of 2025). A paused database causes all API calls to fail with a connection error until the project is unpaused.

**Prevention:**
- Set up a simple uptime cron: use a free service (cron-job.org) to ping `/api/reviews` once daily to keep the project active.
- Alternatively, upgrade to Supabase Pro ($25/month) once the site generates revenue — this removes the pause behavior.
- Monitor usage in the Supabase dashboard; set an email alert at 80% of storage.

**Phase mapping:** Deployment/infrastructure phase.

---

### Pitfall 13: `innerHTML` XSS Vector When Rendering Review Content

**What goes wrong:** CONCERNS.md already flags that `applyLang()` uses `innerHTML`. The same risk applies when rendering review text fetched from Supabase into the DOM. If review content is inserted via `innerHTML` rather than `textContent`, a submitted review containing `<script>alert(1)</script>` or `<img onerror="...">` becomes stored XSS.

**Why it happens:** Reviews fetched from the API are displayed as HTML for formatting (star ratings use HTML entities, paragraph breaks, etc.), and developers reach for `innerHTML` for convenience.

**Prevention:**
- Always use `textContent` for user-submitted string content (reviewer name, review body).
- Use `innerHTML` only for the star rating display (which is generated server-side as `★★★★☆` from a validated integer 1–5, not from user input).
- Server-side: strip or encode HTML entities from review text before storing to Supabase. A simple function: replace `<`, `>`, `&`, `"`, `'` with their HTML entities.
- Admin panel displaying review content for moderation: use `textContent` or a sanitization library (`DOMPurify`) when rendering the raw submitted text.

**Phase mapping:** Review display feature phase.

---

### Pitfall 14: Vercel Function Timeout on Webhook Processing

**What goes wrong:** Vercel hobby-tier functions have a 10-second execution timeout. Stripe webhooks must receive a 200 response quickly or Stripe retries the event. If webhook processing involves slow operations (database writes, email sending), the function may time out, Stripe retries, and the action runs twice (double email, double status update).

**Prevention:**
- Acknowledge the webhook immediately (return 200) before doing any processing — but Vercel functions are synchronous so you cannot return 200 and continue. Instead, keep webhook processing fast: a single Supabase insert/update is well under 1 second.
- Do not send email from inside the webhook function (email sending via SMTP/SendGrid can be slow). Queue the email separately or use a fire-and-forget edge function.
- For this project's scope (recording a payment, logging an event), processing will be fast — this is low-risk but worth knowing.

**Phase mapping:** Stripe webhook implementation phase.

---

### Pitfall 15: Bilingual Admin Content Without i18n Strategy

**What goes wrong:** PROJECT.md states "all new public-facing content must support EN/ES." The admin panel edits content (hero text, service descriptions) that is displayed bilingually. If the admin panel has only one text field per content item, the editor must manually maintain the existing HTML `data-en`/`data-es` pattern — which is fragile (CONCERNS.md already flags this).

**Prevention:**
- When designing the `content` table in Supabase, include both `content_en` and `content_es` columns for every translatable field.
- The admin panel should show two text areas side-by-side: one for English, one for Spanish.
- The public page fetch: `GET /api/content` returns both fields; the frontend applies the appropriate one based on the active language from localStorage.
- Do not store raw HTML (with `<em>`, `<strong>`) in the database — store plain text and handle formatting in the template. This avoids the `innerHTML` XSS vector (Pitfall 13) and the existing fragility in `applyLang()`.

**Phase mapping:** Admin content management phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Supabase table creation | RLS disabled by default (Pitfall 1) | Enable RLS on all tables before writing any data |
| Project setup / .env | Service-role key committed to git (Pitfall 6) | `.gitignore` + Vercel env vars before first commit |
| Admin auth implementation | Client-side-only token check (Pitfall 2) | JWT signed server-side, verified on every admin API route |
| Admin login endpoint | No brute-force protection (Pitfall 9) | Upstash rate limiting on `/api/admin/auth` |
| Review submission endpoint | Spam/abuse, status field writable by submitter (Pitfall 5) | Honeypot + rate limit + RLS policy on `status` column |
| Review display rendering | Stored XSS via `innerHTML` (Pitfall 13) | `textContent` for all user-submitted strings |
| Stripe webhook endpoint | No signature verification (Pitfall 3) | `constructEvent` with raw body buffer |
| Stripe payment page | Editable amount field / wrong tool for custom invoices (Pitfall 10) | Remove editable input; use Stripe Invoices for custom amounts |
| API routes (all) | CORS not configured (Pitfall 4) | CORS helper with per-route origin policy |
| Pricing in database | Four sources of truth (Pitfall 8) | Remove all hardcoded price values from HTML when DB is live |
| Supabase deployment | Project pauses after 7 days inactivity (Pitfall 12) | Daily ping cron job |
| CSP header setup | Blocks Supabase/Stripe connections (Pitfall 11) | Report-only mode first; whitelist required origins |
| Admin content editing | Single-language text fields (Pitfall 15) | Dual `_en`/`_es` columns in DB, two fields in admin UI |

---

## Sources

- Supabase RLS documentation and security model: HIGH confidence (well-established behavior, stable since 2022)
- Stripe webhook signature verification (`constructEvent`, raw body requirement): HIGH confidence (official Stripe pattern, documented in Node.js SDK)
- Vercel serverless function body parsing behavior (`bodyParser: false` config): HIGH confidence (Vercel docs pattern for webhook routes)
- JWT-based admin auth pattern for single-owner panels: HIGH confidence (standard pattern)
- Upstash Redis rate limiting with `@upstash/ratelimit`: MEDIUM confidence (library API may have changed; verify current SDK version at upstash.com/docs/redis/sdks/ratelimit-js)
- Supabase free-tier pause behavior (7 days inactivity): MEDIUM confidence (policy observed as of 2025; Supabase has adjusted this threshold before — verify current policy)
- Vercel hobby timeout (10 seconds): HIGH confidence (documented limit, stable)
- DOMPurify for XSS sanitization: HIGH confidence (standard browser sanitization library)
- CORS behavior in Vercel functions: HIGH confidence (standard HTTP, Vercel-specific config patterns well-documented)
