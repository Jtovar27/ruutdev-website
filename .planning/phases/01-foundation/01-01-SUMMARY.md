---
phase: 1
plan: 1
title: "Codebase Reorganization + Vercel Config"
subsystem: "infrastructure"
tags: ["refactor", "vercel", "file-structure", "security-headers"]
dependency_graph:
  requires: []
  provides:
    - "pages/ directory with all 7 non-root HTML pages"
    - "assets/css/styles.css and assets/js/main.js at canonical paths"
    - "vercel.json with cleanUrls, rewrites, CORS headers, CSP"
    - "admin/ placeholder directory"
  affects:
    - "All subsequent plans that add pages or API routes"
    - "Plan 01-02 (which will reference /assets/ paths)"
tech_stack:
  added: []
  patterns:
    - "Root-relative absolute asset paths (/assets/css/, /assets/js/)"
    - "Vercel cleanUrls + rewrites for clean public URLs"
    - "CSP header with unsafe-inline allowance for existing inline scripts/styles"
    - "CORS scoped to production origin only"
key_files:
  created:
    - pages/about.html
    - pages/contact.html
    - pages/pay.html
    - pages/pricing.html
    - pages/privacy.html
    - pages/services.html
    - pages/terms.html
    - assets/css/styles.css
    - assets/js/main.js
    - vercel.json
    - admin/.gitkeep
  modified:
    - index.html
decisions:
  - "qualifier.html kept at root — standalone internal page, intentionally not in pages/"
  - "Original HTML files at root retained until checkpoint verification confirms preview URLs work"
  - "CSP includes unsafe-inline for script-src and style-src — required for existing onclick attributes and inline <style> blocks"
  - "CORS Access-Control-Allow-Origin scoped to https://ruutdev.com (not wildcard)"
metrics:
  duration: "~4 minutes"
  completed: "2026-04-08T03:13:14Z"
  tasks_completed: 2
  tasks_total: 3
  files_created: 11
  files_modified: 1
---

# Phase 1 Plan 1: Codebase Reorganization + Vercel Config Summary

**One-liner:** Restructured flat project root into pages/assets/admin layout and added vercel.json with cleanUrls rewrites, origin-scoped CORS headers, and CSP with CDN allowances.

## What Was Built

### Task 1: File Migration and Path Updates (commit ac1bb94)

All 7 non-root HTML pages moved from project root to `pages/` directory. Shared CSS and JS assets moved from `css/` and `js/` to `assets/css/` and `assets/js/`. All asset href/src references updated to root-relative absolute paths (`/assets/css/styles.css`, `/assets/js/main.js`). All internal page links updated to clean URL format (`/about`, `/contact`, etc.). Canonical and og:url meta tags updated to remove `.html` extensions. `index.html` updated in place at root (stays at root per Vercel convention). `admin/.gitkeep` created as placeholder.

Path substitutions applied to all 7 pages:

| Old value | New value |
|-----------|-----------|
| `href="css/styles.css"` | `href="/assets/css/styles.css"` |
| `src="js/main.js"` | `src="/assets/js/main.js"` |
| `href="{page}.html"` | `href="/{page}"` |
| `canonical" href="https://ruutdev.com/{page}.html"` | `canonical" href="https://ruutdev.com/{page}"` |
| `og:url" content="https://ruutdev.com/{page}.html"` | `og:url" content="https://ruutdev.com/{page}"` |
| `href="index.html"` | `href="/"` |

### Task 2: vercel.json (commit d702928)

Created `vercel.json` with:
- `cleanUrls: true` — strips `.html` extensions from served URLs
- 7 rewrites mapping `/about`, `/contact`, `/pay`, `/pricing`, `/privacy`, `/services`, `/terms` to their respective `pages/` files
- CORS headers on `/api/(.*)` — `Access-Control-Allow-Origin: https://ruutdev.com` (not wildcard)
- CSP header on `/(.*)`  — covers Google Fonts, Font Awesome CDN, `unsafe-inline` for existing inline scripts/styles, `connect-src` for Web3Forms API, `frame-ancestors 'none'` for clickjacking prevention

### Task 3: Checkpoint (Auto-approved)

Auto-approved per `auto_advance: true` configuration. Live URL and header verification will occur at the next full deploy. Local structural verification passed:
- All 7 pages exist in `pages/`
- No old `css/` or `js/` paths found in `pages/`
- `vercel.json` passes JSON.parse with correct cleanUrls, 7 rewrites, CORS, CSP

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None introduced. The Stripe placeholder URLs in `pages/pay.html` were pre-existing and are intentional pending Plan 02-x Stripe integration work.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundary changes introduced. The `vercel.json` CORS header restricts API origins to `https://ruutdev.com` (not wildcard). CSP blocks framing via `frame-ancestors 'none'`.

## Self-Check: PASSED

- pages/about.html: FOUND
- pages/contact.html: FOUND
- pages/pay.html: FOUND
- pages/pricing.html: FOUND
- pages/privacy.html: FOUND
- pages/services.html: FOUND
- pages/terms.html: FOUND
- assets/css/styles.css: FOUND
- assets/js/main.js: FOUND
- vercel.json: FOUND
- admin/.gitkeep: FOUND
- Commit ac1bb94: FOUND
- Commit d702928: FOUND
