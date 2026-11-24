---
name: spec-data-standard
description: >
  Enforce and auto-apply test data robustness standards for Playwright + TypeScript
  projects. Classifies test data, assesses data maturity (levels 0-4), and enforces
  parallel isolation, typed data sourcing and data-driven datasets, environment
  portability, and deterministic expected values. Includes a verification mode that
  runs the suite in parallel and per environment to produce evidence. Load when
  writing tests that create or read data, enabling parallel execution, adding an
  environment, or diagnosing failures that only appear in parallel or in one environment.
---

## Project Context

- **Hermetic test**: depends on nothing it does not control. Parallel safety and
  environment portability are consequences of hermeticity, not separate goals.
- Playwright runs each worker in a **separate process**. Module-level variables are NOT
  shared between workers. Use `testInfo.parallelIndex` (stable, 0..workers-1) for
  per-worker partitioning, never `workerIndex` (increments when a worker restarts).
- Fixtures support `{ scope: 'worker' }` for resources created once per worker.
- Specs never read `process.env` directly; they use the project's config module.
- Credentials stay owned by `spec-code-standard` R7. This skill governs **which identity**
  a test uses (shared / per worker / per test), not where the secret is stored.

### Project conventions (agnostic — resolve before applying rules)

This skill works for any Playwright + TypeScript framework. Resolve each placeholder from the
project (CLAUDE.md / AGENTS.md, `tsconfig.json` paths, folder tree); use the default only when
the project defines nothing. Report the resolved values in the M0 header.

| Placeholder | Meaning | Default |
|-------------|---------|---------|
| `<data-dir>` | Test data folder (per site/app if the project is multi-site) | `src/data` |
| `<config-module>` | Environment config module (`ENV`) | `src/config/env.ts` |
| `<fixtures-module>` | Playwright fixtures (`test.extend`) | `src/fixtures/index.ts` |
| `<api-layer>` | API client + controllers used for provisioning | `src/api` |
| `<runner-config>` | Playwright config | `playwright.config.ts` |
| `<tc-docs-dir>` | TC specification documents | `docs/test-cases` |

### Data classification (always classify before applying rules)

| Class | Example | Mutable? | Strategy |
|-------|---------|----------|----------|
| Reference | Catalog, products, countries | No | Share; discover via API |
| Environment | Base URL, seed IDs, feature flags | Per environment | Typed config per environment |
| Transactional | New user, order, cart item | Yes | Create per test or worker; isolate; clean |
| Secret | Passwords, tokens | Per environment | Outside the repo (CI secrets) |
| Simulated | Mocked API responses | Controlled by test | `mock<Resource>` fixture |

Most robustness bugs come from treating **Transactional** data as **Reference** data.

**Data lifecycle:** DEFINE (typed shape) → PROVISION (create · discover · mock) →
USE (test · worker · pool scope) → CLEAN (scoped teardown)

### Maturity levels

| Level | State | Exit criteria (to reach the next level) |
|-------|-------|-----------------------------------------|
| 0 — Hardcoded | Data inside the spec | All inputs and expected values moved to `src/data/` |
| 1 — Externalised | `src/data/` + data-driven datasets | Config per environment, validated, secrets outside the repo |
| 2 — Per environment | Typed `TEST_ENV` config | No shared mutable identity; unique generated data |
| 3 — Isolated | Per-worker or per-test data | Self-provisioned via API; env literals replaced by discovery |
| 4 — Self-provisioned | Hermetic | Maintain: run M5 on every new TC |

### Domain coordination

| Concern | Owner | How this skill interacts |
|---------|-------|--------------------------|
| TC lifecycle orchestration | `spec-quality-lifecycle-standard` | Invokes this skill in phase 2 Arrange (M1–M3), phase 4 Assert (M4) and phase 5 Run (M5) |
| TC specification (test data section) | `spec-requirements-standard` M4 | Input: classified data items and their source per TC |
| Teardown exists after `use()` | `api-setup-teardown-standard` R4 | This skill checks teardown **scope** (R12) |
| Controllers for provisioning | `api-setup-teardown-standard` Add | Request `create<Identity>` / `delete<Identity>` when missing |
| Credential source | `spec-code-standard` R7 | Not re-checked |
| Test independence / module state | `spec-quality-lifecycle-standard` R7 | Not re-checked |
| Assertion specificity | `spec-quality-lifecycle-standard` R10 | R13 provides the expected-value source |
| Values inside locator filters | `ui-locator-wait-standard` R6 | `filter({ hasText })` values follow the same controlled sources as R13 |
| Tag syntax | `spec-organisation-standard` | R11 defines tag **meaning** only |

---

## Modes

**M0 is the default** when no mode is specified.

### M0 — Maturity Assessment (read-only)

**Triggers:** `"assess test data"` · `"data maturity"` · `"spec data"` · `"data robustness"`

1. Discover `src/data/**`, `src/config/**`, `src/fixtures/**`, `playwright.config.ts`, `tests/**/*.spec.ts`
2. Inventory every data item a test consumes and classify it
3. Detect shared mutable identities (fixtures mutating state of an identity from one static source)
4. Score the maturity level **per site** (highest level whose exit criteria are fully met)
5. List blockers for the next level, each mapped to a mode and rule. Do NOT modify files

```
[spec-data-standard] MATURITY ASSESSMENT
─────────────────────────────────────────
Site: <site>            Level: <0-4> — <name>
  Data inventory:  <N> reference · <N> environment · <N> transactional · <N> secret · <N> simulated
  Blockers to level <N+1>:
    - <issue> → M<n> / R<n>
Recommended next mode: M<n>
```

### M1 — Parallel Isolation

**Triggers:** `"parallel safe"` · `"isolate data"` · `"fix parallel failures"` · `"spec data m1"`

**Question:** Can N workers run at the same time without touching each other's data?

1. Run R1–R5, R12 and R15 on fixtures, specs, data factories, and `playwright.config.ts`
2. For each shared mutable identity, choose a strategy from the decision table
3. If provisioning needs missing controller methods, invoke `api-setup-teardown-standard` (Add)
4. Auto-fix AUTO-FIX violations; list MANUAL-FIX items

| Situation | Strategy | Fixture pattern |
|-----------|----------|-----------------|
| Test creates or mutates data; API available | Create per test + scoped teardown | `created<Resource>` |
| Costly identity (login, profile) with mutable state | One identity per worker | `worker<Resource>` (`scope: 'worker'`) |
| Identities cannot be created (fixed accounts) | Account pool indexed by `parallelIndex` | `worker<Resource>` from pool |
| Read-only reference data | Share it | `<resource>Controller` |
| UI behaviour independent of backend state | Mock | `mock<Resource>` |
| Truly global state, unavoidable | Serialise, with justification | `mode: 'serial'` + comment |

```typescript
workerUser: [async ({ playwright }, use, workerInfo) => {
  const request = await playwright.request.newContext({ baseURL: ENV.baseUrl });
  const accounts = new AccountController(new ApiClient(request));
  const user = buildUser(workerInfo.parallelIndex);        // unique, prefixed
  const created = await accounts.createUser(user);
  await use({ ...user, id: created.id });
  await accounts.deleteUser(created.id, user);             // scoped teardown
  await request.dispose();
}, { scope: 'worker' }],
```

### M2 — Data Sourcing & Data-Driven

**Triggers:** `"data driven"` · `"externalise data"` · `"load test data"` · `"spec data m2"`

**Question:** Where does each test get its data, and is it typed and reusable?

| Need | Source | Location |
|------|--------|----------|
| Small, typed, code-reviewed datasets | TypeScript module | `<data-dir>/{feature}.data.ts` |
| Large or business-maintained datasets | JSON / CSV + typed loader | `<data-dir>/{feature}.json` + loader |
| Unique values per run | Factory / builder | `<data-dir>/factories/<resource>.factory.ts` |
| Values that differ per environment | Environment data map | `<data-dir>/env.data.ts` (M3) |

1. Run R6–R8
2. Move inline datasets and expected values out of specs (R7)
3. Wrap JSON / CSV in a typed loader that validates required fields and fails fast (R6)
4. Merge tests that differ only in data into a data-driven loop (R8)

```typescript
for (const row of invalidLoginCases) {
  test(`${row.id}: Reject login for ${row.description}`, async ({ loginPage }) => {
    await test.step('Verify login page is loaded', async () => {
      await expect(loginPage.submitButton).toBeVisible();
    });
    await test.step('Submit credentials and verify error', async () => {
      await loginPage.login(row.username, row.password);
      await expect(loginPage.errorMessage).toHaveText(row.expectedError);
    });
  });
}
```

Rows that need a different flow are a different TC, not a different row
(`spec-quality-lifecycle-standard` R8).

### M3 — Environment Portability

**Triggers:** `"multi environment"` · `"run on staging"` · `"env config"` · `"spec data m3"`

**Question:** Does the suite run against another environment with zero code changes?

1. Run R9–R12
2. `src/config/env.ts` selects `.env.<TEST_ENV>` (default `local`) and validates required variables
3. Replace environment literals with the env data map or runtime discovery (R10)
4. Tag tests by data impact (R11); guard destructive cleanup per environment (R12)
5. `.env.*` is git-ignored; `.env.example` documents every variable

```typescript
const TEST_ENV = process.env.TEST_ENV ?? 'local';
dotenv.config({ path: path.resolve(__dirname, `../../.env.${TEST_ENV}`) });
for (const key of ['BASE_URL'] as const) {
  if (!process.env[key]) throw new Error(`[${TEST_ENV}] Missing env var "${key}"`);
}
export const ENV = {
  name: TEST_ENV,
  baseUrl: process.env.BASE_URL as string,
  allowDestructiveCleanup: process.env.ALLOW_DESTRUCTIVE_CLEANUP === 'true',
} as const;
```

| Tag | Meaning | Typical use |
|-----|---------|-------------|
| `@mutates-data` | Creates, updates or deletes persistent data | Excluded from production-like runs |
| `@read-only` | Reads only; safe in any environment | Smoke in every environment |
| `@env:<name>` | Valid only in that environment | Feature flags, env-only data |

**Environment Readiness Map** — always produced by M3. When fewer than two environments are
available, it replaces the per-environment run as the M3/M5 evidence. One row per
reinforcement point; status per project: ✅ done · 🔧 would change (with file) · ➖ n/a.

| # | Reinforcement point | Where | Problem if missing | Rule |
|---|---------------------|-------|--------------------|------|
| E1 | Environment selector + per-env files | `<config-module>` | One hardcoded target | R9 |
| E2 | Fail-fast validation of required variables | `<config-module>` | Late, cryptic failures | R9 |
| E3 | Base URL from config; relative paths in steps | `<runner-config>`, specs, TC docs | Tests tied to one host | R10 · Q11 |
| E4 | Secrets per environment outside the repo | `.env.*`, CI secrets | Leaks; manual setup per env | — |
| E5 | Self-provisioned identities (no seeded users/IDs) | `<fixtures-module>`, `<api-layer>` | Seed data must exist in every env | R1 · R10 |
| E6 | Reference data discovered at runtime | `<fixtures-module>`, specs | IDs/SKUs differ per env | R10 |
| E7 | Oracles from controlled sources | specs, TC docs | Expected values differ per env | R13 · Q6 |
| E8 | Cleanup scoped and guarded per env | `<fixtures-module>` | Destructive cleanup in shared envs | R12 |
| E9 | Data-impact tags for test selection | specs | Mutating tests run where they must not | R11 |
| E10 | CI matrix: one job per env with its secrets | CI pipeline | Portability never exercised | — |

```
[spec-data-standard] ENVIRONMENT READINESS — <site>
Environments available: <n> (<names>)   Mode: run | readiness map
E1 ✅|🔧|➖ <evidence or file to change>
...
Ready: <n>/10   Next: <first 🔧 item>
```

### M4 — Deterministic Data & Value Assertions

**Triggers:** `"assert values"` · `"deterministic data"` · `"mock data"` · `"spec data m4"`

**Question:** Does the test know the **exact** values it expects, and assert them?
Presence is not correctness.

| Expected-value source | When | Assertion |
|-----------------------|------|-----------|
| Data the test created (`created<Resource>`) | Transactional data | Each field `toHaveText(created.field)` |
| Mock payload (`mock<Resource>`) | Rendering, formatting, edge cases | Every rendered field vs. payload |
| Dataset row (M2) | Data-driven inputs and outputs | `toHaveText(row.expected)` |
| API discovery (`<resource>Controller`) | Reference data owned by the system | UI value vs. API value of the same entity |

1. Run R13–R14
2. Identify the expected-value source of every assertion on data-bearing elements
3. Replace presence-only assertions with value assertions from a controlled source
4. Where live data is not owned, add a `mock<Resource>` fixture with a typed payload from `src/data/`

```typescript
const [expected] = mockProducts;                       // typed payload from src/data
await expect(catalogPage.titleOf(expected.id)).toHaveText(expected.title);
await expect(catalogPage.priceOf(expected.id)).toHaveText(formatPrice(expected.price));
```

### M5 — Robustness Verification (evidence)

**Triggers:** `"verify robustness"` · `"stress parallel"` · `"run data verification"` · `"spec data m5"`

Executes tests and produces evidence. Never modifies code.

1. Select scope (TC, feature, or site) and one browser project
2. Baseline single run: `npx playwright test <scope> --project=<browser> --workers=1 --retries=0`
3. Parallel stress: `npx playwright test <scope> --project=<browser> --workers=<N> --repeat-each=<K> --retries=0` (default N=4, K=4)
4. Environment run: repeat for each configured `TEST_ENV` (at least two). With fewer than
   two environments, attach the M3 Environment Readiness Map instead and say so in the verdict
5. Orphan check: count leftover records with the test prefix (R3); expected 0
6. Classify every failure and compare with the previous run when available

| Category | Signal |
|----------|--------|
| Collision | Data changed or deleted by another test |
| Session invalidation | 401/403 after another worker logged in |
| Missing data | Record/ID not found in this environment |
| Order dependency | Passes alone, fails in suite |
| Non-data flakiness | Timing or selector → `spec-quality-lifecycle-standard` |

```
[spec-data-standard] ROBUSTNESS VERIFICATION
─────────────────────────────────────────
Scope:     <scope>   Project: <browser>
Single:    <passed>/<total> passed
Parallel:  workers=<N> repeat=<K> → <passed>/<total> passed · <flaky> flaky
Env <a>:   <passed>/<total> passed
Orphans:   <N> records with prefix '<prefix>'
Failures by cause: collision <n> · session <n> · missing-data <n> · order <n> · other <n>
Verdict:   ✅ HERMETIC  |  ❌ NOT HERMETIC → run M<n> for <rule>
```

---

## Rules

| ID | Rule | Sev. · Fix | Mode | Condition (violation) | Fix |
|----|------|-----------|------|-----------------------|-----|
| R1 | `NO_SHARED_MUTABLE_IDENTITY` | ERROR · MANUAL | M1 | A test-scoped fixture creates, mutates, or bulk-deletes state of an identity loaded from one static source (one env var, one data constant) while workers > 1 | M1 decision table: per-test identity, `worker<Resource>`, or pool |
| R2 | `UNIQUE_CREATED_DATA` | ERROR · AUTO | M1 | Created data uses a static literal for a unique field (username, email, name, title, code) | Factory value: prefix + `parallelIndex` + timestamp + random. `Date.now()` alone is not unique |
| R3 | `TEST_DATA_PREFIXED` | WARNING · AUTO | M1 | Generated transactional data lacks the prefix (`ENV.testDataPrefix`, default `qa_`) | Add prefix; enables orphan check (M5) and sweep jobs |
| R4 | `PARALLELISM_NOT_SUPPRESSED` | WARNING · MANUAL | M1 | `workers: 1`, `fullyParallel: false`, or `mode: 'serial'` without `// spec-data: serial — <reason>` | Fix isolation, or justify the suppression |
| R5 | `NO_GLOBAL_STATE_ASSERTION` | WARNING · MANUAL | M1 | Count or full-collection assertion on data the test does not own | Assert the records the test created, or own the collection |
| R6 | `TYPED_DATA_SOURCE` | ERROR · AUTO | M2 | JSON/CSV imported or parsed directly in a spec, or loaded without interface and validation | Typed loader in `<data-dir>/{feature}.data.ts` |
| R7 | `DATA_OUTSIDE_SPEC` | ERROR · AUTO | M2 | Inline datasets or literal expected values that represent test data (not UI labels). Credentials excluded (`spec-code-standard` R7) | Move to `<data-dir>/{feature}.data.ts` with an interface |
| R8 | `DATA_DRIVEN_TITLES_UNIQUE` | ERROR · AUTO | M2 | Loop-generated `test()` titles without a row id, or copy-paste tests that differ only in data | Add `${row.id}`; merge into dataset + loop |
| R9 | `ENV_RESOLVED_FROM_CONFIG` | ERROR · AUTO | M3 | `process.env` read outside `src/config/`; one fixed `.env` with no selector; a used variable not validated | Route through `ENV`; add `TEST_ENV`; register in `.env.example` |
| R10 | `NO_ENV_SPECIFIC_LITERALS` | ERROR · MANUAL | M3 | Env-dependent literal assumed to exist: absolute host URL, record ID, UUID, SKU/ISBN, seeded username | Discovery via `<resource>Controller`, else `env.data.ts` keyed by `ENV.name` |
| R11 | `DATA_IMPACT_TAGGED` | WARNING · AUTO | M3 | Test using `created/clean/worker<Resource>` or a persistence action without `@mutates-data`; env-restricted test without `@env:<name>` | Add tag via `{ tag: [...] }` |
| R12 | `SCOPED_AND_GUARDED_CLEANUP` | ERROR · MANUAL | M1 · M3 | Teardown bulk-deletes (`deleteAll`, sweep) data the test/worker does not exclusively own, or without checking `ENV.allowDestructiveCleanup` | Delete only identifiers created by the fixture; bulk only on owned identities and allowed environments |
| R13 | `EXPECTED_VALUE_FROM_CONTROLLED_SOURCE` | WARNING · MANUAL | M4 | Assertion on a data-bearing element checks presence only when the intent is a value, or compares to a literal with no controlled source | Exact value from created fixture, mock payload, dataset row, or API discovery |
| R15 | `SINGLE_SESSION_PER_IDENTITY` | ERROR · MANUAL | M1 | Within one test, more than one fixture generates an auth token/session for the same identity (single-active-token systems invalidate the earlier one → intermittent 401) | One fixture owns the identity's token per test; others reuse it or use unauthenticated reads |
| R14 | `MOCK_FOR_UNOWNED_CONTENT` | WARNING · MANUAL | M4 | Test validates rendering/formatting/edge cases of content it does not own and cannot predict | `mock<Resource>` with payload from `src/data/`; keep one non-mocked integration test per feature |

---

## Violation Output Format

```
[spec-data-standard] SEVERITY — RULE_NAME (M<n>)
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED | MANUAL-FIX
```

---

## Scan Scope

| File glob | Rules |
|-----------|-------|
| `src/fixtures/**/*.ts` | R1, R2, R3, R12, R15 |
| `src/data/**` | R2, R3, R6, R10 |
| `src/config/**/*.ts` | R9 |
| `playwright.config.ts` | R4 |
| `tests/**/*.spec.ts` | R4, R5, R6, R7, R8, R9, R10, R11, R13, R14 |
