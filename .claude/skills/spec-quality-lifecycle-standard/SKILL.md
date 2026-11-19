---
name: spec-quality-lifecycle-standard
description: >
  Enforce and auto-apply test case quality standards for Playwright + TypeScript projects.
  Governs preconditions, postconditions, assertion quality, selector resilience, wait
  strategies, and anti-flakiness patterns inside test bodies. Acts as domain orchestrator
  for TC quality: coordinates ui-pom-standard (locators) and api-setup-teardown-standard
  (teardown) for the parts they own, then applies its own rules for the test body.
  Load when creating, reviewing, or debugging test cases.
---

## Project Context

- A test case is considered **deterministic** when it produces the same result on every
  run regardless of execution order, machine speed, or prior test state.
- **Precondition**: the state the system must be in BEFORE the first test action.
  Preconditions are enforced by fixtures; they must be ASSERTED in the first `test.step()`.
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

### Domain orchestration — TC lifecycle phases

This skill is the **domain orchestrator of the full TC lifecycle** (the framework hub is
`automation-architect`). The lifecycle follows the test itself; each phase lists the skills
that live in it:

| # | Phase | Question answered | Skills (rules) |
|---|-------|-------------------|----------------|
| 1 | Specify | What is tested, with which exact oracle? | `spec-requirements-standard` (Q1–Q13) |
| 2 | Arrange | With which data, from which state — and how is it restored? | `spec-data-standard` (M1–M3) · `api-setup-teardown-standard` (setup + teardown) |
| 3 | Act | Does the test interact robustly (structure, selectors, waits)? | `ui-pom-standard` (POM structure) · this skill R3 waits, R5 locators |
| 4 | Assert | Does it check the exact value and explain the failure? | this skill R1, R4, R6, R9, R10 · `spec-data-standard` M4 (R13–R14) |
| 5 | Run | Does it stay green in parallel, repeatedly, per environment, with the right selection? | `spec-data-standard` M5 · data-impact tags (R11) |

**Cross-cutting — Debugging:** every phase reports failures with an actionable message
(blocking rule, file, real cause). Debugging is not a final phase: e.g. an unchecked HTTP
status in Arrange hides a 401 until Assert. **Reporting** (HTML, e-mail, artifacts) belongs to
the CI pipeline, outside this skill.

A phase runs only if the previous phase has no ERROR for the same TC; otherwise report the
blocking phase. Teardown (postconditions) is owned by phase 2 even though it executes after
phase 4. Data isolation across workers belongs to `spec-data-standard` R1; R7 here covers
independence inside spec files.

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

## Modes

---

### Mode: Enforce — Scan and Report

**Triggers:** `"review tc quality"` · `"check test quality"` · `"scan for flaky patterns"` · `"tc quality"`

**When to use:** After writing or refactoring test cases, or when a test is showing
intermittent failures.

**Steps:**
1. Discover all `*.spec.ts` files under `tests/`
2. Apply all rules (R1–R10) to each file
3. For R5 (locator resilience): coordinate with `ui-pom-standard` for deeper PO analysis
4. For R2 (postcondition): cross-check with `api-setup-teardown-standard` R4.
   For R10 (specificity): cross-check with `spec-data-standard` R13
5. Auto-fix every AUTO-FIX violation
6. Collect MANUAL-FIX violations as a prioritised list (ERRORs before WARNINGs)
7. Emit the violation report

**Output:**
```
[spec-quality-lifecycle-standard] SCAN COMPLETE
─────────────────────────────────────────
Scanned:  <N> spec files
Errors:   <N> found — <N> auto-applied
Warnings: <N> found
Remaining manual fixes: <list if any, or "none">
[spec-quality-lifecycle-standard] ✅ All quality rules satisfied.
```

---

### Mode: Create — Scaffold a Quality TC

**Triggers:** `"create tc"` · `"new test case"` · `"scaffold tc"` · `"write tc"`

**When to use:** When writing a new test case from scratch.

**Step 0 — Read the handoff** from `spec-requirements-standard` M4 (under the TC in
`docs/test-cases/`). If none exists, run phase 1 first — never invent an oracle. It provides:
- `tcId`, `title`, `tags`, `preconditions` (with fixture type), `steps` (action + oracle)
- `dataSource` per data item: `created` · `mock` · `dataset` · `discovery`
- `expectedValues`: the exact oracles, asserted with value matchers in Step 3
  (`toHaveText`, `toHaveValue`, `toHaveURL`, `toHaveCount` on owned data).
  `toBeVisible()` alone only for structural checks

**Step 1 — Identify required fixtures** from preconditions:
- Login required? → include the site's `authenticated*` fixture
- API cleanup required? → include `clean<Resource>` fixture (coordinates with `api-setup-teardown-standard`)
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

### Mode: Lifecycle — Specify → Run for one TC

**Triggers:** `"tc lifecycle <TC>"` · `"automate tc end to end"` · `"full tc lifecycle"`

**Steps:**
1. Specify: `spec-requirements-standard` M0 → M2 if not Ready → M4 handoff
2. Arrange: `spec-data-standard` M0 → M1–M3 on the handoff data; `api-setup-teardown-standard`
   (Add mode if a controller or fixture is missing; teardown after `use()`)
3. Act: `ui-pom-standard` on the Page Objects used by the TC; R3 (waits) and R5 (locators)
4. Assert: Create mode (new TC) or Enforce mode (existing TC); `spec-data-standard` M4
5. Run: `spec-data-standard` M5 on the TC

```
[spec-quality-lifecycle-standard] LIFECYCLE — TC{N}
1 Specify   ✅ Ready (score <n>%)          | ❌ blocked: <rule>
2 Arrange   ✅ Level <n> · teardown ok     | ❌ blocked: <rule>
3 Act       ✅ POM · waits · locators      | ❌ blocked: <rule>
4 Assert    ✅ exact values, 0 violations  | ❌ <n> violations
5 Run       ✅ HERMETIC (<passed>/<total>) | ❌ NOT HERMETIC (cause: <category>)
```

---

## Rules

---

### R1 — PRECONDITION_ASSERTED (ERROR, MANUAL-FIX)

**Condition:** A `test()` body begins with an action (click, fill, navigate) WITHOUT
a preceding step that asserts the precondition is met.

**Why:** A test that starts acting without first verifying its starting state is
building on an unknown foundation.

**Violation:**
```typescript
test('TC02: ...', async ({ bookStorePage }) => {
  await bookStorePage.clickFirstBook(); // ❌ first action — no precondition assertion
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

**Violation:**
```typescript
test('TC02: ...', async ({ bookStorePage, bookDetailPage, profilePage }) => {
  // adds a book — but no cleanBookshelf fixture ❌
});
```

**Expected:**
```typescript
test('TC02: ...', async ({
  bookStorePage, bookDetailPage, profilePage,
  cleanBookshelf  // ✅ guarantees teardown even if the test fails
}) => {
  void cleanBookshelf;
  ...
});
```

---

### R3 — NO_HARDCODED_WAITS (ERROR, AUTO-FIX)

**Condition:** Any call to `page.waitForTimeout(N)`, `setTimeout(N, ...)`, or
`new Promise(r => setTimeout(r, N))` in a spec file or Page Object.

**Auto-fix replacement table:**

| Hardcoded wait | Semantic replacement |
|---------------|---------------------|
| Wait for element | `await expect(locator).toBeVisible()` |
| Wait for navigation | `await page.waitForURL(pattern)` + assertion |
| Wait for network idle | `await page.waitForLoadState('networkidle')` _(use sparingly)_ |
| Wait for element gone | `await expect(locator).toBeHidden()` |
| Wait for text change | `await expect(locator).toHaveText(newText)` |

---

### R4 — WEB_FIRST_ASSERTIONS (ERROR, AUTO-FIX)

**Condition:** An assertion on a locator uses JavaScript-first form — the locator is
awaited before being passed to `expect()`.

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
- Positional: `.first()` or `.nth(0)` as the ONLY disambiguation
- Long CSS chains: `div.wrapper > ul > li:nth-child(2) > span.label`
- XPath: `//div[@class='container']//button[2]`
- Text that changes with locale or data

**Resilient (prefer):**
- `getByRole('button', { name: 'Submit' })` — semantic HTML role
- `getByLabel('Email address')` — associated label text
- `locator('[data-testid="submit-btn"]')` — purpose-built attribute
- `locator('#unique-id')` — unique DOM ID
- `getByText('Static label', { exact: true })` — stable text

---

### R6 — STEP_ASSERTS_RESULT (WARNING, MANUAL-FIX)

**Condition:** A `test.step()` block performs user-facing actions but contains NO assertion.

**Violation:**
```typescript
await test.step('Click Add To Your Collection', async () => {
  await bookDetailPage.addToCollectionButton.click(); // ❌ no assertion
});
```

**Expected:**
```typescript
await test.step('Click Add To Your Collection and confirm alert', async () => {
  const alertMessage = await bookDetailPage.addToCollection();
  expect(alertMessage).toBe('Book added to your collection.'); // ✅
});
```

---

### R7 — TEST_IS_INDEPENDENT (ERROR, MANUAL-FIX)

**Condition:** A test file contains:
1. A `let` variable declared outside all `test()` calls and mutated inside `test()`
2. A `beforeAll()` block that sets up state consumed by multiple `test()` calls
3. A `test()` that navigates to a URL set up by a previous `test()` in the same file

**Fix:** Move shared state into fixtures (run before each test).

---

### R8 — NO_CONDITIONAL_IN_TEST_BODY (ERROR, MANUAL-FIX)

**Condition:** An `if/else`, `for`, `while`, `switch`, or `try/catch` block appears
inside a `test()` body.

Conditional logic belongs in Page Objects or fixtures — never in the test body.

---

### R9 — NAVIGATE_THEN_ASSERT (ERROR, MANUAL-FIX)

**Condition:** A navigation call is NOT immediately followed by an assertion confirming
the target page loaded.

**Violation:**
```typescript
await bookStorePage.navigate('/books');
await bookStorePage.clickFirstBook(); // ❌ no confirmation of /books loading
```

**Expected:**
```typescript
await bookStorePage.navigate('/books');
await expect(bookStorePage.pageHeading).toBeVisible(); // ✅
await bookStorePage.clickFirstBook();
```

---

### R10 — ASSERTION_SPECIFICITY (WARNING, MANUAL-FIX)

**Condition:** An assertion only checks existence when the TC intent requires checking
the VALUE of that element, or the expected value has no controlled source
(see `spec-data-standard` R13).

**Violation:**
```typescript
// TC: "assert books table contains a row with the added book title"
await expect(profilePage.bookList.first()).toBeVisible(); // ❌ only presence
```

**Expected:**
```typescript
await expect(profilePage.bookRowByTitle(firstBookTitle)).toBeVisible(); // ✅ specific
```

---

## Violation Output Format

```
[spec-quality-lifecycle-standard] SEVERITY — RULE_NAME
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED | MANUAL-FIX
```

---

## Scan Scope

| File glob | Rules applied |
|-----------|---------------|
| `tests/**/*.spec.ts` | R1, R2, R3, R4, R6, R7, R8, R9, R10 |
| `src/ui/pages/**/*.ts` | R3, R4, R5 (locator and wait quality in POs) |

---

## Anti-flakiness quick reference

See `docs/wiki/anti-flakiness-reference.md` (root cause → rule → signal in code).
