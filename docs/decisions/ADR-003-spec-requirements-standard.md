# ADR-003 — Test Case Specifications: new skill `spec-requirements-standard`

**Date:** 2026-11-18  
**Status:** Proposed  
**Applies to:** `docs/test-cases/**` · `spec-quality-lifecycle-standard` (orchestrator) · `spec-data-standard`

---

## Context

Automated tests are only as good as the test case (TC) specification they implement. The
specifications under `docs/test-cases/` are written before the code, but no skill checks their
quality. A review of an existing CRUD specification (10 TCs) found these gap classes:

| Gap class | Typical symptom | Consequence in automation |
|-----------|-----------------|---------------------------|
| No traceability or metadata | No requirement/AC, priority, suite, or automation status | Coverage cannot be measured |
| Vague preconditions | "A registered user exists" | Nobody knows how the state is provisioned |
| Ambiguous test data | Values marked "e.g.", static unique values | Fails on the second run or in parallel |
| Presence-only oracles | "visible and non-empty", "at least one" | Wrong values pass |
| Non-deterministic oracles | "not visible **or** disabled" | Expected result cannot be verified uniquely |
| Impossible oracles | "no unrelated results shown" without a known dataset | No reference to compare against |
| Missing postconditions | TC creates or deletes data, no cleanup stated | Leaks state, collides with other TCs |
| Hidden dependencies | TC needs data created by another TC | No independence |
| Environment literals | Absolute URLs in every step | Tied to one environment |
| No automation assessment | CAPTCHA "manually or via workaround" | Blocked automation discovered late |
| Happy path only | No negative, boundary, or data-driven variants | Low coverage |
| Editorial defects | Missing step, wrong step reference | Spec and code drift apart |

---

## Gap analysis — existing skills

| Skill | Relation to TC specifications | Why it does not cover the gap |
|-------|-------------------------------|-------------------------------|
| `automation-architect` Mode 5 | Adds or removes rows in `docs/test-cases/` | Syncs **existence**, not **content quality** |
| `spec-organisation-standard` | TC IDs and naming in spec files | Code files only, not specification documents |
| `spec-quality-lifecycle-standard` | Create mode collects `steps` and `expectedResult` | Consumes a specification; does not validate or write one |
| `spec-data-standard` (ADR-002) | Test data in code | Needs the data section of the specification as input |

Unclaimed file/concern pair: `docs/test-cases/**` — specification content quality.

---

## Options considered

### Option A — Split Create mode out of `spec-quality-lifecycle-standard` as `spec-authoring-standard`
**Rejected.** Create mode generates **code** (the *how*). The gap is in the **specification**
(the *what*), which is upstream of code and owned by no one.

### Option B — Add specification rules to `spec-quality-lifecycle-standard`
**Rejected.** The skill is at 368 of 400 lines and governs code files. Mixing documents and
code breaks Hub Growth Policy Rule 3 (one domain per mode).

### Option C — New skill `spec-requirements-standard`, orchestrated as the *Specify* phase (selected)
Owns the specification document. `spec-quality-lifecycle-standard` invokes it first in the TC
lifecycle, and Create mode consumes its output.

---

## Decision

1. Create `spec-requirements-standard` (prompt: `docs/skills/spec-requirements-standard-prompt.md`).
2. Name per ADR-001: domain `spec` (test cases), objective `requirements` (what the TC must
   verify and how it is specified).
3. It is the **Specify** phase (phase 1) of the TC lifecycle orchestrated by
   `spec-quality-lifecycle-standard` (see ADR-002). No new hub mode: Mode 7 gains its triggers.
4. Its **Automation Readiness** output is the input contract for `spec-data-standard`
   (data section) and for `spec-quality-lifecycle-standard` Create mode (steps and oracles).

### Skill modes

| Mode | Question | Output |
|------|----------|--------|
| M0 — Assess | How complete and testable is each TC specification? | Score per TC + gaps |
| M1 — Write | How do we specify a new TC from a requirement? | TC in the standard template |
| M2 — Refine | How do we upgrade an incomplete TC? | Refined TC + change log |
| M3 — Coverage | Which variants are missing (negative, boundary, data-driven)? | Derived TCs + traceability matrix |
| M4 — Automation Readiness | Can it be automated, how, and with which data? | Handoff block for data and code |

---

## Consequences

- Every TC has a requirement link, provisioned preconditions, classified test data, exact
  oracles, postconditions, and an automation decision **before** code is written.
- `docs/test-cases/**` gains an owner in the Scan Scope Ownership table.
- Hub Mode 5 keeps syncing rows; it does not judge content.
- The course adds the *Specify* phase slides before the test data slides.
