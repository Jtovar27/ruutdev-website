# RuutDev Website — v2

## What This Is

RuutDev is a freelance web development services website targeting a broad range of clients (small businesses, startups, freelancers, and creators). The v2 upgrade transforms the existing static marketing site into a dynamic, self-managed platform with an admin panel, client reviews, a portfolio showcase, Stripe payments, and a modern tech-forward visual experience.

## Core Value

Convert visitors into paying clients — the site must look credible, showcase real work, and make it trivially easy to pay.

## Requirements

### Validated

- ✓ Multi-page static site (index, pricing, contact, services, pay, about) — existing
- ✓ Bilingual EN/ES content switching — existing
- ✓ Mobile-responsive layout — existing
- ✓ Contact form via Web3Forms — existing
- ✓ Stripe-ready CTA wiring pattern (`data-checkout-id`) — existing
- ✓ Internal sales qualifier page (noindex) — existing
- ✓ SEO meta tags, Open Graph, sitemap — existing
- ✓ Scroll reveal animations — existing
- ✓ FAQ accordion — existing

### Active

- [ ] Reorganize folder/file structure — logical separation of assets, pages, and admin
- [ ] Portfolio section — showcase real projects with links and live demo URLs
- [ ] Reviews section — star ratings display with client testimonials
- [ ] Client review submission form — visitors can submit reviews
- [ ] Admin panel (password-protected) — manage reviews, portfolio, prices, and content
- [ ] Admin: approve/reject/edit/delete reviews
- [ ] Admin: add/edit/delete portfolio projects
- [ ] Admin: edit pricing packages
- [ ] Admin: edit general site content (hero text, services, etc.)
- [ ] Stripe payment links — wire real buy.stripe.com URLs for all pricing packages
- [ ] Stripe custom project payments — allow clients to pay custom invoices
- [ ] Layout redesign — reduce excessive scroll, more compact sections
- [ ] Modern tech effects — particle animations, glassmorphism, gradient accents, smooth micro-interactions
- [ ] Backend API — Vercel serverless functions + Supabase for data persistence

### Out of Scope

- User accounts for clients — not needed, admin is single-owner
- CMS platform (Contentful, Sanity, etc.) — admin panel replaces this need
- Automated review approval — owner manually reviews all submissions

## Context

**Current stack:** Pure vanilla HTML/CSS/JS, no build step, no framework. Hosted on Vercel at ruutdev.com. All pages share `css/styles.css` and `js/main.js`.

**Existing Stripe wiring:** The pattern exists (`window.RUUTDEV_CHECKOUT_LINKS`, `data-checkout-id` attributes) but the actual live URLs are placeholders.

**Known issues (from codebase audit):** Nav markup is duplicated in every HTML file (fragile), inline styles scattered across `<head>` blocks (hard to maintain), no testing infrastructure, Web3Forms API key hardcoded.

**Backend approach:** Supabase (free tier) for database + Vercel serverless functions for API routes. Admin panel as a protected `/admin` section. Master password auth via simple token-based session (no full auth system needed for single-owner use).

**Owner manages:** Reviews (approve/reject/edit/delete), Portfolio projects (CRUD), Pricing packages (edit), General content (hero, services text).

## Constraints

- **Stack**: Vanilla HTML/CSS/JS preserved for public pages — no React/Vue (keeps deploy simple on Vercel)
- **Backend**: Vercel serverless functions + Supabase — free tier compatible
- **Auth**: Single master password for admin panel — no multi-user auth needed
- **Hosting**: Vercel — no server management required
- **Bilingual**: All new public-facing content must support EN/ES

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep vanilla HTML/CSS/JS for public pages | No build step, Vercel static hosting works perfectly, no need to migrate | — Pending |
| Supabase for data storage | Free tier generous, integrates well with Vercel, handles reviews + portfolio + content | — Pending |
| Vercel serverless functions for API | Already on Vercel, zero infra overhead, handles Stripe webhooks and Supabase writes | — Pending |
| Master password admin auth | Single owner, no need for full auth system — simple token in localStorage | — Pending |
| Admin panel as separate `/admin` route | Clean separation, easy to protect, doesn't affect public site | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-07 after initialization*
