# Spec: Blog Comments System

**Author:** product-manager
**Date:** 2026-04-26
**Status:** Draft

## TL;DR
Add an anonymous, moderated comment system with threaded replies (max 3 levels), basic Markdown, and three emoji reactions to RuutDev blog posts, so readers can engage with content and signal value to the author and other readers.

## Upstream assumptions (flagged, not blockers)
This spec depends on two pieces of work that are not yet shipped:
1. **Blog entity exists with a stable identifier.** A blog post must be addressable by a stable `slug` (or `id`) before this feature can ship. This spec assumes `post_slug: string` as the join key.
2. **Admin surface (REV-03/04) exists before moderation has a UI.** Until the admin panel is live, moderation can be performed via direct SQL on Supabase or via a temporary `?adminSecret=<ADMIN_SECRET>` query-protected endpoint. The admin UI itself is out of scope here.

If either upstream slips, the comment system can still ship behind a feature flag and accumulate moderated content, but it will not be user-visible until a blog post route exists to host it.

## Problem

- **Who has it:** Engaged blog reader — typically a developer or founder arriving from search or social. They finish a post, want to ask a follow-up, share an experience, or signal "this was useful" to the author and to other readers.
- **Evidence:**
  - The blog (planned per `.planning/REQUIREMENTS.md`) has no engagement surface today. Readers who want to respond have to leave the site (Twitter/LinkedIn DMs, email).
  - The existing `api/reviews.js` flow proves anonymous + moderated submission is the right pattern for this audience and this stack.
  - Comments compound SEO value over time (long-tail terms, freshness signal, dwell time).
- **Today's pain:** Readers either bounce silently or move the conversation off-site, where it doesn't benefit other readers, doesn't surface back to the author at the post level, and doesn't accrue to the post's perceived authority.

## Goals

- **Business:** Increase blog dwell time and return visits; create social proof on posts; capture qualified leads (commenter emails are stored, hashed for gravatar, never displayed publicly — usable for opt-in follow-ups in a later phase).
- **User:** Let a reader leave a thoughtful, formatted comment in under 60 seconds, without an account, and see it appear once approved. Let them react with one tap.
- **Non-goals (out of scope):** see the **Out of scope** section below — it is the binding list.

## Success metrics

- **Primary:** ≥ 15% of unique blog-post readers scroll to / open the comments section, and ≥ 2% submit a comment or reaction. Measured over a rolling 30-day window starting two weeks after launch (to let blog traffic stabilize).
- **Guardrails:**
  - Spam ratio (comments rejected as spam ÷ total submissions) < 30%. If breached, escalate to Cloudflare Turnstile (see Anti-spam below).
  - Moderation backlog (median time from submission to approve/reject) < 24h.
  - p95 API latency on `GET /api/comments?post=<slug>` < 400ms.
- **How we measure:**
  - Vercel Analytics for the read-side ratio.
  - Supabase counts on `comments` for submission and spam ratios (cron-aggregated daily into a lightweight metrics view).
  - Manual or scripted query on `created_at` vs `moderated_at` for backlog.

## Persona

**Engaged blog reader — dev or founder arriving via search/social.**
- Reads on mobile and desktop, roughly 60/40.
- Skims first, comments only when a post saved them time or said something they want to push back on.
- Will not create an account for a single comment. Will leave a name and email if the form is short.
- Trusts Markdown (especially code blocks) and is annoyed by editors that mangle backticks.

## User stories

### US-1: Read a comment thread
**As** a blog reader
**I want** to read existing approved comments on a post, with replies nested visually up to 3 levels
**So that** I can see what other readers thought before deciding to contribute.

**Acceptance criteria:**
- [ ] Given a published blog post with N approved comments, when I open the comments section, then I see all N comments ordered newest-first at the root level, with replies nested below their parent.
- [ ] Given a comment with replies, when those replies have replies of their own, then nesting stops at depth 3 (root → reply → reply); deeper threads do not exist because submission is blocked server-side.
- [ ] Given a comment is not yet approved, when I view the post, then I do not see it (no placeholder, no count).
- [ ] Each comment displays: author name, gravatar (from hashed email), relative timestamp ("3h ago"), Markdown-rendered body, reaction counts.
- [ ] Email addresses are never rendered to the page or returned by the public `GET` endpoint.

### US-2: Submit a top-level comment
**As** a reader
**I want** to leave a comment with my name, email, and a Markdown body
**So that** I can contribute to the discussion without creating an account.

**Acceptance criteria:**
- [ ] The form requires `name` (1–60 chars), `email` (valid email, stored but never shown), and `body` (1–4000 chars). All are sanitized server-side.
- [ ] On successful submit, I see a confirmation message: "Thanks — your comment is awaiting moderation." The form clears.
- [ ] My comment is stored with `is_approved=false` and does NOT appear in the public thread until an admin approves it.
- [ ] If I submit invalid input, I get a per-field error and the form preserves what I typed.
- [ ] A honeypot field (hidden from real users) silently rejects bots — they get a 200 OK but nothing is stored.
- [ ] Per-IP rate limit: max 5 submissions per 10 minutes. Per-email rate limit: max 3 submissions per hour. Exceeding either returns 429 with a friendly message.

### US-3: Reply to a comment
**As** a reader
**I want** to reply to a specific comment (or a reply)
**So that** I can address a specific point in the thread.

**Acceptance criteria:**
- [ ] Each visible comment at depth < 3 has a "Reply" affordance.
- [ ] Comments at depth 3 do NOT show a Reply affordance, and the API rejects any submission with `parent_id` whose parent is already at depth 3 (returns 400).
- [ ] A reply inherits the same form, validation, moderation, and rate limits as US-2.
- [ ] On successful submit, the parent comment shows "1 reply pending moderation" only to the submitter (via a short-lived client-side flag); other readers see nothing.

### US-4: React to a comment
**As** a reader
**I want** to tap one of three emojis (👍 ❤️ 🎉) on an approved comment
**So that** I can signal agreement / appreciation / celebration without writing.

**Acceptance criteria:**
- [ ] Reactions are only available on `is_approved=true` comments.
- [ ] A given visitor can apply at most one reaction of each type per comment (so up to 3 distinct reactions on the same comment). Tapping the same reaction again removes it (toggle).
- [ ] Visitor identity for reaction-uniqueness is derived from a fingerprint (cookie ID or hashed IP+UA — final mechanism is an open question for tech-lead).
- [ ] Reaction counts update optimistically in the UI and reconcile with the server response.
- [ ] Reactions on non-approved comments return 403.

### US-5: Render Markdown safely
**As** a reader
**I want** comments to render basic Markdown (bold, italic, links, inline code, code blocks)
**So that** code-heavy comments are readable without becoming an XSS vector.

**Acceptance criteria:**
- [ ] Supported syntax: `**bold**`, `*italic*`, `[text](url)`, `` `inline code` ``, fenced code blocks (``` ```lang ... ``` ```).
- [ ] All other Markdown (images, HTML, headings, tables, blockquotes) is stripped or rendered as plain text. No `<img>`, no `<script>`, no inline event handlers ever reach the DOM.
- [ ] Links open in a new tab with `rel="noopener noreferrer nofollow"`.
- [ ] Sanitization runs on render (defense in depth even though body is also validated on submit). Sanitizer choice is an open question for tech-lead.
- [ ] Code blocks preserve whitespace and use a monospace font; syntax highlighting is optional and not required for v1.

### US-6: Admin views the moderation queue
**As** the site admin (Johan)
**I want** to see all pending comments across all posts in one list
**So that** I can clear the queue quickly.

**Acceptance criteria:**
- [ ] The queue lists all comments with `status='pending'`, newest-first, showing post slug, author name, body, submission time, and IP.
- [ ] The queue is reachable only via authenticated admin context (admin panel when it exists, or `ADMIN_SECRET`-gated endpoint until then).
- [ ] The queue exposes per-comment actions: Approve, Reject, Delete forever.
- [ ] The queue is not publicly indexable and never returns email addresses to a non-admin caller.

### US-7: Admin approves, rejects, or deletes
**As** the site admin
**I want** to approve, reject, or hard-delete a comment
**So that** I control what's published and can remove abusive or illegal content permanently.

**Acceptance criteria:**
- [ ] Approve sets `status='approved'`, `is_approved=true`, `moderated_at=now()`. The comment becomes publicly visible immediately on next read.
- [ ] Reject sets `status='rejected'`, `is_approved=false`, `moderated_at=now()`. The row is **soft-deleted** (kept for audit) but never returned by the public API and never counted in reaction-eligibility.
- [ ] Delete-forever performs a **hard delete** of the row and any descendant replies. This action requires an explicit confirmation step. It is the only path that loses audit trail.
- [ ] All moderation actions are logged with admin identity and timestamp (audit log table or admin-action log — implementation detail for tech-lead).

### US-8: Anti-spam silently rejects bots
**As** the site admin
**I want** obvious spam to be rejected before it reaches the moderation queue
**So that** the queue stays small and I can moderate in minutes per day.

**Acceptance criteria:**
- [ ] A honeypot form field (hidden via CSS, not via `type=hidden`) silently drops any submission that fills it. The bot receives a 200 OK; no row is written.
- [ ] Per-IP and per-email rate limits (US-2) are enforced before any DB write.
- [ ] If the spam ratio exceeds 30% over any rolling 7-day window, escalate to **Cloudflare Turnstile** as a v1.1 add-on. Turnstile is NOT required for v1 launch — it is a guardrail response, documented now to avoid a panic later.
- [ ] Rejected-by-rate-limit responses do not leak which limit was hit (uniform 429 message).

## Risks & dependencies

- **Risk:** Blog entity ships with a different identifier shape than `slug` → comments can't join. **Mitigation:** Use a generic `post_ref: string` column in v1; map at the API boundary.
- **Risk:** Admin panel slips → moderation has no UI for weeks. **Mitigation:** Ship the `ADMIN_SECRET`-gated temporary endpoint defined in US-6; document in runbook.
- **Risk:** Reaction fingerprint is too easy to bypass → reaction counts inflate. **Mitigation:** Accept some inflation in v1; revisit if guardrail breaks. Also: reactions are vanity metrics, not load-bearing.
- **Risk:** Markdown sanitizer has a known bypass → XSS. **Mitigation:** `security-engineer` reviews sanitizer choice and CSP headers before merge.
- **Risk:** Moderation backlog grows → fresh comments never appear → reader trust decays. **Mitigation:** Guardrail metric < 24h; if breached, send Johan a daily digest email.
- **Depends on:**
  - Blog post entity (separate workstream).
  - Admin panel REV-03/04 (separate workstream) for full moderation UX.
  - Supabase project (already wired via `api/_supabase.js`).
  - `tech-lead` ADR for schema, sanitizer, fingerprint, rate-limit store.
  - `ux-designer` for the comment thread + form UI.
  - `security-engineer` review (PII storage, sanitizer, CSP).
  - `qa-engineer` integration tests for the API.

## Out of scope

These are explicit non-goals for v1. They are not deferred features — they are deliberate omissions and must not creep into implementation.

- **No real-time updates.** No WebSockets, no SSE. Polling on focus and refresh-on-submit are sufficient.
- **No email notifications to commenters** (no "your comment was approved", no reply notifications) in v1.
- **No edit or delete by the commenter.** Anonymous submission means there is no identity to authorize against. Only admins can delete.
- **No login / OAuth / magic-link** in v1. All commenting is anonymous (name + email, email never displayed).
- **No file uploads or image embeds** in comments. Markdown image syntax is stripped.
- **No comments outside the blog.** No comments on the portfolio, no comments on the landing page, no comments on case studies.
- **This spec does not define the blog itself.** Blog routing, post storage, MDX rendering, RSS, etc. are a separate workstream.
- **This spec does not define the admin panel.** Moderation UX in v1 is either the admin panel (if it exists) or a temporary `ADMIN_SECRET`-gated endpoint. Building the admin panel is REV-03/04, not this spec.
- **No syntax highlighting** in code blocks for v1. Monospace + preserved whitespace is enough.
- **No comment search, no comment export, no user profiles.**

## Open questions

For `tech-lead` to resolve in the ADR:

1. **Reaction-uniqueness fingerprint:** cookie-based visitor ID, hashed IP+UA, or a hybrid? Trade-off between deduplication accuracy, privacy, and bypass cost. Document the chosen mechanism and its known bypasses.
2. **Markdown sanitizer:** which library? Candidates include `marked` + `DOMPurify`, `markdown-it` + `DOMPurify`, or a server-side render via a vetted lib. Must support the exact allowed subset (bold, italic, links, inline code, code blocks) and strip everything else by default. Where does sanitization run — server (on write), client (on render), or both?
3. **Rate-limit store:** in-memory per-instance (fragile on serverless), Supabase row count with a TTL window, Upstash Redis, or Vercel KV? Pick one consistent with the existing `api/reviews.js` posture.
4. **Schema shape for threading:** adjacency list (`parent_id`) vs materialized path. Adjacency is simpler given the depth-3 cap; confirm.
5. **Email storage:** plaintext in Supabase (encrypted at rest by default) or hashed-only? If plaintext, what is the retention policy and who has read access?
6. **Audit log for moderation actions:** dedicated table, append-only column on `comments`, or external log sink?
7. **Soft-delete representation:** `status` enum (`pending|approved|rejected`) plus `deleted_at` timestamp, or a single `state` column? Pick the simpler one.
8. **CSP and security headers** for the comments-rendering page — coordinate with `security-engineer`.

For `ux-designer`:

9. Visual treatment of nesting at depth 3 (indent depth, mobile collapse, "show replies" affordance).
10. Reaction picker UX — always-visible row vs hover-reveal vs tap-to-open.
11. Empty state and "awaiting moderation" confirmation copy and tone.

For Johan / stakeholders:

12. Confirm the `name + email` field set is acceptable; some sites add an optional `website` field for backlinks. Adding it has SEO and spam implications — recommend NOT adding in v1.
13. Confirm the moderation SLA target (spec proposes < 24h median). Tighter SLA implies email/Slack notifications, which would change scope.
