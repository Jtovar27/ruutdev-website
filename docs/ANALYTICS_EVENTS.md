# Analytics Events

The provider-neutral adapter pushes allowlisted, non-sensitive event names to `dataLayer`. Provider configuration is disabled by default in central config.

Implemented: `primary_cta_click`, `secondary_cta_click`, `contact_form_start`, `contact_form_submit`, `contact_form_success`, `contact_form_error`, `whatsapp_click`, `email_click`, `language_switch`.

Planned: `project_view`, `case_study_view`, `solution_view`, `pricing_view`, `phone_click`. Never attach free-text form values, email, phone, or business name.
