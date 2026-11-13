# Meta-prompt: Create new skill lifecycle-architect

Use this prompt directly with Kiro to create a new skill
`.kiro/skills/lifecycle-architect/SKILL.md` for any Playwright + TypeScript project.

This is a NEW skill — do NOT modify `test-standards`. After creating the skill:
- Register `lifecycle-architect` as a fifth sub-skill in `automation-architect/SKILL.md`
- Update Mode 1 (Full Pipeline) to run `lifecycle-architect` after `spec-standards`
- Add Mode 6 — Lifecycle Infrastructure to `automation-architect/SKILL.md`
- Update the Sub-Skill Registry and Scan Scope Ownership tables
- Update the Sub-Skill Invocation Reference table
- Update the mode slot comment to `(6 of 10 slots used)`

---

## Skill overview

`lifecycle-architect` owns the **API layer structure and lifecycle infrastructure** of
the test framework. It governs how setup and teardown are implemented using the API,
ensuring tests are deterministic, parallel-safe, and portable across environments.

| Skill | Domain |
|-------|--------|
| `pom-architect` | Page Object layer structure |
| `test-standards` | Spec code quality — imports, fixtures, credentials, framework |
| `spec-standards` | Spec organisation — folder hierarchy, file naming, TC IDs, steps |
| `git-standards` | Git workflow conventions |
| `lifecycle-architect` | API layer structure · setup/teardown infrastructure · mocking |

**Gap this skill fills:** No existing skill governs `src/api/`. The `@api/*` path alias
is defined in `tsconfig.json` and referenced in the project structure, but its internal
architecture — how the client, endpoints, models, controllers, and mocks are built and
connected — is currently unenforceable. This skill also governs how the lifecycle layer
is consumed by test cases: controllers and data resources must always be injected as
fixture parameters, never instantiated inside a test body.

**Growth path for future modules:**
- Database-level setup/teardown strategies
- Auth token caching and reuse across fixtures
- Environment-scoped teardown policies (e.g. skip destructive teardown on staging)

---

## API Layer Architecture Reference

This architecture is the single source of truth for how `src/api/` is structured.
All rules in this skill enforce conformance to this layout.

```
src/api/
  client/
    ApiClient.ts              ← only HTTP entry point; wraps APIRequestContext
  endpoints/
    <resource>.endpoints.ts   ← URL constants and path builders per resource
  models/
    <resource>.model.ts       ← TypeScript interfaces for request/response payloads
  controllers/
    <resource>.controller.ts  ← business-level operations per resource
  mocks/
    <resource>.mock.ts        ← route stub factories using page.route()
```

### Layer responsibilities

| Layer | Responsibility | May depend on |
|-------|---------------|---------------|
| `client/ApiClient.ts` | Wrap `APIRequestContext`; handle base URL, headers, response parsing | Nothing inside `src/api/` |
| `endpoints/<r>.endpoints.ts` | URL constants and path builder functions | Nothing |
| `models/<r>.model.ts` | TypeScript interfaces for request/response shapes | Nothing |
| `controllers/<r>.controller.ts` | Business operations (create, get, delete, etc.) | `ApiClient` · `endpoints` · `models` |
| `mocks/<r>.mock.ts` | Route stub factories registered via `page.route()` | `endpoints` · `models` |

### Fixture wiring pattern

Fixtures in `src/fixtures/index.ts` use controllers for setup and teardown.
They receive `request` (Playwright's `APIRequestContext`) from the base fixture.

```typescript
// Setup-only fixture (read operations, no teardown needed)
bookController: async ({ request }, use) => {
  const client = new ApiClient(request);
  const controller = new BookController(client);
  await use(controller);
},

// Setup + teardown fixture (creates data before test, deletes after)
createdBook: async ({ request }, use) => {
  const client = new ApiClient(request);
  const controller = new BookController(client);
  const book = await controller.create({ userId: ENV.userId, isbn: 'test-isbn' });
  await use(book);                       // ← test runs here
  await controller.delete(book.bookId); // ← teardown: always runs after use()
},
```

#### API + UI Hybrid Fixture — Token Refresh Pattern

**When to use:** A fixture that covers a test whose body performs a **UI login**.
Most identity providers (including demoqa) enforce a **single-active-token constraint**:
when the UI login succeeds it issues a new token, which immediately invalidates any
previous API token. The teardown MUST regenerate the token; using the setup token will
return `401 Unauthorized`.

```typescript
// Pre-test state check + post-test cleanup with mandatory token refresh in teardown
cleanBookshelf: async ({ request }, use) => {
  const client = new ApiClient(request);
  const accountCtrl = new AccountController(client);

  // ── Setup: generate token and ensure clean initial state ─────────────
  const setupToken = await accountCtrl.generateToken(
    ENV.testUser.name,
    ENV.testUser.password,
  );
  client.setAuthToken(setupToken);
  const bookCtrl = new BookController(client);

  // Pre-test state check — clean any residual data from a previous failed run
  const existing = await accountCtrl.getUserItems(ENV.testUser.id);
  if (existing.length > 0) {
    await bookCtrl.deleteAll(ENV.testUser.id);
  }

  await use(bookCtrl); // ← test runs here (UI login happens → server issues new token)

  // ── Teardown: MUST regenerate token before API calls ─────────────────
  // The UI login during the test body invalidated the setup token.
  // A stale setup token returns 401 — always refresh here.
  const teardownToken = await accountCtrl.generateToken(
    ENV.testUser.name,
    ENV.testUser.password,
  );
  client.setAuthToken(teardownToken);
  await bookCtrl.deleteAll(ENV.testUser.id);
},
```

#### Fixture injection decision table

| Need | Fixture type | Parameter name pattern | Provides |
|------|-------------|----------------------|----------|
| Read/verify existing data | Controller fixture | `<resource>Controller` | The controller instance |
| Create data, assert, then clean up | Data fixture with teardown | `created<Resource>` | The created resource object |
| Verify clean initial state + clean up after test | Setup+teardown fixture | `clean<Resource>` | The controller instance |
| Mock a route for this test | Mock fixture or inline `page.route()` via mock factory | `mock<Resource>` | Registered route stub |

### Canonical implementation examples

```typescript
// src/api/client/ApiClient.ts
import { APIRequestContext } from '@playwright/test';

export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async get<T>(url: string): Promise<T> {
    const response = await this.request.get(url);
    return response.json() as Promise<T>;
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await this.request.post(url, { data });
    if (!response.ok()) {
      const body = await response.text().catch(() => '');
      throw new Error(`POST ${url} failed — status ${response.status()}: ${body}`);
    }
    return response.json() as Promise<T>;
  }

  async delete(
    url: string,
    options?: { data?: unknown; params?: Record<string, string> },
  ): Promise<void> {
    const response = await this.request.delete(url, {
      data: options?.data,
      params: options?.params,
    });
    if (!response.ok()) {
      const body = await response.text().catch(() => '');
      throw new Error(`DELETE ${url} failed — status ${response.status()}: ${body}`);
    }
  }
}
```

```typescript
// src/api/endpoints/books.endpoints.ts
export const BooksEndpoints = {
  base: '/api/v1/Books',
  byId: (id: string) => `/api/v1/Books/${id}`,
} as const;
```

```typescript
// src/api/models/book.model.ts
export interface Book {
  bookId: string;
  title: string;
  isbn: string;
}

export interface CreateBookPayload {
  userId: string;
  collectionOfIsbns: { isbn: string }[];
}
```

```typescript
// src/api/controllers/BookController.ts
import { ApiClient } from '@api/client/ApiClient';
import { BooksEndpoints } from '@api/endpoints/books.endpoints';
import { Book, CreateBookPayload } from '@api/models/book.model';

export class BookController {
  constructor(private readonly client: ApiClient) {}

  async getAll(): Promise<Book[]> {
    return this.client.get<Book[]>(BooksEndpoints.base);
  }

  async create(payload: CreateBookPayload): Promise<Book> {
    return this.client.post<Book>(BooksEndpoints.base, payload);
  }

  async delete(bookId: string): Promise<void> {
    return this.client.delete(BooksEndpoints.byId(bookId));
  }
}
```

```typescript
// src/api/mocks/book.mock.ts
import { Page } from '@playwright/test';
import { BooksEndpoints } from '@api/endpoints/books.endpoints';
import { Book } from '@api/models/book.model';

export async function mockGetBooks(page: Page, books: Book[]): Promise<void> {
  await page.route(`**${BooksEndpoints.base}`, async (route) => {
    await route.fulfill({ json: books });
  });
}
```

---

## Prompt

Create `.kiro/skills/lifecycle-architect/SKILL.md` with the following content.

---

### Frontmatter

```yaml
---
name: lifecycle-architect
description: >
  Enforce and scaffold the API layer infrastructure for Playwright + TypeScript projects.
  Governs the structure of ApiClient, endpoints, models, controllers, and mocks under
  src/api/. Two modes: New (scaffold the full API layer for a resource) and Add (extend
  an existing API layer with a new resource). Load when implementing API-based setup,
  teardown, or route mocking for any test case.
---
```

---

### Project Context section

```markdown
## Project Context

- API layer lives under `src/api/` — path alias `@api/*` maps to `src/api/*`
- Playwright's `APIRequestContext` (the `request` fixture) is the HTTP mechanism
- `ApiClient` is the only class allowed to call `request.*` methods directly
- Controllers receive `ApiClient`; they never receive `APIRequestContext` directly
- Endpoints are URL-only constants — no HTTP logic, no imports from `client/`
- Models are TypeScript interfaces — no classes, no logic
- Mocks use `page.route()` with endpoint constants — no hardcoded URL strings
- Every fixture that creates data via API must delete it after `use()` (teardown contract)
- Fixtures wire controllers together; they do not call `ApiClient` methods directly
- Controllers and data resources are **always injected into specs as fixture parameters** — never instantiated inside a test body
- Specs may read and assert on injected data; they must not perform create/delete operations directly

### Fixture injection decision table

| Need | Fixture type | Parameter name pattern | Provides |
|------|-------------|----------------------|----------|
| Read/verify existing data | Controller fixture | `<resource>Controller` | The controller instance |
| Create data, assert, then clean up | Data fixture with teardown | `created<Resource>` | The created resource object |
| Mock a route for this test | Mock fixture or inline `page.route()` via mock factory | `mock<Resource>` | Registered route stub |
```

---

### Two invocation modes

---

#### Mode: New — Scaffold API Layer

**Triggers:** `"setup api layer"` · `"scaffold api"` · `"new api resource"` · `"create controller"`
· `"lifecycle new"`

**When to use:** When `src/api/` does not exist yet, or when adding the first controller
for a new resource that has no existing API support.

**Step 0 — Collect parameters** (infer from context; ask only for missing items):
- `resourceName` — PascalCase singular noun (e.g., `Book`, `User`)
- `baseUrl` — the API base path (e.g., `/api/v1/Books`)
- `operations` — which CRUD operations are needed: `get`, `create`, `delete`, `update`
- `needsMock` — `true` if route mocking is required for this resource

**Step 1 — Create `ApiClient` if it does not exist:**
- Path: `src/api/client/ApiClient.ts`
- Implement only the HTTP methods needed by the requested operations
- Use `APIRequestContext` from `@playwright/test`
- All imports via `@api/*` or `@playwright/test`

**Step 2 — Create `src/api/endpoints/<resource>.endpoints.ts`:**
- Export a `const` object named `<Resource>Endpoints`
- Include `base` property and a `byId` function if delete/update operations are needed

**Step 3 — Create `src/api/models/<resource>.model.ts`:**
- Export interfaces for the response shape and each request payload
- Name response interface `<Resource>`, payload interfaces `<Action><Resource>Payload`

**Step 4 — Create `src/api/controllers/<resource>.controller.ts`:**
- Constructor receives `ApiClient` only
- One method per operation requested in Step 0
- All imports via `@api/*`

**Step 5 — Create `src/api/mocks/<resource>.mock.ts`** (only if `needsMock` is `true`):
- Export one factory function per route stub
- Use endpoint constants from `@api/endpoints/<resource>.endpoints`
- Accept `Page` and a response payload parameter

**Step 6 — Wire fixture in `src/fixtures/index.ts`:**
- Add a controller fixture (setup-only, for read operations)
- Add a data fixture with teardown if create/delete operations exist
- All imports via `@api/*` and `@fixtures/*`
- Run `test-standards` on `src/fixtures/index.ts` after update — assert zero violations

**Output:**
```
[lifecycle-architect] SCAFFOLD COMPLETE — New
─────────────────────────────────────────────
Created:  src/api/client/ApiClient.ts           (if new)
Created:  src/api/endpoints/<resource>.endpoints.ts
Created:  src/api/models/<resource>.model.ts
Created:  src/api/controllers/<resource>.controller.ts
Created:  src/api/mocks/<resource>.mock.ts      (if needsMock)
Updated:  src/fixtures/index.ts
```

---

#### Mode: Add — Extend API Layer

**Triggers:** `"add api support"` · `"extend api"` · `"new controller for"` · `"lifecycle add"`

**When to use:** When `src/api/` already exists and a new test case requires API support
for a resource that does not yet have a controller.

**Step 0 — Verify existing structure:**
1. Confirm `src/api/client/ApiClient.ts` exists and is compliant with R1
2. If violations are found, run R1 auto-fix before proceeding

**Step 1 — Collect parameters** (same as Mode New Step 0)

**Steps 2–6 — Same as Mode New** but skip `ApiClient` creation (already exists).

**Step 7 — Run full scan on `src/api/`:**
- Run all rules (R1–R6) on the entire `src/api/` folder
- Auto-fix any violations introduced by the new files
- Report any remaining manual items

**Output:**
```
[lifecycle-architect] SCAFFOLD COMPLETE — Add
─────────────────────────────────────────────
Created:  src/api/endpoints/<resource>.endpoints.ts
Created:  src/api/models/<resource>.model.ts
Created:  src/api/controllers/<resource>.controller.ts
Created:  src/api/mocks/<resource>.mock.ts      (if needsMock)
Updated:  src/fixtures/index.ts
```

---

### Rules

---

#### R1 — API_CLIENT_IS_ONLY_HTTP_ENTRY_POINT (ERROR, AUTO-FIX)

**Condition:** Any file outside `src/api/client/ApiClient.ts` calls
`request.get()`, `request.post()`, `request.put()`, `request.patch()`, or
`request.delete()` directly.

**Auto-fix:** Replace the direct call with the equivalent `ApiClient` method.
If `ApiClient` does not have that method yet, add it.

**Example — before (controller):**
```typescript
async getAll(): Promise<Book[]> {
  const response = await this.request.get(BooksEndpoints.base);
  return response.json();
}
```

**Example — after:**
```typescript
async getAll(): Promise<Book[]> {
  return this.client.get<Book[]>(BooksEndpoints.base);
}
```

---

#### R2 — ENDPOINTS_CENTRALIZED (ERROR, AUTO-FIX)

**Condition:** A hardcoded URL string appears in a controller, fixture, or mock file
(any string matching `'/api/` or a full URL pattern).

**Auto-fix:**
1. If an endpoint file for the resource exists, replace the hardcoded string with the
   correct endpoint constant
2. If no endpoint file exists, create one and replace the hardcoded string

**Example — before:**
```typescript
return this.client.get<Book[]>('/api/v1/Books');
```

**Example — after:**
```typescript
return this.client.get<Book[]>(BooksEndpoints.base);
```

---

#### R3 — CONTROLLER_DEPENDENCY_CONTRACT (ERROR, AUTO-FIX)

**Condition:** A controller constructor parameter is typed as `APIRequestContext`
instead of `ApiClient`.

**Auto-fix:** Replace the parameter type with `ApiClient` and update all usages
inside the constructor and methods.

---

#### R4 — TEARDOWN_MIRRORS_SETUP (ERROR, MANUAL-FIX)

**Condition:** A fixture in `src/fixtures/index.ts` calls a create/post controller
method before `use()` but has no delete/cleanup call after `use()`.

**Why not auto-fix:** Teardown logic requires knowing the correct resource identifier
returned by the create call. Auto-applying risks incorrect cleanup.

**Example — violation:**
```typescript
createdBook: async ({ request }, use) => {
  const client = new ApiClient(request);
  const book = await new BookController(client).create(payload);
  await use(book); // ← no teardown after use()
},
```

**Expected pattern:**
```typescript
createdBook: async ({ request }, use) => {
  const client = new ApiClient(request);
  const controller = new BookController(client);
  const book = await controller.create(payload);
  await use(book);
  await controller.delete(book.bookId); // ← teardown
},
```

---

#### R5 — MOCKS_USE_CENTRALIZED_ENDPOINTS (ERROR, AUTO-FIX)

**Condition:** A mock file passes a hardcoded URL string to `page.route()` instead
of a reference to an endpoint constant.

**Auto-fix:** Replace the hardcoded string with the matching endpoint constant,
wrapped in the `**` prefix pattern Playwright expects.

**Example — before:**
```typescript
await page.route('**/api/v1/Books', async (route) => { ... });
```

**Example — after:**
```typescript
await page.route(`**${BooksEndpoints.base}`, async (route) => { ... });
```

---

#### R7 — NO_LIFECYCLE_INSTANTIATION_IN_SPEC (ERROR, AUTO-FIX)

**Condition:** A spec file (`tests/**/*.spec.ts`) instantiates `ApiClient`, any controller
class, or calls `request.*` methods directly inside a `test()` body or `beforeEach()` block.

**Why:** Controllers and data resources belong in fixtures. Instantiating them in specs
couples the test to the infrastructure, breaks the fixture lifecycle, and prevents proper
teardown.

**Auto-fix:**
1. Extract the instantiation and any setup call into a new fixture in `src/fixtures/index.ts`
2. If a matching fixture already exists, remove the duplicate from the spec and inject the fixture
3. Add the fixture parameter to the `test()` signature

**Example — before (spec):**
```typescript
test('TC10: ...', async ({ page, request }) => {
  const client = new ApiClient(request);
  const controller = new BookController(client);
  const book = await controller.create(payload);
  // test body
});
```

**Example — after (fixture):**
```typescript
// src/fixtures/index.ts
createdBook: async ({ request }, use) => {
  const client = new ApiClient(request);
  const controller = new BookController(client);
  const book = await controller.create(payload);
  await use(book);
  await controller.delete(book.bookId);
},
```
```typescript
// spec
test('TC10: ...', async ({ page, createdBook }) => {
  // test body — createdBook is already prepared
});
```

---

#### R8 — LIFECYCLE_FIXTURE_NAMING_CONVENTION (WARNING, AUTO-FIX)

**Condition:** A lifecycle fixture in `src/fixtures/index.ts` does not follow the naming
convention for its type.

| Fixture type | Required naming pattern | Example |
|-------------|------------------------|---------|
| Controller (read-only, no teardown) | `<resource>Controller` (camelCase) | `bookController` |
| Data resource with teardown | `created<Resource>` (camelCase) | `createdBook` |
| State check + cleanup (setup + teardown) | `clean<Resource>` (camelCase) | `cleanBookshelf` |
| Mock fixture | `mock<Resource>` (camelCase) | `mockBooks` |

**Auto-fix:** Rename the fixture key and update all references in spec files.

---

#### R6 — CORRECT_FOLDER_PLACEMENT (ERROR, AUTO-FIX)

**Condition:** An API layer file is in the wrong subfolder of `src/api/`.

| File type | Required folder |
|-----------|----------------|
| HTTP client wrapper | `src/api/client/` |
| URL constants | `src/api/endpoints/` |
| TypeScript interfaces | `src/api/models/` |
| Business operations | `src/api/controllers/` |
| Route stub factories | `src/api/mocks/` |

**Auto-fix:** Move the file to the correct folder and update all imports.

---

#### R10 — TOKEN_REFRESH_IN_TEARDOWN (WARNING, MANUAL-FIX)

**Condition:** A fixture in `src/fixtures/index.ts`:
1. Generates an API auth token before `await use()`, AND
2. Is used by specs that perform a UI login during the test body (detected by scanning
   the specs that inject this fixture for `login()` PO method calls)

Does NOT regenerate the token before its teardown API calls.

**Why not auto-fix:** Identifying which controller method belongs to teardown requires
human judgement; auto-applying a token refresh at the wrong position could break the
fixture contract.

**Why this matters:** Many identity providers (e.g. demoqa) enforce a **single-active-token
constraint** — when a UI login succeeds the server issues a new session token and
invalidates all previous ones. Using the setup token in teardown returns `401`.

**Expected pattern:**
```typescript
cleanBookshelf: async ({ request }, use) => {
  const client = new ApiClient(request);
  const accountCtrl = new AccountController(client);

  // Setup token
  const setupToken = await accountCtrl.generateToken(username, password);
  client.setAuthToken(setupToken);
  const bookCtrl = new BookController(client);

  // Pre-test state check
  const existing = await accountCtrl.getUserItems(userId);
  if (existing.length > 0) {
    await bookCtrl.deleteAll(userId);
  }

  await use(bookCtrl); // ← UI login happens here → setup token is invalidated

  // Teardown: MUST regenerate token
  const teardownToken = await accountCtrl.generateToken(username, password);
  client.setAuthToken(teardownToken);
  await bookCtrl.deleteAll(userId);
},
```

---

#### R11 — API_CLIENT_STATUS_CHECKED (ERROR, AUTO-FIX)

**Condition:** Any method in `ApiClient` (`get`, `post`, `delete`) does not call
`response.ok()` and throw for non-2xx HTTP responses.

**Why:** A silent non-2xx response (e.g. `401 Unauthorized`, `404 Not Found`) means the
operation failed but the fixture continues as if it succeeded. Errors must surface
immediately with the actual HTTP status and body so they can be diagnosed.

**Auto-fix:** Add status check and throw after every `response` assignment.

**Example — before:**
```typescript
async delete(url: string): Promise<void> {
  await this.request.delete(url);
}
```

**Example — after:**
```typescript
async delete(url: string, options?: { data?: unknown; params?: Record<string, string> }): Promise<void> {
  const response = await this.request.delete(url, {
    data: options?.data,
    params: options?.params,
    headers: this.buildHeaders(),
  });
  if (!response.ok()) {
    const body = await response.text().catch(() => '');
    throw new Error(`DELETE ${url} failed — status ${response.status()}: ${body}`);
  }
}
```

---

### Violation Output Format

```
[lifecycle-architect] SEVERITY — RULE_NAME
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED | MANUAL-FIX
```

**Examples:**
```
[lifecycle-architect] ERROR — API_CLIENT_IS_ONLY_HTTP_ENTRY_POINT
File:  src/api/controllers/BookController.ts
Line:  12
Issue: Controller calls request.get() directly instead of delegating to ApiClient.
Fix:   Replace with this.client.get<Book[]>(BooksEndpoints.base). | AUTO-APPLIED

[lifecycle-architect] ERROR — TEARDOWN_MIRRORS_SETUP
File:  src/fixtures/index.ts
Line:  34
Issue: 'createdBook' fixture creates a book via API but has no teardown after use().
Fix:   Add await controller.delete(book.bookId) after the use() call. | MANUAL-FIX

[lifecycle-architect] ERROR — ENDPOINTS_CENTRALIZED
File:  src/api/controllers/BookController.ts
Line:  8
Issue: Hardcoded URL '/api/v1/Books' found — endpoint constants must be used instead.
Fix:   Replace with BooksEndpoints.base from @api/endpoints/books.endpoints. | AUTO-APPLIED

[lifecycle-architect] ERROR — NO_LIFECYCLE_INSTANTIATION_IN_SPEC
File:  tests/ui/smoke/books/TC10-add-book.spec.ts
Line:  8
Issue: Spec instantiates BookController directly inside the test body.
Fix:   Extract to a 'createdBook' fixture in src/fixtures/index.ts and inject it as a parameter. | AUTO-APPLIED

[lifecycle-architect] WARNING — LIFECYCLE_FIXTURE_NAMING_CONVENTION
File:  src/fixtures/index.ts
Line:  41
Issue: Fixture 'newBook' creates data with teardown but does not follow the 'created<Resource>' naming pattern.
Fix:   Rename to 'createdBook' and update all references in spec files. | AUTO-APPLIED
```

---

### Scan Scope

| File glob | Rules applied |
|-----------|---------------|
| `src/api/client/**/*.ts` | R1, R11 (only HTTP entry point + status checking) |
| `src/api/controllers/**/*.ts` | R1, R2, R3, R6 |
| `src/api/endpoints/**/*.ts` | R6 |
| `src/api/models/**/*.ts` | R6 |
| `src/api/mocks/**/*.ts` | R2, R5, R6 |
| `src/fixtures/index.ts` | R4, R8, R10 |
| `tests/**/*.spec.ts` | R7 |
| `src/api/mocks/**/*.ts` | R2, R5, R6 |
| `src/fixtures/index.ts` | R4, R8 |
| `tests/**/*.spec.ts` | R7 |

---

### Updates required in automation-architect/SKILL.md

1. **Sub-Skill Registry table**: add new row:

   | Skill | Domain | File Scope | Rules / Checks | Added | Status |
   |-------|--------|-----------|----------------|-------|--------|
   | `lifecycle-architect` | API layer structure · setup/teardown · fixture injection | `src/api/**/*.ts` · `src/fixtures/index.ts` · `tests/**/*.spec.ts` | R1–R8 | M6 | Active |

2. **Scan Scope Ownership table**: add new rows:

   | File / Scope | Owner skill | Concern |
   |--------------|-------------|---------|
   | `src/api/client/**/*.ts` | `lifecycle-architect` | HTTP entry point contract |
   | `src/api/controllers/**/*.ts` | `lifecycle-architect` | Controller structure and dependencies |
   | `src/api/endpoints/**/*.ts` | `lifecycle-architect` | URL centralisation |
   | `src/api/models/**/*.ts` | `lifecycle-architect` | Interface placement |
   | `src/api/mocks/**/*.ts` | `lifecycle-architect` | Route stub structure |
   | `src/fixtures/index.ts` — teardown contract | `lifecycle-architect` | Setup/teardown pairing |
   | `src/fixtures/index.ts` — lifecycle fixture naming | `lifecycle-architect` | Naming convention (R8) |
   | `tests/**/*.spec.ts` — controller/client instantiation | `lifecycle-architect` | No lifecycle instantiation in specs (R7) |

   > Note: `src/fixtures/index.ts` is already owned by `test-standards` for fixture
   > completeness and import hygiene. `lifecycle-architect` owns only the teardown
   > contract concern (R4). There is no scan overlap.

3. **Mode 1 — Full Pipeline**: add step after `spec-standards`:
   ```markdown
   6. Run `lifecycle-architect` on `src/api/` and `src/fixtures/index.ts` (teardown only):
      - Detect all API layer violations
      - Auto-fix every fixable violation (R1–R3, R5–R6)
      - Collect R4 (teardown) items as manual fixes
   ```

   Update output format:
   ```
   [automation-architect] PIPELINE COMPLETE
   ─────────────────────────────────────────
   pom-architect:        X violations found — Y auto-applied
   test-standards:       X violations found — Y auto-applied
   spec-standards:       X violations found — Y auto-applied
   lifecycle-architect:  X violations found — Y auto-applied
   Remaining manual fixes: <list if any, or "none">
   [automation-architect] ✅ All rules satisfied.
   ```

4. **Mode 6 — Lifecycle Infrastructure**: add after Mode 5.
   Update mode slot comment to `(6 of 10 slots used)`.

   ```markdown
   ### Mode 6 — Lifecycle Infrastructure

   **Triggers:** `"setup api layer"` · `"scaffold api"` · `"new controller"` ·
   `"add lifecycle support"` · `"lifecycle architect"`

   **When to use:** When implementing API-based setup or teardown for a test case,
   or when extending an existing API layer with a new resource.

   **Steps:**
   1. Load and invoke `lifecycle-architect`
   2. Determine mode automatically:
      - `src/api/` does not exist → **New**
      - `src/api/` exists and resource has no controller → **Add**
   3. Forward all output verbatim

   **Note:** Load `lifecycle-architect` directly for standalone API layer work
   without activating the hub.
   ```

5. **Sub-Skill Invocation Reference table**: add new row:

   | Goal | Skill to load | Trigger phrase example |
   |------|---------------|------------------------|
   | Scaffold or extend the API layer for setup/teardown | `lifecycle-architect` | `"scaffold api for books"` |

6. **Project folder structure** in Project Context: update `src/api/` entry:
   ```
   api/
     client/       ← ApiClient (HTTP entry point)   (lifecycle-architect)
     endpoints/    ← URL constants per resource      (lifecycle-architect)
     models/       ← Request/response interfaces     (lifecycle-architect)
     controllers/  ← Business operations             (lifecycle-architect)
     mocks/        ← Route stub factories            (lifecycle-architect)
   ```
