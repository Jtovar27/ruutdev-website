# Remaining Work

The commercial migration is implemented and locally validated. These items were intentionally deferred because they require owner confirmation, production access, legal review, or a separate reviewed migration.

## Before production approval

1. Review Privacy and Terms with qualified counsel, including the mailing address, subprocessors, data collected by the expanded contact form, and the full Spanish legal translation.
2. Review and migrate Supabase intake uploads to private Storage with signed URLs, versioned RLS policies, and cleanup for partial submissions.
3. Validate all redirects, security headers, canonical responses, API CORS, and 404 behavior on the Vercel Preview created from this branch.
4. Perform one controlled contact submission in Preview with approved test data to verify Web3Forms and Supabase delivery. Do not repeat against production.
5. Confirm the five existing Stripe Payment Links from an authorized owner account. Do not complete test purchases in production.

## Content and business decisions

1. Confirm which repository projects are clients, internal demos, or concepts and whether their screenshots and public URLs may be shown.
2. Provide evidence for any testimonial or outcome before it is published.
3. Confirm all pricing, support-plan values, cancellation terms, ownership transfer, revisions, hosting, maintenance, and third-party fees.
4. Configure and verify a domain email before replacing `helloruutdev@hotmail.com` in `assets/js/site-config.js`.
5. Confirm approved social URLs, analytics provider/IDs, consent requirements, and additional photography.
6. Configure a permanent apex-to-`www` domain redirect in Vercel if it is still temporary.

## Technical cleanup for a later PR

1. Remove excluded legacy source pages, CSS blocks, JavaScript, and unused large portfolio assets after the owner confirms no archival or operational dependency remains.
2. Remove the unused Stripe SDK dependency after confirming no hidden deployment function consumes it.
3. Pin the browser Supabase SDK used by intake, add integrity controls where supported, and review all admin URL rendering.
4. Replace per-instance contact rate limiting with a durable distributed limiter if traffic or abuse warrants it.
5. Consider true server-rendered `/es/` routes for stronger bilingual indexing.
6. Run a manual screen-reader and legal-content review in addition to the automated accessibility checks.

See `docs/OWNER_ACTION_ITEMS.md` for ownership, priority, risk, and production impact.
