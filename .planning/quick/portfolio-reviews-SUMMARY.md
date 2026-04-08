---
plan: portfolio-reviews
subsystem: frontend
tags: [portfolio, reviews, swiper, bilingual, css, nav]
key-files:
  created:
    - pages/portfolio.html
    - .planning/quick/portfolio-reviews-SUMMARY.md
  modified:
    - index.html
    - assets/css/styles.css
    - assets/js/main.js
    - components/nav.html
    - vercel.json
    - sitemap.xml
decisions:
  - Used Swiper 11 CDN (cdn.jsdelivr.net) — no build step, consistent with project's CDN-only dependency pattern
  - Portfolio page uses grid layout (not Swiper) for full page — Swiper only on index.html preview
  - Demo project placeholders use .portfolio-placeholder div with gradient instead of broken img tags
  - CSP in vercel.json extended to allow cdn.jsdelivr.net and api.microlink.io
  - initSwipers() added as named function in main.js and called from DOMContentLoaded
metrics:
  completed: "2026-04-07"
---

# Portfolio & Reviews — Summary

**One-liner:** Portfolio page with 6 real/demo project cards + reviews carousel with 5 glassmorphism testimonial cards using Swiper 11 autoplay, all bilingual EN/ES.

## What Was Built

### pages/portfolio.html
Full portfolio page mirroring `pages/about.html` structure with:
- Page hero with EN/ES bilingual badge, h1, and subtitle
- Filter buttons (All / Websites / E-Commerce / Landing Pages) with inline JS
- 6-card grid: 3 real clients (acaballousa, lacafebreria, taxesigroup) with microlink.io screenshots; 3 demos (Nomad Kitchen, Luma Fashion, Nexus Real Estate) with gradient placeholders
- CTA section linking to /contact
- Swiper CDN included, full footer, effects.js

### index.html — Reviews Section
- `#reviews` section inserted before portfolio section
- 5 review cards in `.reviews-swiper` Swiper carousel
- Autoplay 4s, loop, pauseOnMouseEnter, 1/2/3 column breakpoints
- Avatar initials with blue gradient background
- All review text uses data-en/data-es attributes

### index.html — Portfolio Preview Section
- `#portfolio` section with 3 real project cards in `.portfolio-swiper`
- Navigation arrows and pagination dots
- "View All Projects" CTA linking to /portfolio
- Swiper 11 CDN added to head (CSS) and before effects.js (JS)

### assets/css/styles.css
Appended at end of file:
- `.portfolio-card` — hover lift, blue glow shadow
- `.portfolio-img` / `.portfolio-overlay` — 16/9 aspect, zoom on hover, dark overlay
- `.portfolio-tags`, `.portfolio-info` — tag pills, card body
- `.portfolio-filters` / `.filter-btn` — filter bar with active state
- `.portfolio-placeholder` — gradient div for demo projects
- `.review-card` — glassmorphism surface, blur, border glow
- `.review-stars`, `.review-text`, `.review-author`, `.review-avatar` — card internals
- `.section-sub`, `.section-cta` — utility classes
- Swiper pagination/navigation color tokens

### assets/js/main.js
- `initSwipers()` function added with portfolio and reviews Swiper configs
- Called from `DOMContentLoaded` listener

### components/nav.html
- Portfolio link added after Services in both desktop `.nav-links` and mobile `#nav-mobile`

### vercel.json
- `/portfolio` → `/pages/portfolio` rewrite added
- CSP extended: `cdn.jsdelivr.net` for Swiper, `api.microlink.io` for screenshots

### sitemap.xml
- `/portfolio` added with `weekly` changefreq and `0.9` priority

## Commits

| Hash | Message |
|------|---------|
| 8a6432b | feat: create pages/portfolio.html with 6 project cards, filters, and Swiper |
| 6895569 | feat(index): add reviews and portfolio preview sections with Swiper CDN |
| 6f7fe97 | feat(css): add portfolio cards and review cards styles |
| 3b828bb | feat(js): add portfolio and reviews Swiper instances to initSwipers |
| fcc2c22 | feat: add /portfolio route to vercel.json, sitemap, and nav |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Extended CSP for new external origins**
- **Found during:** Task 6
- **Issue:** vercel.json CSP did not include `cdn.jsdelivr.net` (Swiper) or `api.microlink.io` (microlink screenshots) — both would be blocked in production
- **Fix:** Added both origins to `script-src`, `style-src`, and `font-src` (jsdelivr) and `connect-src` (microlink)
- **Files modified:** vercel.json

**2. [Rule 3 - Blocking] No initSwipers() existed in main.js**
- **Found during:** Task 5
- **Issue:** The plan referenced adding Swiper instances "inside initSwipers()" but no such function existed
- **Fix:** Created `initSwipers()` as a new named function and called it from DOMContentLoaded
- **Files modified:** assets/js/main.js

**3. [Rule 2 - Missing Critical] Mobile nav missing Portfolio link**
- **Found during:** Task 6
- **Issue:** Plan spec only mentioned desktop nav — mobile `#nav-mobile` would be inconsistent
- **Fix:** Added Portfolio link to mobile nav as well
- **Files modified:** components/nav.html

## Known Stubs

None — all 3 real client projects use live microlink.io screenshot URLs. Demo projects intentionally use gradient placeholders as documented in the spec.

## Self-Check: PASSED

- [x] pages/portfolio.html exists
- [x] index.html contains #reviews and #portfolio sections
- [x] assets/css/styles.css contains .portfolio-card and .review-card rules
- [x] assets/js/main.js contains initSwipers() with both Swiper instances
- [x] components/nav.html has Portfolio link in desktop and mobile nav
- [x] vercel.json has /portfolio rewrite and updated CSP
- [x] sitemap.xml has /portfolio entry
- [x] All 5 commits exist in git log
