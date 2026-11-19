---
name: spec-code-standard
description: >
  Enforce and auto-apply test writing and code quality standards for Playwright + TypeScript
  projects. Covers import hygiene (path aliases), fixture pattern, test structure, test
  independence, data hygiene, and site-layer placement. Load when writing, reviewing, or
  refactoring spec files or fixture files.

growth-note: >
  This skill currently governs code quality rules specific to spec files and their
  direct dependencies (fixtures, data). If the project grows to require general
  TypeScript code quality rules that apply across ALL src/ layers (not just specs),
  consider splitting into spec-code-standard (spec-specific) and a new
  code-standard skill (framework-wide). Do not expand this skill with non-spec
  rules — create the new skill instead.
---

## Project Context

- Path aliases (from `tsconfig.json`) are the **only** allowed import style — relative paths
  (`../`, `./`) are forbidden everywhere, no exceptions
- `test` and `expect` must be imported from the spec's **site fixture file**
  (`@fixtures/sites/{site}/{site}.fixtures`), never from `@playwright/test` directly
- `src/fixtures/index.ts` is the **shared** layer: it extends Playwright's `test` with
  site-agnostic fixtures only and re-exports `expect`
- `src/fixtures/sites/{site}/{site}.fixtures.ts` extends the shared `test` (from `@fixtures`)
  with that site's Page Object and API fixtures, and re-exports `expect`

### Site-based Layer Architecture

The project is organized by **site** (target application) across every source layer.
Any new file must be placed in the correct site subfolder before being imported or registered.

| Layer | Base path | Site subfolders |
|-------|-----------|-----------------|
| UI Page Objects | `src/ui/pages/sites/` | `saucedemo/` · `demoqa/` · `automationexercise/` |
| API client/controllers | `src/api/sites/` | `demoqa/` |
| Test data | `src/data/sites/` | `saucedemo/` · `demoqa/` |
| Fixtures | `src/fixtures/sites/` | `saucedemo/` · `demoqa/` · `automationexercise/` |
| Spec files | `tests/ui/smoke/sites/` | `saucedemo/` · `demoqa/` · `automationexercise/` |

`src/ui/pages/BasePage.ts` and `src/fixtures/index.ts` are the only shared files that live
outside the `sites/` hierarchy.

### Test Data Files

Each site owns its own auth data file. Import from the correct site file — never from another
site's data file.

| File | Exported name | Used by |
|------|---------------|---------|
| `src/data/sites/saucedemo/auth.data.ts` | `users` | SauceDemo fixtures and specs |
| `src/data/sites/demoqa/auth.data.ts` | `bookStoreUsers` | demoqa fixtures and specs |

### Fixture Registration

Fixtures follow the same `layer → site` layout as every other layer:

| File | Contains |
|------|----------|
| `src/fixtures/index.ts` | Shared, site-agnostic fixtures only (+ `expect` re-export) |
| `src/fixtures/sites/{site}/{site}.fixtures.ts` | Every fixture for that site (UI POs, API, worker identities) |

When a new fixture is added, put it in the fixture file of the spec's site. Never register a
site-specific fixture in `src/fixtures/index.ts`, and never import one site's fixture file
from another site's specs.

**Per-site base URL:** a non-primary site's fixture file overrides Playwright's `baseURL`
so `po.navigate(path)` resolves against that site:

```typescript
baseURL: async ({}, use) => {
  await use(ENV.siteUrls.saucedemo);
},
```

demoqa (the primary site) uses the config default `BASE_URL` and does not override it.

The `authenticatedPage` fixture (SauceDemo, in `saucedemo.fixtures.ts`) and
`authenticatedBookStoreUser` fixture (demoqa, in `demoqa.fixtures.ts`) **must always** exist.

---

## Path Alias Map

| Alias | Resolves to | Site usage |
|-------|-------------|------------|
| `@pages/*` | `src/ui/pages/*` | `@pages/sites/{site}/MyPage` |
| `@components/*` | `src/ui/components/*` | — |
| `@fixtures` | `src/fixtures/index` | site fixture files (shared base `test`) |
| `@fixtures/*` | `src/fixtures/*` | spec files: `@fixtures/sites/{site}/{site}.fixtures` |
| `@data/*` | `src/data/*` | `@data/sites/{site}/auth.data` |
| `@config/*` | `src/config/*` | — |
| `@helpers/*` | `src/helpers/*` | — |
| `@api/*` | `src/api/*` | `@api/sites/{site}/client/ApiClient` |

The wildcards already cover the `sites/` subdirectory. No new alias is needed when adding a
new site — just use the full path, e.g. `@pages/sites/demoqa/BookStorePage`.

---

## Fixture Pattern Reference

```typescript
// src/fixtures/index.ts — shared layer (site-agnostic only)
import { test as base, expect } from '@playwright/test';

type SharedFixtures = {};

export const test = base.extend<SharedFixtures>({});
export { expect };
```

```typescript
// src/fixtures/sites/saucedemo/saucedemo.fixtures.ts — site layer
import { test as base, expect } from '@fixtures';
import { LoginPage } from '@pages/sites/saucedemo/LoginPage';
import { InventoryPage } from '@pages/sites/saucedemo/InventoryPage';
import { users } from '@data/sites/saucedemo/auth.data';

export { expect };

type SauceDemoFixtures = {
  loginPage: LoginPage;
  authenticatedPage: LoginPage;      // MUST always exist
  inventoryPage: InventoryPage;
};

export const test = base.extend<SauceDemoFixtures>({
  loginPage: async ({ page }, use) => {
    const po = new LoginPage(page);
    await po.navigate();
    await use(po);
  },

  // Authenticated — logs in; Playwright destroys context after each test, no logout needed
  authenticatedPage: async ({ page }, use) => {
    const lp = new LoginPage(page);
    await lp.navigate();
    await lp.login(users.appUser.username, users.appUser.password);
    await use(lp);
  },

  inventoryPage: async ({ authenticatedPage }, use) => {
    const po = new InventoryPage(authenticatedPage.currentPage);
    await use(po);
  },
});
```

```typescript
// tests/ui/smoke/sites/saucedemo/login/TC0-valid-login.spec.ts
import { test, expect } from '@fixtures/sites/saucedemo/saucedemo.fixtures';
```

**Fixture registration decision table:**

| Requires auth? | Site | Fixture dependency | Calls navigate()? |
|----------------|------|--------------------|-------------------|
| No | any | `{ page }` | Yes |
| Yes (UI auth) | SauceDemo | `{ authenticatedPage }` | No |
| Yes (UI auth) | demoqa | `{ authenticatedBookStoreUser }` | No |
| API teardown | demoqa | `{ bookController }` | No (API only) |

---

## Rules

### R1 — PATH_ALIASES_ON_ALL_IMPORTS (ERROR, AUTO-FIX)

**Condition:** Any `import` statement in `src/` or `tests/` uses a relative specifier
(`./` or `../`).

**Auto-fix:**
1. Resolve the relative specifier to an absolute project path
2. Find the matching alias prefix from `tsconfig.json` paths
3. Replace the relative specifier with the alias equivalent

**Alias resolution examples (site-based structure):**

| File | Relative import | Correct alias |
|------|-----------------|---------------|
| `tests/ui/smoke/sites/demoqa/books/TC02.spec.ts` | `../../src/ui/pages/sites/demoqa/BookStorePage` | `@pages/sites/demoqa/BookStorePage` |
| `tests/ui/smoke/sites/saucedemo/login/TC0.spec.ts` | `../../src/fixtures/sites/saucedemo/saucedemo.fixtures` | `@fixtures/sites/saucedemo/saucedemo.fixtures` |
| `tests/ui/smoke/sites/demoqa/books/TC02.spec.ts` | `../../src/data/sites/demoqa/auth.data` | `@data/sites/demoqa/auth.data` |
| `src/ui/pages/sites/demoqa/BookStorePage.ts` | `../../BasePage` | `@pages/BasePage` |
| `src/fixtures/sites/saucedemo/saucedemo.fixtures.ts` | `../../../ui/pages/sites/saucedemo/LoginPage` | `@pages/sites/saucedemo/LoginPage` |

If no alias covers the resolved path, do **not** auto-apply. Report as a manual fix:
`Fix: No alias available — add entry to tsconfig.json paths manually`

---

### R2 — IMPORT_FROM_FIXTURES (ERROR, AUTO-FIX)

**Condition:** A spec file (`tests/**/*.spec.ts`) imports `test` or `expect` directly from
`@playwright/test`.

**Exception:** `src/fixtures/index.ts` is the only file allowed to import `test`/`expect` from `@playwright/test`; site fixture files import them from `@fixtures`. A spec importing from `@fixtures` or from another site's fixture file is also a violation.

**Auto-fix:** Replace the import specifier.

**Example — before:**
```typescript
import { test, expect } from '@playwright/test';
```

**Example — after:**
```typescript
import { test, expect } from '@fixtures/sites/{site}/{site}.fixtures';
```

---

### R3 — NO_MANUAL_BEFOREEACH_FOR_PO_INIT (ERROR, AUTO-FIX)

**Condition:** A `beforeEach()` block in a spec file instantiates a Page Object:
`new <AnyPage>(page)` assigned to a local variable.

**Auto-fix:**
1. Extract the Page Object instantiation into a new fixture in `src/fixtures/sites/{site}/{site}.fixtures.ts`
   for the spec's site (see fixture registration decision table)
2. Remove the `beforeEach` block from the spec
3. Add the fixture name as a parameter to each `test()` that needs it

**Example — before (spec):**
```typescript
let loginPage: LoginPage;

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.navigate();
});
```

**Example — after (fixture in `saucedemo.fixtures.ts`):**
```typescript
loginPage: async ({ page }, use) => {
  const po = new LoginPage(page);
  await po.navigate();
  await use(po);
},
```

---

### R4 — PO_REGISTERED_IN_FIXTURE (ERROR, AUTO-FIX)

**Condition:** A Page Object is used in a spec but is not registered as a fixture in
its site fixture file `src/fixtures/sites/{site}/{site}.fixtures.ts`.

**Auto-fix:**
1. Determine the target site from the spec's folder path
   (`tests/ui/smoke/sites/{site}/...` → site = `{site}`)
2. Verify the Page Object file exists in `src/ui/pages/sites/{site}/`
   — if not, create it there before proceeding
3. Add the import in `src/fixtures/sites/{site}/{site}.fixtures.ts` (create it if missing: extend `test` from `@fixtures`, re-export `expect`)
4. Add the fixture implementation in that file
5. Add the new fixture name to the site's fixtures type
6. Ensure the site's authenticated fixture exists — create it if missing

**Invariant:** `authenticatedPage` (SauceDemo) must **always** be present in
`src/fixtures/sites/saucedemo/saucedemo.fixtures.ts`. Each active site should also have its own authenticated fixture.

---

### R5 — TESTS_WRAPPED_IN_DESCRIBE (ERROR / WARNING, AUTO-FIX)

**Condition (ERROR):** A `test()` call is not inside a `test.describe()` block.

**Condition (WARNING):** A `test.describe()` block has a generic or empty name
(`'test'`, `'describe'`, `''`, `'should work'`).

**Naming conventions:**
- Describe name = feature or page name in PascalCase (e.g., `'Books'`, `'Login'`)
  — inferred from the feature folder name, **not** the site folder name
- Test name = expected behaviour (e.g., `'TC02: Add a book to the user\'s collection'`)

**Auto-fix (ERROR):** Wrap bare `test()` calls in a `test.describe()` block. Infer the
describe name from the **feature** folder (the last segment before the spec file), not
from the site folder.

**Path example:** `tests/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts`
→ describe name = `'Books'` (from `books/`), not `'demoqa'`.

**Example — before:**
```typescript
test('TC02: ...', async ({ bookStorePage }) => { ... });
```

**Example — after:**
```typescript
test.describe('Books', () => {
  test('TC02: ...', async ({ bookStorePage }) => { ... });
});
```

---

### R6 — NO_CROSS_SPEC_IMPORTS (ERROR, AUTO-FIX)

**Condition:** A spec file imports from another spec file (any file matching `**/*.spec.ts`).

**Auto-fix:**
- If the import is for shared test data → move data to `src/data/sites/{site}/` and update
  import to `@data/sites/{site}/...`
- If the import is for shared setup → move setup to `src/fixtures/sites/{site}/{site}.fixtures.ts` and update
  import to `@fixtures/sites/{site}/{site}.fixtures`

---

### R7 — NO_HARDCODED_CREDENTIALS (ERROR, AUTO-FIX)

**Condition:** A string literal in a spec file appears as a username or password argument
(e.g., passed to a `login()` method or filled into a credential field).

**Auto-fix:**
1. Determine the target site from the spec's folder path
2. Add the correct site-specific auth data import if not already present
3. Replace the string literal with the matching exported user object

**Site-to-import mapping:**

| Spec location | Correct import | User object |
|---------------|----------------|-------------|
| `tests/ui/smoke/sites/saucedemo/...` | `import { users } from '@data/sites/saucedemo/auth.data'` | `users.appUser` |
| `tests/ui/smoke/sites/demoqa/...` | `import { bookStoreUsers } from '@data/sites/demoqa/auth.data'` | `bookStoreUsers.appUser` |

**Example — before (demoqa spec):**
```typescript
await bookStoreLoginPage.login('web-automation', 'Test123!');
```

**Example — after:**
```typescript
import { bookStoreUsers } from '@data/sites/demoqa/auth.data';

await bookStoreLoginPage.login(bookStoreUsers.appUser.username, bookStoreUsers.appUser.password);
```

**Parallel note:** when the test mutates state of that user, take the credentials from the
`worker<Resource>` fixture (e.g. `workerUser.username`) or a pool instead of one static user.
Which identity a test uses is owned by `spec-data-standard` R1.

---

### R8 — ONLY_PLAYWRIGHT_TEST_FRAMEWORK (ERROR, AUTO-FIX)

**Condition:** A file imports from `jest`, `mocha`, `chai`, `jasmine`, or any non-Playwright
test utility.

**Auto-fix:** Replace with the `@playwright/test` equivalent (or `@fixtures` for spec files).

| Forbidden import | Replacement |
|------------------|-------------|
| `jest` | `@fixtures` (test) / `@playwright/test` (fixtures) |
| `mocha` | `@fixtures` |
| `chai` | `@fixtures` (`expect`) |
| `jasmine` | `@fixtures` |

---

### R9 — CORRECT_SITE_LAYER_PLACEMENT (ERROR, AUTO-FIX)

**Condition:** A new file is placed in the wrong layer for its site.

| File type | Required location | Anti-pattern |
|-----------|------------------|--------------|
| Page Object for site X | `src/ui/pages/sites/X/` | `src/ui/pages/MyPage.ts` |
| API controller for site X | `src/api/sites/X/controllers/` | `src/api/controllers/MyController.ts` |
| Test data for site X | `src/data/sites/X/` | `src/data/my.data.ts` |
| Spec file for site X | `tests/ui/smoke/sites/X/{feature}/` | `tests/ui/smoke/{feature}/` |

The only file allowed outside a `sites/` subfolder is `src/ui/pages/BasePage.ts`.

**Auto-fix:**
1. Identify the target site from context (file content, related imports, or surrounding folder)
2. Move the file to the correct `sites/{site}/` subfolder
3. Update all imports that referenced the old path

**Example — before:**
```
src/ui/pages/BookStorePage.ts        ← wrong (no site subfolder)
tests/ui/smoke/books/TC02.spec.ts    ← wrong (no sites layer)
```

**Example — after:**
```
src/ui/pages/sites/demoqa/BookStorePage.ts
tests/ui/smoke/sites/demoqa/books/TC02.spec.ts
```

---

## Violation Output Format

Every violation MUST use this exact format:

```
[spec-code-standard] SEVERITY — RULE_NAME
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED
```

**Example:**
```
[spec-code-standard] ERROR — CORRECT_SITE_LAYER_PLACEMENT
File:  src/ui/pages/BookStorePage.ts
Line:  1
Issue: Page Object is not placed inside a site subfolder — found at src/ui/pages/ root.
Fix:   Moved to src/ui/pages/sites/demoqa/BookStorePage.ts and updated all imports. | AUTO-APPLIED
```

---

## Scan Scope

| File glob | Rules applied |
|-----------|---------------|
| `tests/**/*.spec.ts` | R1, R2, R3, R4, R5, R6, R7, R8, R9 |
| `src/fixtures/index.ts` | R1 (site-agnostic fixtures only) |
| `src/fixtures/sites/**/*.fixtures.ts` | R1, R4 (fixture completeness check) |
| `src/ui/pages/**/*.ts` | R1, R9 (import hygiene + placement) |
| `src/api/**/*.ts` | R1, R9 |
| `src/data/**/*.ts` | R1, R9 |
| `src/**/*.ts` (other) | R1 (import hygiene only) |


