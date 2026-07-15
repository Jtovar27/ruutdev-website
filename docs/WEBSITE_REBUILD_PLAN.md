# Website Rebuild Plan

## Route plan

- Preserve `/`, `/about`, `/pricing`, `/contact`, `/privacy`, `/terms`, `/pay`, intake/admin/payment flows.
- Reorganize `/services` to `/solutions` and `/portfolio` to `/work` with permanent redirects.
- Add `/solutions/websites`, `/solutions/business-systems`, `/solutions/automation-ai`, and `/process`.
- Remove the future-product campaign route from public access by routing it to the applicable automation solution. No product route is created.

## System and implementation order

1. Centralize business, navigation, pricing, project, analytics, language, legal, and feature data.
2. Add tokens and accessible shared behavior.
3. Rebuild Home and core solution routes.
4. Rebuild problem-first contact and harden validation.
5. Update routing, sitemap, robots, metadata, and security headers.
6. Migrate Work/About/Pricing and remaining legacy pages without changing legal terms or payment links.
7. Validate links, responsive layouts, accessibility, APIs with mocks, and production preview.

## Design/content/conversion

Editorial, precise, minimal layout; one primary action; five verified credibility signals; exactly three solutions; six-step process; no unverified testimonials or metrics. EN/ES remains client-persisted for this phase; localized indexable routes are a P1 migration because the static architecture cannot serve two metadata variants from one URL.

## Analytics/SEO

Use a provider-neutral event adapter and never send form messages. Keep real providers disabled unless configured/consented. Unique title/description/canonical, exact structured data, clean internal routes, sitemap, robots, permanent redirects, and a later localized-route/hreflang pass.

## Risks and acceptance

Payment/legal values are immutable without owner approval. Supabase storage policy and durable rate limiting need external configuration. Acceptance requires reproducible install, available quality gates, no broken critical routes, accessible core navigation/form, transparent project status, and all owner blockers documented.
