# Meta-prompt: Update automation-architect hub — Project Context & Growth Governance

Use this prompt directly with Kiro to update the existing
`.kiro/skills/automation-architect/SKILL.md`.

This update does NOT add new modes or rules. It establishes:
1. Full project context (tech stack, structure, configuration)
2. A Sub-Skill Registry as the single source of truth for all skills
3. A Framework Growth Considerations section that governs how skills and the
   framework evolve over time

Do NOT modify any sub-skill files — only `automation-architect/SKILL.md`.

---

## Prompt

Replace the existing `## Project Context` section in `automation-architect/SKILL.md`
with the expanded version below, and append the two new sections
(`## Sub-Skill Registry` and `## Framework Growth Considerations`) after the
`## Hub Growth Policy` section.

---

### Updated: Project Context section

```markdown
## Project Context

### Tech Stack

| Dependency | Version | Impact on rules |
|------------|---------|-----------------|
| `@playwright/test` | ^1.64.1 | `test.step()` ✅ · native tag option ✅ · trace viewer ✅ |
| `typescript` | ^7.0.2 | strict mode · ES2022 target |
| `dotenv` | ^18.0.8 | ENV vars loaded before test run |
| Node.js | `@types/node` ^26 | CommonJS module system |

### TypeScript compiler settings (tsconfig.json)

| Setting | Value | Why it matters for skills |
|---------|-------|--------------------------|
| `target` | `ES2022` | Enables `useDefineForClassFields: true` — locators MUST be `get` properties |
| `module` / `moduleResolution` | `NodeNext` | Affects how path aliases resolve |
| `strict` | `true` | All type errors are errors; no implicit any |
| `noUncheckedIndexedAccess` | `true` | Array/object access returns `T \| undefined` |
| `noImplicitOverride` | `true` | Sub-class method overrides require `override` keyword |
| `noEmit` | `true` | TypeScript is type-check only — no compiled output |

### Path aliases (tsconfig.json paths)

| Alias | Resolves to | Used by |
|-------|-------------|---------|
| `@pages/*` | `src/ui/pages/*` | pom-architect, spec-code-standard |
| `@components/*` | `src/ui/components/*` | pom-architect |
| `@fixtures` | `src/fixtures/index` | spec-code-standard |
| `@fixtures/*` | `src/fixtures/*` | spec-code-standard |
| `@data/*` | `src/data/*` | spec-code-standard, pom-architect |
| `@config/*` | `src/config/*` | spec-code-standard |
| `@helpers/*` | `src/helpers/*` | (reserved for future helpers) |
| `@api/*` | `src/api/*` | (reserved for API layer) |

### Project folder structure

```
src/
  ui/
    pages/          ← Page Objects       (pom-architect)
    components/     ← UI Components      (pom-architect)
  fixtures/         ← Playwright fixtures (spec-code-standard)
  data/             ← Test data files     (spec-code-standard, pom-architect)
  config/           ← Env config (ENV.ts) (spec-code-standard, pom-architect)
  helpers/          ← Shared utilities    (future)
  api/              ← API client layer    (future)
tests/
  ui/
    smoke/          ← Critical path TCs  (spec-organisation-standard)
    regression/     ← Edge case TCs      (spec-organisation-standard)
docs/
  decisions/        ← ADRs for hub growth decisions
.kiro/
  skills/           ← Skill definitions
```

### Playwright configuration (playwright.config.ts)

| Setting | Value | Notes |
|---------|-------|-------|
| `testDir` | `./tests` | All spec files must live here |
| `baseURL` | `ENV.baseUrl` | Loaded from `.env` via dotenv |
| `fullyParallel` | `true` | Tests run in parallel by default |
| `retries` | `2` on CI, `0` local | Skills should not assume specific retry count |
| `trace` | `on-first-retry` | Trace collected on CI failures |
| `reporter` | `list` + `html` | HTML report at `playwright-report/` |
| Browsers | chromium · firefox · webkit | All three run by default |
| `forbidOnly` | `true` on CI | `test.only` causes CI failure |

### npm scripts

| Script | Command | When skills should reference it |
|--------|---------|----------------------------------|
| `test` | `playwright test` | Full test run |
| `test:smoke` | `playwright test --grep @smoke` | Smoke suite (grep-based, migrates to native tags) |
| `test:headed` | `playwright test --headed` | Debug runs |
| `typecheck` | `tsc --noEmit` | Run after any code change to verify TypeScript |
| `report` | `playwright show-report` | Open HTML report |

### BasePage contract

```typescript
// src/ui/pages/BasePage.ts
import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}
  async navigate(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }
}
```

All Page Objects extend `BasePage`. No subclass overrides `navigate()` or redeclares
the constructor.
```

---

### New section: Sub-Skill Registry

Append this section after `## Hub Growth Policy`.

```markdown
## Sub-Skill Registry

Single source of truth for all skills in this framework. Update this table whenever
a skill is added, updated, or retired.

| Skill | Domain | File Scope | Rules / Checks | Added | Status |
|-------|--------|-----------|----------------|-------|--------|
| `pom-architect` | Page Object structure | `src/ui/pages/**/*.ts` · `src/ui/components/**/*.ts` | R1–R8 | M4 | Active |
| `spec-code-standard` | Spec code quality | `tests/**/*.spec.ts` · `src/fixtures/index.ts` | R1–R8 | M4 | Active |
| `spec-organisation-standard` | Spec organisation & lifecycle | `tests/**/*.spec.ts` | R1–R5 | M5 | Active |
| `git-standards` | Git workflow | git state (no files) | C1–C3, E1–E5 | M5 | Active |

### Scan scope ownership

Each file type is owned by exactly one skill for each concern. No two skills should
check the same property on the same file.

| File / Scope | Owner skill | Concern |
|--------------|-------------|---------|
| `src/ui/pages/**/*.ts` | `pom-architect` | POM structure, locators, actions |
| `src/ui/components/**/*.ts` | `pom-architect` | Component structure |
| `src/fixtures/index.ts` | `spec-code-standard` | Fixture completeness, import hygiene |
| `tests/**/*.spec.ts` — imports, fixtures, credentials | `spec-code-standard` | Code quality |
| `tests/**/*.spec.ts` — folder, naming, TC IDs, steps | `spec-organisation-standard` | Organisation |
| `src/**/*.ts` (non-PO, non-fixture) | `spec-code-standard` | Import hygiene only |
| git branch + commit history | `git-standards` | Workflow conventions |
```

---

### New section: Framework Growth Considerations

Append this section after `## Sub-Skill Registry`.

```markdown
## Framework Growth Considerations

These considerations govern how this skill system and the automation framework
evolve over time. They complement the Hub Growth Policy, which governs mode slots.

---

### 1 — Context budget

LLM context has a practical limit. Keeping skill files lean ensures the agent can
process them reliably in a single context window.

| File | Target size | Action when exceeded |
|------|-------------|----------------------|
| `automation-architect/SKILL.md` | < 500 lines | Review modes for consolidation or retirement |
| Any sub-skill `SKILL.md` | < 400 lines | Split into two focused sub-skills with their own domain |

When adding new rules or examples, estimate the line cost before adding. Prefer
concise rule definitions over lengthy narrative.

---

### 2 — Scan scope discipline

Before adding a rule to any skill, verify that no existing skill already checks
the same property on the same file. Duplicate scan coverage creates conflicting
violations and confuses auto-fix order.

**Process:** Check the Scan Scope Ownership table in `## Sub-Skill Registry`.
If the file/concern pair is unclaimed, add the rule and update the table.
If it is already claimed, extend the owning skill instead of the new one.

---

### 3 — New skill onboarding checklist

When adding a new sub-skill to this framework:

- [ ] Identify the domain gap — confirm no existing skill covers it (Hub Growth Policy Rule 1)
- [ ] Create ADR in `docs/decisions/` (Hub Growth Policy Rule 2)
- [ ] Create `SKILL.md` with valid YAML frontmatter (`name`, `description`)
- [ ] Add skill to the Sub-Skill Registry table above
- [ ] Add scan scope rows to the Scan Scope Ownership table
- [ ] Update Mode 1 (Full Pipeline) to invoke the new skill
- [ ] Add a row to the Sub-Skill Invocation Reference table
- [ ] Verify zero scan scope overlap with existing skills
- [ ] Document minimum Playwright version if any rule uses a version-specific API

---

### 4 — Playwright version compatibility

Some Playwright APIs used by rules have a minimum version requirement.
When upgrading Playwright, check for newly available APIs that could improve rules.
When a rule depends on a version-specific feature, document it inline.

| API / Feature | Min Playwright version | Used by |
|---------------|----------------------|---------|
| `test.step()` | 1.22 | `spec-organisation-standard` R5 |
| `test()` native tag option `{ tag: [] }` | 1.42 | `spec-organisation-standard` (future tagging rules) |
| `--grep @tag` (current approach) | any | `package.json test:smoke` |

**Migration note:** The current `test:smoke` script uses `--grep @smoke` (regex-based).
When `spec-organisation-standard` adds native tag rules, update the script to use
`playwright test --project=smoke` or Playwright's `--tag` flag and retire the grep approach.

---

### 5 — TypeScript configuration impact

When `tsconfig.json` changes, assess the impact on each skill:

| tsconfig change | Skills affected | Action required |
|-----------------|-----------------|-----------------|
| `target` downgraded (e.g. ES2021) | `pom-architect` | R2 (getters) may become optional — review |
| `strict` disabled | `spec-code-standard`, `pom-architect` | Rules enforcing type safety become less critical |
| New path alias added | `spec-code-standard`, `pom-architect` | Add alias to the Path Alias Map in both skills |
| Path alias removed | `spec-code-standard`, `pom-architect` | Remove alias; update auto-fix guidance |
| `moduleResolution` changed | All skills | Re-verify import resolution examples |

---

### 6 — Breaking change propagation

When a shared contract changes (BasePage, fixture pattern, ENV, auth.data), multiple
skills are affected. Use this impact table to identify what to update:

| Changed component | Skills to update | What to check |
|-------------------|-----------------|---------------|
| `BasePage` API | `pom-architect` | R1 (extends), R5 (navigate) |
| `src/fixtures/index.ts` pattern | `spec-code-standard` | R3 (no manual beforeEach), R4 (fixture registration) |
| `src/data/auth.data.ts` structure | `spec-code-standard`, `pom-architect` | R7/R8 (credential references) |
| `src/config/env.ts` (new ENV var) | `spec-code-standard`, `pom-architect` | Update data hygiene examples |
| `playwright.config.ts` (testDir) | `spec-organisation-standard` | R1 folder structure root |

---

### 7 — Rule and mode deprecation process

When a rule or mode no longer applies to the active project:

1. Mark it inline: `[DEPRECATED — reason — YYYY-MM]`
2. Keep it for one full module cycle (do not auto-fix deprecated rules)
3. Remove it at the start of the following module and add a note to the ADR
4. Update the Sub-Skill Registry rule count

Never delete a deprecated item immediately — the history supports future ADR decisions.

---

### 8 — Inter-skill execution order

Some skills produce output that other skills depend on. When running the Full Pipeline
(Mode 1), maintain this execution order:

```
1. pom-architect      ← establishes correct PO layer (pages, components)
2. spec-code-standard     ← validates spec code quality (imports, fixtures)
3. spec-organisation-standard     ← validates spec organisation (requires spec-code-standard clean)
4. git-standards      ← validates git state (run last, before push/PR)
```

If `pom-architect` produces violations that are not fixed, `spec-organisation-standard` and
`spec-code-standard` may report false positives (e.g., a missing PO method triggers
a spec-code-standard violation).
```

---

### Updates to Mode 1 — Full Pipeline

In the existing Mode 1 steps, update step 4 to include `spec-organisation-standard`:

```markdown
4. Run `spec-organisation-standard` on spec files:
   - Detect all TC organisation violations
   - Auto-fix every fixable violation (R1–R5)
   - Collect remaining manual items
```

And update the output format to include the new skill:

```
[automation-architect] PIPELINE COMPLETE
─────────────────────────────────────────
pom-architect:    X violations found — Y auto-applied
spec-code-standard:   X violations found — Y auto-applied
spec-organisation-standard:   X violations found — Y auto-applied
Remaining manual fixes: <list if any, or "none">
[automation-architect] ✅ All rules satisfied.
```


---

### Add Rule 6 to Hub Growth Policy section

Append this rule to the existing `## Hub Growth Policy` section:

```markdown
**Rule 6 — Update README when the architecture changes.**
The following events require a README update before or alongside the PR that
introduces the change. Load `automation-architect` and trigger Mode 5 to apply it.

| Event | README sections affected |
|-------|--------------------------|
| New skill added or retired | §9 Kiro AI Skills, §6 Repository Structure |
| New mode added to hub | §9 Kiro AI Skills |
| New folder added to project | §6 Repository Structure |
| New npm script added | §5 Available Commands |
| Git conventions change | §10 Git Workflow |
| New framework pattern introduced | §7 Framework Architecture |
| New course module completes | §2 Learning Path |
```

---

### Add Mode 5 to automation-architect/SKILL.md

Append the following after Mode 4. Update the mode-slot comment in the `## Modes`
section header to `(5 of 10 slots used)`.

---

### Mode 5 — README Sync

**Triggers:** `"update readme"` · `"sync readme"` · `"readme out of date"` · `"update docs"`

**When to use:** After adding a skill, adding a mode, changing the project structure,
or completing a course module. Also triggered automatically by `git-standards` C4
when architectural files change in a branch without a corresponding README update.

**Tracked sections and their sources:**

| README section | Source of truth |
|----------------|-----------------|
| §3 Prerequisites | `package.json` devDependencies + `.kiro/` presence |
| §5 Available Commands | `package.json` scripts |
| §6 Repository Structure | Actual folder tree + `.kiro/skills/` directories |
| §7 Framework Architecture | `src/ui/pages/BasePage.ts` · `src/fixtures/index.ts` |
| §9 Kiro AI Skills | `.kiro/skills/*/SKILL.md` frontmatter (name + description) |
| §10 Git Workflow | `git-standards` SKILL.md conventions |

Sections NOT tracked by this mode (manual updates only):
- §1 Description · §2 Learning Path · §4 Quick Start · §8 Environment Setup · §11 Contribution Guidelines

**Steps:**

1. Read `README.md`
2. For each tracked section, compare against the source of truth:
   - **§3 Prerequisites**: check if `@playwright/test`, `typescript`, `dotenv` versions
     in `package.json` match what README states; check if Kiro IDE is listed
   - **§5 Commands**: diff `package.json` scripts against the README commands table
   - **§6 Repository Structure**: list actual top-level folders + `.kiro/skills/`
     directories; compare against the README tree
   - **§7 Architecture**: read `BasePage.ts` constructor and `navigate()` signature;
     verify the code example in README matches
   - **§9 Kiro AI Skills**: list all `SKILL.md` files under `.kiro/skills/`; read each
     frontmatter `name` and `description`; compare against the README skills table
   - **§10 Git Workflow**: read branch pattern and commit types from `git-standards`
     SKILL.md; compare against README examples
3. For each section with a detected difference: update the README section in place
4. For sections that are in sync: leave unchanged

**Output:**

```
[automation-architect] README SYNC
─────────────────────────────────────────
§3 Prerequisites:     IN SYNC | UPDATED
§5 Commands:          IN SYNC | UPDATED — added 'test:regression'
§6 Structure:         IN SYNC | UPDATED — added 'src/api/' folder entry
§7 Architecture:      IN SYNC
§9 Kiro AI Skills:    IN SYNC | UPDATED — added 'git-standards' row
§10 Git Workflow:     IN SYNC
─────────────────────────────────────────
[automation-architect] ✅ README is up to date.
                     OR
[automation-architect] README updated — <N> section(s) changed.
```

**Note:** This mode only updates the tracked sections listed above. Sections marked
as manual-only (Learning Path, Quick Start, etc.) are reported as out-of-scope if
the user asks about them.

