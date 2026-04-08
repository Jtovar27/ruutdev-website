# Research Summary — RuutDev Website v2

**Project:** RuutDev Website v2
**Domain:** Freelance dev agency site — static site + Supabase backend + Vercel serverless + admin CMS
**Date:** 2026-04-07
**Confidence:** HIGH

---

## Stack

**Keep vanilla HTML/CSS/JS for all public pages.** Add:
- Vercel Functions (Node.js 22.x LTS) — `/api/` directory, auto-detected, no config needed
- Supabase (`@supabase/supabase-js` v2) — PostgreSQL for reviews, portfolio, prices, content
- Stripe Node SDK (`stripe@^17`) — server-side only, for webhook verification
- GSAP 3 + ScrollTrigger (CDN) — replaces existing IntersectionObserver scroll reveals
- tsParticles slim (CDN) — hero particle effect (particles.js is abandoned since 2016)

**Admin auth:** ~30 lines of custom `crypto.subtle` — no library needed for single-owner use.

---

## Table Stakes Features

1. Dynamic testimonials — real name + role + company + star rating
2. Aggregate star rating in hero stats row
3. Portfolio grid — thumbnails, tech tags, live links, category filter
4. Stripe payment links wired to real `buy.stripe.com` URLs (currently placeholders)
5. Custom invoice payment via Stripe Invoices
6. Admin CRUD — reviews, portfolio, pricing, general content
7. Review submission form with spam protection

---

## Architecture Build Order

1. **Foundation** — Supabase schema + RLS + secrets + CORS/CSP (hard prerequisite, cannot be retrofitted)
2. **Public Read API** — reviews/portfolio GET endpoints + dynamic display on public pages
3. **Admin Panel + Auth** — JWT auth middleware + admin dashboard + review moderation
4. **Admin CRUD + Submission** — portfolio/pricing/content management + public review form
5. **Visual Polish + Stripe Webhook** — GSAP, particles, glassmorphism + webhook endpoint

---

## Top Pitfalls

1. **Supabase RLS off by default** — Enable on every table before inserting any data
2. **Client-side-only admin auth** — Every API route must independently verify JWT
3. **Stripe webhook body parsing** — Call `request.text()` BEFORE any JSON parsing
4. **Pricing desync** — 3 places have hardcoded prices; Supabase must become single source of truth
5. **Secrets in git** — Web3Forms key currently hardcoded in `js/main.js`; move to env vars in Phase 1

---

## Open Questions

- Supabase free-tier pause (7-day inactivity) — verify current policy; may need daily ping cron
- GSAP commercial license — confirm free at gsap.com/licensing
- Stripe "customer chooses price" on Payment Links — verify still available in current Dashboard
- Supabase Storage multipart upload from serverless — plan code spike in Phase 4
