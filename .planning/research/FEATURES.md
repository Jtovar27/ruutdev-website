# Feature Landscape

**Domain:** Freelance web dev agency website with admin CMS
**Project:** RuutDev v2
**Researched:** 2026-04-07
**Confidence:** HIGH — codebase audit + deep domain knowledge of what converts in this niche

---

## Context: What Already Exists

Before categorizing new work, the v1 baseline is:
- Multi-page static site (index, pricing, contact, services, pay, about, qualifier)
- Bilingual EN/ES toggle via `data-en`/`data-es` attributes
- Static testimonials section (3 hardcoded cards, 5-star, no backend)
- Pricing pages with Stripe-ready wiring (`data-checkout-id`) but placeholder URLs
- Contact form via Web3Forms
- Scroll reveal animations, FAQ accordion
- Mobile responsive, SEO meta, Open Graph

The v2 milestone adds the backend, dynamic content, and polish layer.

---

## Table Stakes

Features visitors expect. Their absence creates distrust or confusion that causes the client to leave.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Social proof with real attribution** | Hardcoded testimonials feel fake to skeptical visitors; named real clients with roles lend credibility | Medium | Move from static HTML to Supabase-backed, approved reviews. Name + role + company slug enough — photo optional |
| **Star rating display (aggregate)** | Visitors pattern-match to Google/Yelp/Trustpilot — a visible average (e.g., "4.9 / 5 from 12 clients") signals legitimacy | Low | Computed from approved reviews in DB; display in hero stats row and testimonials section header |
| **Portfolio with real project links** | "Starter" and "Business" service pages sell a promise; a portfolio makes that promise credible. Clients need to see output matching their budget tier | Medium | Cards with: project title, tech tags, description, screenshot/thumbnail, live URL. Filterable by category |
| **Transparent pricing with direct pay** | Already partially done. Must close the loop: real Stripe payment links wired to each plan so a visitor can self-serve without emailing | Low | Wire real `buy.stripe.com` URLs; confirm flow works end-to-end |
| **Custom invoice / pay-by-amount** | Returning clients or custom project clients need a way to pay a specific amount without a new Stripe product per invoice | Medium | Pay page already exists structurally — needs a Stripe Payment Link with adjustable amount or a dynamic Checkout Session |
| **Working contact form with confirmation** | Already exists via Web3Forms but API key is hardcoded; confirmation feedback to user is critical | Low | Move key to env var; ensure success/error states are visible and bilingual |
| **Mobile-first layout that loads fast** | Over 60% of small business owners browse on mobile. Current layout works but has scroll fatigue | Low-Med | Compact hero, tighter section spacing, fewer full-viewport sections |
| **About / founder page** | Solo freelance and small agencies convert better with a human face — clients are hiring a person | Low | Already exists; ensure it has a clear headshot placeholder slot and a brief credibility paragraph |

---

## Differentiators

Features not universally expected but that create competitive advantage for a dev agency targeting small businesses and startups.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Review submission form (public)** | Letting clients submit reviews directly (pending admin approval) turns satisfied clients into an ongoing social proof engine without manual copy-paste | Medium | Form: name, role, company, rating (1–5 stars), message, optional project tag. Submits to Supabase `reviews` table with `status: pending`. Admin approves before display |
| **Admin panel (single-owner CMS)** | Removes dependency on a developer to update content. Owner can approve reviews, add portfolio items, adjust prices, and edit hero/services copy from a password-protected panel | High | Most complex feature in v2; see admin section below for sub-features |
| **Portfolio filter by category** | Lets a restaurant owner find restaurant-type work, a startup founder find SaaS work — reduces cognitive load and increases relevance | Low | Client-side filter (JS) against category tags stored in Supabase; no additional API call needed if portfolio fetched at load |
| **Bilingual admin panel** | Editing EN and ES content in the same field pair ensures translations stay in sync when the owner updates copy | Medium | Each editable content field should have `content_en` and `content_es` columns; admin form shows two text areas side by side |
| **Review moderation workflow** | Prevents spam, fake reviews, competitor sabotage. Shows owner professionalism | Low (given backend exists) | `status` column: `pending` → `approved` / `rejected`. Admin list view with action buttons |
| **Particle / ambient background effects** | Tech-forward aesthetic that signals RuutDev builds modern, high-quality products — differentiates from generic WordPress agency templates | Medium | Canvas-based or CSS-only particles in hero only. Must be toggleable/disabled for reduced-motion preference |
| **Glassmorphism card treatment** | Cohesive modern visual language across cards (portfolio, pricing, testimonials) — signals attention to craft | Low | CSS only; `backdrop-filter: blur`, semi-transparent backgrounds, subtle border glow on accent cards |
| **Smooth micro-interactions** | Hover states, button feedback, page transition fades — all signal quality of the builder's own work | Low | CSS transitions already partly in place; extend to all interactive elements |
| **Qualifier page integration** | The existing `qualifier.html` (noindex) is a sales tool — linking to it from the right CTAs filters serious leads before calls | Low | Add CTA copy that routes budget-uncertain visitors to the qualifier instead of the main contact form |

---

## Anti-Features

Features to explicitly NOT build in this milestone. Each wastes build time or creates technical debt that conflicts with project constraints.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **User accounts for clients** | Out of scope in PROJECT.md. Adds auth complexity (password reset, session management) without user value — clients pay via Stripe, don't need a dashboard | Use Stripe's hosted invoice/receipt emails for client-facing payment records |
| **Third-party CMS (Contentful, Sanity, Prismic)** | Out of scope. Adds vendor dependency, per-seat pricing risk, and a separate learning curve for the owner. The custom admin panel IS the CMS | Build the admin panel as the CMS; Supabase is the store |
| **Automated review approval (spam filters, ML)** | Complexity is not warranted for a solo owner managing a modest volume of reviews. Manual review is a feature — it ensures quality | Keep `status: pending` default; owner approves manually in admin panel |
| **Client portal / project tracker** | Scope creep. Clients don't need to log in to track projects — use email updates and a simple delivery handoff workflow | Out of scope; direct communication handles this |
| **Blog / content marketing section** | Legitimate long-term SEO play but wrong phase. Content strategy takes months to bear fruit and requires ongoing writing commitment | Defer to a future milestone after core conversion features ship |
| **Live chat widget (Intercom, Drift, etc.)** | Adds third-party JS weight, monthly cost, and async pressure on a solo owner. Contact form + WhatsApp link (if desired) covers the use case | Use the existing contact form; optionally add a WhatsApp floating link (2 lines of HTML) |
| **Dark/light mode toggle** | The current design is dark-mode native and polished. Adding a toggle doubles CSS maintenance surface with no clear conversion benefit | Keep dark-mode-only design; honor `prefers-color-scheme` in media queries passively |
| **Review reply system** | Owner replying publicly to reviews (like Google Maps) is not a pattern clients expect from a personal agency. Adds UI complexity for near-zero value | If owner wants to respond to a reviewer, do it via email |
| **Animated page transitions (SPA-style routing)** | Pure HTML multi-page site doesn't support SPA routing without a framework. Faking it with JS is fragile and complicates the no-build-step constraint | Use CSS `transition` on elements within pages; accept the native browser page load between pages |

---

## Feature Deep-Dives

### Reviews / Testimonials

**Trust conversion mechanics:** The pattern that converts in the freelance dev niche is:
1. Aggregate rating shown in the hero stats row (e.g., "4.9 stars from 14 clients") — gives instant credibility before they scroll
2. Individual testimonial cards in a dedicated section — 3-4 visible, rest lazy-loaded or paginated
3. Each card: 5-star display, quote, first name + last initial + role + company (not just "John D." — specificity signals authenticity)
4. Submission form is NOT in the main flow — link to it from a "Leave a review" CTA below the testimonials section, or send the link to clients post-delivery

**Admin review workflow:**
- Supabase table: `reviews(id, name, role, company, rating, message, status, created_at, project_tag)`
- `status` default: `pending`
- Admin list view shows pending first, with Approve / Reject / Edit / Delete actions
- Approved reviews fetched via public Vercel function (no auth required to READ approved reviews)
- Submit form POSTs to authenticated Vercel function (rate-limited by IP to prevent spam)

**Bilingual consideration:** Review content is submitted in whatever language the client writes. Do NOT auto-translate. Display as-is. The EN/ES toggle should only toggle UI chrome (section headers, submit button labels, placeholder text) — not review content itself.

---

### Portfolio Showcase

**What converts:** Portfolio cards need 4 things — (1) a visual (screenshot or mockup), (2) the type of project, (3) the tech used, and (4) a live link. Missing any of these, especially the live link, drops credibility significantly.

**UX pattern:** Grid of cards (2-col desktop, 1-col mobile). Each card:
- Thumbnail image (aspect-ratio: 16/9 or 4/3, object-fit: cover)
- Project title
- Short description (2 sentences max)
- Tech tag pills (e.g., "React", "Supabase", "Stripe")
- Category tag (Website, E-commerce, Software, AI/Automation)
- CTA button: "View Live" (external link)

**Filter:** Category filter tabs above the grid. Client-side JS — no API round-trip on filter change.

**Admin portfolio CRUD:**
- Supabase table: `portfolio(id, title, description_en, description_es, thumbnail_url, live_url, tech_tags, category, sort_order, visible, created_at)`
- Image upload: Use Supabase Storage (free tier: 1GB). Admin uploads image, gets public URL stored in `thumbnail_url`
- `sort_order` column lets owner pin featured projects to the top
- `visible` boolean for soft-hiding without deleting

---

### Admin Panel

**Architecture:** Protected `/admin/` route (or `admin.html` with JS redirect guard). Simple master-password auth: POST to `/api/admin/login` with password, receives a signed JWT or opaque token stored in `sessionStorage`. All admin API routes verify the token in `Authorization: Bearer` header.

**Do NOT use localStorage for the admin token** — sessionStorage expires on tab close, which is the right security posture for a shared-device scenario.

**Admin sections (priority order):**
1. **Reviews** — approve/reject/edit/delete pending and approved reviews (highest urgency: drives trust)
2. **Portfolio** — CRUD for portfolio projects, image upload, reorder via drag or sort_order field
3. **Pricing** — edit package names, prices, descriptions. These values feed the public pricing page via a Vercel function that returns pricing JSON; no more hardcoded HTML prices
4. **Content** — edit hero headline, subline, stats numbers, services descriptions (EN + ES pairs). Lowest priority: existing static copy is acceptable for v2 launch

**Admin UX pattern:** Single-page admin (no multi-page navigation inside admin). Sidebar with section tabs. Each section is a panel. No framework needed — vanilla JS is fine given the admin is internal tooling, not a public-facing product.

---

### Payment Flow

**Stripe pattern for this use case:**
- Predefined packages: Use Stripe Payment Links (`buy.stripe.com/...`) — one per pricing tier. No server required for these, pure redirect.
- Custom invoices: Use Stripe's Invoice feature (manually created in Stripe Dashboard) with a "Pay Invoice" link sent to client via email. The `/pay.html` page handles this case — client enters invoice ID or uses a direct link.
- Dynamic custom amounts: If owner needs clients to pay arbitrary amounts without creating a Stripe invoice manually, use a Stripe Payment Link with "customer chooses price" enabled. This is a Stripe Dashboard setting — zero code required.

**Payment confirmation:** After Stripe redirect, client lands on a success URL (`/pay.html?status=success`). The page should detect this query param and show a confirmation message. No webhook needed for this — it's cosmetic confirmation only.

**Webhook consideration:** If the owner wants to auto-log payments in Supabase (for bookkeeping), a Stripe webhook → Vercel function → Supabase insert is the right pattern. This is MEDIUM complexity and optional for v2 — the Stripe Dashboard itself is sufficient for payment records.

---

## Feature Dependencies

```
Admin panel auth (JWT)
  └── Admin reviews management
        └── Review submission form (public)
              └── Testimonials display on index.html (dynamic)
                    └── Aggregate star rating in hero stats

Admin panel auth (JWT)
  └── Admin portfolio CRUD
        └── Supabase Storage (image uploads)
              └── Portfolio section on index.html (dynamic)

Supabase project setup
  └── All of the above (shared prerequisite)

Vercel serverless functions
  └── All Supabase-touching features (CRUD, auth, submit)

Stripe live URLs
  └── Pricing page CTAs
  └── Pay page (custom invoice / dynamic amount)
```

**Critical path:** Supabase setup must complete before ANY dynamic feature can be built or tested. Admin auth must work before any write operations (reviews, portfolio) are exposed.

---

## MVP Recommendation for v2

Prioritize in this order:

1. **Supabase schema + Vercel API scaffold** — unblocks everything
2. **Admin panel with auth + reviews management** — approve the backlog of existing client reviews so the site has real social proof
3. **Dynamic testimonials display** — replaces hardcoded cards; aggregate rating in hero stats
4. **Portfolio section** — static-to-dynamic migration; add real project entries
5. **Stripe live URL wiring** — low effort, high revenue impact
6. **Layout compaction + visual effects** — particle hero, glassmorphism cards, tighter spacing
7. **Review submission form** — comes after admin panel is ready to handle the queue
8. **Admin pricing + content editing** — lowest urgency; static copy is acceptable longer

**Defer to v3:**
- Blog/content section
- Stripe webhook → Supabase payment log
- Admin content editor (hero/services copy)

---

## Sources

- Codebase audit of `/Users/jtovar_27/Desktop/ruutdev-website/` (April 2026)
- PROJECT.md requirements (validated + active requirements)
- Domain knowledge: freelance dev agency conversion patterns, Stripe API documentation patterns, Supabase free tier capabilities
- Confidence: HIGH for table stakes and anti-features (well-established patterns); MEDIUM for specific Stripe dynamic amount approach (verify "customer chooses price" is still available on Payment Links in current Stripe Dashboard)
