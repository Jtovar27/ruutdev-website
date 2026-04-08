---
phase: 1
plan: 3
title: "Contact Form Proxy + Supabase Client Utility"
subsystem: api
tags: [security, api, supabase, web3forms, serverless]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [api/contact.js, api/_supabase.js]
  affects: [assets/js/main.js, .gitignore]
tech_stack:
  added: ["@supabase/supabase-js (already in package.json from 01-04)", "Vercel serverless functions (api/ directory)"]
  patterns: ["Serverless proxy pattern", "Env-var-only secrets", "Underscore-prefixed private modules"]
key_files:
  created:
    - api/contact.js
    - api/_supabase.js
    - .env.local
  modified:
    - .gitignore
    - assets/js/main.js
decisions:
  - "WEB3FORMS_KEY moved from client-side JS to server-side env var — eliminates source-visible API key exposure"
  - "api/_supabase.js uses underscore prefix to prevent Vercel from routing it as an HTTP endpoint"
  - "CORS preflight handler in api/contact.js restricts origin to https://ruutdev.com"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-07"
  tasks_completed: 4
  files_changed: 5
---

# Phase 1 Plan 3: Contact Form Proxy + Supabase Client Utility Summary

## One-liner

Web3Forms API key moved server-side via `/api/contact` proxy; shared Supabase client utility created for all Phase 2+ API functions.

## What Was Built

### Task 1: `.gitignore` + `.env.local` scaffold (commit: 31fabf4)

Updated `.gitignore` with proper section comments and added `.env.development` / `.env.production` entries. Created `.env.local` as a template file with all required secret placeholders. Verified gitignored and untracked before creating.

### Task 2: `api/contact.js` — Web3Forms proxy (commit: d3cf202)

Serverless function that:
- Accepts POST from contact form, validates `name` + `email` presence
- Forwards to `https://api.web3forms.com/submit` with `process.env.WEB3FORMS_KEY`
- Returns `200 + { success: true }` on success; `405` for non-POST; `400` for missing fields; `502`/`504`/`500` for upstream errors
- Handles CORS preflight with `Access-Control-Allow-Origin: https://ruutdev.com`
- 8-second `AbortController` timeout matching original client-side behavior

### Task 3: `api/_supabase.js` — shared Supabase client (commit: 92200ac)

Utility module that:
- Imports `createClient` from `@supabase/supabase-js`
- Guards against missing env vars with an early `throw` (fails fast)
- Exports a single `supabase` client for all Phase 2+ serverless functions to import
- Underscore prefix prevents Vercel from treating it as an HTTP route

### Task 4: `assets/js/main.js` — proxy migration (commit: 0f2a2ae)

Two targeted changes to `submitContactForm()`:
1. Fetch URL changed from `'https://api.web3forms.com/submit'` to `'/api/contact'`
2. `access_key: '...'` field removed from the request body

All other behavior — AbortController timeout, success/error UI toggle, button re-enable on failure — is unchanged.

## Verification Results

```
git ls-files .env.local → (empty — not tracked)
grep access_key assets/js/ pages/ index.html → PASS: no match
grep web3forms.com assets/js/ pages/ index.html → PASS: no match
grep api/contact assets/js/main.js → PASS: match found
grep process.env.SUPABASE api/_supabase.js → PASS: match found
```

Curl tests against `vercel dev` were not run (Vercel CLI not installed in this environment, and `WEB3FORMS_KEY` is a placeholder). The route structure and 405/200/400 response contract are verified by code inspection against the plan spec.

## Deviations from Plan

None — plan executed exactly as written.

The `.gitignore` already had `.env`, `.env.local`, `.env.*.local`, `.vercel`, and `node_modules/` entries from plan 01-04. Task 1 added `.env.development`, `.env.production`, and section comment headers — an additive update, not a conflict.

## Known Stubs

None. `api/_supabase.js` is a utility not yet invoked by any live function — that is intentional per plan design. It will be imported starting Phase 2.

## Threat Flags

No new security surface beyond what is documented in the plan's threat model. The `api/contact.js` endpoint is a new public HTTP route, but it is explicitly accounted for in the threat model (rate limiting deferred to Phase 4 per plan scope).

## Self-Check

- [x] `api/contact.js` exists — FOUND
- [x] `api/_supabase.js` exists — FOUND
- [x] `.gitignore` updated — FOUND
- [x] `.env.local` exists — FOUND (gitignored, untracked)
- [x] `assets/js/main.js` updated — FOUND
- [x] Commits 31fabf4, d3cf202, 92200ac, 0f2a2ae — all present in git log
