---
name: ui-locator-wait-standard
description: >
  Enforce and auto-apply locator and wait standards for Playwright + TypeScript projects.
  Assesses interaction maturity (levels 0-4) and enforces the locator hierarchy (team
  test-id contract first when defined, then role, label, placeholder, text, alt text, title,
  and justified CSS/XPath), element uniqueness and composition, action semantics,
  condition-based waits, bounded polling, timeout hierarchy, and diagnostic wait messages.
  Includes a verification mode that repeats tests to prove interactions are stable. Load when
  writing or reviewing locators, Page Object getters, actions, waits or polling, or when
  diagnosing timeouts, strict-mode violations, or timing-related flaky tests.
---

## Project Context

- **Deterministic interaction:** every interaction targets exactly one element through a
  locator that expresses user intent (or the team's test contract), and every wait is a bounded
  condition that proves the operation completed and explains itself when it fails.
- **Selector vs. locator:** a selector is a string; a locator is a lazy object that re-queries
  the DOM, auto-waits for actionability and retries assertions. Pass locators, never strings.
- **Auto-waiting synchronises actions; assertions verify behaviour.** A clickable button does
  not prove the operation completed. **Strict mode** failures are information — fix the locator.
- Locators live in Page Object getters (`ui-pom-standard` R2). This skill decides **which**
  locator; `ui-pom-standard` decides **where** it lives.
- AI may inspect, compare and propose locators, but never invents attributes, roles, names, or
  API states that were not observed.

### Project conventions (agnostic — resolve before applying rules)

Resolve each placeholder from the project (CLAUDE.md / AGENTS.md, ADRs, `tsconfig.json` paths,
folder tree, runner config); use the default only when the project defines nothing. Report the
resolved values in the M0 header.

| Placeholder | Meaning | Default |
|-------------|---------|---------|
| `<pages-dir>` | Page Objects and components | `src/ui/pages` · `src/ui/components` |
| `<specs-dir>` | Spec files | `tests` |
| `<fixtures-module>` | Playwright fixtures (`test.extend`) | `src/fixtures` |
| `<api-layer>` | API client + controllers (used for polling) | `src/api` |
| `<runner-config>` | Playwright config | `playwright.config.ts` |
| `<testid-contract>` | `testIdAttribute` in `<runner-config>` (global or per project) **or** a convention in CLAUDE.md / AGENTS.md / an ADR | none |
| `<testid-attribute>` | Attribute name of the contract | `data-testid` |

### Locator hierarchy (R1)

Resolve `<testid-contract>` **per site**. The contract applies to an element only when the
attribute exists on that element in the inspected DOM.

| # | Contract defined and element carries it | No contract, or element lacks it |
|---|-----------------------------------------|----------------------------------|
| 1 | `getByTestId()` | `getByRole()` |
| 2 | `getByRole()` | `getByLabel()` |
| 3 | `getByLabel()` | `getByPlaceholder()` |
| 4 | `getByPlaceholder()` | `getByText()` |
| 5 | `getByText()` | `getByAltText()` |
| 6 | `getByAltText()` | `getByTitle()` |
| 7 | `getByTitle()` | `getByTestId()` |
| 8 | CSS / XPath with a reason (R2) | CSS / XPath with a reason (R2) |

Choose the highest tier that identifies the element uniquely; prefer composition over going down a tier.

### Wait types and timeout layers

| Type | Example | Status |
|------|---------|--------|
| Fixed | `waitForTimeout(3000)`, sleep | Forbidden (R13) |
| Implicit | Actionability auto-wait, web-first assertion retry | Rely on it; do not duplicate (R15) |
| Explicit | `expect(locator).toHaveText()`, `expect(page).toHaveURL()`, `waitForResponse` tied to the action | After every state-changing action (R14) |
| Condition-based | `expect.poll()`, `expect().toPass()` | For state not in the DOM; always bounded (R17–R20) |

Timeout layers: test (`<runner-config>` / test options) · assertion (`expect.timeout`) · action /
navigation (`use.actionTimeout` / `navigationTimeout`) · request (API client) · polling
(`expect.poll`). Invariant: **test > polling > single request / assertion**.

### Maturity levels

| Level | State | Exit criteria (to reach the next level) |
|-------|-------|-----------------------------------------|
| 0 — Time-driven | Fixed waits; positional or generated selectors | No fixed waits (R13); no dynamic IDs / generated classes (R3) |
| 1 — Structural | CSS/XPath dominate | Hierarchy per contract (R1); every CSS/XPath justified (R2) |
| 2 — Semantic | Intent-based locators; positions still disambiguate | Scope/filter instead of positions (R5–R8); actions match element (R9–R11) |
| 3 — Synchronised | Every state change waits for its terminal state | Bounded polling with failure states (R17–R18); timeout hierarchy (R19); diagnostics (R20) |
| 4 — Bounded & diagnosable | Deterministic interaction | Maintain: run M6 on every new TC |

### Domain coordination

| Concern | Owner | How this skill interacts |
|---------|-------|--------------------------|
| TC lifecycle orchestration | `spec-quality-lifecycle-standard` | Invokes this skill in phase 3 Act (M0–M5) and phase 5 Run (M6) |
| Where locators live / no `page.*` in tests | `ui-pom-standard` R2 · R4 | Not re-checked; this skill judges the locator **expression** |
| Preconditions / navigate-then-assert | `spec-quality-lifecycle-standard` R1 · R9 | Not re-checked |
| Observable completion condition per step | `spec-requirements-standard` Q5–Q7 | Input: the oracle each wait must reach (R14) |
| Values used inside filters | `spec-data-standard` R10 · R13 | Filters use created / mock / dataset values, not env literals |
| HTTP calls during polling | `api-setup-teardown-standard` R1 · R11 | Polling calls a controller; the client checks the status |
| Assertion type, messages, hard vs. soft validation | `spec-quality-lifecycle-standard` R4 · R6 · R10 | R16 covers only soft assertions used as synchronisation |

---

## Modes

Each mode answers one domain question and owns its rules (one rule → one mode). **M0 is the
default** when no mode is specified.

### M0 — Interaction Assessment (read-only)

**Triggers:** `"assess locators"` · `"assess waits"` · `"interaction maturity"` · `"locator wait"`

1. Scan `<pages-dir>`, `<specs-dir>`, `<fixtures-module>`, `<runner-config>`; resolve `<testid-contract>` per site
2. Classify every locator by tier (1–8) and every wait by type; score the maturity level **per site**
3. List blockers for the next level, each mapped to mode and rule. Do NOT modify files

```
[ui-locator-wait-standard] INTERACTION ASSESSMENT
─────────────────────────────────────────
Site: <site>     Test-id contract: <attribute> (<source>) | none     Level: <0-4> — <name>
  Locators: <N> total · tier 1–7 <N> (<pct>%) · CSS/XPath <N> (<N> justified) · positional <N>
  Waits:    fixed <N> · explicit <N> · condition-based <N> (<N> bounded) · redundant <N>
  Blockers to level <N+1>:
    - <issue> → M<n> / R<n>
Recommended next mode: M<n>
```

### M1 — Locator Strategy (R1–R4)

**Triggers:** `"review locators"` · `"locator strategy"` · `"fix selectors"` · `"locator wait m1"`

**Question:** Does each locator express user intent or the team's explicit test contract?

1. Inspect first: DevTools (HTML, accessibility tree), `npx playwright codegen`, `--debug` Inspector
2. Run R1–R4 on Page Objects, components and spec-level chains; list MANUAL-FIX items with the
   proposed locator and tier. No stable contract → **markup request** for the development team

### M2 — Uniqueness & Composition (R5–R8)

**Triggers:** `"locator uniqueness"` · `"strict mode violation"` · `"repeated elements"` · `"locator wait m2"`

**Question:** Does every locator resolve to exactly one element by business criteria, not position?

Run R5–R8. Replace positions with scope + `filter({ hasText | has })` + unique child.
Collections: filter → assert count → iterate or read.

```typescript
rowFor(name: string) { return this.page.getByRole('row').filter({ hasText: name }); } // PO
const row = ordersPage.rowFor(created.name);                                          // spec
await expect(row, `Exactly one row should exist for ${created.name}`).toHaveCount(1);
await row.getByRole('button', { name: 'Archive' }).click();
```

### M3 — Action & Read Semantics (R9–R12)

**Triggers:** `"review actions"` · `"action semantics"` · `"locator wait m3"`

**Question:** Does each action represent the real user interaction, without bypassing checks?

| Element | Action |
|---------|--------|
| Button / link | `click()` |
| Text input | `fill()` (`pressSequentially()` only when per-key behaviour is under test) |
| Checkbox / radio | `check()` / `uncheck()` / `setChecked()` |
| Select | `selectOption()` |
| File input | `setInputFiles()` |
| Keyboard | `press()` |

### M4 — Wait Strategy (R13–R16)

**Triggers:** `"fix waits"` · `"remove hardcoded waits"` · `"synchronisation"` · `"locator wait m4"`

**Question:** Does the test wait for the observable condition that proves completion — never for time?

Run R13–R16. Take each action's terminal state from the TC oracle (`spec-requirements-standard` Q6).

| Change | Wait |
|--------|------|
| Text / status | `expect(locator).toHaveText(...)` |
| Appears / disappears | `toBeVisible()` / `toBeHidden()` |
| Navigation | `expect(page).toHaveURL(...)` |
| Attribute / state | `toHaveAttribute()` · `toBeEnabled()` · `toBeChecked()` |
| List size | `toHaveCount(n)` on owned data |
| Backend response the UI depends on | `page.waitForResponse(...)` started **before** the action, then a UI assertion |

### M5 — Polling & Timeouts (R17–R20)

**Triggers:** `"polling"` · `"wait for api state"` · `"timeouts"` · `"locator wait m5"`

**Question:** Is every condition-based wait bounded, aware of failure states, and diagnosable?

Run R17–R20 on specs, fixtures and helpers. States come from `<api-layer>` models
(undocumented → `TBD: state model`); timeouts are checked against `<runner-config>`.

```typescript
const FAILED = ['failed', 'cancelled', 'expired'];
await expect.poll(async () => {
  const { status } = await jobController.getStatus(job.id);   // controller, not request.*
  if (FAILED.includes(status)) throw new Error(`Job ${job.id} reached terminal failure "${status}"`);
  return status;
}, {
  message: `Job ${job.id} should reach "completed"`,
  timeout: 5 * 60_000,
  intervals: [2_000, 5_000, 10_000, 15_000],
}).toBe('completed');
// test options: { timeout: 6 * 60_000 }  → test timeout > polling timeout
```

### M6 — Interaction Verification (evidence)

**Triggers:** `"verify interactions"` · `"stress locators"` · `"flaky interaction"` · `"locator wait m6"`

**Question:** Do the interactions stay green when repeated, in parallel, under load? Executes
tests; never modifies code.

`npx playwright test <scope> --project=<browser> --repeat-each=<K> --workers=<N> --retries=0 --trace=retain-on-failure`
(default K=5, N=4). Classify every failure; compare with the previous run when available.

| Category | Signal | Rule |
|----------|--------|------|
| Strict-mode violation | `resolved to N elements` | R5–R8 |
| Locator not found | Timeout waiting for locator | R1–R4 |
| Not actionable | Not visible / not stable / intercepted | R10 · R14 |
| Premature assertion | Action passed, assertion saw the old state | R14 · R15 |
| Polling exhausted | `expect.poll` timeout / terminal failure | R17–R20 |
| Data / isolation | Collision, 401, missing record | → `spec-data-standard` M5 |

```
[ui-locator-wait-standard] INTERACTION VERIFICATION
Scope: <scope>   Project: <browser>   repeat=<K> workers=<N>
Result: <passed>/<total> passed · <flaky> flaky
Failures by cause: strict <n> · not-found <n> · actionability <n> · premature <n> · polling <n> · data <n>
Verdict: ✅ DETERMINISTIC  |  ❌ NOT DETERMINISTIC → run M<n> for <rule>
```

---

## Rules

### R1 — LOCATOR_HIERARCHY (ERROR, MANUAL-FIX) · M1

**Condition:** A locator uses a lower tier than one that identifies the same element uniquely.
With `<testid-contract>` defined and the attribute present, any other strategy is a lower tier.

**Auto-fix (partial):** `locator('[<testid-attribute>="x"]')` → `getByTestId('x')` when the
contract is configured in `<runner-config>`. Contract exists but element lacks the attribute →
semantic order + markup request. Never add an attribute not seen in the DOM (R4).

```typescript
// contract: testIdAttribute = 'data-test'
get submitButton() { return this.page.locator('[data-test="login-button"]'); }  // ❌
get submitButton() { return this.page.getByTestId('login-button'); }            // ✅
// no contract
get submitButton() { return this.page.getByRole('button', { name: 'Login' }); } // ✅
```

### R2 — JUSTIFIED_CSS_XPATH (WARNING, MANUAL-FIX) · M1

**Condition:** CSS/XPath (tier 8) without a `// locator: <reason>` comment. **Fix:** move up a tier, or add the reason.

### R3 — NO_FRAGILE_SELECTORS (ERROR, MANUAL-FIX) · M1

**Condition:** A locator depends on a dynamic ID (digits/hash segment), a generated class
(`css-*`, `sc-*`, `jss*`, hashed suffix), a CSS/XPath chain deeper than 3 levels, `:nth-child`,
or XPath indexes (`[2]`). **Fix:** dynamic ID → role / label / text / test id; generated class →
role / test id; deep chain → region scope + semantic child; no contract → markup request + R2.

### R4 — NO_INVENTED_ATTRIBUTES (ERROR, MANUAL-FIX) · M1

**Condition:** A locator references a test id, role name, label or attribute not observed in the
DOM (codegen, Inspector, DevTools, page snapshot). **Fix:** replace with an observed value; if it
cannot be verified, mark `// TODO: verify locator in DOM` and report — never guess.

### R5 — NO_POSITIONAL_WITHOUT_RULE (WARNING, MANUAL-FIX) · M2

**Condition:** `.first()`, `.last()` or `.nth(n)` is the only disambiguation, without a
`// position: <business rule>` comment. **Fix:** scope and filter by business data (R6); keep the
position only when the order itself is the requirement.

### R6 — SCOPE_AND_FILTER (WARNING, MANUAL-FIX) · M2

**Condition:** Similar elements are distinguished by a long selector string instead of region
scoping, `filter({ hasText | has | hasNot })`, or a unique child locator.

```typescript
this.page.locator('div.cards > div:has-text("Playwright") button.add');           // ❌
this.page.getByRole('article').filter({ hasText: 'Playwright' })
  .getByRole('button', { name: 'Add to cart' });                                   // ✅
```

Filter values come from controlled data (`spec-data-standard` R13), not environment literals.

### R7 — FILTER_BEFORE_ITERATE (WARNING, MANUAL-FIX) · M2

**Condition:** A collection is iterated (`for`, `.all()`, `count()` loop) or read as a list
(`allTextContents`, `evaluateAll`) before being filtered by business criteria and its count
asserted. **Fix:** filter → `toHaveCount(n)` → iterate / read.

### R8 — AMBIGUITY_FAILS_CLEARLY (ERROR, MANUAL-FIX) · M2

**Condition:** Strict-mode ambiguity silenced (`.first()` after `resolved to N elements`, or `try/catch` hiding a missing element). **Fix:** make it unique (R6).

### R9 — ACTION_MATCHES_ELEMENT (ERROR, AUTO-FIX) · M3

**Condition:** `click()` on a checkbox/radio, `type()` (deprecated) or `pressSequentially()` for
plain input, `click()` on an `<option>`, keyboard tricks to choose a select value, or `fill()` on
a file input. **Auto-fix:** use the M3 table action.

### R10 — NO_ACTIONABILITY_BYPASS (ERROR, MANUAL-FIX) · M3

**Condition:** `{ force: true }`, `dispatchEvent('click')`, `evaluate(el => el.click())`, or JS
value assignment instead of `fill()`. If a real user cannot click it, the test must not either.
**Fix:** wait for the blocker to clear (overlay hidden, element enabled). Allowed only with
`// bypass: <reason>` for a documented product limitation.

### R11 — LOCATOR_NOT_HANDLE (ERROR, AUTO-FIX) · M3

**Condition:** `page.$()`, `page.$$()`, `ElementHandle`, `page.waitForSelector()`, or a raw
selector string passed between methods. **Auto-fix:** `page.$(s)` → `page.locator(s)`;
`waitForSelector(s)` → `await expect(locator).toBeVisible()`; methods take and return `Locator`.

### R12 — INTENTIONAL_READS (WARNING, MANUAL-FIX) · M3

**Condition:** A read (`textContent`, `innerText`, `getAttribute`, `inputValue`, `boundingBox`,
`evaluate(getComputedStyle)`) is used for something other than capturing a value a later step
needs, or an intentional visual check marked `// visual: <reason>`. **Fix:** verify with a
web-first assertion (`spec-quality-lifecycle-standard` R4).

### R13 — NO_FIXED_WAITS (ERROR, AUTO-FIX) · M4

*Owner moved from `spec-quality-lifecycle-standard` R3 (ADR-004).*

**Condition:** `page.waitForTimeout(n)`, `setTimeout`, `new Promise(r => setTimeout(r, n))` or a
sleep helper in a spec, Page Object, fixture or helper. **Auto-fix:** explicit wait on the
terminal state (M4 table), e.g. `waitForTimeout(3000)` → `expect(status).toHaveText('Saved')`;
unknown state → `// TODO: wait for <terminal state>` + MANUAL-FIX.

### R14 — WAIT_FOR_TERMINAL_STATE (ERROR, MANUAL-FIX) · M4

**Condition:** A state-changing action (submit, save, delete, navigate, upload) is followed by
(1) no wait for the state that proves completion before the next action, or (2) a generic wait
that proves nothing: `waitForLoadState('networkidle')`, bare `waitForLoadState()`, or a wait on
an intermediate state. **Fix:** wait for the final observable state from the TC oracle.

### R15 — NO_REDUNDANT_WAITS (WARNING, AUTO-FIX) · M4

**Condition:** `locator.waitFor()` or `expect(locator).toBeVisible()` right before an action on
the **same** locator, with no other purpose. **Auto-fix:** remove it; keep it only when it is the
step's assertion or a precondition (`spec-quality-lifecycle-standard` R1).

### R16 — NO_SOFT_ASSERT_AS_SYNC (ERROR, AUTO-FIX) · M4

**Condition:** `expect.soft()` checks a state the next action depends on. A failed soft assertion
does not stop the test, so the next action fails with a misleading error. Soft assertions are for
independent evidence only. **Auto-fix:** convert to a hard `expect()`.

### R17 — BOUNDED_POLLING (ERROR, MANUAL-FIX) · M5

**Condition:** `expect.poll` / `toPass` without `timeout` and `intervals`, or a hand-rolled
`while` / `for` / recursive retry loop with `try/catch`. **Fix:** `expect.poll` (state value) or
`toPass` (assertion block) with both options, polling through a controller
(`api-setup-teardown-standard` R1).

### R18 — TERMINAL_FAILURE_STATES (ERROR, MANUAL-FIX) · M5

**Condition:** Polling checks only the success state, so a terminal failure (`failed`,
`cancelled`, `expired`, error page) keeps polling until timeout; or the polled states are not in
the API contract. **Fix:** fail immediately on terminal failures with the observed state; take
states from the API models (unknown → `TBD: state model`).

### R19 — TIMEOUT_HIERARCHY (WARNING, MANUAL-FIX) · M5

**Condition:** (1) a polling or assertion timeout ≥ the effective test timeout; (2) a magic-number
timeout with no constant or comment; (3) a global timeout raised in `<runner-config>` to hide one
slow operation. **Fix:** test > polling > request/assertion; raise only the slow operation, with a
named constant or `// timeout: <business reason>`.

### R20 — DIAGNOSTIC_WAIT_MESSAGE (WARNING, AUTO-FIX) · M5

**Condition:** A long wait (`expect.poll`, `toPass`, matcher with custom `timeout`) has no
message, or its failure omits the last observed state. **Auto-fix:** add `message` with the
entity and expected state; custom failures throw with the last state and elapsed time
(`Job 42 did not complete within 300s. Last known status: "processing".`).

---

## Violation Output Format

```
[ui-locator-wait-standard] SEVERITY — RULE_NAME (M<n>)
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED | MANUAL-FIX
```

## Scan Scope

| File glob | Rules |
|-----------|-------|
| `<pages-dir>/**/*.ts` | R1–R13, R15 |
| `<specs-dir>/**/*.spec.ts` | R5–R20 |
| `<fixtures-module>/**/*.ts` · helpers | R13, R17–R20 |
| `<runner-config>` | R1 (contract resolution), R19 |
