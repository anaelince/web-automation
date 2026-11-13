# AI Automation SDLC — Onboarding Prompt

> **Portability note:** This prompt is agent-agnostic. It works with Kiro, Cursor,
> Claude Projects, GitHub Copilot Workspaces, or any AI agent that supports
> custom instructions and skill/context injection. Adapt the file paths and
> activation mechanism to your agent's conventions.

---

## What is this system?

This document bootstraps the **AI Automation SDLC** — a governance system for
AI-assisted test automation projects. It enforces quality, consistency, and
determinism across a Playwright + TypeScript test framework using three layers:

```
Skills      ← domain-specific AI agents that enforce and auto-fix rules
Steering    ← persistent context injected into AI sessions
Hooks       ← event-driven automation triggered by IDE/CI actions
```

Together they replace ad-hoc prompting with a structured, repeatable process
where the AI knows exactly what to do and what NOT to do in every layer of the codebase.

---

## System Architecture

### Hub + Sub-skills

The system uses a two-level orchestration model:

```
automation-architect                ← hub: orchestrates all standards
  │
  ├── ui-pom-standard               ← UI layer: Page Object Model structure
  ├── api-setup-teardown-standard   ← API layer: setup/teardown infrastructure
  ├── spec-organisation-standard    ← Spec layer: file organisation and naming
  ├── spec-code-standard            ← Spec layer: code quality (imports, fixtures)
  ├── spec-quality-lifecycle-standard ← Spec layer: TC quality, assertions, anti-flakiness
  └── git-workflow-docs-standard    ← Git: workflow conventions + docs sync
```

**Credit consumption strategy:**
- For targeted tasks: load the specific sub-skill directly
- For full pipeline: use the hub
- `spec-quality-lifecycle-standard` acts as domain orchestrator for TC quality —
  it internally coordinates `ui-pom-standard` (locators) and `api-setup-teardown-standard`
  (teardown) for the parts they own

### Naming convention

All domain skills follow `{domain}-{objective}-standard`.
Hub/orchestrator skills use `-architect` suffix.

```
Domain prefixes:  ui- · api- · spec- · git- · data- · config-
Suffix:           -standard (enforcement) · -architect (orchestration)
```

See: `docs/decisions/ADR-001-skill-naming-convention.md` for the full rationale.

### Steering files

| File | Inclusion | Purpose |
|---|---|---|
| `project-context.md` | always | Core project conventions (<50 lines) |
| `framework-reference.md` | manual | Orchestrator — loads all 4 below at once |
| `framework-path-aliases.md` | manual | Full alias map |
| `framework-playwright-config.md` | manual | Config settings + npm scripts |
| `framework-tech-stack.md` | manual | Dependency versions |
| `framework-basepage-contract.md` | manual | BasePage contract and locator rules |

**Activation (Kiro):** `#framework-reference` in chat loads all four at once.
**Adaptation:** For other agents, include the content of `framework-reference.md` in
your system prompt or context window when working on the framework.

### Hooks

| File | Trigger | Purpose |
|---|---|---|
| `docs-sync-on-push.json` | PostToolUse (execute_pwsh) | Checks doc sync after git push |

---

## Bootstrapping a New Project

Execute the following prompts in order. Each prompt lives in `docs/skills/` and
creates one skill. After all skills are created, register them in `automation-architect`.

### Step 0 — Prerequisites

The target project must have:
- Node.js + npm
- Playwright + TypeScript configured
- `tsconfig.json` with path aliases
- A `src/` and `tests/` directory structure

---

### Step 1 — Hub: `automation-architect`

**Prompt:** `docs/skills/automation-architect-skill-prompt.md`

Creates the master orchestrator skill. Do this first — all subsequent steps
register their skill in this hub.

**What it creates:**
- `.kiro/skills/automation-architect/SKILL.md`
- Modes 1–7, Hub Growth Policy, Sub-Skill Registry

---

### Step 2 — UI Layer: `ui-pom-standard`

**Prompt:** Execute the `ui-pom-standard` section of the automation-architect prompt
(it describes the POM rules inline).

**What it governs:**
- Page Objects extend `BasePage`
- Locators are `get` properties (not constructor fields)
- Actions are `async` methods
- No assertions in Page Objects
- `navigate()` uses `baseURL`

---

### Step 3 — API Layer: `api-setup-teardown-standard`

**Prompt:** `docs/skills/api-setup-teardown-standard-prompt.md`

**What it governs:**
- `ApiClient` is the only file that calls `request.*`
- Controllers receive `ApiClient`, never `APIRequestContext`
- URL constants are centralized in `endpoints/`
- Every fixture that creates data has teardown after `use()`
- Token refresh in teardown when UI login happens during the test body (R10)
- `ApiClient` methods check `response.ok()` and throw on non-2xx (R11)

---

### Step 4 — Spec Organisation: `spec-organisation-standard`

**Prompt:** `docs/skills/spec-organisation-standard-prompt.md`

**What it governs:**
- Spec files live in `tests/ui/{suite}/sites/{site}/{feature}/TC{N}-{name}.spec.ts`
- `test.step()` is the only accepted step labelling mechanism
- TC IDs follow `TC{N}` format
- One spec file per TC

---

### Step 5 — Spec Code Quality: `spec-code-standard`

**What it governs:**
- All imports use path aliases (`@fixtures`, `@pages/*`, `@data/*`, etc.)
- `test` and `expect` imported from `@fixtures`, not `@playwright/test`
- No PO instantiation in `beforeEach` — use fixtures instead
- No hardcoded credentials — use `@data/{site}/auth.data`
- No cross-spec imports

**Growth note:** If general TypeScript quality rules are needed beyond spec files,
create a separate `code-standard` skill. Do not expand this skill's scope.

---

### Step 6 — TC Quality: `spec-quality-lifecycle-standard`

**Prompt:** `docs/skills/spec-quality-lifecycle-standard-prompt.md`

**What it governs (the full test lifecycle):**
- R1: Precondition asserted before first action
- R2: Postcondition guaranteed via `clean<Resource>` fixture
- R3: No hardcoded waits (`waitForTimeout` forbidden)
- R4: Web-first assertions (`expect(locator).toBeVisible()`, not `await locator.isVisible()`)
- R5: Resilient locators (role-based, label, testid — not positional CSS/XPath)
- R6: Every `test.step()` with actions has at least one assertion
- R7: Tests are independent (no shared mutable state between tests)
- R8: No conditional logic in test body (`if/else` belongs in POs/fixtures)
- R9: Navigate then assert (always confirm page loaded after navigation)
- R10: Assertion specificity (check value, not just presence, when value matters)

**Orchestration role:** This skill coordinates with `ui-pom-standard` (R5) and
`api-setup-teardown-standard` (R2). Load it directly for TC-specific work without
activating the hub.

---

### Step 7 — Git Workflow: `git-workflow-docs-standard`

**Prompt:** `docs/skills/git-workflow-docs-standard-prompt.md`

**What it governs:**
- Branch naming: `(test|fix)/<kebab-case-scope>`
- Commit format: `type(scope): description` (Conventional Commits)
- C4 — DOCS_SYNC: detects when architectural changes need README or wiki updates
- Execute capabilities: create branch, commit, push, open PR

---

### Step 8 — Steering Files

Create the following files in `.kiro/steering/` (or equivalent for your agent):

**`project-context.md`** — `inclusion: always`
```markdown
---
inclusion: always
---
# Project Context
[Insert your project's core conventions: language, testing framework, secrets policy]
```

**`framework-*.md` files** — `inclusion: manual`
Create individual reference files for path aliases, playwright config, tech stack,
and BasePage contract. Use the files in this repo as templates.

**`framework-reference.md`** — `inclusion: manual`
Orchestrator that loads all four via:
```
#[[file:.kiro/steering/framework-path-aliases.md]]
#[[file:.kiro/steering/framework-playwright-config.md]]
#[[file:.kiro/steering/framework-tech-stack.md]]
#[[file:.kiro/steering/framework-basepage-contract.md]]
```
> **Note:** Use workspace-root-relative paths in `#[[file:...]]` references,
> not paths relative to the steering file itself.

---

### Step 9 — Hooks

Create `.kiro/hooks/docs-sync-on-push.json`:
- Trigger: `PostToolUse`
- Matcher: `execute_pwsh` (or your shell tool name)
- Action: `command` type (not `agent` — lower credit cost)
- Logic: check if `git push` was executed, then run the trigger map check

> **Hook design rule:** Default to `command` type. Use `agent` only when LLM
> reasoning is required. `Stop` trigger fires after every agent turn — avoid it
> for one-time session tasks.

---

### Step 10 — Living Documentation

Set up the `docs/` structure:

```
docs/
  decisions/     ← ADRs (ADR-NNN-*.md)
  skills/        ← this prompt + all skill meta-prompts
  wiki/
    ai-governance.md  ← AI tooling conventions (copy from this repo)
    api/              ← API layer reference per site
  test-cases/    ← TC specs per site
  course/        ← course material (if applicable)
```

---

## Adapting to Your AI Agent

| Concept | Kiro | Cursor | Claude Project | Manual AI |
|---|---|---|---|---|
| Skills | `.kiro/skills/*/SKILL.md` + `disclose_context` | Custom instructions per context | Project instructions | Paste in system prompt |
| Steering (always) | `.kiro/steering/*.md` with `inclusion: always` | Add to workspace rules | Project knowledge | Include in every prompt |
| Steering (manual) | `#file-name` in chat | @-mention file | Add to context | Paste when needed |
| Hooks | `.kiro/hooks/*.json` | — (not supported) | — | Manual workflow step |
| Hub | Load `automation-architect` and say "apply architecture" | Paste hub prompt + invoke | Include hub in project instructions | Use as meta-prompt |

---

## Governance Decisions Made in This Project

| ADR | Decision | File |
|---|---|---|
| ADR-001 | Skill naming convention: `{domain}-{objective}-standard` | `docs/decisions/ADR-001-skill-naming-convention.md` |

**When to create an ADR:**
- Naming convention changes
- New skill added or retired
- Hub architecture change
- Documentation strategy change
- Any decision the team needs to understand in 6 months

---

## Anti-patterns to Avoid

| Anti-pattern | Why | Correct approach |
|---|---|---|
| Always-included steering with >50 lines | High credit cost on every message | Split into manual steering files |
| `Stop` trigger hooks with `agent` action | Fires after every agent turn, expensive | Use `PostToolUse` + `command` type |
| Loading the hub for a targeted task | Loads all 7 skills, high credit | Load the specific sub-skill directly |
| Hardcoding rules in multiple skills | Duplication causes conflicts | Each rule lives in exactly one skill |
| Skipping the ADR for naming decisions | Future team members won't understand why | Write the ADR first, then execute |
