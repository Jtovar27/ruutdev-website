---
phase: quick
plan: "260409-fch"
subsystem: css-design
tags: [css, transitions, nav, fonts, performance]
dependency_graph:
  requires: []
  provides: [specific-property-transitions, floating-pill-nav, aligned-qualifier-fonts]
  affects: [assets/css/styles.css, assets/js/effects.js, qualifier.html]
tech_stack:
  added: []
  patterns: [specific-property-transitions, floating-pill-nav, backdrop-filter]
key_files:
  modified:
    - assets/css/styles.css
    - assets/js/effects.js
    - qualifier.html
decisions:
  - "Used rgba(0,0,0,0.06) neutral shadow on review-card:hover instead of blue-glow for subtlety"
  - "Nav pill uses width:calc(100%-48px) max-width:1120px to stay inset from viewport edges on all screen sizes"
  - "Retained JetBrains Mono in qualifier.html Google Fonts URL since header badge uses font-mono"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-09"
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 260409-fch: Fix 5 Pending CSS Design Issues Summary

**One-liner:** Replaced all `transition: all` with specific property lists, removed cursor glow rAF loop, converted nav to floating pill, fixed review-card blue-glow hover, and aligned qualifier.html to Bricolage Grotesque/Figtree font stack.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | transition:all sweep + review card hover + cursor glow removal | 1d646a1 | assets/css/styles.css, assets/js/effects.js |
| 2 | Nav floating pill + qualifier.html font alignment | 24e88ba | assets/css/styles.css, qualifier.html |

## Changes Made

### Task 1 — Transition sweep + review card + cursor glow

**transition:all replacements (assets/css/styles.css):**
- `.hamburger span` → `transform, opacity`
- `.footer-wa` → `background-color, color`
- `.btn-primary` → `background-color, color, transform, box-shadow`
- `.btn-secondary` → `background-color, color, border-color, transform, box-shadow`
- `.btn-outline` → `background-color, border-color, color`
- `.whatsapp-btn` → `background-color, transform, box-shadow`
- `.service-card` → `transform, box-shadow, border-color`
- `.testimonial-card` → `transform, box-shadow, border-color`
- `.faq-item` → `border-color, box-shadow`
- `.faq-icon` → `background-color, color, transform`
- `.lang-btn` → `background-color, color`
- `.why-card` → `transform, box-shadow`
- `.plan-card` → `transform, box-shadow, border-color`
- `.value-card` → `transform, box-shadow, border-color`
- `.contact-method` → `transform, box-shadow, border-color`
- `.payment-type-option` → `border-color, background-color`
- `.payment-type-option .pt-icon` → `background-color, color, border-color`
- `.tier-option` → `border-color, background-color`
- `.pricing-card` → `transform, box-shadow, border-color`
- `.maintenance-card` → `transform, box-shadow, border-color`
- `.toc-list a` → `color, background-color, border-color`
- `.portfolio-card` (was bare `var(--transition)`) → `transform, box-shadow`
- `.portfolio-overlay` (was bare `var(--transition)`) → `opacity`
- `.filter-btn` (was bare `var(--transition)`) → `background-color, color, border-color`
- `.review-card` (was bare `var(--transition)`) → `transform, box-shadow, border-color`
- `.swiper-button-next/prev` → `background-color, border-color, box-shadow`
- `.mobile-nav-footer .nav-cta` → `background-color, box-shadow`

**review-card:hover fix:** Removed `box-shadow: 0 8px 32px var(--blue-glow)` — replaced with `transform: translateY(-2px)` + `box-shadow: 0 8px 24px rgba(0,0,0,0.06)`.

**Cursor glow removal:** Deleted entire `2E — CURSOR GLOW` section from `effects.js` (42 lines): `initCursorGlow` IIFE, `#cursor-glow` div creation, mousemove listener, `animateGlow` rAF loop, visibilitychange listener.

### Task 2 — Nav pill + qualifier fonts

**Nav floating pill (assets/css/styles.css):**
- `top: 16px` (was `top: 0`)
- `left: 50%; transform: translateX(-50%)` (was `left: 0; right: 0`)
- `width: calc(100% - 48px); max-width: 1120px`
- `padding: 12px 24px` (was `18px 6%`)
- `border: 1px solid var(--border)` (was `border-bottom` only)
- `border-radius: 100px`
- `box-shadow: 0 4px 24px rgba(0,0,0,0.06)`
- Added `-webkit-backdrop-filter: blur(20px)` for Safari
- Mobile: `top: 8px; width: calc(100% - 24px); padding: 10px 16px`

**qualifier.html font alignment:**
- Replaced `Syne:wght@700;800 + DM+Sans + JetBrains+Mono` Google Fonts URL
- New URL loads: `Bricolage+Grotesque + Figtree + JetBrains+Mono`
- Added `<link rel="preconnect">` tags for fonts.googleapis.com and fonts.gstatic.com
- CSS vars updated: `--font-display: 'Bricolage Grotesque'`, `--font-body: 'Figtree'`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — changes are CSS/visual and client-side JS cleanup only. No new trust boundaries introduced.

## Self-Check: PASSED

- [x] `transition: all` count in styles.css = 0
- [x] `cursor-glow` count in effects.js = 0
- [x] `border-radius: 100px` present on nav rule (line 71)
- [x] `review-card:hover` uses `translateY(-2px)` + neutral shadow, no `blue-glow`
- [x] `Bricolage` found in qualifier.html (Google Fonts link + CSS var)
- [x] Commits 1d646a1 and 24e88ba exist in git log
