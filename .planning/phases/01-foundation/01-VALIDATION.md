---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification + curl/browser checks (no test framework — static site) |
| **Config file** | none |
| **Quick run command** | `curl -I http://localhost:3000/api/contact` |
| **Full suite command** | Manual checklist (see Per-Task Verification Map) |
| **Estimated runtime** | ~120 seconds manual |

---

## Sampling Rate

- **After every task commit:** Verify file structure with `ls pages/ assets/ api/`
- **After every plan wave:** Run full manual checklist
- **Before `/gsd-verify-work`:** All success criteria verified via curl/browser
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | STRC-01 | — | Files in pages/ not at root | manual | `ls pages/*.html` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | STRC-02 | — | Nav renders from shared partial | manual | `grep -r "nav-include" pages/` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 2 | STRC-03 | T-1-01 | API key not in client JS | automated | `grep -r "web3forms" js/main.js` returns empty | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 2 | STRC-04 | — | vercel.json rewrites work | manual | `curl -I https://<preview>.vercel.app/about` 200 | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | INFRA-01 | — | Supabase project created | manual | Supabase dashboard check | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | INFRA-02 | T-1-02 | RLS enabled on all tables | automated | `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 2 | INFRA-03 | T-1-03 | Env vars not in client code | automated | `grep -r "SUPABASE_SERVICE_ROLE_KEY" js/` returns empty | ❌ W0 | ⬜ pending |
| 1-02-04 | 02 | 3 | INFRA-04 | — | CORS headers present | automated | `curl -I https://<preview>.vercel.app/api/contact` has Access-Control-Allow-Origin | ❌ W0 | ⬜ pending |
| 1-02-05 | 02 | 3 | INFRA-05 | — | CSP headers present | automated | `curl -I https://<preview>.vercel.app/api/contact` has Content-Security-Policy | ❌ W0 | ⬜ pending |
| 1-02-06 | 02 | 3 | INFRA-06 | — | .env.local not committed | automated | `git ls-files .env*` returns empty | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vercel.json` — rewrites config for pages/ directory
- [ ] `.env.local` — local secrets file (gitignored)
- [ ] `.gitignore` — ensures .env* is excluded

*Existing static site infrastructure covers most requirements. Wave 0 creates Vercel config.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase tables created with correct schema | INFRA-01 | Requires Supabase dashboard access | Log in to Supabase, check Table Editor for reviews, portfolio, prices, content tables |
| RLS policies allow correct read/write | INFRA-02 | Requires live DB query | Run SQL: `SELECT * FROM pg_policies WHERE schemaname='public'` in Supabase SQL editor |
| Nav renders identically across all pages | STRC-02 | Requires browser visual check | Open each page in browser, verify nav looks identical |
| Vercel preview deploy works | INFRA-04/05 | Requires live deployment | Push to preview branch, check Vercel dashboard for successful deploy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
