# ADR-004 — Locators and Waits: new skill `ui-locator-wait-standard`

**Date:** 2026-11-23  
**Status:** Proposed  
**Applies to:** `automation-architect` hub · `spec-quality-lifecycle-standard` · `ui-pom-standard`

---

## Context

Module 7 (*Act — Locators, Selectors & DOM* and *Wait Strategies*) and Module 8 (*Assertions*)
define how a test should interact with the UI:

1. **Locators** express user intent (role, label, placeholder, text) or an explicit team
   contract (test id); CSS/XPath is a justified last resort.
2. **Repeated elements** are disambiguated by scope and filters, never by position alone; a
   strict-mode ambiguity must fail clearly.
3. **Actions** match the element type and never bypass actionability.
4. **Waits** target observable conditions, not time. Auto-waiting synchronises actions but does
   not prove business success.
5. **Condition-based waits** (polling) are bounded, fail fast on terminal failure states,
   respect the timeout hierarchy, and explain the last observed state.

The framework enforces only a small part of this: `spec-quality-lifecycle-standard` R3
(no hardcoded waits) and R5 (resilient locators, a single WARNING). ADR-002 already recorded a
locator skill as a *future candidate* for lifecycle phase 3 (Act).

### Maturity model used to measure the gap

| Level | State | Characteristic |
|-------|-------|----------------|
| 0 — Time-driven | Fixed waits, positional or generated selectors | Flaky on slow or fast machines |
| 1 — Structural | CSS/XPath dominate | Breaks on harmless markup changes |
| 2 — Semantic | Intent-based locators, positions still used | Breaks when order changes |
| 3 — Synchronised | Every state change waits for its terminal state | Stable, but long waits are unbounded or opaque |
| 4 — Bounded & diagnosable | Bounded polling, timeout hierarchy, diagnostic messages | Deterministic interaction |

---

## Gap analysis — existing skills

Hub Growth Policy Rule 1 requires confirming that no existing skill covers the gap.

| Skill | What it already covers | Why it does not cover locators and waits |
|-------|------------------------|------------------------------------------|
| `ui-pom-standard` | Locators as getters (R2), no `page.*` in tests (R4) | Governs **where** a locator lives, not **which** locator |
| `spec-quality-lifecycle-standard` | R3 no hardcoded waits · R5 resilient locators | Two rules only; no hierarchy, test-id contract, collections, action semantics, polling, timeouts, or diagnostics. Near its 400-line budget |
| `api-setup-teardown-standard` | HTTP entry point, controllers, status checks | Provides calls used by polling, not how polling is bounded |
| `spec-data-standard` | Data sources for expected values | Supplies filter values, not locator strategy |

### Unclaimed file/concern pairs (Scan Scope Ownership table)

| File / Scope | Concern | Current owner |
|--------------|---------|---------------|
| `src/ui/pages/**` | Locator tier, test-id contract, composition, action semantics | partial (`spec-quality-lifecycle-standard` R5, warning only) |
| `tests/**/*.spec.ts` | Terminal-state waits, redundant waits, soft assertions as sync | partial (R3 fixed waits only) |
| `tests/**` · `src/fixtures/**` | Polling bounds, failure states, diagnostics | none |
| `playwright.config.ts` | `testIdAttribute` contract, timeout layers | none |

---

## Options considered

### Option A — Extend `spec-quality-lifecycle-standard`
**Rejected.** It would exceed the 400-line budget and mix TC body quality with interaction
engineering (Hub Growth Policy Rule 3).

### Option B — Extend `ui-pom-standard`
**Rejected.** `ui-pom-standard` governs Page Object structure. Waits and polling live in specs
and fixtures, outside its scope, and locator strategy would double its size.

### Option C — New skill + new hub mode
**Rejected.** Hub Mode 7 already routes to the TC lifecycle orchestrator; Act is one of its
phases. A new mode would duplicate that route (Rule 1).

### Option D — New skill `ui-locator-wait-standard` orchestrated by `spec-quality-lifecycle-standard` (selected)
One owner for locators and waits, with an assessment mode, one mode per domain question, and a
verification mode. Existing rules R3 and R5 of the lifecycle skill become delegations, so each
concern keeps a single owner.

---

## Decision

1. Create `ui-locator-wait-standard` (prompt: `docs/skills/ui-locator-wait-standard-prompt.md`).
2. **No new hub mode.** `spec-quality-lifecycle-standard` orchestrates it as phase 3 Act
   (M0–M5) and phase 5 Run (M6). Hub Mode 7 gains its triggers. Mode count stays 7 of 10.
3. `spec-quality-lifecycle-standard` R3 → delegated to R13; R5 → delegated to R1–R3, R5
   (Revision 4 of its prompt). The rule IDs remain as delegation stubs (Hub Growth Policy Rule 5).
4. Insert the skill in the Mode 1 pipeline right **after** `ui-pom-standard`.
5. The locator hierarchy is **contract-aware**: when the team defines a test-id contract
   (`testIdAttribute` in the runner config, or a documented convention) and the element carries
   the attribute, `getByTestId` comes first; otherwise role → label → placeholder → text →
   alt text → title → test id → CSS/XPath with a reason.

### Naming note

ADR-001 pattern `{domain}-{objective}-standard`: domain `ui` (the interaction with the user
interface, in Page Objects and in specs), objective `locator-wait` (the two concerns of Module 7).

### Lifecycle after this decision

```
spec-quality-lifecycle-standard (TC lifecycle orchestrator)
 ├─ 1. Specify → spec-requirements-standard
 ├─ 2. Arrange → spec-data-standard M1–M3 · api-setup-teardown-standard
 ├─ 3. Act     → ui-pom-standard (structure) · ui-locator-wait-standard M0–M5
 ├─ 4. Assert  → own R1 R4 R6 R9 R10 · spec-data-standard M4
 └─ 5. Run     → spec-data-standard M5 · ui-locator-wait-standard M6 · tags
     Cross-cutting: Debugging (every phase)
```

### Skill modes

| Mode | Domain question | Rules |
|------|-----------------|-------|
| M0 — Interaction Assessment | Which maturity level, and what blocks the next one? | read-only |
| M1 — Locator Strategy | Does each locator express intent or the team contract? | R1–R4 |
| M2 — Uniqueness & Composition | Does each locator resolve to one element by business criteria? | R5–R8 |
| M3 — Action & Read Semantics | Does each action represent the user interaction? | R9–R12 |
| M4 — Wait Strategy | Does the test wait for the condition that proves completion? | R13–R16 |
| M5 — Polling & Timeouts | Are condition-based waits bounded and diagnosable? | R17–R20 |
| M6 — Interaction Verification | Do interactions stay green when repeated? | evidence |

---

## Consequences

- Hub: mode count unchanged (7 of 10); Mode 7 routes locator and wait requests to phase 3 Act.
- `spec-quality-lifecycle-standard` loses selector and wait detail and gains room under its budget.
- Page Object getters change when a test-id contract is configured (`getByTestId`).
- Every polling helper declares timeout, intervals, failure states and a diagnostic message.
- The course gains one slide per mode (Module 7, Activities).
