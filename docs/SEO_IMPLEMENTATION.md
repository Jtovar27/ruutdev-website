# SEO Implementation

- The production canonical host is `https://www.ruutdev.com` across canonicals, sitemap, Open Graph, schema, and robots.
- Unique EN/ES titles and descriptions are centralized in `assets/js/site-config.js` and applied to the build output and language switch.
- The build adds Open Graph, Twitter cards, reciprocal commercial-page language alternates, and accurate canonical URLs.
- `Organization`, `WebSite`, and `Person` schema are present on Home. Internal indexable pages receive `BreadcrumbList`; solution details also receive `Service` schema.
- The sitemap contains only final indexable routes. Pay, intake, payment success, admin, and 404 remain outside it and are noindex where appropriate.
- Permanent redirects retire Services, Portfolio, old case slugs, the withdrawn campaign route, physical `/pages/*` aliases, and Qualifier.
- The build allowlist prevents source documents, unverified case studies, legacy runtime code, and the withdrawn campaign asset from entering the deployment artifact.
- A custom bilingual 404 and SVG favicon are included.
- No review, rating, customer, metric, private location schema, or unsupported claim was added.

Limitation: commercial Spanish variants use `?lang=es` with JavaScript-applied localized content. Dedicated server-rendered `/es/` documents would be the stronger long-term indexing model. Privacy and Terms do not advertise Spanish hreflang until an approved full legal translation exists.
