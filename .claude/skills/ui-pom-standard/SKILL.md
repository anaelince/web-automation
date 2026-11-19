---
name: ui-pom-standard
description: >
  Enforce and auto-apply Page Object Model rules for Playwright + TypeScript projects.
  Detects violations and fixes them: locators as getters, actions as async methods,
  no direct page usage in test bodies, assertions only in specs, navigate() using baseURL.
  Load when creating, reviewing, or refactoring Page Objects or spec files.
---

## Project Context

- `BasePage` at `src/ui/pages/BasePage.ts` — abstract class, `protected readonly page: Page`,
  `async navigate(path = '/')` — all Page Objects extend it
- tsconfig `target: ES2022` → `useDefineForClassFields: true` → locators MUST be getters,
  not constructor fields (`this.page` is undefined during class field initialisation)
- `baseURL` configured in `playwright.config.ts` via `process.env.BASE_URL` (loaded by dotenv)
- Path aliases are the only allowed import style — relative paths are always a violation

## Critical Pattern: Getters vs Constructor Fields

```typescript
// ❌ WRONG — broken with ES2022 useDefineForClassFields: true
export class LoginPage extends BasePage {
  private usernameInput = this.page.locator('[data-test="username"]');
  // this.page is UNDEFINED here — class fields run before super() assigns it
}

// ✅ CORRECT — getter runs lazily at call time, this.page is already set
export class LoginPage extends BasePage {
  get usernameInput() {
    return this.page.locator('[data-test="username"]');
  }
}
```

## BasePage Contract

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

No subclass should override `navigate()` or redeclare the constructor.

## Rules

### R1 — EXTENDS_BASE_PAGE (ERROR, AUTO-FIX)

**Condition:** A class in `src/ui/pages/` or `src/ui/components/` does not `extend BasePage`.

**Auto-fix:**
1. Add `extends BasePage` to the class declaration
2. Add `import { BasePage } from '@pages/BasePage'` if missing
3. Remove any duplicate constructor that only calls `super(page)` (BasePage handles it)
4. Remove any duplicate `navigate()` override (BasePage handles it)

**Example — before:**
```typescript
import { Page } from '@playwright/test';

export class LoginPage {
  private page: Page;
  constructor(page: Page) {
    this.page = page;
  }
}
```

**Example — after:**
```typescript
import { BasePage } from '@pages/BasePage';

export class LoginPage extends BasePage {
}
```

---

### R2 — LOCATORS_AS_GETTERS (ERROR, AUTO-FIX)

**Condition:** A Page Object assigns a Playwright locator to a class field inside the constructor body:
`this.X = this.page.locator(...)` / `this.page.getByRole(...)` / `this.page.getByText(...)` / etc.

**Auto-fix:**
1. Remove the assignment statement from the constructor
2. Add a `get X()` property after the constructor (or at the top of the class body if constructor becomes empty)
3. If the constructor body is now empty (only `super()` remains), remove the constructor entirely

**Example — before:**
```typescript
export class LoginPage extends BasePage {
  private usernameInput;
  private loginButton;

  constructor(page: Page) {
    super(page);
    this.usernameInput = this.page.locator('[data-test="username"]');
    this.loginButton   = this.page.locator('[data-test="login-button"]');
  }
}
```

**Example — after:**
```typescript
export class LoginPage extends BasePage {
  get usernameInput() { return this.page.locator('[data-test="username"]'); }
  get loginButton()   { return this.page.locator('[data-test="login-button"]'); }
}
```

---

### R3 — ACTIONS_AS_ASYNC_METHODS (ERROR, AUTO-FIX)

**Condition:** A spec file calls two or more `page.*` interaction methods in sequence inside a
`test()` body where a Page Object already exists for that page.

**Auto-fix:**
1. Extract the interaction sequence into an `async` method on the Page Object
2. Replace the sequence in the spec with a single call to the new PO method

**Example — before (in spec):**
```typescript
await page.locator('[data-test="username"]').fill('user');
await page.locator('[data-test="password"]').fill('pass');
await page.locator('[data-test="login-button"]').click();
```

**Example — after (in Page Object):**
```typescript
async login(username: string, password: string): Promise<void> {
  await this.usernameInput.fill(username);
  await this.passwordInput.fill(password);
  await this.loginButton.click();
}
```

**Example — after (in spec):**
```typescript
await loginPage.login(users.appUser.username, users.appUser.password);
```

---

### R4 — NO_DIRECT_PAGE_IN_TEST_BODY (ERROR, AUTO-FIX)

**Condition:** A `test()` callback body directly calls `page.locator(...)`, `page.fill(...)`,
`page.click(...)`, `page.getByRole(...)`, etc.

**Exception:** `page.goto()` is allowed inside `beforeEach` when no fixture handles navigation.

**Auto-fix:** Replace the direct `page.*` call with a call to the corresponding PO method.
If no PO method exists for that interaction, create one (see R3).

---

### R5 — NAVIGATE_USES_BASE_URL (ERROR, AUTO-FIX)

**Condition:** A call to `navigate()` or `page.goto()` inside a Page Object passes a hardcoded
full URL starting with `http://` or `https://`.

**Auto-fix:** Extract the path portion of the URL and pass only the relative path.

**Example — before:**
```typescript
await this.navigate('https://www.saucedemo.com/inventory.html');
```

**Example — after:**
```typescript
await this.navigate('/inventory.html');
```

---

### R6 — EXPECT_ONLY_IN_SPECS (ERROR / WARNING, AUTO-FIX)

**Condition (ERROR):** A Page Object method contains `expect()` and the method name does NOT
start with `assert`.

**Condition (WARNING):** A Page Object method contains `expect()`, the method name DOES start
with `assert`, but the method has no JSDoc comment.

**Auto-fix (ERROR):**
1. Move the `expect()` call to the spec file
2. If the locator is private, convert it to a public `get` property so the spec can access it

**Example — before:**
```typescript
async verifyLogin(): Promise<void> {
  await expect(this.page.locator('.inventory')).toBeVisible();
}
```

**Example — after (in Page Object):**
```typescript
get inventoryContainer() {
  return this.page.locator('.inventory');
}
```

**Example — after (in spec):**
```typescript
await expect(loginPage.inventoryContainer).toBeVisible();
```

---

### R7 — CORRECT_FOLDER_PLACEMENT (ERROR, AUTO-FIX)

**Expected folder layout:**

| File type       | Required location         |
|-----------------|---------------------------|
| Page Objects    | `src/ui/pages/`           |
| Components      | `src/ui/components/`      |
| Fixtures        | `src/fixtures/`           |
| Test data       | `src/data/`               |
| Config / Env    | `src/config/`             |
| Spec files      | `tests/`                  |

**Condition:** A file is placed outside its required location.

**Auto-fix:**
1. Move the file to the correct folder
2. Update all `import` statements across the project that reference the old path
3. Ensure the new imports use path aliases (not relative paths)

---

### R8 — NO_HARDCODED_CREDENTIALS (ERROR, AUTO-FIX)

**Condition:** A string literal inside a Page Object matches a credential pattern
(username, password, or known test account value such as `'secret_sauce'`).

**Auto-fix:**
1. Replace hardcoded credential strings with method parameters
2. Move test account data to `src/data/auth.data.ts`
3. Update callers to pass `users.appUser.username` / `users.appUser.password`

---

## Violation Output Format

Every violation MUST use this exact format:

```
[ui-pom-standard] SEVERITY — RULE_NAME
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED
```

**Example:**
```
[ui-pom-standard] ERROR — LOCATORS_AS_GETTERS
File:  src/ui/pages/LoginPage.ts
Line:  8
Issue: Locator 'usernameInput' is assigned in the constructor — this.page is undefined at field init time (ES2022 useDefineForClassFields).
Fix:   Convert to a `get usernameInput()` getter property. | AUTO-APPLIED
```

## Scan Scope

| File glob                     | Scanned for rules                        |
|-------------------------------|------------------------------------------|
| `src/ui/pages/**/*.ts`        | R1, R2, R3, R5, R6, R7, R8              |
| `src/ui/components/**/*.ts`   | R1, R2, R3, R5, R6, R7, R8              |
| `tests/**/*.spec.ts`          | R3, R4                                   |
| All other `src/**/*.ts`       | R7 (folder placement check only)         |


