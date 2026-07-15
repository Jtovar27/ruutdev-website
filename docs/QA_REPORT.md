# QA Report

Status: validated locally for the public build; Vercel Preview validation remains required. No real contact submission, payment, Supabase mutation, or production deployment was performed.

## Automated results

- `npm install`: completed. Local Node is 24; production declares Node 22.x.
- `npm run lint`: passes the repository static/content checker for 16 critical source pages.
- `npm run typecheck`: passes JavaScript syntax validation. This is not TypeScript compiler coverage.
- `npm test`: 9/9 tests pass after generating the deployment artifact.
- `npm run build`: passes and generates an allowlisted `public/` artifact with 20 documents/assets.
- `npm run qa:browser`: validates exact viewport widths, global shell counts, horizontal overflow, console errors, EN/ES, menu focus behavior, Escape, scroll lock, contact validation, and mocked success/error states.
- `npm audit --omit=dev`: 0 reported vulnerabilities during the audit.

## Responsive/browser coverage

Chrome DevTools Protocol was used at 320, 360, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS pixels. Home, Solutions, Work, Pricing, Contact, Privacy, Terms, and Pay were checked at mobile and desktop widths. No root overflow, duplicate shell, missing main landmark, or console error was detected. No live form request was sent.

## Lighthouse 13.4.0

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| Home | 97 | 100 | 100 | 100 |
| Solutions | 98 | 100 | 100 | 100 |
| Pricing | 97 | 100 | 100 | 100 |
| Contact | 98 | 100 | 100 | 100 |

The Lighthouse reports were produced successfully. On Windows, the CLI returned an `EPERM` warning while deleting its temporary profile after writing some reports; the JSON reports themselves contain no runtime error.

## Partially validated

- Redirect definitions and source-route exclusions are covered by tests, but final HTTP behavior must be checked on a Vercel Preview.
- Lighthouse is not a substitute for a full manual screen-reader audit.
- Landscape mobile and browser zoom received structural review but not a complete assistive-technology matrix.
- The five existing Stripe URLs were preserved; no checkout was completed.
- Supabase Storage privacy and RLS require an owner-reviewed migration and production policy check.
