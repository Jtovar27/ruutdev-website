# Website Audit

## Current architecture

RuutDev is a static multi-page HTML/CSS/JavaScript site deployed on Vercel with Node 22 ESM serverless functions. Routing uses `vercel.json` rewrites. Supabase stores leads, reviews, and intakes; Web3Forms delivers contact email; Stripe is used through existing Payment Links. npm is the package manager. There is no compiler, TypeScript, lint, test, or build pipeline in the original project.

## Preserve

- Existing contact, intake, admin, legal, and payment flows.
- Current prices and Stripe URLs without modification.
- Phone, WhatsApp, email, logo, original portfolio images, and founder photo.
- Supabase/Web3Forms dual-delivery and admin magic-link access.

## P0

- Unverified testimonials/outcomes and demos presented without visible status damage credibility.
- Public future-product landing conflicts with current scope.
- Public forms and uploads lack durable rate limiting; intake upload security depends on unversioned Supabase policies.
- Contact interaction was not an actual form and lacked accessible errors, consent, and honeypot.

## P1

- Pricing, technology, AI, and speed claims dominated the value proposition.
- Navigation exposed Pay and omitted Process; mobile navigation lacked Escape/focus handling.
- EN/ES localization did not include URL, metadata, or server-rendered locale variants.
- CSP allows inline scripts/styles; analytics consent behavior needs owner/legal review.
- Pricing and contact data are duplicated; project content was not structured.
- `npm install` reports one high and one moderate vulnerability. Major updates were not applied blindly.

## P2

- Large global CSS/JS, remote icon/font/carousel dependencies, inline styles, autoplay, and hidden reveal content.
- No automated quality gates, 404 page, full hreflang architecture, or reproducible Supabase policies.

## Accessibility, UX, SEO, credibility

The rebuild introduces semantic landmarks, skip navigation, visible focus, reduced motion, problem-first content, three clear solutions, direct-founder positioning, canonical metadata, updated sitemap, and honest project-status requirements. Fully localized indexable routes and independent automated accessibility/performance runs remain follow-up work.

## Priorities

- **P0:** keep future product disabled; verify portfolio statuses; secure public endpoints/storage; remove unverified public proof.
- **P1:** finish structured Work/Pricing rendering, localized SEO routes, analytics consent, and automated tests.
- **P2:** migrate remaining legacy pages to shared tokens and reduce CDN/runtime weight.
