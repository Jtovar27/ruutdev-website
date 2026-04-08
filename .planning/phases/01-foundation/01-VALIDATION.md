---
phase: 1
slug: foundation
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification + curl/bash checks (no test framework — static site) |
| **Config file** | none |
| **Quick run command** | `ls pages/ assets/ api/` |
| **Full suite command** | Manual checklist (see Per-Task Verification Map) |
| **Estimated runtime** | ~120 seconds manual |

---

## Sampling Rate

- **After every task commit:** Verify file structure with `ls pages/ assets/ api/`
- **After every plan wave:** Run full manual checklist
- **Before `/gsd-verify-work`:** All success criteria verified via curl/browser
- **Max feedback latency:** 120 seconds

---

## Wave 0 Notes

Wave 0 artifacts (`vercel.json`, `.gitignore`, `.env.local`) are created within the plans themselves:
- `vercel.json` — Plan 01, Task 2
- `.gitignore` + `.env.local` — Plan 03, Task 1

No pre-execution setup is required before Wave 1.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 1-01-1 | 01 | 1 | STRC-01 | — | Files in pages/, not at root | automated | `ls pages/*.html` | ⬜ pending |
| 1-01-2 | 01 | 1 | INFRA-05 | T-CORS, T-CSP | vercel.json valid with CORS + CSP | automated | `grep '"cleanUrls"' vercel.json` | ⬜ pending |
| 1-01-3 | 01 | 1 | INFRA-05 | — | Preview URLs return 200 | manual | `curl -s -o /dev/null -w "%{http_code}" $PREVIEW/about` | ⬜ pending |
| 1-02-1 | 02 | 2 | STRC-02 | — | nav.html partial created with bilingual attrs | automated | `grep "data-en" components/nav.html \| wc -l` (≥ 6) | ⬜ pending |
| 1-02-2 | 02 | 2 | STRC-02 | — | initNav() and markActiveNavLink() in main.js | automated | `grep "function initNav" assets/js/main.js` | ⬜ pending |
| 1-02-3 | 02 | 2 | STRC-02 | — | All 8 pages use nav-placeholder | automated | `grep -l "nav-placeholder" index.html pages/*.html \| wc -l` (= 8) | ⬜ pending |
| 1-03-1 | 03 | 3 | INFRA-06 | T-secrets | .env.local gitignored, not tracked | automated | `git ls-files .env.local` (empty) | ⬜ pending |
| 1-03-2 | 03 | 3 | STRC-04 | T-API-key | api/contact.js proxies Web3Forms | automated | `grep "WEB3FORMS_KEY" api/contact.js` | ⬜ pending |
| 1-03-3 | 03 | 3 | INFRA-06 | T-creds | api/_supabase.js uses env vars only | automated | `grep "SUPABASE_URL" api/_supabase.js` | ⬜ pending |
| 1-03-4 | 03 | 3 | STRC-04 | T-API-key | API key removed from client JS | automated | `grep "access_key" assets/js/main.js` (empty) | ⬜ pending |
| 1-04-1 | 04 | 1 | INFRA-01 | — | package.json with supabase + stripe | automated | `grep '"@supabase/supabase-js"' package.json` | ⬜ pending |
| 1-05-1 | 05 | 4 | INFRA-02, INFRA-03 | T-RLS | Supabase tables + RLS created | manual | Supabase dashboard — Table Editor + RLS check | ⬜ pending |
| 1-05-2 | 05 | 4 | INFRA-04 | — | Vercel env vars set (7 vars) | manual | Vercel dashboard — Environment Variables section | ⬜ pending |
| 1-06-1 | 06 | 3 | STRC-03 | — | No inline styles in HTML pages | automated | `grep -rl "<style>" pages/ \| wc -l` (= 0) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase tables created with correct schema | INFRA-02 | Requires Supabase dashboard access | Log in to Supabase, check Table Editor for reviews, portfolio, prices, content tables |
| RLS policies allow correct read/write | INFRA-03 | Requires live DB query | Run SQL: `SELECT * FROM pg_policies WHERE schemaname='public'` in Supabase SQL editor |
| Nav renders identically across all pages | STRC-02 | Requires browser visual check | Open each page in browser, verify nav looks identical |
| Vercel preview URLs respond 200 | INFRA-05 | Requires live deployment | Push to preview branch, run curl checks from Task 1-01-3 |
| Vercel env vars set (7 vars) | INFRA-04 | Requires Vercel dashboard | Check Settings → Environment Variables in Vercel project |

---

## Sampling Continuity

Wave 1 (Plans 01, 04): Tasks 1-01-1, 1-01-2, 1-04-1 — all have automated bash checks. ✅
Wave 2 (Plan 02): Tasks 1-02-1, 1-02-2, 1-02-3 — all have automated bash checks. ✅
Wave 3 (Plans 03, 06): Tasks 1-03-1 through 1-03-4, 1-06-1 — all have automated bash checks. ✅
Wave 4 (Plan 05): Tasks 1-05-1, 1-05-2 — manual (Supabase + Vercel dashboards required). ✅

No 3+ consecutive tasks without automated verification. Nyquist sampling satisfied.

---

## Validation Sign-Off

- [x] All tasks have `automated` verify commands or are explicitly marked manual with justification
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 — no pre-execution setup required (artifacts created within plans)
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
