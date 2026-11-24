---
name: api-setup-teardown-standard
description: >
  Enforce and scaffold the API layer infrastructure for Playwright + TypeScript projects.
  Governs the structure of ApiClient, endpoints, models, controllers, and mocks under
  src/api/. Two modes: New (scaffold the full API layer for a resource) and Add (extend
  an existing API layer with a new resource). Load when implementing API-based setup,
  teardown, or route mocking for any test case.
---

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
- When a fixture's test body performs a UI login, the API token generated during setup is invalidated by the server — teardown must regenerate the token before making API calls (single-active-token constraint)

### Fixture injection decision table

| Need | Fixture type | Parameter name pattern | Provides |
|------|-------------|----------------------|----------|
| Read/verify existing data | Controller fixture | `<resource>Controller` | The controller instance |
| Create data, assert, then clean up | Data fixture with teardown | `created<Resource>` | The created resource object |
| Verify clean initial state + clean up after test | Setup+teardown fixture | `clean<Resource>` | The controller instance |
| Mock a route for this test | Mock fixture or inline `page.route()` via mock factory | `mock<Resource>` | Registered route stub |

### API + UI Hybrid Fixture — Token Refresh Pattern

When a fixture covers a test whose body performs a **UI login**, most identity providers
enforce a **single-active-token constraint**: the UI login issues a new token and
invalidates all previous ones. The teardown MUST regenerate the token; using the setup
token returns `401 Unauthorized`.

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

---

## Modes

---

### Mode: New — Scaffold API Layer

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
- Run `spec-code-standard` on `src/fixtures/index.ts` after update — assert zero violations

**Output:**
```
[api-setup-teardown-standard] SCAFFOLD COMPLETE — New
─────────────────────────────────────────────
Created:  src/api/client/ApiClient.ts           (if new)
Created:  src/api/endpoints/<resource>.endpoints.ts
Created:  src/api/models/<resource>.model.ts
Created:  src/api/controllers/<resource>.controller.ts
Created:  src/api/mocks/<resource>.mock.ts      (if needsMock)
Updated:  src/fixtures/index.ts
```

---

### Mode: Add — Extend API Layer

**Triggers:** `"add api support"` · `"extend api"` · `"new controller for"` · `"lifecycle add"`

**When to use:** When `src/api/` already exists and a new test case requires API support
for a resource that does not yet have a controller.

**Step 0 — Verify existing structure:**
1. Confirm `src/api/client/ApiClient.ts` exists and is compliant with R1
2. If violations are found, run R1 auto-fix before proceeding

**Step 1 — Collect parameters** (same as Mode New Step 0)

**Steps 2–6 — Same as Mode New** but skip `ApiClient` creation (already exists).

**Identity provisioning** (requested by `spec-data-standard` M1): when a worker-scoped or
per-test identity is needed, add `create<Identity>` / `delete<Identity>` to the identity
controller and wire a `worker<Resource>` fixture with `{ scope: 'worker' }` that creates the
identity before `use()` and deletes it after.

**State reads for polling** (requested by `ui-locator-wait-standard` M5): when a test waits for
an asynchronous resource, add `get<Resource>Status(id)` to its controller and declare the state
union (success and terminal failure states) in `models/`. Bounded polling (R17) calls this method,
never `request.*`.

**Step 7 — Run full scan on `src/api/`:**
- Run all rules (R1–R6) on the entire `src/api/` folder
- Auto-fix any violations introduced by the new files
- Report any remaining manual items

**Output:**
```
[api-setup-teardown-standard] SCAFFOLD COMPLETE — Add
─────────────────────────────────────────────
Created:  src/api/endpoints/<resource>.endpoints.ts
Created:  src/api/models/<resource>.model.ts
Created:  src/api/controllers/<resource>.controller.ts
Created:  src/api/mocks/<resource>.mock.ts      (if needsMock)
Updated:  src/fixtures/index.ts
```

---

## Rules

---

### R1 — API_CLIENT_IS_ONLY_HTTP_ENTRY_POINT (ERROR, AUTO-FIX)

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

### R2 — ENDPOINTS_CENTRALIZED (ERROR, AUTO-FIX)

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

### R3 — CONTROLLER_DEPENDENCY_CONTRACT (ERROR, AUTO-FIX)

**Condition:** A controller constructor parameter is typed as `APIRequestContext`
instead of `ApiClient`.

**Auto-fix:** Replace the parameter type with `ApiClient` and update all usages
inside the constructor and methods.

---

### R4 — TEARDOWN_MIRRORS_SETUP (ERROR, MANUAL-FIX)

**Condition:** A fixture in `src/fixtures/index.ts` (test- or worker-scoped, including
`{ scope: 'worker' }` identity fixtures) calls a create/post controller method before
`use()` but has no delete/cleanup call after `use()`. Cleanup **scope** (only owned data)
is checked by `spec-data-standard` R12.

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

### R5 — MOCKS_USE_CENTRALIZED_ENDPOINTS (ERROR, AUTO-FIX)

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

### R6 — CORRECT_FOLDER_PLACEMENT (ERROR, AUTO-FIX)

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

### R10 — TOKEN_REFRESH_IN_TEARDOWN (WARNING, MANUAL-FIX)

**Condition:** A fixture in `src/fixtures/index.ts`:
1. Generates an API auth token before `await use()`, AND
2. Is used by specs that perform a UI login during the test body

Does NOT regenerate the token before its teardown API calls.

**Why:** Many identity providers enforce a **single-active-token constraint** — when
a UI login succeeds the server issues a new token and invalidates all previous ones.
Using the setup token in teardown returns `401 Unauthorized`.

**Expected pattern:**
```typescript
cleanBookshelf: async ({ request }, use) => {
  // Setup token
  const setupToken = await accountCtrl.generateToken(username, password);
  client.setAuthToken(setupToken);
  // ... pre-test state check ...

  await use(controller); // ← UI login happens here, invalidates setupToken

  // Teardown: regenerate token
  const teardownToken = await accountCtrl.generateToken(username, password);
  client.setAuthToken(teardownToken);
  await controller.deleteAll(userId);
},
```

---

### R11 — API_CLIENT_STATUS_CHECKED (ERROR, AUTO-FIX)

**Condition:** Any method in `ApiClient` (`get`, `post`, `delete`) does not call
`response.ok()` and throw for non-2xx HTTP responses.

**Why:** Silent non-2xx responses (e.g. `401`, `404`) cause fixtures to continue as if
operations succeeded, masking real failures.

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
  const response = await this.request.delete(url, { ... });
  if (!response.ok()) {
    const body = await response.text().catch(() => '');
    throw new Error(`DELETE ${url} failed — status ${response.status()}: ${body}`);
  }
}
```

---

### R7 — NO_LIFECYCLE_INSTANTIATION_IN_SPEC (ERROR, AUTO-FIX)

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

### R8 — LIFECYCLE_FIXTURE_NAMING_CONVENTION (WARNING, AUTO-FIX)

**Condition:** A lifecycle fixture in `src/fixtures/index.ts` does not follow the naming
convention for its type.

| Fixture type | Required naming pattern | Example |
|-------------|------------------------|---------|
| Controller (read-only, no teardown) | `<resource>Controller` (camelCase) | `bookController` |
| Data resource with teardown | `created<Resource>` (camelCase) | `createdBook` |
| State check + cleanup (setup + teardown) | `clean<Resource>` (camelCase) | `cleanBookshelf` |
| Mock fixture | `mock<Resource>` (camelCase) | `mockBooks` |
| Worker-scoped identity/resource (`scope: 'worker'`) | `worker<Resource>` (camelCase) | `workerUser` |

**Auto-fix:** Rename the fixture key and update all references in spec files.

---

## Violation Output Format

```
[api-setup-teardown-standard] SEVERITY — RULE_NAME
File:  <relative path from project root>
Line:  <line number>
Issue: <one sentence describing the problem>
Fix:   <one sentence describing the fix> | AUTO-APPLIED | MANUAL-FIX
```

**Examples:**
```
[api-setup-teardown-standard] ERROR — API_CLIENT_IS_ONLY_HTTP_ENTRY_POINT
File:  src/api/controllers/BookController.ts
Line:  12
Issue: Controller calls request.get() directly instead of delegating to ApiClient.
Fix:   Replace with this.client.get<Book[]>(BooksEndpoints.base). | AUTO-APPLIED

[api-setup-teardown-standard] ERROR — TEARDOWN_MIRRORS_SETUP
File:  src/fixtures/index.ts
Line:  34
Issue: 'createdBook' fixture creates a book via API but has no teardown after use().
Fix:   Add await controller.delete(book.bookId) after the use() call. | MANUAL-FIX

[api-setup-teardown-standard] ERROR — ENDPOINTS_CENTRALIZED
File:  src/api/controllers/BookController.ts
Line:  8
Issue: Hardcoded URL '/api/v1/Books' found — endpoint constants must be used instead.
Fix:   Replace with BooksEndpoints.base from @api/endpoints/books.endpoints. | AUTO-APPLIED

[api-setup-teardown-standard] ERROR — NO_LIFECYCLE_INSTANTIATION_IN_SPEC
File:  tests/ui/smoke/books/TC10-add-book.spec.ts
Line:  8
Issue: Spec instantiates BookController directly inside the test body.
Fix:   Extract to a 'createdBook' fixture in src/fixtures/index.ts and inject it as a parameter. | AUTO-APPLIED

[api-setup-teardown-standard] WARNING — LIFECYCLE_FIXTURE_NAMING_CONVENTION
File:  src/fixtures/index.ts
Line:  41
Issue: Fixture 'newBook' creates data with teardown but does not follow the 'created<Resource>' naming pattern.
Fix:   Rename to 'createdBook' and update all references in spec files. | AUTO-APPLIED
```

---

## Scan Scope

| File glob | Rules applied |
|-----------|---------------|
| `src/api/client/**/*.ts` | R1, R11 (only HTTP entry point + status checking) |
| `src/api/controllers/**/*.ts` | R1, R2, R3, R6 |
| `src/api/endpoints/**/*.ts` | R6 |
| `src/api/models/**/*.ts` | R6 |
| `src/api/mocks/**/*.ts` | R2, R5, R6 |
| `src/fixtures/index.ts` | R4, R8, R10 |
| `tests/**/*.spec.ts` | R7 |

---

## Canonical Implementation Examples

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
    return response.json() as Promise<T>;
  }

  async delete(url: string): Promise<void> {
    await this.request.delete(url);
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

```typescript
// src/fixtures/index.ts — fixture wiring pattern

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



