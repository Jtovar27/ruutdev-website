# Google Ads Landing Page — Custom AI Business Systems

Operational reference for the dedicated paid-search landing page at
`/google-ads/ai-business-os`. This page is intentionally separated from the
main RuutDev marketing site so ad creatives, headlines, and offers can change
without affecting organic SEO.

**Positioning:** RuutDev sells **services** today (custom websites, software,
AI integrations, and automations). The landing page leads with that offer
and uses the upcoming **AI Business OS SaaS** as a secondary "coming soon"
funnel via a waitlist option in the project-call form. This keeps the LP
fully aligned with what `ruutdev.com` actually delivers, which is what
Google Ads requires.

---

## 1. Route

| Item             | Value |
| ---------------- | ----- |
| Public URL       | `https://ruutdev.com/google-ads/ai-business-os` |
| Source file      | `pages/google-ads/ai-business-os.html` |
| Vercel rewrite   | `/google-ads/ai-business-os` → `/pages/google-ads/ai-business-os` (in `vercel.json`) |
| Body id          | `page-google-ads-lp` (CSS + JS scope) |
| Indexable        | Yes — `<meta name="robots" content="index, follow, max-image-preview:large">` |
| Listed in sitemap | No (intentional — keep paid LP separate from organic surface) |

---

## 2. Campaign purpose

Drive **project call requests** from small and medium business owners searching
for an AI-powered way to manage marketing, CRM, leads, scheduling, content,
and operations. The page funnels them into RuutDev's existing services
(monthly plans / buyout builds / custom AI systems) and offers an **AI Business
OS SaaS waitlist** as a secondary path for users who'd prefer the future
self-serve product.

Single primary conversion goal: **Project call request submitted via the form
on this page**. The form select includes a `saas_waitlist` option for the
upcoming AI Business OS — those leads are queued for early-access notification.

---

## 3. Target keyword themes

The copy is structured to be relevant to these search intents:

- AI CRM for small business
- AI business software
- marketing automation for small business
- CRM and scheduling software
- AI marketing assistant for business
- business management software with AI
- content and CRM software for small business
- AI operating system for business
- small business marketing platform

Headline, subheadline, FAQ, and feature blocks intentionally repeat these
intent phrases (CRM, scheduling, content, campaigns, AI agents) without
keyword-stuffing.

---

## 4. Conversion goal

| Goal | Where it lives | Backend |
| --- | --- | --- |
| Project call request submitted | Form section `#contact` | Posts to `/api/contact` (existing endpoint) which forwards to Web3Forms. The `type` field is the user-selected project type (`monthly_plan`, `buyout_project`, `software_ai`, `saas_waitlist`, …). |
| Primary CTA click | Hero, nav, sticky mobile, final CTA | Anchor links to `#contact`. Tracked via `data-gad-cta="primary"`. |
| Pricing click | Pricing cards (monthly + buyout tiers) | Tracked via `data-gad-cta="pricing-{tier}"`. |
| Secondary CTA — See pricing | Hero | Tracked via `data-gad-cta="how"`. |

---

## 5. Page sections (in order)

1. Minimal nav (logo + EN/ES toggle + primary CTA)
2. Hero (headline, sub, two CTAs, dashboard mockup, trust line)
3. Trust strip (5 short value statements)
4. Problem section (6 pain-point cards)
5. Solution overview (9 module pills)
6. Features grid (9 detailed feature cards, each with use case)
7. Industry fit (12 industry chips)
8. How it works (5 numbered steps)
9. Pricing preview (4 plans with beta disclaimer)
10. Trust / Built-for (4 cards — no fake testimonials)
11. FAQ (10 entries, native `<details>` accordion)
12. Final CTA + demo request form
13. Minimal footer (legal + contact)
14. Sticky mobile CTA (visible on phones)

---

## 6. Compliance notes (Google Ads policy)

| Risk area | Mitigation |
| --- | --- |
| **Misrepresentation** — making a claim the product can't fulfill | "Beta" badge in hero. "Designed for" sections instead of fake testimonials. Pricing labeled as **beta** with a disclaimer that pricing/features may change. |
| **Destination requirements** — page must load, not 404, work on mobile | Static HTML on Vercel. CSP-safe. No popups, no autoplay, no forced downloads. Mobile-first CSS with sticky CTA. |
| **Destination match** — landing page must match ad promise | Ads should reference the exact phrasing used in the headline ("AI Business OS", "manage leads, CRM, scheduling, content"). The CTA on the LP is **Request Demo** — ads must promise a demo, not a free trial. |
| **Privacy** — lead form must link to privacy policy | Required consent checkbox. Inline link to `/privacy`. No unnecessary sensitive data collected (no SSN, no DOB). |
| **No fake reviews / logos / customer counts** | "Built For Real Operators" trust block describes the studio, privacy posture, onboarding, and bilingual support — no testimonials, no logos. |
| **Original content** | All copy is bespoke for this page. |
| **CSP** | Currently allows `cdnjs.cloudflare.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `cdn.jsdelivr.net`, and connections to `self`, `api.web3forms.com`, `api.microlink.io`. **This will block GTM and Google Ads scripts until updated** — see section 9. |

---

## 7. Conversion tracking architecture

The page is wired for tracking but **does not load any external script by default**.
This keeps the page CSP-safe out of the box.

### Tracking events emitted

| Event name             | When it fires                                  |
| ---------------------- | ---------------------------------------------- |
| `landing_page_view`    | On `DOMContentLoaded` for this page only.      |
| `primary_cta_click`    | Any element with `data-gad-cta="primary"` or `"how"` or `"sticky-mobile"`. |
| `pricing_click`        | Any pricing card CTA (`data-gad-cta="pricing-…"`). |
| `project_call_submit`  | After a successful `/api/contact` response. Includes `project_type` (e.g. `monthly_plan`, `saas_waitlist`). |

### How events are dispatched

`gadTrackEvent(name, params)` in `assets/js/main.js`:

1. Pushes to `window.dataLayer` if it exists (GTM-friendly).
2. Calls `gtag('event', name, params)` if `gtag` is loaded.
3. If `window.RUUTDEV_TRACKING.googleAdsId` and a matching label are set,
   also calls `gtag('event', 'conversion', { send_to: '<adsId>/<label>' })`.

All wrapped in try/catch so tracking never breaks the page.

### To activate tracking

Inject a small inline script in `pages/google-ads/ai-business-os.html` **before**
the `<script src="/assets/js/main.js"></script>` tag:

```html
<script>
  window.RUUTDEV_TRACKING = {
    googleAdsId: 'AW-XXXXXXXXXX',
    gtmId:       'GTM-XXXXXXX',
    conversionLabels: {
      project_call_submit: 'AbCdEfGh1234567890',
      primary_cta_click:   'IjKlMnOp1234567890',
      pricing_click:       'QrStUvWx1234567890'
    }
  };
  // Optional: GTM bootstrap
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
    var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
    j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-XXXXXXX');
</script>
<!-- gtag-js loader if not using GTM:
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXXX');
</script>
-->
```

You **must** also widen the CSP in `vercel.json` — see section 9.

### Verification

1. Run the page locally with `vercel dev` (or `npm run dev`).
2. Append UTM params: `?utm_source=google&utm_medium=cpc&utm_campaign=test`.
3. Open DevTools → Console: `dataLayer` should contain `landing_page_view`.
4. Click "Request Demo" → `dataLayer` adds `primary_cta_click`.
5. Submit the form (with a real WEB3FORMS_KEY in env) → `dataLayer` adds
   `demo_request_submit`.
6. Once GTM is wired, verify in **Google Tag Assistant** (Chrome extension):
   the events should appear under the configured tag.
7. After publishing, verify the conversion count in Google Ads under
   **Tools → Conversions** within ~24 hours.

---

## 8. Required environment variables

| Variable | Purpose | Required for |
| --- | --- | --- |
| `WEB3FORMS_KEY` | Server-side key used by `/api/contact` to forward the demo request via Web3Forms. | The form to actually deliver leads. |

Set in Vercel → Project Settings → Environment Variables.

There are no other secrets specific to this landing page.

The Google Ads ID, GTM ID, and conversion labels are NOT secrets and live in
the inline script described in section 7. Do not commit real Google Ads
campaign IDs unless you explicitly intend to share them publicly.

---

## 9. CSP changes needed when enabling tracking

`vercel.json` currently sets:

```
default-src 'self';
script-src  'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://cdn.jsdelivr.net;
connect-src 'self' https://api.web3forms.com https://api.microlink.io;
```

When activating GTM + Google Ads conversion, add:

```
script-src  ... https://www.googletagmanager.com https://www.google-analytics.com;
img-src     ... https://www.google.com https://www.google-analytics.com https://www.googletagmanager.com;
connect-src ... https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;
frame-src   https://td.doubleclick.net;
```

Apply edits in `vercel.json` headers and redeploy.

---

## 10. Manual QA checklist

Before pointing a Google Ads campaign at this page:

**Functional**

- [ ] `/google-ads/ai-business-os` loads with HTTP 200
- [ ] Hero CTA "Request Demo" scrolls to `#demo`
- [ ] Hero CTA "See How It Works" scrolls to `#how-it-works`
- [ ] Pricing CTAs scroll to `#demo`
- [ ] Sticky mobile CTA (≤720px) visible and tappable
- [ ] EN/ES toggle in nav switches all `data-en`/`data-es` content
- [ ] Saved language persists across page reloads
- [ ] FAQ accordion opens/closes
- [ ] Form validates required fields, email, and consent
- [ ] Form submission succeeds with valid `WEB3FORMS_KEY`
- [ ] Form shows success state and clears form body
- [ ] Form failure shows error message in the user's selected language

**Tracking**

- [ ] Visit with UTMs → hidden inputs populate
- [ ] Lead-submit packs UTMs into `message`
- [ ] `landing_page_view` appears in `dataLayer` on load
- [ ] `primary_cta_click`, `pricing_click`, `demo_request_submit` fire correctly
- [ ] No console errors

**Mobile**

- [ ] No horizontal scroll at 375px / 390px / 414px / 768px
- [ ] Hero stacks cleanly, dashboard mockup readable
- [ ] Buttons ≥ 44×44px touch target
- [ ] Form fields fit one-per-row on phones
- [ ] Sticky CTA does not overlap form submit button at bottom

**Compliance**

- [ ] No `href="#"` dead links
- [ ] No fake testimonials / logos / customer counts present
- [ ] Pricing has visible **beta** disclaimer
- [ ] Privacy link works
- [ ] Terms link works
- [ ] Contact email + WhatsApp links work
- [ ] No leaked secrets in HTML/JS source

**Performance**

- [ ] No images >200KB on the page (mockup is pure CSS/SVG)
- [ ] Fonts use `display=swap`
- [ ] No autoplay video, no popups
- [ ] Lighthouse mobile performance ≥ 85 (verify after first deploy)

---

## 11. Google Ads setup recommendations

These steps happen inside the Google Ads UI and are **not** automated by this codebase:

1. **Create a Search campaign** with the keyword themes listed in section 3.
2. **Create ad groups** by primary intent (e.g. "AI CRM", "AI scheduling",
   "AI business software", "agency tooling") so headlines can match.
3. **Use Responsive Search Ads.** Suggested headlines:
   - "AI Business OS for Small Business"
   - "CRM, Scheduling & Marketing — One App"
   - "Run Your Business with AI Agents"
   - "Bilingual Business OS · USA & LATAM"
   - "Request a Free Demo Today"
4. **Final URL:** `https://ruutdev.com/google-ads/ai-business-os`
5. **Tracking template (optional):**
   `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignname}&utm_term={keyword}&utm_content={creative}`
6. **Ad extensions:**
   - Sitelink: `/pricing`, `/contact`
   - Callout: "Mobile + Desktop", "Bilingual", "No CC required for demo"
   - Structured snippet (Service): "CRM, Scheduling, Content, Campaigns, AI Agents"
   - Lead form extension (optional, redundant with form on page)
7. **Conversion setup:** create a primary conversion in Google Ads called
   "AI Business OS — Demo Request" tied to the conversion label used in
   `RUUTDEV_TRACKING.conversionLabels.demo_request_submit`.
8. **Budget pacing:** start small ($10–$25/day) and let landing page CTR /
   conversion data accumulate for at least 7 days before optimizing.
9. **Negative keywords:** add early — `free`, `download`, `crack`, `pirate`,
   `tutorial`, `course`, `youtube`, plus competitor names if you don't want
   competitor-comparison traffic.
10. **Quality Score levers in this page:** clear headline match, mobile speed,
    one focused CTA, original content, expected CTR via tight ad-group → keyword
    → headline alignment.

---

## 12. What still needs to be configured manually

This codebase does NOT automatically:

- Provision a Google Ads account or campaign.
- Create the GTM container or Google Ads conversion actions.
- Write the inline `RUUTDEV_TRACKING` config block (intentional — IDs are
  campaign-specific and should be added when the user is ready).
- Update CSP for GTM/Google Analytics (intentional — page works without it).
- Add the page to `sitemap.xml` (intentional — paid LP isolated from organic).

When you are ready to launch:

1. Create the Google Ads conversion actions and capture the conversion labels.
2. Create the GTM container if you want a wrapper layer.
3. Inject the `RUUTDEV_TRACKING` script block per section 7.
4. Update CSP per section 9.
5. Deploy to production via `vercel --prod`.
6. Smoke-test the full flow with Google Tag Assistant before pointing budget
   at the page.

---

## 13. Files touched by this feature

| File | Change |
| --- | --- |
| `pages/google-ads/ai-business-os.html` | New. The landing page itself. |
| `vercel.json` | New rewrite for `/google-ads/ai-business-os`. |
| `assets/css/styles.css` | Appended scoped section under `body#page-google-ads-lp`. Does not affect other pages. |
| `assets/js/main.js` | Appended LP-specific init: UTM capture, demo form submit, CTA tracking. Gated to `body#page-google-ads-lp`. |
| `docs/GOOGLE_ADS_LANDING_PAGE.md` | New (this file). |

The existing `/api/contact` endpoint is reused unchanged. The form packs
landing-page-specific fields (industry, phone, contact preference, challenge,
UTMs, page URL, referrer) into the existing `message` field so the API contract
stays the same.
