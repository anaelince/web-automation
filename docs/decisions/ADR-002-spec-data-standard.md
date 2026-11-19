# ADR-002 — Test Data Robustness: new skill `spec-data-standard`

**Date:** 2026-11-18  
**Status:** Proposed — revised 2026-11-18 (orchestration moved under `spec-quality-lifecycle-standard`)  
**Applies to:** `automation-architect` hub · `spec-quality-lifecycle-standard` · all domain skills that touch test data

---

## Context

The framework controls the **test lifecycle** (setup, teardown, assertions, waits), but no
skill governs the **test data** that flows through that lifecycle. As a result, tests can be
correct in isolation and still fail when:

1. **They run in parallel** — two workers mutate the same identity or resource
   (shared account, shared cart, shared collection, shared session token).
2. **They run in another environment** — the test assumes a record, ID, URL, or user
   that only exists in one environment.
3. **They assert on data they do not own** — assertions only check presence because the
   expected value is unknown, so wrong values pass silently.

These are symptoms of one discipline: **Test Data Management (TDM)**. Its goal is the
**hermetic test** — a test that depends on nothing it does not control.

### Maturity model used to measure the gap

| Level | State | Characteristic |
|-------|-------|----------------|
| 0 — Hardcoded | Data inside the spec | Fragile; does not scale |
| 1 — Externalised | Data in `src/data/`, data-driven datasets | Reusable, but static |
| 2 — Per environment | Typed config, secrets outside the repo | Portable across environments |
| 3 — Isolated | Unique data, per-worker resources or pools | Safe in parallel |
| 4 — Self-provisioned | API setup/teardown, discovery, mocks | Hermetic: runs anywhere, in any order |

---

## Gap analysis — existing skills

Hub Growth Policy Rule 1 requires confirming that no existing skill covers the gap.

| Skill | What it already covers | Why it does not cover test data |
|-------|------------------------|--------------------------------|
| `spec-code-standard` | R7 no hardcoded credentials · R9 site placement of `src/data/` | Covers *where credentials come from*, not data isolation, sourcing, or environments |
| `spec-organisation-standard` | Folders, naming, TC IDs, steps (tag rules planned) | Owns tag **syntax**, not which tags data-impacting tests must carry |
| `api-setup-teardown-standard` | API layer, teardown pairing (R4), token refresh (R10) | Guarantees teardown **exists**, not that it is scoped, isolated, or environment-safe |
| `spec-quality-lifecycle-standard` | Preconditions, waits, independence (R7), assertion specificity (R10) | Body quality only. Already 368 lines — near the 400-line budget, cannot absorb a new domain |

### Unclaimed file/concern pairs (Scan Scope Ownership table)

| File / Scope | Concern | Current owner |
|--------------|---------|---------------|
| `src/data/**` | Data shape, typing, sourcing, uniqueness | none (only site placement) |
| `src/config/env.ts` | Environment selection and validation | none (only import hygiene) |
| `src/fixtures/index.ts` | Fixture **scope** and data identity (test / worker / pool) | none |
| `playwright.config.ts` | Parallelism suppression, environment projects | none |
| `tests/**/*.spec.ts` | Data-impact tags, env-specific literals, expected-value source | none |

---

## Options considered

### Option A — Extend `spec-quality-lifecycle-standard`
**Rejected.** It would exceed the 400-line budget (Framework Growth Consideration 1) and mix
two domains (TC body quality vs. data management), violating Hub Growth Policy Rule 3.

### Option B — Distribute rules across existing skills
**Rejected.** Data robustness would have no single owner, no maturity assessment, and no
verification procedure. Rules would drift apart.

### Option C — New skill `spec-data-standard` + hub Mode 8
One owner for the data domain, routed directly from a new hub mode.

**Rejected (revised 2026-11-18):** Hub Mode 7 (TC Quality Review) already routes to
`spec-quality-lifecycle-standard`, which is the **domain orchestrator for the TC lifecycle**.
Test data is one phase of that lifecycle. A new hub mode would duplicate that route and
violate Hub Growth Policy Rule 1.

### Option D — New skill `spec-data-standard` orchestrated by `spec-quality-lifecycle-standard` (selected)
One owner for the data domain, with a maturity assessment, rule modes, and a verification
mode that produces evidence. It is invoked by the TC lifecycle orchestrator, not by a new hub
mode. Existing skills are **reinforced**, not duplicated.

---

## Decision

1. Create `spec-data-standard` (prompt: `docs/skills/spec-data-standard-prompt.md`).
2. **No new hub mode.** `spec-quality-lifecycle-standard` orchestrates it as the *Data* phase
   (M1–M4) and the *Verify* phase (M5) of the TC lifecycle. Hub Mode 7 gains its triggers.
3. Insert the skill in the Mode 1 pipeline **after** `api-setup-teardown-standard` and
   **before** `spec-quality-lifecycle-standard`, because data must be isolated before body
   quality can be judged.
4. Reinforce existing skills (see "Reinforcements").

### Two orchestration levels

| Level | Skill | Orchestrates |
|-------|-------|--------------|
| Framework hub | `automation-architect` | All layers: POM, code, organisation, API, git, docs |
| TC lifecycle domain | `spec-quality-lifecycle-standard` | A test case from definition to verification |

```
spec-quality-lifecycle-standard (TC lifecycle orchestrator)        — revised 2026-11-19
 ├─ 1. Specify → spec-requirements-standard (ADR-003)
 ├─ 2. Arrange → spec-data-standard M1–M3 · api-setup-teardown-standard (setup + teardown)
 ├─ 3. Act     → ui-pom-standard (POM structure) · own R3 waits, R5 locators · locator skill (future)
 ├─ 4. Assert  → own R1 R4 R6 R9 R10 · spec-data-standard M4
 └─ 5. Run     → spec-data-standard M5 · data-impact tags
     Cross-cutting: Debugging (every phase)      Next module: CI — reporting, matrix, secrets
```

*Revision 2026-11-19:* the first version had six phases (Define, Data, Setup/Teardown, Page
Objects, Body, Verify). It mixed lifecycle stages, infrastructure layers and code parts, so
"Page Objects" did not read as a phase. The lifecycle now follows the test (Arrange · Act ·
Assert) wrapped in Specify and Run; debugging is cross-cutting and reporting moves to CI.

### Naming note

ADR-001 reserves the `data-` prefix for `src/data/`. This skill governs test data **as consumed
by specs**: fixtures, config, data files, and spec bodies. `data-` would wrongly
limit it to one folder. `spec-data-standard` follows the `{domain}-{objective}-standard`
pattern with `spec` as the consuming domain.

### Skill modes

| Mode | Domain question | Output |
|------|-----------------|--------|
| M0 — Maturity Assessment | Where are we (level 0–4) and what blocks the next level? | Read-only report |
| M1 — Parallel Isolation | Can N workers run without touching each other's data? | Violations + fixes |
| M2 — Data Sourcing & Data-Driven | Where does each test get its data, and is it typed? | Violations + fixes |
| M3 — Environment Portability | Does the suite run against another environment without code changes? | Violations + fixes |
| M4 — Deterministic Data & Value Assertions | Does the test know the exact expected values? | Violations + fixes |
| M5 — Robustness Verification | Does it actually stay green in parallel and across environments? | Evidence report |

---

## Reinforcements to existing skills

| Skill | Change |
|-------|--------|
| `automation-architect` | Registry row, scan scope rows, Mode 1 step, Mode 7 triggers, invocation reference, execution order, breaking-change row for `env.ts` |
| `spec-quality-lifecycle-standard` | Lifecycle orchestration table (5 phases + cross-cutting debugging). R10 requires an exact value from a controlled source (`spec-data-standard` R13). Create mode collects `dataSource` and `expectedValues` |
| `api-setup-teardown-standard` | Add mode covers identity provisioning (create/delete user) for worker-scoped fixtures. R4 also applies to `scope: 'worker'` fixtures. R8 naming adds `worker<Resource>` |
| `spec-code-standard` | R7 examples resolve credentials from the worker identity or pool, not a single static user |
| `spec-organisation-standard` | Tag rules register the data-impact vocabulary: `@mutates-data`, `@read-only`, `@env:<name>` |
| `CLAUDE.md` | Fixture naming table adds `worker<Resource>` |

### Planned companion skill — `spec-requirements-standard`

A dedicated skill for **test case specifications** (`docs/test-cases/**`) is planned under a
separate ADR (ADR-003). It owns the *what* of a TC: traceability, preconditions with their
provisioning method, test data with its class and source, one action plus an exact expected
result per step, postconditions, and automation readiness. `spec-quality-lifecycle-standard`
Create mode consumes that specification to generate code (the *how*), so Create mode does not
need to be split out. `spec-data-standard` consumes the test data section of the specification.

### Future candidate — locator strategy (`ui-locator-standard`)

Phase 3 of the lifecycle is **Act**: `ui-pom-standard` governs the *structure* of the
Page Object pattern (extends BasePage, getters, async actions, no assertions). It does not judge
locator *quality*. Locator resilience is today a single rule (`spec-quality-lifecycle-standard`
R5). A dedicated locator skill (selection strategy, accessibility-first selectors, test IDs,
shadow DOM / frames, self-healing review) and its own slide group are recorded as a future
candidate. It requires its own ADR before creation.

---

## Consequences

- Hub: mode count unchanged (7 of 10). Mode 7 routes data robustness through the TC lifecycle orchestrator.
- Every new TC is checked for parallel safety and environment portability before review.
- `playwright.config.ts` must justify any parallelism suppression (`workers: 1`, `serial`).
- The course gains one slide per mode (Module 6, after *Activities – Part 1*).
