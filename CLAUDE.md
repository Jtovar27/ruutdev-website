# CLAUDE.md — RuutDev Engineering Standards

> Read at every session start. Defines team conventions, the agent roster,
> and the delegation rules Claude Code must follow.

## Project context

- **Org:** RuutDev (web development, software, AI integration)
- **Default stack:** MERN monorepo — Next.js (App Router) + Express + MongoDB Atlas, deployed to Vercel (web) + Railway (api).
- **Language:** TypeScript strict everywhere.
- **Package manager:** pnpm (workspaces).
- **Communication with Johan:** Spanish in chat. English in code, commits, files, comments.

If the active project's `PLANNING.md` overrides any of the above, the project file wins.

## Operating principles (apply on every task)

1. **Plan before code.** For anything beyond a one-line fix, use Plan Mode (Shift+Tab) or delegate to `tech-lead` first.
2. **Small PRs.** Target ≤ 150 lines net. One concern per PR. Squash-merge.
3. **Test what you write.** Lógica de negocio sin test = código a medias.
4. **No secrets in code.** Always `process.env` validated by Zod at boot (`lib/env.ts`).
5. **Conventional Commits.** `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`.
6. **Artifacts persist.** Specs, ADRs, plans, reviews → `.claude/work/<area>/<slug>.md`. Don't bury work in chat.
7. **Re-run quality gates locally before claiming done:** `pnpm -r typecheck && pnpm -r lint && pnpm -r test`.

## Agent roster — when to delegate

Claude Code automatically delegates based on each agent's `description`. The table below is for *you* (Johan and the main thread) to know who owns what. **Always delegate the matching task — don't do it inline.**

| Need | Agent | Produces |
|---|---|---|
| Define what/why of a feature | `product-manager` | `.claude/work/specs/<slug>-spec.md` |
| Decide how technically | `tech-lead` | `.claude/work/adrs/ADR-NNN-<slug>.md` |
| Design UI / flows / tokens | `ux-designer` | `.claude/work/design/<slug>-design.md` |
| Implement React/Next.js | `frontend-engineer` | code + tests, PR description |
| Implement Node/Express APIs | `backend-engineer` | code + tests, PR description |
| Model Mongo / queries / indexes | `database-engineer` | model file + `.claude/work/db/<model>.md` |
| Configure deploy / CI / monitoring | `devops-engineer` | configs + `.claude/work/runbooks/<service>.md` |
| Write or design tests | `qa-engineer` | tests + `.claude/work/test-plans/<slug>.md` |
| Audit auth / secrets / OWASP | `security-engineer` | `.claude/work/security/<slug>-review.md` |
| Review a PR before merge | `code-reviewer` | `.claude/work/reviews/<slug>-review.md` |

## Mandatory delegation rules

These rules are enforced — main thread must follow them.

1. **Any change touching auth, payments, secrets, PII, or new dependencies** → `security-engineer` MUST review **before merge**. Non-negotiable.
2. **Any new endpoint or schema** → `qa-engineer` writes integration tests; main thread does not skip them.
3. **Architecture decisions (new service, new DB, new auth flow, breaking API)** → `tech-lead` writes an ADR **before** any code is written.
4. **Anything UI-facing without a spec** → `ux-designer` produces a design spec first.
5. **Before merging any PR** → `code-reviewer` produces a review document. No self-merges.
6. **Multi-file refactors / migrations (>3 files)** → use Plan Mode first, then chain agents per phase.

## Quick start for new features

For any non-trivial feature, run this pipeline:

```
1. > Use product-manager to write a spec for <feature>
2. > Use tech-lead to write an ADR based on .claude/work/specs/<slug>-spec.md
3. > Use ux-designer to design the UI based on the spec  (if UI involved)
4. > Use frontend-engineer + backend-engineer in parallel to implement against the ADR
5. > Use qa-engineer to write tests
6. > Use security-engineer to review  (if auth/data sensitive)
7. > Use code-reviewer to review the PR
8. > Use devops-engineer to ship + write runbook
```

Each step produces an artifact the next step reads. Don't re-explain context — point at the file.

## Anti-patterns (do not do)

- ❌ Implementing a feature without a spec or ADR.
- ❌ Merging without `code-reviewer` running.
- ❌ Putting secrets in `CLAUDE.md`, `.env.example`, or any tracked file.
- ❌ Adding a dependency without `security-engineer` glancing at it.
- ❌ Writing 500-line PRs. Split them.
- ❌ Skipping tests because "it's just a small change."
- ❌ Editing `.claude/agents/*.md` without committing the change with a `chore(agents):` message.

## File layout conventions

```
<project-root>/
├── CLAUDE.md                      ← this file (read by Claude Code on session start)
├── AGENTS.md                      ← team philosophy & composition (read by humans)
├── PLANNING.md                    ← project-level vision/scope
├── DESIGN.md                      ← project-level design direction
├── DEVELOP.md                     ← project-level dev workflow notes
├── .claude/
│   ├── agents/                    ← the 10 subagent definitions
│   └── work/                      ← persistent artifacts produced by agents
│       ├── specs/                 ← product-manager output
│       ├── adrs/                  ← tech-lead output
│       ├── design/                ← ux-designer output
│       ├── db/                    ← database-engineer model docs
│       ├── runbooks/              ← devops-engineer output
│       ├── test-plans/            ← qa-engineer output
│       ├── security/              ← security-engineer output
│       └── reviews/               ← code-reviewer output
├── apps/
│   ├── web/                       ← Next.js frontend
│   └── api/                       ← Express backend
└── packages/                      ← shared libs (ui, types, config)
```

## Definition of Done (every PR)

A PR is *done* when **all** of these are true:

- [ ] Linked to a spec or ADR (or is genuinely trivial)
- [ ] Type checks pass (`pnpm -r typecheck`)
- [ ] Lint passes (`pnpm -r lint`)
- [ ] Tests pass and new tests cover the change (`pnpm -r test`)
- [ ] No secrets in diff (gitleaks would find none)
- [ ] PR description includes: what, why, how to test, screenshots (if UI)
- [ ] `code-reviewer` produced a review document
- [ ] If sensitive: `security-engineer` signed off

## How to extend this file

When you discover a recurring rule or pattern, add it here. Keep this file under ~250 lines. If a section gets long, move it to `.claude/rules/<topic>.md` and reference it.
