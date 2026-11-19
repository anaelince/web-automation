---
name: spec-requirements-standard
description: >
  Write, assess, and refine high-quality test case specifications for Playwright +
  TypeScript projects. Governs docs/test-cases/**: traceability, provisioned
  preconditions, classified test data, one action with an exact and deterministic
  expected result per step, postconditions, independence, coverage variants, and
  automation readiness. Produces the handoff consumed by spec-data-standard and by
  spec-quality-lifecycle-standard Create mode. Load before automating a TC, when
  writing TCs from requirements, or when reviewing TC documents.
---

## Project Context

- TC specifications live in `<tc-docs-dir>/{feature}-test-cases.md`
  (one file per feature, one `###` section per TC). `<tc-docs-dir>` is resolved from the
  project (CLAUDE.md / AGENTS.md / folder tree); default `docs/test-cases`, with a
  `{site}` subfolder when the project is multi-site. The skill is framework-agnostic: it
  applies to any Playwright + TypeScript project.
- A specification is **ready** when another engineer (or an agent) can automate it
  without asking a single question.
- **Oracle**: the exact expected result a step is compared against. A step without an
  exact, deterministic, and verifiable oracle is not a test step.
- **Captured value**: a value read during the test and reused later. Name it with braces
  (`{itemTitle}`) instead of referring to "the value from step N".
- Steps use **relative paths** (`/items`). The base URL comes from the environment.
- Data classes (shared with `spec-data-standard`): Reference · Environment · Transactional ·
  Secret · Simulated.

### TC lifecycle position

This skill is **phase 1 (Specify)** of the TC lifecycle orchestrated by
`spec-quality-lifecycle-standard`:
Specify → Arrange (`spec-data-standard`, `api-setup-teardown-standard`) → Act (`ui-pom-standard`,
waits, locators) → Assert (`spec-quality-lifecycle-standard`, `spec-data-standard` M4) →
Run (`spec-data-standard` M5). Debugging is cross-cutting; reporting belongs to CI.

### Domain coordination

| Concern | Owner | Interaction |
|---------|-------|-------------|
| TC lifecycle orchestration | `spec-quality-lifecycle-standard` | Invokes this skill as phase 1 |
| Test data implementation | `spec-data-standard` | Consumes the M4 handoff `data` block |
| Code generation | `spec-quality-lifecycle-standard` Create | Consumes the M4 handoff `steps` block |
| Row sync in docs | `automation-architect` Mode 5 | Existence only; never content |
| TC ID format in code | `spec-organisation-standard` R4 | Same `TC{N}` ID in doc and spec |

---

## TC specification template

Fields marked * are mandatory.

````markdown
### TC{N}: <Imperative title> *

| Field | Value |
|-------|-------|
| Requirement / AC * | <REQ-ID> · <acceptance criterion it verifies> |
| Objective * | <one sentence: behaviour verified and why it matters> |
| Priority * | High · Medium · Low |
| Suite * | smoke · regression |
| Type * | positive · negative · boundary · data-driven |
| Tags | `@mutates-data` · `@read-only` · `@env:<name>` |
| Automation * | Automatable · Partial (<reason + workaround>) · Manual (<reason>) |

**Preconditions** *

| # | State | Provisioned by | Scope |
|---|-------|----------------|-------|
| P1 | <exact state> | API · fixture · mock · UI | test · worker · shared read-only |

**Test data** *

| Item | Value or generation rule | Class | Source |
|------|--------------------------|-------|--------|
| <name> | <exact value / `qa_` + unique suffix / first entry from API> | Reference · Transactional · … | dataset · factory · discovery · mock · env |

**Steps** *

| # | Action | Expected result (oracle) |
|---|--------|--------------------------|
| 1 | <one user action> | <exact, deterministic, verifiable result> |

**Postconditions** *

| State after the test | Cleanup | Scope |
|----------------------|---------|-------|
| <final state> | <what is removed and how> | only data created by this TC |

**Risks / notes** — parallel, environment, or product constraints (optional)
````

---

## Modes

**M0 is the default** when no mode is specified.

### M0 — Assess (read-only)

**Triggers:** `"assess test cases"` · `"tc spec review"` · `"spec requirements"`

**Steps:**
1. Discover `docs/test-cases/**/*.md` and split into TC sections
2. Apply Q1–Q13 to each TC
3. Score each TC: `score = 100 × passed weight / total weight` (ERROR = 3, WARNING = 1)
4. Grade: **Ready** ≥ 90 · **Needs refinement** 60–89 · **Incomplete** < 60
5. Do NOT modify files

**Output:**
```
[spec-requirements-standard] ASSESSMENT
─────────────────────────────────────────
File: docs/test-cases/<site>/<feature>-test-cases.md
TC01  <score>%  <grade>   top gaps: Q4, Q6, Q12
...
Average: <score>%   Ready: <n>/<total>
Most frequent gaps: Q6 (<n>) · Q9 (<n>) · Q3 (<n>)
Recommended next mode: M2 on <lowest-score TC>
```

### M1 — Write

**Triggers:** `"write test case"` · `"new tc spec"` · `"spec from requirement"`

**Step 0 — Collect** (infer from context; ask only for missing items): requirement or user
story, acceptance criteria, feature, site, known business rules.

**Steps:**
1. One TC per acceptance criterion (more if M3 derives variants)
2. Fill the template; mark every unknown value as `TBD: <question>` (never invent an oracle)
3. Run Q1–Q13; a TC with `TBD` cannot be graded **Ready**
4. Append to `<tc-docs-dir>/{feature}-test-cases.md` with the next free `TC{N}`

### M2 — Refine

**Triggers:** `"refine test case"` · `"improve tc"` · `"make tc robust"`

**Steps:**
1. Run M0 on the target TC to get the baseline score
2. Rewrite it in the template, fixing each failed rule
3. Keep the TC ID and the original intent. If the intent itself is untestable, propose a
   split and flag it; never silently change scope
4. Add a **Change log** under the TC: `Qn — <what changed and why>`
5. Re-run M0 and report `before → after`

**Output:**
```
[spec-requirements-standard] REFINED — TC{N}
Score: <before>% → <after>%   Grade: <before> → <after>
Changes: Q3 provisioning added · Q6 exact oracle · Q9 postcondition · Q13 step refs fixed
Open questions: <TBD list or "none">
```

### M3 — Coverage

**Triggers:** `"tc coverage"` · `"derive negative cases"` · `"traceability matrix"`

**Techniques:** equivalence partitioning · boundary values · state transitions (create → read
→ update → delete) · role/auth variants (anonymous, owner, other user) · error guessing ·
data-driven rows.

**Steps:**
1. Build the traceability matrix: requirement/AC × TC
2. For each AC, list missing variants by technique
3. Variants that differ only in data become **one data-driven TC** with a dataset table
4. Write new TCs through M1

**Output:**
```
[spec-requirements-standard] COVERAGE
REQ / AC          positive  negative  boundary  auth   data-driven
<REQ-1 · AC1>     TC02      —         —         —      —
Missing: <n> variants → proposed TC<N>…TC<M>
```

### M4 — Automation Readiness

**Triggers:** `"automation readiness"` · `"handoff tc"` · `"ready to automate"`

**Precondition:** the TC is graded **Ready** (M0 ≥ 90, no `TBD`).

**Steps:**
1. Confirm the automation decision (Q12). For `Partial`, describe the workaround
   (e.g., provision through the API instead of a CAPTCHA-protected form)
2. Map each precondition to a fixture type (`worker<Resource>` · `created<Resource>` ·
   `clean<Resource>` · `mock<Resource>` · `<resource>Controller`)
3. Map each data item to a `spec-data-standard` strategy
4. Emit the handoff block and append it under the TC

```yaml
tc: TC{N}
title: <title>
suite: smoke
tags: ['@mutates-data']
automation: automatable
fixtures:
  identity: worker<Resource>        # isolation strategy (spec-data-standard M1)
  state: clean<Resource>            # postcondition owner (api-setup-teardown-standard)
data:
  - name: item
    class: reference
    source: discovery               # <resource>Controller.getAll()[0]
captured: [itemTitle]
steps:
  - action: open /items
    oracle: heading = "<exact text>"; first row title = item.title
postconditions:
  - only items created by this TC are removed
```

---

## Rules

Severity: **ERROR** blocks *Ready* (weight 3); **WARNING** lowers the score (weight 1).

| ID | Rule | Sev. | Condition (violation) | Fix |
|----|------|------|-----------------------|-----|
| Q1 | `TC_METADATA_COMPLETE` | ERROR | Missing requirement/AC, priority, suite, type, or automation field | Fill the field; unknown → `TBD:` |
| Q2 | `OBJECTIVE_STATED` | WARNING | No one-sentence objective, or it repeats the title | State behaviour and value |
| Q3 | `PRECONDITIONS_PROVISIONED` | ERROR | A precondition has no "provisioned by" or no scope ("user is logged in") | Add method (API/fixture/mock/UI) and scope |
| Q4 | `TEST_DATA_DECLARED` | ERROR | Values inline in steps, marked "e.g.", static values for unique fields, or secrets in clear | Data table with class and source; unique → generation rule; secrets → env reference |
| Q5 | `ONE_ACTION_PER_STEP` | WARNING | A step has several actions, or an action has no expected result | Split; one action, one oracle |
| Q6 | `EXACT_ORACLE` | ERROR | Oracle checks presence only ("visible", "non-empty", "at least one") when a value is knowable | State the exact value or the data item it equals |
| Q7 | `DETERMINISTIC_ORACLE` | ERROR | Oracle contains "or", "e.g.", "should", "some", "any", or an alternative outcome | Choose the single correct outcome; unknown → `TBD:` |
| Q8 | `VERIFIABLE_ORACLE` | ERROR | Oracle needs a reference that does not exist ("no unrelated results" without a known dataset) | Add the reference: dataset, mock, or API discovery |
| Q9 | `POSTCONDITIONS_DEFINED` | ERROR | TC creates, changes, or deletes data and states no postcondition or cleanup scope | Add final state and scoped cleanup |
| Q10 | `INDEPENDENT_TC` | ERROR | TC relies on state produced by another TC, or destroys state other TCs use | Provision via precondition; isolate destructive TCs (own identity) |
| Q11 | `ENV_AGNOSTIC_STEPS` | WARNING | Absolute URLs, hosts, or environment IDs in steps | Relative paths; env values in the data table (class Environment) |
| Q12 | `AUTOMATION_DECISION` | WARNING | No automation decision, or "manually or via workaround" without a defined workaround | Automatable / Partial (workaround) / Manual (reason) |
| Q13 | `STEP_REFERENCES_VALID` | ERROR | Gaps in step numbering, broken formatting, or "value from step N" pointing to the wrong step | Renumber; use captured values `{name}` |

**Example — before (fails Q4, Q6, Q7, Q11):**
```markdown
3. Enter a unique username (e.g., `john_auto01`).
9. Assert the button is not visible or is disabled.
```

**Example — after:**
```markdown
| Item | Value or generation rule | Class | Source |
| username | `qa_` + unique suffix | Transactional | factory |

| 3 | Enter `{username}` in Username | Field value = `{username}` |
| 9 | Open `/items` with an empty collection | "Delete All" button is not rendered |
```

---

## Violation Output Format

```
[spec-requirements-standard] SEVERITY — RULE_NAME
File:  docs/test-cases/<site>/<feature>-test-cases.md
TC:    TC{N} · step <n> (if applicable)
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED | MANUAL-FIX
```

Q13 numbering and formatting fixes are AUTO-APPLIED. All other rules are applied by M2 with
a change log, because they change the TC meaning.

---

## Scan Scope

| File glob | Rules |
|-----------|-------|
| `docs/test-cases/**/*.md` | Q1–Q13 |
