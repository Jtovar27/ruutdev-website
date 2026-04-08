# Requirements: RuutDev Website v2

**Defined:** 2026-04-07
**Core Value:** Convert visitors into paying clients — the site must look credible, showcase real work, and make it trivially easy to pay.

## v1 Requirements

### Structure

- [ ] **STRC-01**: Codebase is reorganized into a logical directory structure (pages/, assets/, api/, admin/)
- [ ] **STRC-02**: Nav markup is extracted into a shared include pattern to eliminate duplication across HTML files
- [ ] **STRC-03**: Page-specific inline styles are migrated to the shared stylesheet
- [ ] **STRC-04**: Secrets (Web3Forms key, etc.) are moved out of client-side JS into environment variables or serverless function proxies

### Infrastructure

- [ ] **INFRA-01**: `package.json` created with server-side dependencies (stripe, @supabase/supabase-js)
- [ ] **INFRA-02**: Supabase project initialized with tables: reviews, portfolio, prices, content
- [ ] **INFRA-03**: Row Level Security enabled on all Supabase tables at creation time
- [ ] **INFRA-04**: Vercel environment variables configured for SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- [ ] **INFRA-05**: `vercel.json` configured with CORS headers for `/api/*`, CSP header, and `cleanUrls: true`
- [ ] **INFRA-06**: Shared `api/_supabase.js` utility initializes Supabase client from env vars

### Public API

- [ ] **API-01**: `GET /api/reviews` returns approved reviews with name, role, rating, text
- [ ] **API-02**: `GET /api/portfolio` returns visible portfolio items with title, description, tags, link, image
- [ ] **API-03**: `GET /api/prices` returns current pricing packages from database
- [ ] **API-04**: `POST /api/reviews` accepts visitor-submitted reviews with honeypot spam protection and rate limiting

### Display

- [ ] **DISP-01**: Homepage shows dynamic testimonials section loaded from Supabase via API
- [ ] **DISP-02**: Aggregate star rating (computed from approved reviews) appears in hero stats row
- [ ] **DISP-03**: Portfolio section displays project grid with thumbnails, tech tags, and live demo links
- [ ] **DISP-04**: Portfolio grid has client-side category filter
- [ ] **DISP-05**: All new dynamic sections support EN/ES bilingual switching

### Reviews

- [ ] **REV-01**: Visitors can submit a review via a public form with name, role, company, rating (stars), and text
- [ ] **REV-02**: Submitted reviews default to `status='pending'` and are not shown publicly until approved
- [ ] **REV-03**: Admin can view all pending reviews in the admin panel
- [ ] **REV-04**: Admin can approve, reject, edit, or delete any review
- [ ] **REV-05**: Approved reviews appear immediately on the public site

### Portfolio

- [ ] **PORT-01**: Admin can add new portfolio projects with title, description, tech tags, live URL, thumbnail image
- [ ] **PORT-02**: Admin can edit existing portfolio projects
- [ ] **PORT-03**: Admin can delete portfolio projects
- [ ] **PORT-04**: Admin can toggle project visibility (show/hide without deleting)

### Admin Panel

- [ ] **ADMN-01**: `/admin` route serves a password-protected admin panel
- [ ] **ADMN-02**: Admin logs in with a master password; a signed server token is issued and stored in sessionStorage
- [ ] **ADMN-03**: Every admin API route independently verifies the server token — auth is enforced server-side, not just in the UI
- [ ] **ADMN-04**: Admin can edit pricing packages (name, price, features list) — Supabase becomes single source of truth, hardcoded HTML prices removed
- [ ] **ADMN-05**: Admin can edit general site content (hero headline, hero subtext, services descriptions) in both EN and ES
- [ ] **ADMN-06**: Admin session clears on tab close (sessionStorage, not localStorage)

### Payments

- [ ] **PAY-01**: All pricing package CTAs on `pricing.html` link to real `buy.stripe.com` Payment Link URLs
- [ ] **PAY-02**: `pay.html` custom invoice flow routes clients to a Stripe Invoice or custom Payment Link
- [ ] **PAY-03**: Stripe webhook endpoint at `api/webhooks/stripe.js` verifies signature using raw request body before JSON parsing
- [ ] **PAY-04**: Checkout link URLs are managed via Vercel environment variables (not hardcoded in JS)

### Visual

- [ ] **VIS-01**: GSAP 3 + ScrollTrigger replaces existing IntersectionObserver scroll reveal animations
- [ ] **VIS-02**: Hero section has ambient particle background (tsParticles slim, reduced-motion aware)
- [ ] **VIS-03**: Portfolio and testimonial cards use glassmorphism treatment (backdrop blur, translucent surface)
- [ ] **VIS-04**: Layout is compacted — each major section fits within one viewport without excessive scroll
- [ ] **VIS-05**: Smooth micro-interactions on buttons, cards, and nav links via GSAP

## v2 Requirements

### Admin

- **ADMN-V2-01**: Admin can schedule content to go live at a future date
- **ADMN-V2-02**: Multi-user admin with role-based access (editor vs owner)

### Analytics

- **ANLX-01**: Admin dashboard shows review submission rate and approval ratio
- **ANLX-02**: Portfolio click-through tracking (which projects get most clicks)

### Payments

- **PAY-V2-01**: Stripe webhook logs payments to Supabase for invoice history tracking
- **PAY-V2-02**: Automated receipt email on successful payment

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts for clients | Single-owner operation; not needed |
| Third-party CMS (Contentful, Sanity) | Custom admin panel handles this need |
| Automated review approval | Owner must manually approve all submissions |
| Blog section | High build cost, months to bear SEO fruit — defer |
| React / Next.js migration | Violates no-build-step constraint; not needed for this scope |
| Real-time chat | Not a conversion feature for this type of site |
| Mobile app | Web-first; mobile later if needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STRC-01 | Phase 1 | Pending |
| STRC-02 | Phase 1 | Pending |
| STRC-03 | Phase 1 | Pending |
| STRC-04 | Phase 1 | Pending |
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| INFRA-06 | Phase 1 | Pending |
| API-01 | Phase 2 | Pending |
| API-02 | Phase 2 | Pending |
| API-03 | Phase 2 | Pending |
| API-04 | Phase 4 | Pending |
| DISP-01 | Phase 2 | Pending |
| DISP-02 | Phase 2 | Pending |
| DISP-03 | Phase 2 | Pending |
| DISP-04 | Phase 2 | Pending |
| DISP-05 | Phase 2 | Pending |
| REV-01 | Phase 4 | Pending |
| REV-02 | Phase 4 | Pending |
| REV-03 | Phase 3 | Pending |
| REV-04 | Phase 3 | Pending |
| REV-05 | Phase 3 | Pending |
| PORT-01 | Phase 3 | Pending |
| PORT-02 | Phase 3 | Pending |
| PORT-03 | Phase 3 | Pending |
| PORT-04 | Phase 3 | Pending |
| ADMN-01 | Phase 3 | Pending |
| ADMN-02 | Phase 3 | Pending |
| ADMN-03 | Phase 3 | Pending |
| ADMN-04 | Phase 4 | Pending |
| ADMN-05 | Phase 4 | Pending |
| ADMN-06 | Phase 3 | Pending |
| PAY-01 | Phase 2 | Pending |
| PAY-02 | Phase 2 | Pending |
| PAY-03 | Phase 5 | Pending |
| PAY-04 | Phase 2 | Pending |
| VIS-01 | Phase 5 | Pending |
| VIS-02 | Phase 5 | Pending |
| VIS-03 | Phase 5 | Pending |
| VIS-04 | Phase 5 | Pending |
| VIS-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after initial definition*
