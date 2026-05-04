# AGENTS.md — RuutDev Engineering Team

> **For humans.** Filosofía y composición del equipo.
> Para reglas operativas que Claude Code lee, ver `CLAUDE.md`.

## Filosofía

Cuatro principios tomados de las mejores empresas de ingeniería del mundo:

1. **Craft & Taste (Apple).** Cada detalle importa. Si algo se ve descuidado, se rechaza.
2. **Engineering Rigor (Google).** Diseño antes de código. ADRs, code reviews exhaustivos, testing como ciudadano de primera clase.
3. **Customer Obsession (Amazon).** Cada decisión vuelve al usuario. Working backwards.
4. **Move Fast, Stable Infra (Meta).** Iterar rápido sobre cimientos sólidos. Feature flags, observabilidad desde el día uno.

**Lema operativo:** Plan → Design → Build → Review → Ship → Measure → Iterate.

## El equipo (10 agentes)

| Agente | Rol equivalente FAANG | Cuándo invocar |
|---|---|---|
| `tech-lead` | Principal Engineer | Decisiones arquitectónicas, ADRs, RFCs |
| `product-manager` | Senior PM | Specs, user stories, métricas de éxito |
| `ux-designer` | Product Designer | Diseño de UI, design system, accesibilidad |
| `frontend-engineer` | Senior FE SWE | Implementar React/Next.js, hooks, estado |
| `backend-engineer` | Senior BE SWE | Implementar APIs, services, integraciones |
| `database-engineer` | Data Engineer / DBA | Schemas, queries, índices, migraciones |
| `devops-engineer` | SRE | Deploy, CI/CD, monitoring, runbooks |
| `qa-engineer` | SDET | Test plans, automatización, regresiones |
| `security-engineer` | AppSec Engineer | OWASP, auth, secretos, threat modeling |
| `code-reviewer` | Staff Engineer (review) | Review de PRs antes de merge |

## Workflow estándar

```
┌─────────────────┐
│ product-manager │  → spec.md
└────────┬────────┘
         ↓
┌─────────────────┐
│   tech-lead     │  → ADR.md
└────────┬────────┘
         ↓
┌─────────────────┐
│  ux-designer    │  → design.md  (si hay UI)
└────────┬────────┘
         ↓
   ┌─────┴──────┬──────────┐
   ↓            ↓          ↓
┌─────┐    ┌───────┐   ┌──────┐
│ FE  │    │  BE   │   │ DB   │
└──┬──┘    └───┬───┘   └──┬───┘
   └───────────┴──────────┘
               ↓
   ┌──────────────────────┐
   │  qa + security pass  │
   └──────────┬───────────┘
              ↓
   ┌────────────────────┐
   │   code-reviewer    │  → review.md
   └──────────┬─────────┘
              ↓
   ┌────────────────────┐
   │  devops-engineer   │  → ship + runbook.md
   └────────────────────┘
```

## Anatomía de un agente bien escrito

Cada agente sigue un mismo patrón (basado en best practices de Anthropic y la comunidad):

```markdown
---
name: <kebab-case>
description: Use PROACTIVELY when <trigger>. Produces <artifact>. MUST BE USED <when blocking>.
tools: <minimum necessary>
model: opus | sonnet (per role)
permissionMode: plan | acceptEdits  (cuando aplica)
color: <visual indicator>
---

# Identity (one paragraph)

## When invoked (numbered steps)
1. Read X
2. Apply Y
3. Produce Z

## Output format (template)

## Quality bar (checklist)

## Don't (anti-patterns)

## Communication (idioma)
```

## Por qué este orden importa

El research interno de Anthropic muestra patrones consistentes en equipos de alto rendimiento:

1. **Plan antes de codear.** El equipo de Claude Code mismo dice: *"Letting Claude jump straight to coding can produce code that solves the wrong problem."* Por eso `product-manager` y `tech-lead` van primero.

2. **Test-first se volvió default.** Equipos como Security Engineering en Anthropic pasaron de *"design doc → janky code → refactor → give up on tests"* a *"pseudocode → guide through TDD → check in periodically"*. Por eso `qa-engineer` define criterios antes de que se codee.

3. **Small PRs.** El equipo de Claude Code tiene un p50 de 118 líneas por PR, ~5 PRs/dev/día. Nuestra "Definition of Done" en CLAUDE.md refleja esto.

4. **Subagentes para preservar contexto.** El research de Anthropic confirma: *"context degradation is the primary failure mode."* Cada subagente trabaja en su propio contexto y solo el resumen vuelve al main thread.

5. **Artifacts persistentes.** *"Have the agent produce a durable artifact like research.md, plan.md, or review-notes.md."* Por eso cada agente escribe a `.claude/work/`.

6. **Descripciones accionables.** *"Reviews code for security issues before commits"* enruta mejor que *"security expert"*. Por eso cada `description` empieza con "Use PROACTIVELY when…".

## Cómo evolucionar el equipo

Cuando RuutDev crezca, considera añadir:

- `mobile-engineer` — para iOS/Android nativo o React Native
- `ml-engineer` — cuando AI integrations crezca como línea
- `data-analyst` — cuando midas decisiones por métricas
- `technical-writer` — para docs públicas / SDK
- `growth-engineer` — SEO / analytics / A/B testing dedicado

Para añadir un agente nuevo: copia la plantilla de cualquiera, ajusta el `description`, los `tools` y el system prompt. Commitéalo con `feat(agents): add <name>`.

## Cómo mejorar agentes existentes

1. Cuando un agente falla en un caso, edita su `.md` y agrega instrucción.
2. Cuando un agente repite el mismo error, el problema suele estar en la `description`, no en el cuerpo. Reescribe la descripción para enrutarlo mejor.
3. Cada vez que descubras una convención del codebase, agrégala a `CLAUDE.md` (no a cada agente).
4. Mantén cada agente bajo ~200 líneas. Más allá de eso, divide en agentes especializados.

---

*Este documento es parte del cuarteto vivo `PLANNING.md` / `DESIGN.md` / `DEVELOP.md` / `AGENTS.md`. Más `CLAUDE.md` que es leído automáticamente por Claude Code al iniciar.*
