# Roadmap: RuutDev Website v2

## Overview

The v2 upgrade transforms the existing static marketing site into a dynamic, self-managed platform. Five phases deliver this in order: first a solid foundation (Supabase schema, secrets, CORS/CSP), then public-facing dynamic content (testimonials, portfolio, Stripe wiring), then a secure admin panel with review moderation, then full admin CRUD and public review submission, and finally visual polish with GSAP/tsParticles and the Stripe webhook endpoint.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Restructure codebase, configure Supabase + secrets + CORS/CSP
- [ ] **Phase 2: Public API + Dynamic Content** - Read endpoints wired to public testimonials, portfolio, and Stripe CTAs
- [ ] **Phase 3: Admin Panel + Review Moderation** - Password-protected admin with JWT auth, review approve/reject/edit/delete, portfolio CRUD
- [ ] **Phase 4: Admin CRUD + Review Submission** - Pricing/content management, public review form with spam protection
- [ ] **Phase 5: Visual Polish + Stripe Webhook** - GSAP animations, tsParticles, glassmorphism, layout compaction, Stripe webhook

## Phase Details

### Phase 1: Foundation
**Goal**: The codebase is clean, secrets are safe, and Supabase is live and ready to receive data
**Depends on**: Nothing (first phase)
**Requirements**: STRC-01, STRC-02, STRC-03, STRC-04, INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. Files live under pages/, assets/, api/, admin/ — no stray HTML at project root
  2. Nav renders identically across all pages and is maintained in one place
  3. Web3Forms API key is gone from client-side JS and is sourced from a serverless function
  4. Supabase dashboard shows reviews, portfolio, prices, and content tables with RLS enabled
  5. A Vercel preview deploy responds with correct CORS and CSP headers on /api/* routes
**Plans**: TBD

### Phase 2: Public API + Dynamic Content
**Goal**: Visitors see live testimonials, a real portfolio grid, and working Stripe payment CTAs — all sourced from Supabase
**Depends on**: Phase 1
**Requirements**: API-01, API-02, API-03, DISP-01, DISP-02, DISP-03, DISP-04, DISP-05, PAY-01, PAY-02, PAY-04
**Success Criteria** (what must be TRUE):
  1. Homepage testimonials section loads approved reviews from the database (not hardcoded)
  2. Aggregate star rating in the hero stats row reflects the computed average of approved reviews
  3. Portfolio grid renders project cards with thumbnails, tech tags, and live links sourced from Supabase
  4. Portfolio category filter works client-side without a page reload
  5. All pricing CTA buttons on pricing.html navigate to real buy.stripe.com URLs from environment variables, in both EN and ES
**Plans**: TBD
**UI hint**: yes

### Phase 3: Admin Panel + Review Moderation
**Goal**: Owner can log into a secure admin panel and fully manage reviews and portfolio projects
**Depends on**: Phase 2
**Requirements**: REV-03, REV-04, REV-05, PORT-01, PORT-02, PORT-03, PORT-04, ADMN-01, ADMN-02, ADMN-03, ADMN-06
**Success Criteria** (what must be TRUE):
  1. Visiting /admin without a valid session shows a login gate — wrong password is rejected
  2. Logging in with the master password stores a server-signed token in sessionStorage; closing the tab clears it
  3. Every admin API route independently returns 401 when called without a valid token
  4. Admin can view all pending reviews and approve, reject, edit, or delete each one
  5. Approving a review causes it to appear immediately on the public testimonials section
  6. Admin can add, edit, delete, and toggle visibility of portfolio projects
**Plans**: TBD
**UI hint**: yes

### Phase 4: Admin CRUD + Review Submission
**Goal**: Admin fully controls pricing and site content; visitors can submit reviews via a public form
**Depends on**: Phase 3
**Requirements**: API-04, REV-01, REV-02, ADMN-04, ADMN-05
**Success Criteria** (what must be TRUE):
  1. Visitor submits a review form; submission succeeds, review status is pending, it does not appear publicly
  2. A honeypot field or rate-limit check silently blocks bot submissions
  3. Admin can edit pricing package names, prices, and feature lists — public pricing page reflects changes without a code deploy
  4. Admin can edit hero headline, hero subtext, and services descriptions in both EN and ES
**Plans**: TBD
**UI hint**: yes

### Phase 5: Visual Polish + Stripe Webhook
**Goal**: The site looks and feels like premium, modern dev work, and Stripe payment events are securely handled
**Depends on**: Phase 4
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04, VIS-05, PAY-03
**Success Criteria** (what must be TRUE):
  1. Scroll-triggered animations use GSAP/ScrollTrigger throughout — IntersectionObserver code is removed
  2. Hero section shows an ambient particle background that pauses when prefers-reduced-motion is set
  3. Portfolio and testimonial cards have glassmorphism styling (backdrop blur, translucent surface)
  4. Each major section fits within one viewport — no section requires excessive vertical scrolling
  5. Stripe webhook endpoint at /api/webhooks/stripe returns 400 on invalid signature and 200 on valid events
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/? | Not started | - |
| 2. Public API + Dynamic Content | 0/? | Not started | - |
| 3. Admin Panel + Review Moderation | 0/? | Not started | - |
| 4. Admin CRUD + Review Submission | 0/? | Not started | - |
| 5. Visual Polish + Stripe Webhook | 0/? | Not started | - |
