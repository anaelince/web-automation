# Meta-prompt: Create new skill spec-standards

Use this prompt directly with Kiro to create a new skill
`.kiro/skills/spec-standards/SKILL.md` for any Playwright + TypeScript project.

This is a NEW skill — do NOT modify `test-standards`. After creating the skill:
- Register `spec-standards` as a third sub-skill in `automation-architect/SKILL.md`
- Update Mode 1 (Full Pipeline) to run `spec-standards` alongside `pom-architect`
  and `test-standards`
- Update the Sub-Skill Invocation Reference table in `automation-architect/SKILL.md`

---

## Skill overview

`spec-standards` owns the **organisational and lifecycle standards** for spec files.
It is distinct from `test-standards`, which owns code-level quality rules (imports,
fixtures, data hygiene).

| Skill | Domain |
|-------|--------|
| `pom-architect` | Page Object layer structure |
| `test-standards` | Spec code quality — imports, fixtures, credentials, framework |
| `spec-standards` | Spec organisation — folder hierarchy, file naming, TC IDs, step definition, *(future: tagging, test lifecycle)* |

**Growth path for future modules:**
- Test tagging conventions (`@smoke`, `@regression`, TC-level tags via Playwright's `tag` option)
- Test lifecycle standards (`beforeAll`/`afterAll` usage policies, setup/teardown patterns)
- Skip/only conventions (no `test.only` or `test.skip` without documented justification)

---

## Prompt

Create `.kiro/skills/spec-standards/SKILL.md` with the following content.

---

### Frontmatter

```yaml
---
name: spec-standards
description: >
  Enforce and auto-apply organisational and lifecycle standards for spec files in
  Playwright + TypeScript projects. Covers folder hierarchy, file naming, TC ID format,
  describe-block naming, and test step definition using test.step(). Future rules will
  cover test tagging and test lifecycle conventions. Load when creating, reviewing, or
  reorganising spec files.
---
```

---

### Project Context section

```markdown
## Project Context

- Spec files live under `tests/ui/{suite}/{feature}/TC{N}-{short-name}.spec.ts`
- Suite categories: `smoke` (critical path) and `regression` (edge cases, negative paths)
- The `{feature}` folder represents the **functionality under test**, not the page name
- TC IDs are assigned by the team or sourced from a test management tool; the skill
  validates format only — it does not verify that a number exists in an external system
- `TC0` is reserved for exercises or examples outside the project's main TC suite
- One spec file per TC; data-driven variants of the same TC stay in the same file
- `test.step()` is the only accepted mechanism for labelling steps — inline comments
  and JSDoc `@steps` sections are both violations
```

---

### Rules

---

#### R1 — FOLDER_STRUCTURE (ERROR, AUTO-FIX)

**Condition:** A spec file (`*.spec.ts`) is not located at
`tests/ui/{suite}/{feature}/TC{N}-{short-name}.spec.ts`.
This includes files placed directly under `tests/` or under `tests/ui/` without the
`{suite}/{feature}` sub-levels.

**Auto-fix:**
1. Determine the correct suite (`smoke` by default when unknown)
2. Derive the feature folder from the `test.describe()` name:
   PascalCase → kebab-case (e.g. `'UserRegistration'` → `user-registration`)
3. Move the file to `tests/ui/{suite}/{feature}/TC{N}-{short-name}.spec.ts`
4. Update all import statements that reference the old path
5. If the file contains `test()` calls with **different TC IDs**, split into separate
   files first (one per TC), then move each one

**Feature folder naming — functionality, not page:**

| Functionality validated | Feature folder |
|-------------------------|----------------|
| User authentication | `login/` |
| Account creation | `register/` |
| Product catalogue browsing | `products/` |
| Shopping cart management | `cart/` |
| Checkout and payment | `checkout/` |
| Contact / support forms | `contact/` |
| Newsletter subscription | `subscription/` |

**Example — before:**
```
tests/products.spec.ts           ← two TCs, wrong location
```

**Example — after:**
```
tests/ui/smoke/products/TC8-verify-all-products-and-detail.spec.ts
tests/ui/smoke/products/TC9-search-product.spec.ts
```

---

#### R2 — FILE_NAMING_CONVENTION (ERROR, AUTO-FIX)

**Condition:** The spec filename does not match `TC{N}-{short-kebab-description}.spec.ts`
where:
- `N` is a non-negative integer with no padding (TC0, TC1 … TC10 …)
- `short-kebab-description` is 1–5 words in kebab-case
- No underscores, no hyphen between `TC` and `N`, no PascalCase

The `N` in the filename must match the `N` in the `test('TC{N}: …')` call inside.

**Auto-fix:**
1. Read the TC number from the `test('TC{N}: …')` inside the file
2. Derive the short description: first 5 significant words after the colon, kebab-cased
3. Rename the file to `TC{N}-{short-description}.spec.ts`

**Valid examples:**
```
TC0-valid-login.spec.ts                         ✅
TC1-register-user.spec.ts                       ✅
TC8-verify-all-products-and-detail.spec.ts      ✅
TC9-search-product.spec.ts                      ✅
TC10-subscription-home-page.spec.ts             ✅
```

**Invalid examples:**
```
products.spec.ts                 ❌  no TC ID
example.spec.ts                  ❌  no TC ID
TC8_VerifyAllProducts.spec.ts    ❌  underscore and PascalCase
TC-8-verify-products.spec.ts     ❌  hyphen between TC and number
```

---

#### R3 — DESCRIBE_MATCHES_FEATURE_FOLDER (ERROR, AUTO-FIX)

**Condition:** The `test.describe()` name does not match the PascalCase conversion of the
parent feature folder name.

Conversion rule: kebab-case folder → split on hyphens → capitalise each word → join.

| Feature folder | Expected `test.describe()` name |
|----------------|---------------------------------|
| `login/` | `'Login'` |
| `register/` | `'Register'` |
| `products/` | `'Products'` |
| `user-registration/` | `'UserRegistration'` |
| `shopping-cart/` | `'ShoppingCart'` |

**Auto-fix:** Update the `test.describe()` string to the PascalCase of the feature folder.
Resolve R1 first (correct folder placement), then apply R3.

**Example — before** (file at `tests/ui/smoke/products/TC8-*.spec.ts`):
```typescript
test.describe('All Products', () => { ... });   // ❌ does not match 'products'
```

**Example — after:**
```typescript
test.describe('Products', () => { ... });       // ✅
```

---

#### R4 — TC_ID_NAMING_CONVENTION (ERROR, AUTO-FIX)

**Condition:** A `test()` name does not start with `TC{N}: ` (capital `TC`, integer `N`,
colon, space) OR the `N` does not match the TC number in the filename.

**Auto-fix:**
1. Read the correct `N` from the filename (validated by R2)
2. Prepend `TC{N}: ` if missing, or correct the number if mismatched

**Valid examples:**
```typescript
test('TC0: Valid login redirects to inventory page', ...)           ✅
test('TC8: Verify All Products and product detail page', ...)       ✅
test('TC9: Search Product', ...)                                    ✅
```

**Invalid examples:**
```typescript
test('TC8 Verify All Products', ...)    ❌  missing colon
test('TC8 - verify products', ...)      ❌  hyphen instead of colon
test('verify all products', ...)        ❌  no TC ID
```

For data-driven tests (multiple variants of the same TC), every `test()` must still start
with `TC{N}: ` followed by a distinguishing suffix:

```typescript
// tests/ui/smoke/login/TC3-login-incorrect-credentials.spec.ts
test('TC3: Login User with incorrect credentials — wrong email and password', ...)  ✅
test('TC3: Login User with incorrect credentials — empty email', ...)               ✅
```

---

#### R5 — USE_TEST_STEP (ERROR, AUTO-FIX)

**Condition:** A `test()` body uses inline `// Step N:` comments to label steps instead
of `test.step()` calls, OR contains logical action/assertion groups not wrapped in
`test.step()` blocks.

**Why `test.step()` over comments:** `test.step()` labels appear as named, collapsible
entries in the Playwright HTML report and CI trace output — inline comments and JSDoc
`@steps` sections are invisible to the reporter.

**Auto-fix:**
1. Remove all `// Step N:` inline comments from the test body
2. Group related actions and assertions into `await test.step('description', async () => { ... })`
3. When a step produces a value needed by later steps, return it from the callback

**Required pattern:**
```typescript
test('TC{N}: ...', async ({ fixture }) => {
  await test.step('Step description', async () => {
    // actions and assertions for this step
  });

  // Return values to pass data between steps:
  const result = await test.step('Step description', async () => {
    const value = await fixture.someAction();
    await expect(value.someLocator).toBeVisible();
    return value;
  });

  await test.step('Step description using result', async () => {
    await expect(result.anotherLocator).toBeVisible();
  });
});
```

**Example — before:**
```typescript
test('TC8: Verify All Products and product detail page', async ({ homePage }) => {
  // Step 1: Verify home page loaded successfully
  await expect(homePage.homePageIndicator).toBeVisible();

  // Step 2: Navigate to All Products page
  const productsPage = await homePage.clickProducts();

  // Step 3: Verify All Products heading is present
  await expect(productsPage.allProductsHeading).toBeVisible();

  // Step 4: Open the first product's detail page
  const productDetailPage = await productsPage.viewFirstProduct();

  // Step 5: Verify all required detail fields are visible
  await expect(productDetailPage.productName).toBeVisible();
  await expect(productDetailPage.productCategory).toBeVisible();
});
```

**Example — after:**
```typescript
test('TC8: Verify All Products and product detail page', async ({ homePage }) => {
  await test.step('Verify home page is visible', async () => {
    await expect(homePage.homePageIndicator).toBeVisible();
  });

  const productsPage = await test.step('Navigate to All Products page', async () => {
    const page = await homePage.clickProducts();
    await expect(page.allProductsHeading).toBeVisible();
    return page;
  });

  const productDetailPage = await test.step('Open first product detail page', async () => {
    await expect(productsPage.firstProductCard).toBeVisible();
    return await productsPage.viewFirstProduct();
  });

  await test.step('Verify product detail fields are visible', async () => {
    await expect(productDetailPage.productName).toBeVisible();
    await expect(productDetailPage.productCategory).toBeVisible();
  });
});
```

---

### Violation Output Format

```
[spec-standards] SEVERITY — RULE_NAME
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED
```

**Examples:**
```
[spec-standards] ERROR — FOLDER_STRUCTURE
File:  tests/products.spec.ts
Line:  1
Issue: Spec file is not inside the required tests/ui/{suite}/{feature}/ hierarchy.
Fix:   Split into one file per TC and move to tests/ui/smoke/products/. | AUTO-APPLIED

[spec-standards] ERROR — FILE_NAMING_CONVENTION
File:  tests/ui/smoke/login/example.spec.ts
Line:  —
Issue: Filename does not match TC{N}-{short-kebab-description}.spec.ts pattern.
Fix:   Rename to TC0-valid-login.spec.ts. | AUTO-APPLIED

[spec-standards] ERROR — DESCRIBE_MATCHES_FEATURE_FOLDER
File:  tests/ui/smoke/products/TC8-verify-all-products-and-detail.spec.ts
Line:  3
Issue: test.describe() name 'All Products' does not match folder 'products' (expected 'Products').
Fix:   Rename describe block to 'Products'. | AUTO-APPLIED

[spec-standards] ERROR — TC_ID_NAMING_CONVENTION
File:  tests/ui/smoke/products/TC8-verify-all-products-and-detail.spec.ts
Line:  4
Issue: test() name does not start with 'TC8: '.
Fix:   Prepend 'TC8: ' to the test name. | AUTO-APPLIED

[spec-standards] ERROR — USE_TEST_STEP
File:  tests/ui/smoke/products/TC9-search-product.spec.ts
Line:  6
Issue: test() body uses inline '// Step N:' comments instead of test.step() blocks.
Fix:   Wrap each logical group into await test.step('description', async () => { ... }). | AUTO-APPLIED
```

---

### Scan Scope

| File glob | Rules applied |
|-----------|---------------|
| `tests/ui/**/*.spec.ts` | R1, R2, R3, R4, R5 |
| `tests/*.spec.ts` | R1 violation (files outside `tests/ui/` hierarchy) |

---

### Updates required in automation-architect/SKILL.md

1. **Sub-skills list** in Project Context: add `spec-standards (TC organisation rules)`
2. **Mode 1 — Full Pipeline**: add step to run `spec-standards` after `test-standards`
3. **Mode 1 output format**: add `spec-standards` line to the PIPELINE COMPLETE summary
4. **Sub-Skill Invocation Reference table**: add new row:

| Goal | Skill to load | Trigger phrase example |
|------|---------------|------------------------|
| Fix TC folder / naming / step violations | `spec-standards` | `"check spec structure"` |
