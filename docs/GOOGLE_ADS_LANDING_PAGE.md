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

**GTM is now active site-wide.** Container ID `GTM-MGKZGHK7` is embedded in the
`<head>` of every public HTML page (homepage, pricing, contact, services, portfolio,
case studies, the Google Ads LP, and legal pages). Admin and qualifier pages are
intentionally excluded so internal traffic does not skew conversion data.

The container ID is hardcoded in HTML by design. GTM IDs are public (the script
URL exposes them anyway) and there is no build step to inject env vars. To rotate
the container, replace `GTM-MGKZGHK7` site-wide with the new ID.

### Tracking events emitted

| Event name             | When it fires                                  |
| ---------------------- | ---------------------------------------------- |
| `landing_page_view`    | On `DOMContentLoaded` for this page only.      |
| `primary_cta_click`    | Any element with `data-gad-cta="primary"` or `"how"` or `"sticky-mobile"`. |
| `pricing_click`        | Any pricing card CTA (`data-gad-cta="pricing-…"`). |
| `project_call_submit`  | After a successful `/api/contact` response. Includes `project_type` (e.g. `monthly_plan`, `saas_waitlist`). |
| `mockup_form_submit`   | After a successful `/api/contact` response on the LP form. Carries `conversionValue: 75` and `currency: 'USD'` — wire this to a Google Ads conversion in the GTM UI. |

### How events are dispatched

`gadTrackEvent(name, params)` in `assets/js/main.js`:

1. Pushes to `window.dataLayer` if it exists (GTM-friendly).
2. Calls `gtag('event', name, params)` if `gtag` is loaded.
3. If `window.RUUTDEV_TRACKING.googleAdsId` and a matching label are set,
   also calls `gtag('event', 'conversion', { send_to: '<adsId>/<label>' })`.

All wrapped in try/catch so tracking never breaks the page.

### Wiring conversions in the GTM UI

The dataLayer events above are pushed by the site code; the actual Google Ads
conversion firing happens in the GTM container UI:

1. In GTM (container `GTM-MGKZGHK7`), create a Google Ads Conversion Tracking tag.
2. Trigger: **Custom Event** equal to `mockup_form_submit`.
3. Conversion Value: `{{DLV - conversionValue}}` (Data Layer Variable on `conversionValue`).
4. Conversion Currency: `{{DLV - currency}}`.
5. Publish the container.

Optionally also tag `project_call_submit`, `primary_cta_click`, and `pricing_click`
as additional Google Ads conversions or GA4 events. The site does not need any
changes for those — the events already fire.

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

## 9. CSP for tracking

The CSP in `vercel.json` already allows GTM and Google Ads:

```
script-src  ... https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net;
img-src     'self' data: https:;
connect-src ... https://www.googletagmanager.com https://www.google-analytics.com https://*.analytics.google.com https://*.g.doubleclick.net;
frame-src   https://www.googletagmanager.com https://td.doubleclick.net;
```

If GTM later loads a tag that hits a domain not listed above (e.g. a third-party
pixel), widen the corresponding directive and redeploy.

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
- [ ] `gtm.js` request returns 200 in DevTools Network
- [ ] `window.dataLayer` is defined as an array on every public page
- [ ] `landing_page_view` appears in `dataLayer` on load
- [ ] `primary_cta_click`, `pricing_click`, `project_call_submit` fire correctly
- [ ] `mockup_form_submit` fires on successful LP form submit with `conversionValue: 75`, `currency: 'USD'`
- [ ] `mockup_form_submit` does NOT fire on validation errors or non-2xx API responses
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
   - "Bilingual Business OS · Florida"
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
- Create the Google Ads conversion actions inside the Google Ads UI.
- Configure tags/triggers inside the GTM container UI.
- Add the LP to `sitemap.xml` (intentional — paid LP isolated from organic).

What the codebase *does* automatically (already done):

- Loads GTM container `GTM-MGKZGHK7` on every public page.
- Pushes `mockup_form_submit` (with `conversionValue: 75`, `currency: 'USD'`)
  to `window.dataLayer` on a successful LP form submit, *before* UI updates,
  so the tag fires even if the user navigates away during the success transition.
- Pushes `project_call_submit`, `primary_cta_click`, `pricing_click`,
  `landing_page_view` per section 7.
- Allows the required Google domains in CSP.

When you are ready to launch:

1. Create the Google Ads conversion action ("Get Free Mockup — Lead").
2. In GTM (`GTM-MGKZGHK7`), create the Google Ads Conversion Tracking tag
   triggered by Custom Event `mockup_form_submit`. See section 7.
3. Publish the GTM container.
4. Deploy to production via `vercel --prod`.
5. Smoke-test the full flow with Google Tag Assistant + GTM Preview Mode
   before pointing budget at the page.

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
