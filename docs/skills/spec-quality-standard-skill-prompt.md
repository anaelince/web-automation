# Meta-prompt: Create new skill `spec-quality-standard`

Use this prompt directly with Kiro to create a new skill
`.kiro/skills/spec-quality-standard/SKILL.md` for any Playwright + TypeScript project.

This is a NEW skill — do NOT modify `spec-organisation-standard` or `spec-code-standard`.
After creating the skill:
- Register `spec-quality-standard` as a seventh sub-skill in `automation-architect/SKILL.md`
- Update Mode 1 (Full Pipeline) to run `spec-quality-standard` after `lifecycle-architect`
- Add Mode 7 — TC Quality Review to `automation-architect/SKILL.md`
- Update the Sub-Skill Registry and Scan Scope Ownership tables
- Update the Sub-Skill Invocation Reference table
- Update the mode slot comment to `(7 of 10 slots used)`

---

## Skill overview

`spec-quality-standard` owns the **internal quality of test cases** — what happens inside each
`test()` body. It governs the lifecycle contract (preconditions, postconditions),
assertion quality, selector resilience, wait strategies, and anti-flakiness patterns.

### Domain boundary — what this skill does and does NOT cover

| Concern | Owner skill | NOT owned by spec-quality-standard |
|---------|-------------|------------------------|
| TC folder and file naming | `spec-organisation-standard` | ✅ |
| TC ID format, describe-block naming | `spec-organisation-standard` | ✅ |
| Import hygiene and fixture registration | `spec-code-standard` | ✅ |
| Page Object structure and locator getters | `pom-architect` | ✅ |
| API layer and teardown contract | `lifecycle-architect` | ✅ |
| **Precondition and postcondition quality** | **`spec-quality-standard`** | — |
| **Assertion quality and specificity** | **`spec-quality-standard`** | — |
| **Selector resilience** | **`spec-quality-standard`** | — |
| **Wait strategies and flakiness prevention** | **`spec-quality-standard`** | — |
| **Test independence and isolation** | **`spec-quality-standard`** | — |

---

## The flaky test lifecycle

A flaky test fails non-deterministically — it passes sometimes and fails other times
without any code change. The root causes are almost always one of these five:

```
1. Missing precondition assertion  → test starts in unknown state
2. Missing teardown               → state leaks into next test
3. Hardcoded wait                 → passes on fast machines, fails on slow
4. Fragile selector               → breaks when DOM changes structurally
5. Assertion not tied to action   → passes even when the action failed silently
```

Every rule in this skill targets one or more of these root causes explicitly.

---

## Frontmatter

```yaml
---
name: spec-quality-standard
description: >
  Enforce and auto-apply test case quality standards for Playwright + TypeScript projects.
  Governs preconditions, postconditions, assertion quality, selector resilience, wait
  strategies, and anti-flakiness patterns inside test bodies. Load when creating,
  reviewing, or debugging test cases.
---
```

---

## Project Context section

```markdown
## Project Context

- A test case is considered **deterministic** when it produces the same result on every
  run regardless of execution order, machine speed, or prior test state.
- **Precondition**: the state the system must be in BEFORE the first test action.
  Preconditions are enforced by fixtures; they must be ASSERTED in the first test.step().
- **Postcondition**: the state the system must return to AFTER the test completes.
  Postconditions are enforced by teardown fixtures (`clean<Resource>`).
- Playwright auto-waits for actionability before every interaction. Never add manual
  waits on top of built-in auto-waits — it only adds time, not reliability.
- Every `test.step()` that performs a user-visible action must end with at least one
  assertion that confirms the result of that action.
- Assertions must use Playwright's web-first assertions (`expect(locator).toBeVisible()`),
  not JavaScript-first assertions (`expect(await locator.textContent()).toBe(...)`).
- Locators must be resilient to DOM changes: prefer role, label, testid, and stable
  text over positional CSS or XPath.
```

---

## Two invocation modes

---

### Mode: Enforce — Scan and Report

**Triggers:** `"review tc quality"` · `"check test quality"` · `"scan for flaky patterns"` · `"tc quality"`

**When to use:** After writing or refactoring test cases, or when a test is showing
intermittent failures.

**Steps:**
1. Discover all `*.spec.ts` files under `tests/`
2. Apply all rules (R1–R10) to each file
3. Auto-fix every AUTO-FIX violation
4. Collect MANUAL-FIX violations as a prioritised list (ERRORs before WARNINGs)
5. Emit the violation report

**Output:**
```
[spec-quality-standard] SCAN COMPLETE
─────────────────────────────────────────
Scanned:  <N> spec files
Errors:   <N> found — <N> auto-applied
Warnings: <N> found
Remaining manual fixes: <list if any, or "none">
[spec-quality-standard] ✅ All quality rules satisfied.
```

---

### Mode: Create — Scaffold a Quality TC

**Triggers:** `"create tc"` · `"new test case"` · `"scaffold tc"` · `"write tc"`

**When to use:** When writing a new test case from scratch.

**Step 0 — Collect parameters** (infer from context; ask only for missing):
- `tcId` — TC{N} format (e.g. `TC03`)
- `title` — imperative description (e.g. `Browse all available books`)
- `preconditions` — list of conditions the system must be in before the test
- `steps` — list of `{ action, expectedResult }` pairs from the TC spec doc
- `hasApiTeardown` — `true` if the test creates/mutates data that needs API cleanup

**Step 1 — Identify required fixtures** from preconditions:
- Login required? → include the site's `authenticated*` fixture
- API cleanup required? → include `clean<Resource>` fixture
- PO access required? → include the relevant PO fixtures

**Step 2 — Generate the first step as precondition assertion:**
```typescript
await test.step('Verify <precondition> is met before test begins', async () => {
  await expect(<fixture>.<indicator>).toBeVisible();
});
```

**Step 3 — Generate each action step with its result assertion:**
```typescript
await test.step('<action description>', async () => {
  await <fixture>.<action>();                     // ← action
  await expect(<fixture>.<result>).toBeVisible(); // ← assertion always follows
});
```

**Step 4 — Generate postcondition verification as the last step:**
```typescript
await test.step('Verify postcondition: <expected final state>', async () => {
  await expect(<fixture>.<finalStateIndicator>).<matcher>();
});
```

**Step 5 — Run all R1–R10 rules on the generated file — assert zero violations.**

---

## Rules

---

### R1 — PRECONDITION_ASSERTED (ERROR, MANUAL-FIX)

**Condition:** A `test()` body begins with an action (click, fill, navigate) WITHOUT
a preceding step that asserts the precondition is met.

**Why:** A test that starts acting without first verifying its starting state is
building on an unknown foundation. If a previous test left the system dirty, this test
will fail — but the failure will point to the WRONG place.

**Violation:**
```typescript
test('TC02: ...', async ({ bookStorePage }) => {
  // ❌ first action — no precondition assertion
  await bookStorePage.clickFirstBook();
});
```

**Expected:**
```typescript
test('TC02: ...', async ({ bookStorePage }) => {
  await test.step('Verify catalog is loaded before test begins', async () => {
    await expect(bookStorePage.pageHeading).toBeVisible();      // ✅ precondition
    await expect(bookStorePage.bookList.first()).toBeVisible(); // ✅ precondition
  });
  await test.step('Click first book', async () => {
    await bookStorePage.clickFirstBook();
  });
});
```

---

### R2 — POSTCONDITION_GUARANTEED (ERROR, MANUAL-FIX)

**Condition:** A test that creates data, adds items, or mutates persistent state does
NOT include a `clean<Resource>` fixture parameter.

**Detection:** Look for action method calls that imply persistence: `addToCollection`,
`create`, `submit`, `register`, `upload`, `delete`.

**Why:** Without teardown, every failed run leaves dirty data that makes subsequent
runs fail — not because of a bug in the next run, but because of leftover state from
the previous one.

**Violation:**
```typescript
test('TC02: ...', async ({ bookStorePage, bookDetailPage, profilePage }) => {
  // adds a book — but no cleanBookshelf fixture
});
```

**Expected:**
```typescript
test('TC02: ...', async ({
  bookStorePage, bookDetailPage, profilePage,
  cleanBookshelf  // ✅ guarantees teardown even if the test fails
}) => {
  void cleanBookshelf; // suppress unused-variable warning if not used directly
  ...
});
```

---

### R3 — NO_HARDCODED_WAITS (ERROR, AUTO-FIX)

**Condition:** Any call to `page.waitForTimeout(N)`, `setTimeout(N, ...)`, or
`new Promise(r => setTimeout(r, N))` in a spec file or Page Object.

**Why:** `waitForTimeout` is a fixed delay that makes tests:
- Slow (always waits the full time, even on fast machines)
- Flaky (not long enough on slow machines or under load)
- Fragile (the right number today is wrong after a dependency upgrade)

Playwright's auto-waits handle timing automatically. Manual delays mask timing
problems instead of solving them.

**Auto-fix:** Replace with the appropriate semantic wait:

| Hardcoded wait | Semantic replacement |
|---------------|---------------------|
| Wait for element | `await expect(locator).toBeVisible()` |
| Wait for navigation | `await page.waitForURL(pattern)` followed by an assertion |
| Wait for network idle | `await page.waitForLoadState('networkidle')` _(use sparingly)_ |
| Wait for element gone | `await expect(locator).toBeHidden()` |
| Wait for text change | `await expect(locator).toHaveText(newText)` |

**Violation:**
```typescript
await page.waitForTimeout(2000); // ❌
await loginButton.click();
```

**Expected:**
```typescript
await loginButton.click();
await expect(dashboardHeading).toBeVisible(); // ✅ semantic wait
```

---

### R4 — WEB_FIRST_ASSERTIONS (ERROR, AUTO-FIX)

**Condition:** An assertion on a locator uses JavaScript-first form — the locator is
awaited before being passed to `expect()`.

**Why:** JavaScript-first assertions evaluate at a single point in time with no retry.
Playwright's web-first assertions retry until the condition is met or the timeout
expires — this is the difference between a flaky test and a stable one.

**Auto-fix:** Rewrite to the web-first form.

| JavaScript-first (❌) | Web-first (✅) |
|----------------------|----------------|
| `expect(await el.textContent()).toBe('x')` | `expect(el).toHaveText('x')` |
| `expect(await el.isVisible()).toBe(true)` | `expect(el).toBeVisible()` |
| `expect(await el.isEnabled()).toBeTruthy()` | `expect(el).toBeEnabled()` |
| `expect(await el.getAttribute('href')).toBe('/path')` | `expect(el).toHaveAttribute('href', '/path')` |
| `expect(await el.inputValue()).toBe('value')` | `expect(el).toHaveValue('value')` |
| `expect(await page.title()).toBe('Title')` | `expect(page).toHaveTitle('Title')` |
| `expect(await page.url()).toContain('/path')` | `expect(page).toHaveURL(/\/path/)` |

---

### R5 — RESILIENT_LOCATORS (WARNING, MANUAL-FIX)

**Condition:** A locator in a Page Object uses a fragile selector strategy.

**Fragile (avoid):**
- Positional: `.first()` or `.nth(0)` used as the ONLY disambiguation
- Long CSS chains: `div.wrapper > ul > li:nth-child(2) > span.label`
- XPath: `//div[@class='container']//button[2]`
- Text that changes with locale or data: `getByText('1 item')` where count varies

**Resilient (prefer):**
- `getByRole('button', { name: 'Submit' })` — semantic HTML role + accessible name
- `getByLabel('Email address')` — associated label text
- `locator('[data-testid="submit-btn"]')` — purpose-built test attribute
- `locator('#unique-id')` — unique DOM ID when available
- `getByText('Static label', { exact: true })` — stable, non-dynamic text

**Acceptable use of `.first()` or `.nth()`:**
Only when the locator is already scoped to a specific container and position is
genuinely meaningful (e.g. "first row of a results table"). Document with a comment.

---

### R6 — STEP_ASSERTS_RESULT (WARNING, MANUAL-FIX)

**Condition:** A `test.step()` block performs one or more user-facing actions
(click, fill, navigate, keyboard input) but contains NO assertion.

**Why:** A step without an assertion passes silently even if the action had no effect.
The test becomes a click-through script, not a verification. If the button doesn't
work, the test still passes — which defeats its entire purpose.

**Violation:**
```typescript
await test.step('Click Add To Your Collection', async () => {
  await bookDetailPage.addToCollectionButton.click(); // ❌ action with no assertion
});
```

**Expected:**
```typescript
await test.step('Click Add To Your Collection and confirm alert', async () => {
  const alertMessage = await bookDetailPage.addToCollection();
  expect(alertMessage).toBe('Book added to your collection.'); // ✅ result asserted
});
```

---

### R7 — TEST_IS_INDEPENDENT (ERROR, MANUAL-FIX)

**Condition:** A test file contains any of:
1. A `let` variable declared outside all `test()` calls and mutated inside `test()` — indicating shared mutable state
2. A `beforeAll()` block that sets up state consumed by multiple `test()` calls
3. A `test()` that calls `page.goto()` to a URL set up by a previous `test()` in the same file

**Why:** Test order dependency is the most common cause of CI-only failures and
"works on my machine" bugs. Each test must be runnable in isolation.

**Fix:** Move shared state into fixtures (run before each test), not into module scope.

**Violation:**
```typescript
let createdItemId: string; // ❌ shared mutable state

test('TC-A: create item', async ({ api }) => {
  createdItemId = await api.create();
});
test('TC-B: delete item', async ({ api }) => {
  await api.delete(createdItemId); // ❌ depends on TC-A having run first
});
```

**Expected:**
```typescript
test('TC-A: create and verify item', async ({ createdItem }) => {
  // fixture creates and tears down in isolation ✅
  await expect(page.getByText(createdItem.name)).toBeVisible();
});
```

---

### R8 — NO_CONDITIONAL_IN_TEST_BODY (ERROR, MANUAL-FIX)

**Condition:** An `if/else`, `for`, `while`, `switch`, or `try/catch` block appears
inside a `test()` body.

**Why:** Conditional logic inside a test makes it non-deterministic — the test may
verify different things on different runs depending on the branching condition. It
also makes failures harder to diagnose: when the test fails, was the error in the
`if` branch or the `else` branch?

Conditional logic belongs in:
- Page Objects (to handle UI variations)
- Fixtures (to handle environment conditions)
- Parameterised tests (`test.each`) for data-driven scenarios

**Violation:**
```typescript
test('TC02: ...', async ({ bookStorePage }) => {
  if (await bookStorePage.loginLink.isVisible()) { // ❌
    await bookStorePage.loginLink.click();
  }
});
```

**Expected:**
```typescript
// In the fixture or PO, not in the test body
// The test only verifies; it does not make conditional decisions
test('TC02: ...', async ({ authenticatedBookStorePage }) => {
  // fixture guarantees login happened — test body is linear ✅
});
```

---

### R9 — NAVIGATE_THEN_ASSERT (ERROR, MANUAL-FIX)

**Condition:** A navigation call (`page.goto()`, `po.navigate()`, `page.waitForURL()`,
`button.click()` that triggers navigation) is NOT immediately followed by an assertion
confirming the target page loaded.

**Why:** Navigation is asynchronous. A `goto()` may resolve the HTTP request but the
page content may not yet be rendered. Acting on the new page without first confirming
it loaded is a race condition.

**Violation:**
```typescript
await bookStorePage.navigate('/books');
await bookStorePage.clickFirstBook(); // ❌ acting on /books without confirming it loaded
```

**Expected:**
```typescript
await bookStorePage.navigate('/books');
await expect(bookStorePage.pageHeading).toBeVisible(); // ✅ confirms page loaded
await bookStorePage.clickFirstBook();
```

---

### R10 — ASSERTION_SPECIFICITY (WARNING, MANUAL-FIX)

**Condition:** An assertion only checks existence or visibility of an element when
the test's intent requires checking the VALUE of that element.

**Why:** `expect(el).toBeVisible()` passes even if the element shows the wrong text,
wrong count, or wrong state. The test passes, but the feature is broken.
Specificity makes failures meaningful.

**Detection heuristic:** If the TC description says "assert the value is X" or
"assert the message contains Y", the assertion must check the VALUE, not just presence.

**Violation:**
```typescript
// TC says "assert books table contains a row with the added book title"
await expect(profilePage.bookList.first()).toBeVisible(); // ❌ only presence
```

**Expected:**
```typescript
// Assert the SPECIFIC book appears — not just any row
await expect(profilePage.bookRowByTitle(firstBookTitle)).toBeVisible(); // ✅ specific
```

---

## Violation Output Format

```
[spec-quality-standard] SEVERITY — RULE_NAME
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED | MANUAL-FIX
```

**Examples:**
```
[spec-quality-standard] ERROR — NO_HARDCODED_WAITS
File:  tests/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts
Line:  18
Issue: page.waitForTimeout(2000) introduces a fixed delay that causes flakiness.
Fix:   Replace with expect(bookStorePage.pageHeading).toBeVisible(). | AUTO-APPLIED

[spec-quality-standard] ERROR — PRECONDITION_ASSERTED
File:  tests/ui/smoke/sites/saucedemo/login/TC0-valid-login.spec.ts
Line:  5
Issue: Test begins with an action without first asserting the precondition is met.
Fix:   Add a first step that asserts the starting state (e.g. login form is visible). | MANUAL-FIX

[spec-quality-standard] ERROR — POSTCONDITION_GUARANTEED
File:  tests/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts
Line:  4
Issue: Test calls addToCollection() without a cleanBookshelf fixture — dirty state leaks.
Fix:   Add cleanBookshelf to the test parameter list. | MANUAL-FIX

[spec-quality-standard] WARNING — STEP_ASSERTS_RESULT
File:  tests/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts
Line:  22
Issue: test.step 'Click Login' performs a navigation but has no assertion confirming it succeeded.
Fix:   Add expect(bookStoreLoginPage.usernameInput).toBeVisible() or equivalent. | MANUAL-FIX

[spec-quality-standard] ERROR — WEB_FIRST_ASSERTIONS
File:  tests/ui/smoke/sites/saucedemo/login/TC0-valid-login.spec.ts
Line:  12
Issue: expect(await inventoryPage.secondaryHeader.textContent()).toBe('Products') uses JavaScript-first assertion with no retry.
Fix:   Replace with expect(inventoryPage.secondaryHeader).toHaveText('Products'). | AUTO-APPLIED

[spec-quality-standard] WARNING — RESILIENT_LOCATORS
File:  src/ui/pages/sites/demoqa/BookStorePage.ts
Line:  34
Issue: Locator uses .nth(0) as the only disambiguation — will break if list order changes.
Fix:   Scope to a container or use a semantic attribute to identify the first book. | MANUAL-FIX

[spec-quality-standard] ERROR — NO_CONDITIONAL_IN_TEST_BODY
File:  tests/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts
Line:  28
Issue: if/else inside test body makes the test non-deterministic.
Fix:   Move conditional logic to a Page Object method or fixture. | MANUAL-FIX

[spec-quality-standard] ERROR — NAVIGATE_THEN_ASSERT
File:  tests/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts
Line:  41
Issue: profilePage.navigate('/profile') is not followed by an assertion confirming the page loaded.
Fix:   Add expect(profilePage.usernameValue).toBeVisible() immediately after navigate(). | MANUAL-FIX
```

---

## Scan Scope

| File glob | Rules applied |
|-----------|---------------|
| `tests/**/*.spec.ts` | R1, R2, R3, R4, R6, R7, R8, R9, R10 |
| `src/ui/pages/**/*.ts` | R3, R4, R5 (locator and wait quality in POs) |

---

## Anti-flakiness quick reference

| Root cause | Rule | Signal in code |
|-----------|------|---------------|
| Unknown starting state | R1 | No assertion in first step |
| Dirty state from previous test | R2 | No `clean<Resource>` fixture |
| Timing assumption | R3 | `waitForTimeout` |
| Point-in-time evaluation | R4 | `await locator.textContent()` in expect |
| DOM structure dependency | R5 | CSS chains, XPath, positional `.nth()` |
| Silent action failures | R6 | Step without assertion |
| Test order dependency | R7 | Shared `let` variables across tests |
| Non-deterministic path | R8 | `if/else` in test body |
| Race condition on navigation | R9 | Navigate without immediate assert |
| Wrong-value false positive | R10 | `toBeVisible()` when value matters |

---

## Updates required in automation-architect/SKILL.md

1. **Sub-Skill Registry table**: add new row:

   | Skill | Domain | File Scope | Rules / Checks | Added | Status |
   |-------|--------|-----------|----------------|-------|--------|
   | `spec-quality-standard` | TC body quality · assertions · selectors · wait strategies · flakiness prevention | `tests/**/*.spec.ts` · `src/ui/pages/**/*.ts` | R1–R10 | M7 | Active |

2. **Scan Scope Ownership table**: add new rows:

   | File / Scope | Owner skill | Concern |
   |--------------|-------------|---------|
   | `tests/**/*.spec.ts` — preconditions/postconditions | `spec-quality-standard` | R1, R2 |
   | `tests/**/*.spec.ts` — assertion quality and waits | `spec-quality-standard` | R3, R4, R6, R9, R10 |
   | `tests/**/*.spec.ts` — test independence | `spec-quality-standard` | R7, R8 |
   | `src/ui/pages/**/*.ts` — locator resilience | `spec-quality-standard` | R5 |

3. **Mode 1 — Full Pipeline**: add step after `lifecycle-architect`:
   ```markdown
   7. Run `spec-quality-standard` on `tests/**/*.spec.ts` and `src/ui/pages/**/*.ts`:
      - Detect all TC quality violations
      - Auto-fix every fixable violation (R3, R4)
      - Collect R1, R2, R5–R10 items as manual fixes
   ```

   Update output format:
   ```
   [automation-architect] PIPELINE COMPLETE
   ─────────────────────────────────────────
   pom-architect:        X violations found — Y auto-applied
   spec-code-standard:       X violations found — Y auto-applied
   spec-organisation-standard:       X violations found — Y auto-applied
   lifecycle-architect:  X violations found — Y auto-applied
   spec-quality-standard:           X violations found — Y auto-applied
   Remaining manual fixes: <list if any, or "none">
   [automation-architect] ✅ All rules satisfied.
   ```

4. **Mode 7 — TC Quality Review**: add after Mode 6.
   Update mode slot comment to `(7 of 10 slots used)`.

   ```markdown
   ### Mode 7 — TC Quality Review

   **Triggers:** `"review tc quality"` · `"check test quality"` · `"scan for flaky patterns"` ·
   `"tc quality"`

   **When to use:** After writing or refactoring test cases, or when a test shows
   intermittent failures. Also run before every PR that includes new or modified specs.

   **Steps:**
   1. Load and invoke `spec-quality-standard`
   2. Determine mode:
      - Single file provided → Enforce on that file only
      - No file provided → Enforce on all `tests/**/*.spec.ts`
   3. Forward all output verbatim

   **Note:** Load `spec-quality-standard` directly for standalone TC review without activating
   the hub.
   ```

5. **Sub-Skill Invocation Reference table**: add new row:

   | Goal | Skill to load | Trigger phrase example |
   |------|---------------|------------------------|
   | Review TC quality and anti-flakiness patterns | `spec-quality-standard` | `"review tc quality"` |

