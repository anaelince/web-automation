---
name: automation-architect
description: >
  Hub skill that orchestrates ui-pom-standard, spec-code-standard, spec-organisation-standard,
  git-workflow-docs-standard, api-setup-teardown-standard, and spec-quality-lifecycle-standard
  (the TC lifecycle orchestrator, which in turn coordinates spec-requirements-standard,
  spec-data-standard and ui-locator-wait-standard) for Playwright + TypeScript projects. Use for full architecture enforcement (review + auto-fix)
  on existing files, or to scaffold new Page Objects, fixtures, spec files, and API layer
  following all agreed patterns. Invoke sub-skills independently for targeted checks.
---

## Project Context

> **Reference steering files** (load with `#` when needed for detailed specs):
> - `#framework-reference` — **loads all four framework steering files at once** (recommended for full context)
> - `#framework-path-aliases` — full alias map with site-based path patterns
> - `#framework-playwright-config` — playwright.config.ts settings and npm scripts
> - `#framework-tech-stack` — dependency versions and TypeScript compiler settings
> - `#framework-basepage-contract` — BasePage class contract and locator rules

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
| `@pages/*` | `src/ui/pages/*` | ui-pom-standard, spec-code-standard |
| `@components/*` | `src/ui/components/*` | ui-pom-standard |
| `@fixtures` | `src/fixtures/index` (shared base) | spec-code-standard |
| `@fixtures/*` | `src/fixtures/*` (specs: `@fixtures/sites/{site}/{site}.fixtures`) | spec-code-standard |
| `@data/*` | `src/data/*` | spec-code-standard, ui-pom-standard |
| `@config/*` | `src/config/*` | spec-code-standard |
| `@helpers/*` | `src/helpers/*` | (reserved for future helpers) |
| `@api/*` | `src/api/*` | (reserved for API layer) |

### Project folder structure

```
src/
  ui/
    pages/          ← Page Objects       (ui-pom-standard, ui-locator-wait-standard)
    components/     ← UI Components      (ui-pom-standard, ui-locator-wait-standard)
  fixtures/         ← Playwright fixtures (spec-code-standard)
  data/             ← Test data files     (spec-code-standard, ui-pom-standard)
  config/           ← Env config (ENV.ts) (spec-code-standard, ui-pom-standard)
  helpers/          ← Shared utilities    (future)
  api/              ← API client layer    (api-setup-teardown-standard)
                      client/       ← ApiClient (HTTP entry point)
                      endpoints/    ← URL constants per resource
                      models/       ← Request/response interfaces
                      controllers/  ← Business operations
                      mocks/        ← Route stub factories
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

---

## Hub Growth Policy

The following rules are **mandatory** for maintaining this hub skill. They must not be removed
or modified without a team ADR.

**Rule 1 — Add a mode only for a real gap.**
A new mode is justified only when no existing mode (1–N) can detect the problem it targets.
Before adding a mode, state explicitly which existing modes were considered and why they
do not cover the gap.

**Rule 2 — Document the gap in an ADR first.**
Every new mode must be preceded by an ADR in `docs/decisions/` recording: the gap, the
options considered (extending an existing mode vs. adding a new one), and the decision.
The mode is not added until the ADR exists.

**Rule 3 — One domain per mode.**
Each mode targets exactly one domain (e.g., git conventions, lifecycle process, refactor
guidance). A mode that detects across multiple unrelated domains must be split or merged
into the closest existing mode.

**Rule 4 — Maximum 10 modes.**
If a new mode would exceed 10 total modes, the team must first review existing modes for
consolidation opportunities before adding. This limit exists to keep the SKILL.md within
a size that an LLM agent can process reliably in a single context window.

**Rule 5 — Retire modes that no longer apply.**
When a module's scope is complete and a mode is no longer relevant, mark it `[RETIRED]`
in the SKILL.md with the reason. Do not delete — the history is part of the ADR record.

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

---

## Sub-Skill Registry

Single source of truth for all skills in this framework. Update this table whenever
a skill is added, updated, or retired.

| Skill | Domain | File Scope | Rules / Checks | Added | Status |
|-------|--------|-----------|----------------|-------|--------|
| `ui-pom-standard` | Page Object structure | `src/ui/pages/**/*.ts` · `src/ui/components/**/*.ts` | R1–R8 | M4 | Active |
| `spec-code-standard` | Spec code quality | `tests/**/*.spec.ts` · `src/fixtures/sites/{site}/{site}.fixtures.ts` | R1–R9 | M4 | Active |
| `spec-organisation-standard` | Spec organisation & lifecycle | `tests/**/*.spec.ts` | R1–R5 | M5 | Active |
| `git-workflow-docs-standard` | Git workflow | git state (no files) | C1–C3, E1–E5 | M5 | Active |
| `api-setup-teardown-standard` | API layer structure · setup/teardown · fixture injection | `src/api/**/*.ts` · `src/fixtures/sites/{site}/{site}.fixtures.ts` · `tests/**/*.spec.ts` | R1–R8 | M6 | Active |
| `spec-quality-lifecycle-standard` | TC lifecycle orchestrator · preconditions · assertions · independence | `tests/**/*.spec.ts` · `src/ui/pages/**/*.ts` | R1–R10 (R3, R5 delegated) | M7 | Active |
| `ui-locator-wait-standard` | Locator strategy · uniqueness · action semantics · waits · polling · timeouts (lifecycle phases 3 Act · 5 Run) | `src/ui/pages/**` · `src/ui/components/**` · `tests/**/*.spec.ts` · `src/fixtures/**` · `playwright.config.ts` | R1–R20 · M0–M6 | M7 | Active |
| `spec-requirements-standard` | TC specification: traceability · preconditions · data · oracles · postconditions · readiness (lifecycle phase 1 · Specify) | `docs/test-cases/**/*.md` | Q1–Q13 · M0–M4 | M6 | Active |
| `spec-data-standard` | Test data: classification · isolation · sourcing · environments · expected values (lifecycle phases 2 Arrange · 4 Assert · 5 Run) | `src/data/**` · `src/config/**` · `src/fixtures/**` · `playwright.config.ts` · `tests/**/*.spec.ts` | R1–R15 · M0–M5 | M6 | Active |

### Scan scope ownership

Each file type is owned by exactly one skill for each concern. No two skills should
check the same property on the same file.

| File / Scope | Owner skill | Concern |
|--------------|-------------|---------|
| `src/ui/pages/**/*.ts` | `ui-pom-standard` | POM structure (getters, async actions) |
| `src/ui/components/**/*.ts` | `ui-pom-standard` | Component structure |
| `src/fixtures/sites/{site}/{site}.fixtures.ts` | `spec-code-standard` | Fixture completeness, import hygiene |
| `tests/**/*.spec.ts` — imports, fixtures, credentials | `spec-code-standard` | Code quality |
| `tests/**/*.spec.ts` — site layer placement | `spec-code-standard` | R9 correct site folder |
| `src/ui/pages/**/*.ts` — site placement | `spec-code-standard` | R9 correct site folder |
| `src/api/**/*.ts` — site placement | `spec-code-standard` | R9 correct site folder |
| `src/data/**/*.ts` — site placement | `spec-code-standard` | R9 correct site folder |
| `tests/**/*.spec.ts` — folder, naming, TC IDs, steps | `spec-organisation-standard` | Organisation |
| `src/**/*.ts` (non-PO, non-fixture) | `spec-code-standard` | Import hygiene only |
| git branch + commit history | `git-workflow-docs-standard` | Workflow conventions |
| `src/api/client/**/*.ts` | `api-setup-teardown-standard` | HTTP entry point contract |
| `src/api/controllers/**/*.ts` | `api-setup-teardown-standard` | Controller structure and dependencies |
| `src/api/endpoints/**/*.ts` | `api-setup-teardown-standard` | URL centralisation |
| `src/api/models/**/*.ts` | `api-setup-teardown-standard` | Interface placement |
| `src/api/mocks/**/*.ts` | `api-setup-teardown-standard` | Route stub structure |
| `src/fixtures/sites/{site}/{site}.fixtures.ts` — teardown contract | `api-setup-teardown-standard` | Setup/teardown pairing (R4) |
| `src/fixtures/sites/{site}/{site}.fixtures.ts` — lifecycle fixture naming | `api-setup-teardown-standard` | Naming convention (R8) |
| `tests/**/*.spec.ts` — controller/client instantiation | `api-setup-teardown-standard` | No lifecycle instantiation in specs (R7) |
| `tests/**/*.spec.ts` — preconditions/postconditions | `spec-quality-lifecycle-standard` | R1, R2 |
| `tests/**/*.spec.ts` — assertion quality | `spec-quality-lifecycle-standard` | R4, R6, R9, R10 |
| `tests/**/*.spec.ts` — test independence | `spec-quality-lifecycle-standard` | R7, R8 |
| `src/ui/pages/**/*.ts` — locator expression and actions | `ui-locator-wait-standard` | R1–R12 (replaces `spec-quality-lifecycle-standard` R5) |
| `tests/**/*.spec.ts` — waits and synchronisation | `ui-locator-wait-standard` | R13–R16 (replaces `spec-quality-lifecycle-standard` R3) |
| `tests/**/*.spec.ts` · `src/fixtures/**` — polling and timeouts | `ui-locator-wait-standard` | R17–R20 |
| `playwright.config.ts` — test-id contract, timeout layers | `ui-locator-wait-standard` | R1, R19 |
| `docs/test-cases/**/*.md` — specification content quality | `spec-requirements-standard` | Q1–Q13 (Mode 5 syncs rows only) |
| `src/data/**` — shape, typing, uniqueness | `spec-data-standard` | R2, R3, R6 |
| `src/config/**` — environment selection and validation | `spec-data-standard` | R9 |
| `src/fixtures/**` — fixture scope and data identity | `spec-data-standard` | R1, R12 |
| `playwright.config.ts` — parallelism suppression | `spec-data-standard` | R4 |
| `tests/**/*.spec.ts` — data sourcing, env literals, data tags, expected-value source | `spec-data-standard` | R5, R7, R8, R10, R11, R13, R14 |

---

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
| `getByRole` / `getByLabel` / `getByText` / `getByTestId` / `getByAltText` / `getByTitle` · `testIdAttribute` | 1.27 | `ui-locator-wait-standard` R1 |
| `expect.poll` with `intervals` · `expect().toPass` | 1.29 (`toPass` 1.29+) | `ui-locator-wait-standard` R17 |
| `locator.pressSequentially()` (replaces deprecated `type()`) | 1.38 | `ui-locator-wait-standard` R9 |

**Migration note:** The current `test:smoke` script uses `--grep @smoke` (regex-based).
When `spec-organisation-standard` adds native tag rules, update the script to use
`playwright test --project=smoke` or Playwright's `--tag` flag and retire the grep approach.

---

### 5 — TypeScript configuration impact

When `tsconfig.json` changes, assess the impact on each skill:

| tsconfig change | Skills affected | Action required |
|-----------------|-----------------|-----------------|
| `target` downgraded (e.g. ES2021) | `ui-pom-standard` | R2 (getters) may become optional — review |
| `strict` disabled | `spec-code-standard`, `ui-pom-standard` | Rules enforcing type safety become less critical |
| New path alias added | `spec-code-standard`, `ui-pom-standard` | Add alias to the Path Alias Map in both skills |
| Path alias removed | `spec-code-standard`, `ui-pom-standard` | Remove alias; update auto-fix guidance |
| `moduleResolution` changed | All skills | Re-verify import resolution examples |

---

### 6 — Breaking change propagation

When a shared contract changes (BasePage, fixture pattern, ENV, auth.data), multiple
skills are affected. Use this impact table to identify what to update:

| Changed component | Skills to update | What to check |
|-------------------|-----------------|---------------|
| `BasePage` API | `ui-pom-standard` | R1 (extends), R5 (navigate) |
| `src/fixtures/sites/{site}/{site}.fixtures.ts` pattern | `spec-code-standard` | R3 (no manual beforeEach), R4 (fixture registration) |
| `src/data/auth.data.ts` structure | `spec-code-standard`, `ui-pom-standard` | R7/R8 (credential references) |
| `src/config/env.ts` (new ENV var) | `spec-code-standard`, `ui-pom-standard` | Update data hygiene examples |
| `playwright.config.ts` (testDir) | `spec-organisation-standard` | R1 folder structure root |
| `src/config/env.ts` (`TEST_ENV` / new variable) | `spec-data-standard`, `spec-code-standard` | R9, credential examples |
| `playwright.config.ts` (`testIdAttribute` / timeouts) | `ui-locator-wait-standard`, `ui-pom-standard` | R1, R19, PO getter examples |

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
0. spec-requirements-standard ← reports TC specification quality (report only, Q13 auto-fix)
1. ui-pom-standard          ← establishes correct PO layer (pages, components)
2. ui-locator-wait-standard ← validates locators, actions, waits, polling (requires PO structure clean)
3. spec-code-standard       ← validates spec code quality (imports, fixtures)
4. spec-organisation-standard ← validates spec organisation (requires spec-code-standard clean)
5. api-setup-teardown-standard ← validates API layer and teardown contract
6. spec-data-standard       ← validates data isolation, sourcing, environments
7. spec-quality-lifecycle-standard ← validates TC body quality, assertions, flakiness
8. git-workflow-docs-standard ← validates git state (run last, before push/PR)
```

If `ui-pom-standard` produces violations that are not fixed, `spec-organisation-standard` and
`spec-code-standard` may report false positives (e.g., a missing PO method triggers
a spec-code-standard violation).

---

## Modes (7 of 10 slots used)

### Mode 1 — Full Pipeline (default)

**Triggers:** `"aplicar arquitectura"` · `"apply architecture"` · `"full review"` · `"enforce all rules"`

**When to use:** After writing or refactoring any Page Object, spec, or fixture file.
This is the default mode — when in doubt, run this.

**Steps:**
0. Run `spec-requirements-standard` M0 on `docs/test-cases/**` (report only; auto-fix Q13).
   TCs graded Incomplete are listed as manual items
1. Discover all `.ts` files under `src/` and `tests/`
2. Classify each file: `PAGE_OBJECT`, `COMPONENT`, `FIXTURE`, `SPEC`, `DATA`, `CONFIG`, `OTHER`
3. Run `ui-pom-standard` on Page Objects, components, and any spec that calls `page.*` directly:
   - Detect all POM violations
   - Auto-fix every fixable violation (R1–R8)
   - Collect remaining manual items
4. Run `ui-locator-wait-standard` (M1–M5 rules) on Page Objects, specs, fixtures and config:
   - Auto-fix R1 (test-id contract), R9, R11, R13, R15, R16, R20
   - Collect R1–R8, R10, R12, R14, R17–R19 as manual fixes
5. Run `spec-code-standard` on spec files and `src/fixtures/sites/{site}/{site}.fixtures.ts`:
   - Detect all test writing violations
   - Auto-fix every fixable violation (R1–R8)
   - Collect remaining manual items
6. Run `spec-organisation-standard` on spec files:
   - Detect all TC organisation violations
   - Auto-fix every fixable violation (R1–R5)
   - Collect remaining manual items
7. Run `api-setup-teardown-standard` on `src/api/` and `src/fixtures/sites/{site}/{site}.fixtures.ts` (teardown + injection):
   - Detect all API layer violations
   - Auto-fix every fixable violation (R1–R3, R5–R8)
   - Collect R4 (teardown) items as manual fixes
8. Run `spec-data-standard` (M1–M4 rules) on fixtures, data, config, and specs:
   - Auto-fix R2, R3, R6–R9, R11
   - Collect R1, R4, R5, R10, R12–R14 as manual fixes
9. Run `spec-quality-lifecycle-standard` on `tests/**/*.spec.ts` and `src/ui/pages/**/*.ts`:
   - Detect all TC quality violations
   - Auto-fix every fixable violation (R4)
   - Collect R1, R2, R6–R10 items as manual fixes
10. Emit unified summary report

**Output:**
```
[automation-architect] PIPELINE COMPLETE
─────────────────────────────────────────
ui-pom-standard:                   X violations found — Y auto-applied
ui-locator-wait-standard:          X violations found — Y auto-applied
spec-code-standard:                X violations found — Y auto-applied
spec-organisation-standard:        X violations found — Y auto-applied
api-setup-teardown-standard:       X violations found — Y auto-applied
spec-data-standard:                X violations found — Y auto-applied
spec-quality-lifecycle-standard:   X violations found — Y auto-applied
spec-requirements-standard:        <n>/<total> TCs Ready (report only)
Remaining manual fixes: <list if any, or "none">
[automation-architect] ✅ All rules satisfied.
```

---

### Mode 2 — Structure Only

**Triggers:** `"revisar estructura"` · `"check structure"` · `"verify folders"`

**When to use:** Quick structural health-check without modifying any files.

**Steps:**
1. Check all files are in their correct folder:
   - Page Objects → `src/ui/pages/`
   - Components → `src/ui/components/`
   - Fixtures → `src/fixtures/`
   - Test data → `src/data/`
   - Config/Env → `src/config/`
   - Specs → `tests/`
2. Check all imports in `src/` and `tests/` use path aliases (no `./` or `../`)
3. Report only — **no auto-fix** unless the user explicitly requests it

**Output:**
```
[automation-architect] STRUCTURE CHECK
─────────────────────────────────────────
Folder violations:  X
Import violations:  X
[violations in standard format, or "✅ No structural violations found."]
```

---

### Mode 3 — Scaffold New Page Object

**Triggers:** `"generar"` · `"crear"` · `"scaffold"` · `"nuevo Page Object"` · `"new page"`

**When to use:** Adding a new page or feature that requires a Page Object, fixture, and spec file.

**Steps:**

**Step 0 — Collect parameters** (infer from context; ask only for missing items):
- `pageName` — PascalCase, no path separators (e.g., `Inventory`)
- `urlPath` — relative path starting with `/` (e.g., `/inventory.html`)
- `locators` — list of `{ name, selector }` pairs
- `requiresAuth` — `true` if the page requires an authenticated session

**Step 1 — Generate `src/ui/pages/<Name>Page.ts`:**
- `extends BasePage`
- No constructor (BasePage handles it)
- No `navigate()` override (BasePage handles it)
- All locators as `get` properties (never constructor fields)
- Locator expressions follow the `ui-locator-wait-standard` R1 hierarchy for the resolved
  test-id contract, using only values observed in the DOM (R4)
- All interactions as `async` methods
- All imports via path aliases

**Step 2 — Register fixture in `src/fixtures/sites/{site}/{site}.fixtures.ts`:**

| requiresAuth | Fixture dependency      | Body                                                 |
|--------------|-------------------------|------------------------------------------------------|
| `false`      | `{ page }`              | `new Page(page)` → `po.navigate(urlPath)` → `use(po)` |
| `true`       | `{ authenticatedPage }` | `new Page(authenticatedPage.currentPage)` → `use(po)` |

**Step 3 — Generate `tests/ui/smoke/{feature}/TC{N}-{name}.spec.ts`:**
- Import `test`, `expect` from `@fixtures/sites/{site}/{site}.fixtures`
- Import `users` from `@data/auth.data` if credentials are needed
- One `test.describe('<Feature>', () => { ... })` block (PascalCase of feature folder)
- One placeholder `test('TC{N}: …', async ({ fixture }) => { ... })` inside the describe block
- Use `test.step()` for each logical step group
- Zero relative imports

**Step 4 — Verify generated files:**
- Run `ui-pom-standard` on the new Page Object → assert zero violations
- Run `ui-locator-wait-standard` M1–M4 on the new Page Object and spec → assert zero ERRORs
- Run `spec-code-standard` on the new spec → assert zero violations
- Run `spec-organisation-standard` on the new spec → assert zero violations
- If any violation is found, fix it before reporting SCAFFOLD COMPLETE

**Output:**
```
[automation-architect] SCAFFOLD COMPLETE
─────────────────────────────────────────
Created:  src/ui/pages/<Name>Page.ts
Updated:  src/fixtures/sites/{site}/{site}.fixtures.ts
Created:  tests/ui/smoke/{feature}/TC{N}-{name}.spec.ts
```

**Scaffold example — `InventoryPage` (auth required):**

```typescript
// src/ui/pages/InventoryPage.ts
import { BasePage } from '@pages/BasePage';

// test-id contract: testIdAttribute = 'data-test' (ui-locator-wait-standard R1)
export class InventoryPage extends BasePage {
  get productList() {
    return this.page.getByTestId('inventory-container');
  }

  get addToCartButton() {
    return this.page.getByTestId('add-to-cart-sauce-labs-backpack');
  }

  async addProductToCart(productName: string): Promise<void> {
    await this.page.getByTestId(`add-to-cart-${productName}`).click();
  }
}
```

```typescript
// src/fixtures/sites/{site}/{site}.fixtures.ts — new fixture block added
inventoryPage: async ({ authenticatedPage }, use) => {
  const po = new InventoryPage(authenticatedPage.currentPage);
  await use(po);
},
```

```typescript
// tests/ui/smoke/inventory/TC1-verify-product-list.spec.ts
import { test, expect } from '@fixtures/sites/saucedemo/saucedemo.fixtures';

test.describe('Inventory', () => {
  test('TC1: Verify product list is displayed after login', async ({ inventoryPage }) => {
    await test.step('Verify product list is visible', async () => {
      await expect(inventoryPage.productList).toBeVisible();
    });
  });
});
```

---

### Mode 4 — Git Workflow

**Triggers:** `"check git"` · `"verify commits"` · `"git conventions"` · `"git workflow"` · `"commit push PR"` · `"create PR"`

**When to use:** For any git operation — pre-PR validation or full commit/push/PR workflow.

**Steps:**
1. Load and invoke `git-workflow-docs-standard`
2. Forward all output verbatim

**Note:** Load `git-workflow-docs-standard` directly for standalone git work without activating the hub.

---

### Mode 5 — Docs Sync

**Triggers:** `"update docs"` · `"sync docs"` · `"docs out of date"` · `"update wiki"` ·
`"update readme"` · `"sync readme"` · `"readme out of date"`

**When to use:** After adding a skill, adding a mode, changing the project structure,
adding a new API layer, adding a new TC, or completing a course module. Also triggered
automatically by `git-workflow-docs-standard` C4 when architectural files change without a
corresponding docs update.

**Anti-over-documentation rule:** Only update a section when the **public interface**
of that layer changed (new files, deleted files, renamed exports). Internal refactors,
bug fixes, and test assertion changes do NOT trigger doc updates.

**Trigger map — what changes update what docs:**

| Changed files | Docs to update |
|---------------|----------------|
| `.kiro/skills/**` | README §9 Kiro AI Skills |
| `playwright.config.ts` / `package.json` | README §3 Prerequisites or §5 Commands |
| `src/ui/pages/BasePage.ts` | README §7 Framework Architecture |
| `src/fixtures/sites/{site}/{site}.fixtures.ts` (new fixture type added) | README §7 Framework Architecture |
| Any folder added/removed at top level of `src/` or `tests/` | README §6 Repository Structure |
| `src/api/sites/{site}/` — new controller, endpoint, or model | `docs/wiki/api/{site}-api-layer.md` |
| New `src/api/sites/{site}/` directory | Create `docs/wiki/api/{site}-api-layer.md` |
| New `*.spec.ts` under `tests/ui/smoke/sites/{site}/{feature}/` | `docs/test-cases/{site}/` |
| New `tests/ui/smoke/sites/{site}/` directory | Create `docs/test-cases/{site}/` |
| `git-workflow-docs-standard` SKILL.md conventions changed | README §10 Git Workflow |

**Steps:**

1. Run `git diff origin/main...HEAD --name-only` (or compare current state if not on a branch)
2. Apply the Trigger Map: collect which doc files need updating
3. For each stale README section — compare against source of truth and update in place:
   - **§3 Prerequisites**: `package.json` devDependencies + `.kiro/` presence
   - **§5 Commands**: `package.json` scripts
   - **§6 Repository Structure**: actual folder tree + `.kiro/skills/` directories
   - **§7 Architecture**: `BasePage.ts` + `src/fixtures/` (shared `index.ts` + `sites/{site}/{site}.fixtures.ts`) fixture types
   - **§9 Kiro AI Skills**: `.kiro/skills/*/SKILL.md` frontmatter (name + description)
   - **§10 Git Workflow**: `git-workflow-docs-standard` SKILL.md conventions
4. For each stale `docs/wiki/api/{site}-api-layer.md`:
   - Read the current doc and the current source files in `src/api/sites/{site}/`
   - Update only the sections whose source content changed (methods added/removed, new models)
   - Do NOT rewrite unchanged sections
5. For each new TC file under `tests/ui/smoke/sites/{site}/{feature}/`:
   - Check if `docs/test-cases/{site}/` exists; create it if not
   - Add a row for each new `test()` found; remove rows for deleted tests
6. Leave all sections that are already in sync untouched

Sections NOT tracked (manual updates only):
- §1 Description · §2 Learning Path · §4 Quick Start · §8 Environment Setup · §11 Contribution Guidelines

**Output:**

```
[automation-architect] DOCS SYNC
─────────────────────────────────────────
README.md:
  §3 Prerequisites:                 IN SYNC
  §5 Commands:                      IN SYNC | UPDATED — added 'test:regression'
  §6 Structure:                     IN SYNC | UPDATED — added 'src/api/' folder entry
  §7 Architecture:                  IN SYNC
  §9 Kiro AI Skills:                IN SYNC | UPDATED — added 'api-setup-teardown-standard' row
  §10 Git Workflow:                 IN SYNC

Wiki:
  docs/wiki/api/demoqa-api-layer.md IN SYNC | UPDATED — BookController.deleteBook added
  docs/wiki/api/saucedemo-api.md    SKIPPED — no src/api/sites/saucedemo/ exists yet

Test cases:
  docs/test-cases/demoqa/           IN SYNC | UPDATED — TC02 entry added
─────────────────────────────────────────
[automation-architect] ✅ All documentation is up to date.
                     OR
[automation-architect] Documentation updated — <N> file(s) changed.
```

**Note:** This mode only updates sections listed in the Trigger Map. Changes that are
internal (bug fixes, refactors, assertion tweaks) are intentionally ignored to prevent
documentation churn.

---

### Mode 6 — Lifecycle Infrastructure

**Triggers:** `"setup api layer"` · `"scaffold api"` · `"new controller"` · `"add lifecycle support"` · `"lifecycle architect"`

**When to use:** When implementing API-based setup or teardown for a test case,
or when extending an existing API layer with a new resource.

**Steps:**
1. Load and invoke `api-setup-teardown-standard`
2. Determine mode automatically:
   - `src/api/` does not exist → **New**
   - `src/api/` exists and resource has no controller → **Add**
3. Forward all output verbatim

**Note:** Load `api-setup-teardown-standard` directly for standalone API layer work
without activating the hub.

---

### Mode 7 — TC Lifecycle & Quality

**Triggers:** `"review tc quality"` · `"check test quality"` · `"scan for flaky patterns"` ·
`"tc quality"` · `"write tc"` · `"create tc"` · `"tc lifecycle"` ·
`"assess test cases"` · `"refine test case"` · `"write test case"` · `"tc coverage"` ·
`"data robustness"` · `"parallel safe"` · `"multi environment"` · `"assess test data"` ·
`"verify robustness"` · `"review locators"` · `"fix waits"` · `"assess locators"` ·
`"strict mode violation"` · `"polling"` · `"verify interactions"` · `"flaky interaction"`

**When to use:** Any work on a test case, from its specification to verified automation:
writing or refining TC documents, writing or refactoring specs, intermittent failures,
failures only in parallel or in one environment, and before every PR with new or modified specs.

**Steps:**
1. Load and invoke `spec-quality-lifecycle-standard` (TC lifecycle orchestrator)
2. Determine mode:
   - `"tc lifecycle <TC>"` → Lifecycle mode (phases 1–5: Specify · Arrange · Act · Assert · Run)
   - TC specification triggers → phase 1, `spec-requirements-standard`
   - Data robustness triggers → phases 2, 4 (M4) and 5 (M5), `spec-data-standard`
   - Locator and wait triggers → phase 3 Act (M0–M5) and phase 5 Run (M6), `ui-locator-wait-standard`
   - Single file provided → Enforce on that file only
   - `"write tc"` or `"create tc"` trigger → Create mode
   - No file provided → Enforce on all `tests/**/*.spec.ts`
3. Forward all output verbatim

**Note:** Load `spec-quality-lifecycle-standard` directly for standalone TC quality review
without activating the hub. As a domain orchestrator, it internally coordinates
`ui-pom-standard` (POM structure), `ui-locator-wait-standard` (locators and waits)
and `api-setup-teardown-standard` (teardown) for
their respective concerns.

---

```
[skill-name] SEVERITY — RULE_NAME
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED
```

---

## Error Handling

| Scenario                             | Response                                                                 |
|--------------------------------------|--------------------------------------------------------------------------|
| File not found during scan           | Skip it; emit WARNING with `Issue: File not found during scan`           |
| Ambiguous or unverified locator      | Apply `ui-locator-wait-standard` R1; value not observed in DOM → getter with `// TODO: verify locator in DOM` (R4) |
| Fixture already registered           | Skip insertion; emit `WARNING — PO_REGISTERED_IN_FIXTURE: already exists`|
| No alias covers a relative import    | Do not auto-apply; report as manual fix with tsconfig.json edit guidance  |
| `authenticatedPage` fixture missing  | Auto-create it using `users.appUser` credentials; report as AUTO-APPLIED  |

---

## Sub-Skill Invocation Reference

To run a sub-skill independently, load it and invoke it by name:

| Goal | Skill to load | Trigger phrase example |
|------|---------------|------------------------|
| Fix POM violations only | `ui-pom-standard` | `"review page objects"` |
| Fix import / test structure only | `spec-code-standard` | `"check test files"` |
| Fix TC folder / naming / step violations | `spec-organisation-standard` | `"check spec structure"` |
| Validate git conventions or run full git workflow | `git-workflow-docs-standard` | `"check git"` / `"git workflow"` |
| Scaffold or extend the API layer for setup/teardown | `api-setup-teardown-standard` | `"scaffold api for books"` |
| Review TC quality and anti-flakiness patterns | `spec-quality-lifecycle-standard` | `"review tc quality"` |
| Write a new test case with quality built-in | `spec-quality-lifecycle-standard` | `"write tc"` |
| Take one TC from specification to verified automation | `spec-quality-lifecycle-standard` | `"tc lifecycle TC02"` |
| Score TC specifications | `spec-requirements-standard` | `"assess test cases"` |
| Upgrade an incomplete TC specification | `spec-requirements-standard` | `"refine test case TC02"` |
| Assess test data maturity | `spec-data-standard` | `"assess test data"` |
| Make tests safe in parallel | `spec-data-standard` | `"parallel safe"` |
| Verify robustness with evidence | `spec-data-standard` | `"verify robustness"` |
| Assess locator and wait maturity | `ui-locator-wait-standard` | `"assess locators"` |
| Fix fragile locators / strict-mode violations | `ui-locator-wait-standard` | `"review locators"` |
| Replace fixed waits / add bounded polling | `ui-locator-wait-standard` | `"fix waits"` |
| Prove interactions are stable with evidence | `ui-locator-wait-standard` | `"verify interactions"` |
| Run everything | `automation-architect` | `"apply architecture"` |
| Check folders + imports only | `automation-architect` | `"check structure"` |
| Generate new PO + fixture + spec | `automation-architect` | `"scaffold InventoryPage"` |
| Sync README with current project state | `automation-architect` | `"update readme"` |


