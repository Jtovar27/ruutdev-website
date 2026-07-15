# AGENTS.md — RuutDev Website

## Project map

Commercial bilingual website for an independent Florida development studio. The application is static HTML/CSS/JavaScript deployed on Vercel with Node ESM serverless APIs. It is not a Next.js project.

- `index.html`: homepage.
- `pages/`: public, legal, payment, intake, admin, and case-study documents.
- `assets/css/`: legacy styles plus rebuild tokens/components.
- `assets/js/`: site config, shared behavior, and legacy behavior.
- `api/`: Vercel functions using Supabase and Web3Forms.
- `migrations/`: reviewable database migrations.
- `vercel.json`: routes, redirects, CORS, CSP, and security headers.

## Commands

- Install: `npm install`
- Develop: `npm run dev` (requires Vercel CLI and environment variables)
- Lint/static validation: `npm run lint`
- JavaScript syntax/type proxy: `npm run typecheck` (syntax checks, not a TypeScript compiler)
- Tests: `npm test` (builds first; mocks contact validation and never sends real forms/payments)
- Build: `npm run build` (creates the allowlisted `public/` deployment artifact)

## Conventions

- English in code, commits, and repository docs; EN/ES parity in public content.
- Reuse `rebuild.css`, `rebuild.js`, and `site-config.js`; do not duplicate business, pricing, project, analytics, or feature data.
- Components use semantic HTML, visible labels, logical headings, keyboard support, 44px targets, visible focus, and reduced-motion support.
- Content is direct and business-oriented. No invented customers, metrics, testimonials, guarantees, team size, or capabilities.
- Every public page needs a unique title/description, canonical URL, correct indexation, internal links, and accurate structured data only.
- Never expose secrets or log form bodies. Validate and limit data on client and server. Preserve payment links and production integrations unless explicitly approved.

## Sensitive data and environment

Server-only variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `ADMIN_EMAILS`, `WEB3FORMS_KEY`. `api/_supabase.js`, admin APIs, Vercel environment settings, Supabase policies/storage, payment URLs, and legal/payment documents require security review. Never put real secrets in tracked files.

## Must not break

Contact dual delivery, project intake, admin magic-link/allowlist, approved review moderation, `/pay`, payment success, privacy/terms, current prices, current Stripe Payment Links, and indexed-route redirects. `futureProductEnabled` must remain `false`; do not name or publish a future product.

## Definition of done

Reproducible install; relevant checks actually executed and reported; critical routes and links verified in preview; EN/ES parity; keyboard/mobile/form QA; no unverified claims; no new secrets; no production submissions; review of security-sensitive changes; documentation updated; conventional commit on a dedicated branch, pushed without merging.
