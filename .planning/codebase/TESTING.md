# Testing Patterns

**Analysis Date:** 2026-04-07

## Test Framework

**Runner:** None — no test framework is installed or configured.

**Assertion Library:** None.

**Config Files:** None found. No `jest.config.*`, `vitest.config.*`, `playwright.config.*`, `.mocharc.*`, or equivalent.

**Run Commands:** No test scripts exist. No `package.json` is present in the project root.

## Test File Organization

**Test Files:** None. No `*.test.*`, `*.spec.*`, or `__tests__/` directories exist anywhere in the project.

## Current State of Testing

This codebase has **zero automated tests** of any kind:

- No unit tests
- No integration tests
- No end-to-end (E2E) tests
- No snapshot tests
- No accessibility tests
- No visual regression tests

The project is a static HTML/CSS/JS website served without a build step or server runtime, developed
without a package manager (`package.json` is absent). All JavaScript logic lives in two files:
- `js/main.js` — shared UI behaviors (252 lines)
- Inline `<script>` block in `qualifier.html` — sales qualifier app logic (~700+ lines)

## Testable Logic That Currently Has No Coverage

The following functional units exist but are untested:

**`js/main.js`:**
- `getLeadType(intent, plan)` — pure function mapping URL params to lead type strings
- `getPlanLabel(plan, lang)` — pure function looking up bilingual plan label from `LEAD_PLAN_LABELS`
- `applyLang(lang)` — DOM mutation function; applies language to all `[data-en]` elements
- `initStripeReadyCtas()` — rewrites `href` on `[data-checkout-id]` elements based on `RUUTDEV_CHECKOUT_LINKS`
- `initContactPrefill()` — reads URL query params and prefills form fields
- `submitContactForm()` — async form submission to web3forms.com API with validation and error handling
- `toggleMenu()` — toggles `.open` class on `#nav-mobile`
- Email regex validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**`qualifier.html` inline script:**
- `computeResult()` — decision-tree function mapping user answers to a recommended product (`landing`, `ecommerce`, `ai_tool`) with complexity scoring
- `canProceed(q)` — validates whether the current question can advance
- `toggleMulti(id, val)` — multi-select toggle logic with `none` mutual exclusion
- `renderQuestion()` / `renderResult()` — HTML string generation functions

**Highest-value test targets (by risk):**
1. `computeResult()` — complex branching logic with budget overrides and v2 override rules; incorrect output directly affects sales recommendations
2. `submitContactForm()` — async fetch with timeout, error handling, and UI state changes
3. `initContactPrefill()` — URL param parsing and conditional DOM writes
4. `getLeadType()` / `getPlanLabel()` — small pure functions, easy to unit test, used in the contact flow

## If Tests Were Added: Recommended Approach

Given the vanilla JS/HTML nature of the codebase, the lowest-friction path to adding tests:

**Unit tests (pure functions):** Use `vitest` or `jest` with jsdom.
```bash
npm install --save-dev vitest jsdom
```

Extract pure functions from `js/main.js` into an ES module:
```js
// js/utils.js (new file)
export function getLeadType(intent, plan) { ... }
export function getPlanLabel(plan, lang) { ... }
```

Test file location pattern (co-locate with source):
```
js/
  main.js
  utils.js
  utils.test.js
```

**E2E tests (form flows, language toggle):** Use Playwright against a local static server.
```bash
npm install --save-dev playwright @playwright/test
npx playwright install
```

Cover:
- Language toggle persists on reload
- Contact form validation shows alert on missing fields
- Contact form success state displays after mock fetch resolves
- Qualifier app advances through questions and renders a result
- Stripe CTA falls back to `data-fallback-href` when `RUUTDEV_CHECKOUT_LINKS` is empty

## Coverage

**Requirements:** None enforced (no tooling).

**Current coverage:** 0% — no tests exist.

---

*Testing analysis: 2026-04-07*
