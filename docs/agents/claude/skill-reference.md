# Skill Reference — Claude Format

> Load this file with `@docs/agents/claude/skill-reference.md` when you need
> the full rule set for a specific skill. Each section maps to a Kiro skill.
> Source of truth: the SKILL.md files in `.kiro/skills/`

---

## automation-architect

Hub skill. Use for full pipeline reviews or scaffolding.

**Full pipeline trigger:** `"apply architecture"` → runs all 6 sub-skills in order:
1. `ui-pom-standard` on PO files
2. `spec-code-standard` on spec files + fixtures
3. `spec-organisation-standard` on spec files
4. `api-setup-teardown-standard` on API layer + fixtures
5. `spec-quality-lifecycle-standard` on spec files + PO files
6. `git-workflow-docs-standard` on git state

**Mode 3 — Scaffold Page Object:** generates PO + fixture entry + spec skeleton  
**Mode 5 — Docs Sync:** updates README + wiki when architectural files change  
**Mode 6 — Lifecycle Infrastructure:** scaffolds API layer for a new resource  
**Mode 7 — TC Quality Review:** runs `spec-quality-lifecycle-standard`

---

## ui-pom-standard

Governs `src/ui/pages/**/*.ts` and `src/ui/components/**/*.ts`.

**R1 EXTENDS_BASEPAGE (ERROR, AUTO-FIX):** Every PO must extend `BasePage`.  
**R2 LOCATORS_AS_GETTERS (ERROR, AUTO-FIX):** Locators are `get` properties — NEVER
constructor fields. ES2022 `useDefineForClassFields: true` runs field initializers
before `super()`, making `this.page` undefined at field-init time.  
**R3 ACTIONS_ARE_ASYNC (ERROR, AUTO-FIX):** All interaction methods are `async`.  
**R4 NO_ASSERTIONS_IN_PO (ERROR, AUTO-FIX):** No `expect()` inside POs — assertions
belong in specs only.  
**R5 NAVIGATE_USES_BASEPAGE (WARNING, AUTO-FIX):** No `navigate()` override — call
`po.navigate('/path')` from fixtures or specs.  
**R6 NO_DIRECT_PAGE_IN_SPEC (ERROR, AUTO-FIX):** Specs don't call `page.*` directly
— use PO methods instead.  
**R7 IMPORTS_USE_ALIASES (ERROR, AUTO-FIX):** All imports via `@pages/*`, `@data/*`, etc.  
**R8 NO_HARDCODED_URL (WARNING, MANUAL-FIX):** No hardcoded URLs in POs — use
`BasePage.navigate(path)` where path is relative.

---

## api-setup-teardown-standard

Governs `src/api/sites/{site}/**` and `src/fixtures/index.ts` (teardown concern).

**R1 API_CLIENT_IS_ONLY_HTTP_ENTRY_POINT (ERROR, AUTO-FIX):** Only `ApiClient` calls
`request.get/post/put/delete`. All other layers delegate to `ApiClient`.  
**R2 ENDPOINTS_CENTRALIZED (ERROR, AUTO-FIX):** No hardcoded URLs outside `endpoints/`.  
**R3 CONTROLLER_DEPENDENCY_CONTRACT (ERROR, AUTO-FIX):** Controllers receive `ApiClient`,
never `APIRequestContext`.  
**R4 TEARDOWN_MIRRORS_SETUP (ERROR, MANUAL-FIX):** Fixture that creates data via API
must delete it after `use()`.  
**R5 MOCKS_USE_CENTRALIZED_ENDPOINTS (ERROR, AUTO-FIX):** Mocks use endpoint constants,
not hardcoded URL strings.  
**R6 CORRECT_FOLDER_PLACEMENT (ERROR, AUTO-FIX):** Files live in correct subfolder
(`client/`, `controllers/`, `endpoints/`, `models/`, `mocks/`).  
**R7 NO_LIFECYCLE_INSTANTIATION_IN_SPEC (ERROR, AUTO-FIX):** Specs never instantiate
`ApiClient` or controllers — use fixtures.  
**R8 LIFECYCLE_FIXTURE_NAMING_CONVENTION (WARNING, AUTO-FIX):** Naming: `<r>Controller`
(read-only) · `created<R>` (data+teardown) · `clean<R>` (cleanup) · `mock<R>`.  
**R10 TOKEN_REFRESH_IN_TEARDOWN (WARNING, MANUAL-FIX):** When a fixture's test body
performs a UI login, the server invalidates the setup token. Regenerate the token
before teardown API calls.  
**R11 API_CLIENT_STATUS_CHECKED (ERROR, AUTO-FIX):** `ApiClient` methods check
`response.ok()` and throw on non-2xx responses.

---

## spec-organisation-standard

Governs spec file location, naming, TC IDs, and step structure.

**R1 FOLDER_STRUCTURE (ERROR, AUTO-FIX):**
Path: `tests/ui/smoke/sites/{site}/{feature}/TC{N}-{kebab-name}.spec.ts`

**R2 FILE_NAMING (ERROR, AUTO-FIX):** `TC{N}-{kebab-case-description}.spec.ts`

**R3 TC_ID_FORMAT (ERROR, AUTO-FIX):** TC IDs match `TC\d+` pattern.

**R4 DESCRIBE_BLOCK_NAMING (WARNING, AUTO-FIX):** Describe name = feature folder
in PascalCase (e.g. `books/` → `'Books'`). NOT the site name.

**R5 USE_TEST_STEP (ERROR, AUTO-FIX):** Every logical step uses `test.step()`.
No inline `// Step N:` comments. No JSDoc `@steps`.

---

## spec-code-standard

Governs spec code quality, imports, fixtures, and data hygiene.

**R1 PATH_ALIASES_ON_ALL_IMPORTS (ERROR, AUTO-FIX):** No relative imports anywhere.  
**R2 IMPORT_FROM_FIXTURES (ERROR, AUTO-FIX):** `test` and `expect` from `@fixtures`.  
**R3 NO_MANUAL_BEFOREEACH_FOR_PO_INIT (ERROR, AUTO-FIX):** No `new Page(page)` in
`beforeEach` — extract to fixture.  
**R4 PO_REGISTERED_IN_FIXTURE (ERROR, AUTO-FIX):** Every used PO is in `src/fixtures/index.ts`.  
**R5 TESTS_WRAPPED_IN_DESCRIBE (ERROR/WARNING, AUTO-FIX):** Every `test()` inside
a `describe()` with a meaningful name.  
**R6 NO_CROSS_SPEC_IMPORTS (ERROR, AUTO-FIX):** No imports from other spec files.  
**R7 NO_HARDCODED_CREDENTIALS (ERROR, AUTO-FIX):** No string literals as username/
password — use `@data/sites/{site}/auth.data`.  
**R8 ONLY_PLAYWRIGHT_TEST_FRAMEWORK (ERROR, AUTO-FIX):** No jest/mocha/chai imports.  
**R9 CORRECT_SITE_LAYER_PLACEMENT (ERROR, AUTO-FIX):** Files in `sites/{site}/` subfolder.

---

## spec-quality-lifecycle-standard

Governs TC body quality. Coordinates with `ui-pom-standard` (locators) and
`api-setup-teardown-standard` (teardown) for the parts they own.

**R1 PRECONDITION_ASSERTED (ERROR, MANUAL-FIX):** First `test.step()` must assert
the precondition is met before any actions.  
**R2 POSTCONDITION_GUARANTEED (ERROR, MANUAL-FIX):** Tests that mutate persistent
state must include a `clean<Resource>` fixture parameter.  
**R3 NO_HARDCODED_WAITS (ERROR, AUTO-FIX):** `page.waitForTimeout()` is forbidden.
Replace with semantic waits: `expect(locator).toBeVisible()`, `waitForURL()`, etc.  
**R4 WEB_FIRST_ASSERTIONS (ERROR, AUTO-FIX):** Use `expect(locator).toBeVisible()`
not `expect(await locator.isVisible()).toBe(true)`.

| ❌ JS-first | ✅ Web-first |
|---|---|
| `expect(await el.textContent()).toBe('x')` | `expect(el).toHaveText('x')` |
| `expect(await el.isVisible()).toBe(true)` | `expect(el).toBeVisible()` |
| `expect(await page.url()).toContain('/p')` | `expect(page).toHaveURL(/\/p/)` |

**R5 RESILIENT_LOCATORS (WARNING, MANUAL-FIX):** Prefer `getByRole()`, `getByLabel()`,
`locator('[data-testid]')` over positional CSS or XPath.  
**R6 STEP_ASSERTS_RESULT (WARNING, MANUAL-FIX):** Every `test.step()` with actions
must have at least one assertion.  
**R7 TEST_IS_INDEPENDENT (ERROR, MANUAL-FIX):** No shared mutable state between tests.  
**R8 NO_CONDITIONAL_IN_TEST_BODY (ERROR, MANUAL-FIX):** No `if/else`/`for`/`try/catch`
in `test()` body — move to POs/fixtures.  
**R9 NAVIGATE_THEN_ASSERT (ERROR, MANUAL-FIX):** After navigation, immediately assert
a stable element confirming the page loaded.  
**R10 ASSERTION_SPECIFICITY (WARNING, MANUAL-FIX):** Assert the VALUE when the TC
says "assert value is X" — not just `.toBeVisible()`.

---

## git-workflow-docs-standard

**Commit format:** `type(scope): description`  
Allowed types: `feat` · `fix` · `refactor` · `chore` · `docs`  
Description: lowercase, no period at end.

**C4 DOCS_SYNC:** When these files change, check if matching docs need updating:

| Changed | Update |
|---|---|
| `.kiro/skills/**` | `README.md §9` |
| `src/api/sites/{site}/` | `docs/wiki/api/{site}-api-layer.md` |
| New `*.spec.ts` | `docs/test-cases/{site}/` |
| `playwright.config.ts` / `package.json` | `README.md §3/§5` |

**Project override:** Push directly to `main` (no branches/PRs for this project).
