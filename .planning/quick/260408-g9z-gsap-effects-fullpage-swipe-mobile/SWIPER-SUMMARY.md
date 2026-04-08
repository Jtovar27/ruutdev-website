---
plan: swiper-carousels
subsystem: frontend-ui
tags: [swiper, carousel, mobile-ux, scrolling]
key-files:
  modified:
    - index.html
    - pages/services.html
    - pages/pricing.html
    - pages/about.html
    - pages/contact.html
    - pages/pay.html
    - assets/js/main.js
    - assets/css/styles.css
decisions:
  - Used Swiper 11.0.5 from cdnjs (already allowed in CSP)
  - services-swiper used for both maintenance and support card grids on services.html
  - about-swiper used for values grid; process-swiper used for process steps
  - buyout-swiper used for buyout pricing grid on pricing.html
  - initSwipers() called on window load to handle deferred script loading
---

# Swiper Carousels Summary

**One-liner:** Swiper.js 11 carousels added to all public pages wrapping service, pricing, process, and values card groups to reduce scrolling.

## What Was Done

Swiper.js 11.0.5 CDN added to all 6 public pages (index.html, services.html, pricing.html, about.html, contact.html, pay.html). Existing card groups were wrapped in Swiper containers without removing or modifying any card content, links, data-en/data-es attributes, or Stripe checkout attributes.

### Carousels added per page

| Page | Swiper class | Cards wrapped |
|------|-------------|---------------|
| index.html | .services-swiper | 6 service cards |
| index.html | .process-swiper | 4 process steps |
| services.html | .services-swiper | 3 maintenance/support option cards |
| services.html | .about-swiper | 3 technical support service cards |
| pricing.html | .pricing-swiper | 3 monthly plan pricing cards |
| pricing.html | .buyout-swiper | 4 buyout pricing cards |
| about.html | .about-swiper | 6 values cards |
| about.html | .process-swiper | 6 process steps |

### JS (assets/js/main.js)

`initSwipers()` function added with per-swiper breakpoint configs:
- `.services-swiper`: 1 / 2 / 3 slides at 1 / 640 / 1024px
- `.process-swiper`: 1 / 2 / 4 slides at 1 / 640 / 1024px
- `.pricing-swiper`: centeredSlides on mobile, initialSlide:1 (Standard featured), 2/3 slides at 768/1100px
- `.about-swiper`, `.buyout-swiper`: 1 / 2 / 3 slides at 1 / 640 / 1024px

### CSS (assets/css/styles.css)

`/* ── Swiper Overrides ── */` section appended with brand color tokens applied to nav arrows and pagination dots.

## Commits

| Hash | Message |
|------|---------|
| ddda405 | feat: add Swiper.js 11 CDN to all pages |
| d3e0e52 | feat(index): convert cards and process steps to Swiper carousels |
| 8f6eccb | feat(services): convert service cards to Swiper carousel |
| 7d61b4d | feat(pricing): convert pricing plans to Swiper carousel |
| e7c5c90 | feat(about): convert about page cards to Swiper carousel |
| e34cab7 | feat(js): add Swiper initialization for all carousels |
| e2b4b2a | feat(css): add Swiper brand overrides |

## Deviations from Plan

**1. [Rule 2 - Missing] Maintenance + support grids both wrapped on services.html**
- Plan specified wrapping "service cards or sections" on services.html
- Both `.maintenance-grid` (3 cards) and `.services-grid` (3 cards) were wrapped since both are scrollable card groups
- Used `services-swiper` for maintenance cards and `about-swiper` for support cards to avoid duplicate selector conflicts

**2. [Rule 2 - Missing] value-card added to CSS selector list**
- Plan CSS snippet did not include `.value-card` in the slide fill rule
- Added to ensure about.html values cards fill their slides correctly

## Known Stubs

None — all cards display real existing content.

## Self-Check: PASSED

- index.html: FOUND
- pages/services.html: FOUND
- pages/pricing.html: FOUND
- pages/about.html: FOUND
- assets/js/main.js: FOUND
- assets/css/styles.css: FOUND
- All 7 task commits present in git log
