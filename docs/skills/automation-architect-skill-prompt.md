# Meta-prompt: Generate the automation-architect skill system

Use this prompt with a custom-agent-creator or directly with Kiro to recreate the full skill system for a Playwright + TypeScript automation project.

---

## Prompt

Create a Kiro skill system for a Playwright + TypeScript test automation project with the following structure:

### Skill system overview

Three skills:
1. `pom-architect` — enforces Page Object Model rules
2. `spec-code-standard` — enforces test writing and organisation rules
3. `automation-architect` — hub that orchestrates the other two

Each skill must:
- Have a `SKILL.md` file with valid YAML frontmatter (`name`, `description`)
- Detect violations AND auto-apply fixes when possible
- Output violations in this format:
  ```
  [skill-name] SEVERITY — RULE NAME
  File:  <path>
  Line:  <number>
  Issue: <one sentence>
  Fix:   <one sentence> | AUTO-APPLIED
  ```

---

## Skill 1: pom-architect

**File:** `.kiro/skills/pom-architect/SKILL.md`

**Frontmatter description:**
> Enforce and auto-apply Page Object Model rules for Playwright + TypeScript projects. Detects violations and fixes them: locators as getters, actions as async methods, no direct page usage in test bodies, assertions only in specs, navigate() using baseURL. Load when creating, reviewing, or refactoring Page Objects or spec files.

**Rules to enforce and auto-fix:**

1. **All Page Objects extend BasePage** — Never define constructor or `navigate()` directly in a Page Object.

   `BasePage` must exist at `src/ui/pages/BasePage.ts`:
   ```typescript
   import { Page } from '@playwright/test';
   export abstract class BasePage {
     constructor(protected readonly page: Page) {}
     async navigate(path: string = '/'): Promise<void> {
       await this.page.goto(path);
     }
   }
   ```
   All Page Objects: `export class LoginPage extends BasePage { ... }` — only getters and action methods.
   Auto-fix: Add `extends BasePage`, remove duplicate constructor and navigate().

2. **Locators as getters** — Page Object locators must be `get` properties, never constructor-initialized fields.
   - Reason: Playwright Locators are lazy; ES2022 `useDefineForClassFields: true` causes `this.page` to be undefined during class field initialization.
   - Auto-fix: Convert constructor-initialized locators to `get` properties.

2. **Locators as getters** — UI interactions must be encapsulated in `async` methods in the PO, never called directly in spec files.
   - Auto-fix: Extract interaction sequences from spec files into PO methods.

3. **Actions as async methods** — All interactions go through the Page Object.
   - Exception: `page.goto()` in `beforeEach` only when no fixture handles navigation.
   - Auto-fix: Replace direct `page.*` calls in test body with PO method calls.

4. **No direct `page.*` in test body** — Must use `'/'` or a relative path, never a hardcoded full URL.
   - Auto-fix: Replace hardcoded URLs with `'/'`.

5. **`navigate()` uses baseURL** — POs must not contain `expect()` unless method name starts with `assert` and has JSDoc.
   - Post-action locators needed for assertions must be public `get` properties.
   - Auto-fix: Move `expect()` to spec; expose locators as public getters.

6. **`expect()` only in spec files**
   - Page Objects → `src/ui/pages/`
   - Components → `src/ui/components/`
   - Fixtures → `src/fixtures/`
   - Test data → `src/data/`
   - Config/Env → `src/config/`
   - Auto-fix: Move files to correct folder and update all imports.

7. **Correct folder placement:**
   - Page Objects → `src/ui/pages/`
   - Components → `src/ui/components/`
   - Fixtures → `src/fixtures/`
   - Test data → `src/data/`
   - Config/Env → `src/config/`
   - Auto-fix: Move files to correct folder and update all imports.

8. **No hardcoded credentials or test data in Page Objects** — Parametrize or use data files.
   - Auto-fix: Replace hardcoded values with parameters.

**File:** `.kiro/skills/spec-code-standard/SKILL.md`

**Frontmatter description:**
> Enforce and auto-apply test writing and organisation standards for Playwright + TypeScript projects. Covers import hygiene (path aliases), fixture pattern, test structure, test independence, and data hygiene. Load when writing, reviewing, or refactoring spec files or fixture files.

**Rules to enforce and auto-fix:**

1. **Path aliases on all imports (universal rule — no exceptions)** — Every import in `src/` and `tests/` must use a path alias. Relative paths (`../`, `./`) are forbidden everywhere.

   Aliases (defined in `tsconfig.json`):
   | Alias | Resolves to |
   |---|---|
   | `@pages/*` | `src/ui/pages/*` |
   | `@components/*` | `src/ui/components/*` |
   | `@fixtures` | `src/fixtures/index` |
   | `@fixtures/*` | `src/fixtures/*` |
   | `@data/*` | `src/data/*` |
   | `@config/*` | `src/config/*` |
   | `@helpers/*` | `src/helpers/*` |
   | `@api/*` | `src/api/*` |

   Auto-fix: Replace all relative imports with their path alias equivalent.

2. **Import `test` and `expect` from `@fixtures`** — Spec files must not import from `@playwright/test` directly.
   - Exception: `src/fixtures/index.ts` itself re-exports `expect` from `@playwright/test`.
   - Auto-fix: Replace `@playwright/test` import in spec files with `@fixtures`.

3. **No manual `beforeEach` for Page Object initialisation** — That is the fixture's responsibility.
   - Auto-fix: Extract `beforeEach` PO initialisation into `src/fixtures/index.ts`.

4. **New Page Objects registered in fixture with correct auth dependency:**
   - No auth required → depends on `{ page }`, calls `navigate()` before `use()`
   - Auth required → depends on `{ authenticatedPage }`, does NOT call navigate again

   `authenticatedPage` fixture MUST always exist in `src/fixtures/index.ts`:
   ```typescript
   authenticatedPage: async ({ page }, use) => {
     const lp = new LoginPage(page);
     await lp.navigate();
     await lp.login(users.appUser.username, users.appUser.password);
     await use(lp);
   }
   ```
   Playwright destroys the browser context after each test — no logout needed.
   Auto-fix: Register fixture with correct dependency; create `authenticatedPage` if missing.

5. **Tests wrapped in `describe` with descriptive names** — Every `test()` must be inside `test.describe()`.
   - Describe name = feature or page name.
   - Test name = expected behaviour (not the action).
   - Auto-fix: Wrap bare `test()` calls in `describe`; rename generic names like `'test'`.

6. **No cross-spec imports** — Specs must not import from other spec files.
   - Shared data → `src/data/`. Shared setup → `src/fixtures/`.
   - Auto-fix: Move shared data to `src/data/` and update imports.

7. **No hardcoded credentials in specs** — Must come from `users.*` (from `@data/auth.data`) or `Env.*` (from `@config/Env`).
   - Auto-fix: Replace string literals with `users.appUser.username` / `users.appUser.password`.

8. **Only `@playwright/test` as test framework** — No jest, mocha, chai, or any other test utility.
   - Auto-fix: Replace non-Playwright imports with `@playwright/test` equivalents.

---

## Skill 3: automation-architect (hub)

**File:** `.kiro/skills/automation-architect/SKILL.md`

**Frontmatter description:**
> Hub skill that orchestrates pom-architect and spec-code-standard for Playwright + TypeScript projects. Use for full architecture enforcement (review + auto-fix) on existing files, or to scaffold new Page Objects, fixtures, and spec files following all agreed patterns. Invoke sub-skills independently for targeted checks.

---

### Hub Growth Policy (MUST be included in SKILL.md)

The hub grows by adding new modes as the course progresses (M5 adds Modes 4–6, later modules may add more). To prevent uncontrolled growth and context overload, the following rules are **mandatory** and must be documented inside `automation-architect` `SKILL.md`:

**Rule 1 — Add a mode only for a real gap.**
A new mode is justified only when no existing mode (1–N) can detect the problem it targets. Before adding a mode, state explicitly which existing modes were considered and why they do not cover the gap.

**Rule 2 — Document the gap in an ADR first.**
Every new mode must be preceded by an ADR in `docs/decisions/` that records: the gap, the options considered (including extending an existing mode vs. adding a new one), and the decision. The mode is not added until the ADR exists.

**Rule 3 — One domain per mode.**
Each mode targets exactly one domain (e.g., git conventions, lifecycle process, refactor guidance). A mode that detects across multiple unrelated domains must be split or merged into the closest existing mode.

**Rule 4 — Maximum 10 modes.**
If a new mode would exceed 10 total modes, the team must first review existing modes for consolidation opportunities before adding. This limit exists to keep the SKILL.md within a size that an LLM agent can process reliably in a single context window.

**Rule 5 — Retire modes that no longer apply.**
When a module's scope is complete and a mode is no longer relevant to the active project, mark it as `[RETIRED]` in the SKILL.md with the reason. Do not delete — the history is part of the ADR record.

These rules are enforced by the team, not by the skill itself. They must appear verbatim in the `## Hub Growth Policy` section of `automation-architect` `SKILL.md`.

---

**Three invocation modes (M4 baseline):**

**Mode 1 — Full pipeline** (default)
- Triggered by: "aplicar arquitectura", "apply architecture", "full review", "enforce all rules"
- Steps:
  1. Identify all relevant files (specs, POs, fixtures, data files)
  2. Run `pom-architect` — detect + auto-fix all POM violations
  3. Run `spec-code-standard` — detect + auto-fix all test writing violations
  4. Output unified summary

**Mode 2 — Structure only**
- Triggered by: "revisar estructura", "check structure", "verify folders"
- Steps:
  1. Check all files are in their correct folder
  2. Check all imports use path aliases
  3. Report only — no auto-fix unless explicitly requested

**Mode 3 — Scaffold new file**
- Triggered by: "generar", "crear", "scaffold", "nuevo Page Object", "new page"
- Steps:
  1. Ask: page name + URL path + locators + requires authentication? (infer from context)
  2. Generate `src/ui/pages/<Name>Page.ts` extending `BasePage` — only getters and action methods, no constructor, no navigate()
  3. Register fixture in `src/fixtures/index.ts`:
     - No auth → `async ({ page }, use)` → call `navigate()`
     - Auth required → `async ({ authenticatedPage }, use)` → use `authenticatedPage.page`
  4. Generate `tests/<name>.spec.ts` importing from `@fixtures` and `@data`, with describe block
  5. Verify zero relative imports in all generated files

**Output format:**

Full pipeline:
```
[automation-architect] PIPELINE COMPLETE
─────────────────────────────────────────
pom-architect:    X violations found — Y auto-applied
spec-code-standard:   X violations found — Y auto-applied
Remaining manual fixes: <list if any>
[automation-architect] ✅ All rules satisfied.
```

Scaffold:
```
[automation-architect] SCAFFOLD COMPLETE
─────────────────────────────────────────
Created:  src/ui/pages/<Name>Page.ts
Updated:  src/fixtures/index.ts
Created:  tests/<name>.spec.ts
```

---

## Project context (include in the skill files)

- `BasePage` at `src/ui/pages/BasePage.ts` — `abstract class`, `protected readonly page: Page`, `async navigate(path = '/')` — all Page Objects extend it
- tsconfig `target: ES2022` → `useDefineForClassFields: true` → locators MUST be getters, not constructor fields
- `baseURL` configured in `playwright.config.ts` via `process.env.BASE_URL` (loaded by dotenv)
- `src/config/Env.ts` validates all required env vars at startup with descriptive errors
- `src/data/auth.data.ts` defines test users: `appUser` (from Env), plus site-specific accounts
- Path aliases are the only allowed import style — relative paths are always a violation

