# Owner Action Items

| Priority | Page/system | Risk | Required action | Blocks production? |
|---|---|---|---|---|
| P0 | Privacy / Terms | Legal text, address, actual collected fields, subprocessors, and Spanish legal parity require review. | Have qualified counsel review both documents, the current mailing address, and an approved Spanish translation. | Blocks legal sign-off. |
| P0 | Project intake / Supabase Storage | Uploaded client files currently depend on production policies that are not versioned in this repository. | Approve a migration to private storage, signed URLs, cleanup for failed submissions, and reviewed RLS policies. | Blocks treating uploads as fully hardened. |
| P1 | Work | Project type and publication permission are not confirmed. | Classify each repository project as client, demo, or concept and approve screenshots/links. | No; Work remains safely empty. |
| P1 | Testimonials / metrics | No source evidence is available. | Provide quote sources and metric evidence before enabling public rendering or schema. | No. |
| P1 | Pricing / Terms / Pay | Support-plan values in Terms and commercial plan values need owner confirmation. | Confirm prices, cancellation, ownership, revisions, hosting, maintenance, third-party fees, and all five unchanged Payment Links. | No change was made to current amounts. |
| P1 | Business email | The current Hotmail address remains functional but is not domain-branded. | Configure and verify `hello@ruutdev.com` before changing the centralized public email. | No. |
| P1 | Domain / Vercel | The apex domain previously used a temporary redirect to `www`. | Configure an approved permanent apex-to-`www` redirect and verify the Preview route matrix. | SEO follow-up. |
| P1 | Analytics / consent | No approved IDs or consent requirements were provided. | Confirm provider, real IDs, jurisdictional consent behavior, and updated privacy language before enabling analytics. | No; analytics remains disabled. |
| P2 | Social links | No handles were verified. | Confirm approved social URLs before adding them to configuration or footer. | No. |
| P2 | Founder/project photography | Only the existing founder asset is approved. | Provide optimized approved imagery if broader editorial visuals are desired. | No. |
