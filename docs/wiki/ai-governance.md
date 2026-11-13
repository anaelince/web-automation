# AI Governance — Kiro Tooling Conventions

> This document is the single source of truth for how Kiro AI tooling is configured
> and governed in this project. Update it whenever a new agreement is reached about
> skills, hooks, steering, specs, or hubs.
>
> Related ADR: `docs/decisions/ADR-001-skill-naming-convention.md`

---

## 1 — Skill Naming Convention

All domain skills follow the pattern `{domain}-{objective}-standard`.
The hub skill retains the `-architect` suffix to signal orchestration.

```
automation-architect                ← hub: orchestrates all standards
  ui-pom-standard                   ← UI layer: Page Object Model
  api-setup-teardown-standard       ← API layer: setup/teardown infrastructure
  spec-organisation-standard        ← Spec: file organisation and naming
  spec-code-standard                ← Spec: code quality (imports, fixtures, data)
  spec-quality-lifecycle-standard   ← Spec: TC quality across full lifecycle
  git-workflow-docs-standard        ← Git: workflow conventions + docs sync
```

**Naming rules for future skills:**
1. Prefix = source layer it governs: `ui-`, `api-`, `spec-`, `git-`, `data-`, `config-`
2. Objective = noun describing what the skill enforces within that domain
3. Suffix = always `-standard` for enforcement skills; `-architect` for hub/orchestrators
4. Split rule: if a skill's scope grows beyond its domain prefix, split into two skills

**Growth note for `spec-code-standard`:**
If general TypeScript quality rules are needed across all `src/` layers (not just specs),
create a separate `code-standard` skill. Do not expand `spec-code-standard` beyond the
`spec` domain.

---

## 2 — Hub Architecture

`automation-architect` is the top-level hub. It orchestrates ALL skills for the Full
Pipeline (Mode 1) and provides direct entry points for specific workflows.

**Credit consumption principle:**
- Load the specific sub-skill directly for targeted tasks — do NOT use the hub
- Use the hub only when you need cross-skill orchestration or the full pipeline
- `spec-quality-lifecycle-standard` acts as a **domain orchestrator** for TC quality:
  it internally coordinates `ui-pom-standard` and `api-setup-teardown-standard` for
  the parts they own, reducing hub load when doing TC-specific reviews

```
Targeted task → load specific sub-skill directly (low credit)
Full pipeline  → automation-architect Mode 1 (high credit — intentional)
TC quality     → spec-quality-lifecycle-standard (medium credit, coordinates domain)
```

**Mode slot budget:** Maximum 10 modes in `automation-architect`. Current usage tracked
in the SKILL.md header comment `(N of 10 slots used)`.

---

## 3 — Hook Design Conventions

### Naming
Hooks follow the same intent-first naming philosophy as skills:
`{trigger-event}-{what-it-does}.json`

Examples:
- `docs-sync-on-push.json` — checks doc sync after git push
- `lint-on-save.json` — runs linter after file save

### Action type selection

| Use `command` when... | Use `agent` when... |
|---|---|
| You need to run a script and check output | You need to inject contextual instructions into the LLM |
| Minimal credit consumption is important | The logic is complex and needs LLM reasoning |
| The check is deterministic (git diff, file exists) | The action requires judgment |

**Default to `command`** — it consumes near-zero tokens vs `agent` which injects tokens
into every context window when it fires.

### Trigger selection

| Trigger | Fires | Use for |
|---|---|---|
| `PostToolUse` + matcher | After specific tool calls | Post-action checks (lint, format, verify) |
| `PostFileSave` + matcher | After specific file saves | Per-file checks (lint on save) |
| `SessionStart` | Once per session | Session setup, reminders |
| `Stop` | **After every agent turn** (NOT session end) | Avoid for one-time session tasks |

> **Warning:** `Stop` fires after EVERY agent response in a session, not at session end.
> Use `PostToolUse` with appropriate matchers for post-commit/post-push checks.

### Current hooks

| File | Trigger | Matcher | Action type | Purpose |
|---|---|---|---|---|
| `docs-sync-on-push.json` | PostToolUse | `execute_pwsh` | command | Check doc sync after git push |

---

## 4 — Steering File Conventions

### Naming
Steering files follow the same domain-objective philosophy as skills:
`{domain}-{objective}.md`

Examples:
- `spec-code-rules.md` — always-active rules for spec code quality
- `git-commit-format.md` — format reference for commits

### Inclusion mode selection

| Mode | Use when | Credit impact |
|---|---|---|
| `always` | The rule must ALWAYS be active (e.g. "never commit secrets") | High — in every context |
| `fileMatch` | Only relevant when specific files are open | Medium — contextual |
| `auto` | Activated by user intent matching the description | Low — on demand |
| `manual` | Reference material the user pulls with `#` | Near zero — user-driven |

**Convention for this project:** Prefer `manual` for reference material, `auto` for
conventions that apply to specific tasks. Reserve `always` for project-critical rules
that are short (<50 lines) and always relevant.

**Activation:**
- `manual` steering → user types `#` in chat and selects the file
- `auto` steering → Kiro's `disclose_context` tool activates it when intent matches
- `always` steering → automatically in every context (no activation needed)

### Current steering files

| File | Inclusion | Purpose |
|---|---|---|
| `project-context.md` | `always` | Project conventions (English, no Azure DevOps, secrets out of git) |
| `framework-reference.md` | `manual` | **Orchestrator** — loads all four framework steering files at once via `#[[file:...]]` |
| `framework-path-aliases.md` | `manual` | Full alias map with site-based path patterns |
| `framework-playwright-config.md` | `manual` | playwright.config.ts settings + npm scripts |
| `framework-tech-stack.md` | `manual` | Dependency versions and TypeScript compiler settings |
| `framework-basepage-contract.md` | `manual` | BasePage class contract and locator rules |
| `pptx-workflow.md` | *(check file)* | — |

**Activation:**
- `#framework-reference` → loads all four framework files at once (recommended for full context)
- `#framework-path-aliases` → loads only the alias map (targeted use)

---

## 5 — Spec Workflow

Specs are structured feature-development sessions in Kiro. They live in
`.kiro/specs/{name}/` and contain three phases:

```
requirements.md   ← what the system should do (user behavior)
design.md         ← how it will be built (architecture, components)
tasks.md          ← actionable checklist with status tracking
```

### When to create a spec vs use Vibe

| Situation | Use |
|---|---|
| New feature with complex architecture | Spec (Requirements-First or Design-First) |
| Quick well-understood feature | Spec (Quick) or Vibe |
| Bug fix | Spec (Bugfix) for root cause analysis |
| Exploratory work / Q&A | Vibe |
| Skill creation / updates | Vibe (use meta-prompts in `docs/skills/`) |

### Activating an existing spec
Open from the **Specs** panel in Kiro sidebar, or reference in chat:
`"continue the spec for X"`

### Spec naming convention
`{module}-{feature-or-decision}` → kebab-case
Examples: `m6-book-store-api`, `automation-architect-skill-system`

---

## 6 — Documentation Taxonomy

| Type | Location | For what |
|---|---|---|
| ADR | `docs/decisions/ADR-NNN-*.md` | Architectural decisions (why X over Y) |
| Tech Spec | `docs/specs/` | Implementation plans (how to build) |
| Wiki | `docs/wiki/**/*.md` | Living framework documentation (what it is now) |
| Skill prompts | `docs/skills/*.md` | Meta-prompts for creating/updating skills |
| Test cases | `docs/test-cases/{site}/*.md` | TC specifications per site |
| Execution Report | `docs/reports/` | Output from running skills/reviews |
| Retrospective | `docs/retros/` | Sprint/module learnings |
| Course material | `docs/course/` | Presentation slides (read-only) |

**Living docs trigger map** (governed by `docs/skills/living-docs-prompt.md`):

| Changed files | Update | On |
|---|---|---|
| `.kiro/skills/**` | `README.md §9` | Skill added/retired |
| `src/api/sites/{site}/` | `docs/wiki/api/{site}-api-layer.md` | Layer change |
| New `*.spec.ts` | `docs/test-cases/{site}/` | TC added |
| `playwright.config.ts` / `package.json` | `README.md §3/§5` | Config change |

---

## 7 — Governance Process

When making a new agreement that affects the AI tooling (new skill naming rule,
new hook pattern, steering decision):

1. **Discuss and agree** in a Vibe session
2. **Document in ADR** if it's an architectural decision (new naming convention,
   structural change to the hub, change to documentation strategy)
3. **Update this wiki** (`docs/wiki/ai-governance.md`) with the new convention
4. **Update the affected skill SKILL.md** if the decision changes how a skill works
5. **Commit with `docs(ai-governance): ...`** type prefix

> This document itself is the prompt for maintaining AI governance. When creating
> a new spec, hook, steering file, or skill, refer to this document first to ensure
> consistency with established conventions.
