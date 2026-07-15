# Analytics Events

The provider-neutral adapter writes allowlisted, non-sensitive events to `dataLayer`. Provider loading remains disabled in central configuration; the previous hardcoded GTM container was removed because it conflicted with the published privacy policy.

Implemented events:

- `primary_cta_click`
- `secondary_cta_click`
- `solution_view` with a non-sensitive route identifier
- `pricing_view`
- `contact_form_start`
- `contact_form_submit`
- `contact_form_success`
- `contact_form_error` with a generic reason
- `language_switch`
- `email_click`
- `phone_click`
- `whatsapp_click`
- `payment_page_view`
- `pricing_checkout_click` with a plan identifier
- `payment_checkout_click` with a deposit type

Deferred because there is no verified public content or configured destination: `project_view`, `case_study_view`, and `social_click`.

Never attach names, email addresses, phone numbers, business names, form messages, URLs entered by a prospect, payment details, or other personal data to analytics events.
