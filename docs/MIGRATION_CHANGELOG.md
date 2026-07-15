# Migration Changelog

## Completion phase

- Consolidated Home, Solutions, Work, Process, About, Pricing, Contact, legal, payment, and operational routes under one global responsive shell.
- Rebuilt Home and all three solution pages around the independent-studio positioning and business outcomes.
- Removed all unverified projects/testimonials/metrics from public rendering and retained an internal verification inventory.
- Reorganized Pricing without changing approved amounts or the five Stripe Payment Links.
- Rebuilt Pay around fixed checkout choices, removing the misleading custom amount control.
- Preserved legal substance, intake, payment success, admin, Web3Forms, and Supabase integrations.
- Removed hardcoded GTM loading and kept provider-neutral analytics disabled by default.
- Added a source allowlist build so legacy `/pages/*`, Qualifier, old case studies, withdrawn campaign content, and legacy `main.js` are not deployed.
- Added permanent legacy redirects, canonical `www` URLs, sitemap, robots, localized metadata, social cards, breadcrumbs, Service schema, favicon, and custom 404.
- Added static/content tests, mocked contact API tests, public artifact tests, and dependency-free Chrome DevTools browser QA.
- Validated exact responsive widths and Lighthouse targets without live submissions or production mutations.
