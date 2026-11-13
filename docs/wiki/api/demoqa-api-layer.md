# API Layer — `src/api/sites/demoqa/`

> Built and enforced by the **`api-setup-teardown-standard`** skill (R1–R11).  
> Path alias: `@api/sites/demoqa/*` → `src/api/sites/demoqa/*`

---

## Architecture Overview

```
src/api/sites/demoqa/
  client/
    ApiClient.ts              ← sole HTTP entry point (R1)
  endpoints/
    account.endpoints.ts      ← Account API URL constants
    books.endpoints.ts        ← BookStore API URL constants
  models/
    account.model.ts          ← Account request/response interfaces
    book.model.ts             ← BookStore request/response interfaces
  controllers/
    AccountController.ts      ← authentication + user operations
    BookController.ts         ← book catalog + collection operations
```

---

## `client/ApiClient.ts`

**Role:** The **only** file allowed to call Playwright's `request.*` methods directly.
All other layers delegate HTTP calls to this class (enforced by **R1**).

**Responsibilities:**
- Wraps `APIRequestContext` from `@playwright/test`
- Manages the Bearer token: `setAuthToken(token)` stores it and `buildHeaders()` injects it as `Authorization: Bearer {token}` on every request
- Surfaces HTTP failures: `delete()` checks `response.ok()` and throws with status + body on non-2xx (enforced by **R11**)

**Public API:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `setAuthToken` | `(token: string): void` | Stores the Bearer token for all subsequent requests |
| `get` | `<T>(url: string): Promise<T>` | GET request — returns parsed JSON as `T` |
| `post` | `<T>(url: string, data: unknown): Promise<T>` | POST request with JSON body — returns parsed JSON as `T` |
| `delete` | `(url, options?): Promise<void>` | DELETE — supports optional body (`data`) and query params (`params`); throws on non-2xx |

**Key design decisions:**
- Bearer token is set lazily — `setAuthToken()` is called after `AccountController.generateToken()` resolves, not at construction time
- `delete()` accepts both a request body (used by `DELETE /BookStore/v1/Book`) and query params (used by `DELETE /BookStore/v1/Books?UserId=`)

---

## `endpoints/`

URL constants only — no HTTP logic, no imports from `client/` (enforced by **R2**, **R6**).

### `account.endpoints.ts`

| Constant | Value | Used by |
|----------|-------|---------|
| `AccountEndpoints.generateToken` | `'/Account/v1/GenerateToken'` | `AccountController.generateToken()` |
| `AccountEndpoints.user(userId)` | `` `/Account/v1/User/${userId}` `` | `AccountController.getUserBooks()` |

### `books.endpoints.ts`

| Constant | Value | Used by |
|----------|-------|---------|
| `BooksEndpoints.books` | `'/BookStore/v1/Books'` | `BookController.getAll()`, `addBooks()`, `deleteAllBooks()` |
| `BooksEndpoints.book` | `'/BookStore/v1/Book'` | `BookController.deleteBook()` |

---

## `models/`

TypeScript interfaces only — no classes, no business logic (enforced by **R6**).

### `account.model.ts`

| Interface | Purpose |
|-----------|---------|
| `GenerateTokenPayload` | Request body for `POST /Account/v1/GenerateToken` — `{ userName, password }` |
| `TokenResponse` | Response from token endpoint — `{ token, expires, status, result }` |
| `UserResponse` | Response from `GET /Account/v1/User/{id}` — `{ userId, username, books[] }` |

### `book.model.ts`

| Interface | Purpose |
|-----------|---------|
| `Book` | Full book record — `{ isbn, title, subTitle, author, publisher, pages, … }` |
| `BooksResponse` | Catalog response — `{ books: Book[] }` |
| `AddBooksPayload` | Request body for adding books — `{ userId, collectionOfIsbns: [{isbn}] }` |
| `DeleteBookPayload` | Request body for single-book delete — `{ isbn, userId }` |

---

## `controllers/`

Business-level operations. Each controller receives `ApiClient` only — never
`APIRequestContext` directly (enforced by **R3**).

### `AccountController.ts`

Covers authentication and user-profile operations against demoqa's Account API.

| Method | Endpoint | Auth required | Returns |
|--------|----------|--------------|---------|
| `generateToken(userName, password)` | `POST /Account/v1/GenerateToken` | No | `string` (Bearer token) |
| `getUserBooks(userId)` | `GET /Account/v1/User/{userId}` | Yes | `Array<{ isbn }>` |

**Usage pattern in fixtures:**
```typescript
const accountCtrl = new AccountController(client);
const token = await accountCtrl.generateToken(username, password);
client.setAuthToken(token);
const existing = await accountCtrl.getUserBooks(userId);
```

### `BookController.ts`

Covers all BookStore CRUD operations against demoqa's BookStore API.

| Method | Endpoint | Auth required | Description |
|--------|----------|--------------|-------------|
| `getAll()` | `GET /BookStore/v1/Books` | No | Returns the full public book catalog |
| `addBooks(payload)` | `POST /BookStore/v1/Books` | Yes | Adds one or more books to user collection |
| `deleteBook(isbn, userId)` | `DELETE /BookStore/v1/Book` (body) | Yes | Removes a single book by ISBN |
| `deleteAllBooks(userId)` | `DELETE /BookStore/v1/Books?UserId=` | Yes | Removes the entire collection |

---

## Fixture Integration (`src/fixtures/index.ts`)

### `bookController` — setup-only (no teardown)

Provides an authenticated `BookController` for read operations during tests. Generates a
token at setup and injects the controller; no cleanup is performed after the test.

### `cleanBookshelf` — setup + teardown (implements R4 + R10)

Implements the **API + UI Hybrid Fixture** pattern to guarantee a clean shelf state both
before and after a test that also performs a UI login.

```
SETUP (before test body)
  generateToken()           → setup token (token A)
  getUserBooks(userId)      → check current collection
  if books > 0:
    deleteAllBooks(userId)  → remove residual data from previous failed run

  ── TEST BODY ─────────────────────────────────────────────────────────────
  UI login                  → demoqa issues token B, invalidates token A

TEARDOWN (after test body — always runs, even on test failure)
  generateToken()           → fresh teardown token (token B)   ← R10 mandatory
  client.setAuthToken(token B)
  deleteAllBooks(userId)    → remove data added during this test
```

> **Why token refresh is mandatory (R10):** demoqa enforces a single-active-token
> constraint. When the UI login succeeds, the server issues a new token for the browser
> session and immediately invalidates all previously issued tokens. Using token A in
> teardown returns `401 Unauthorized`. A fresh call to `generateToken()` in teardown
> ensures the cleanup call is authorised.

---

## Rules Reference

| ID | Name | Covers | Severity | Fix |
|----|------|--------|----------|-----|
| R1 | API_CLIENT_IS_ONLY_HTTP_ENTRY_POINT | Only `ApiClient` may call `request.*` | ERROR | AUTO |
| R2 | ENDPOINTS_CENTRALIZED | No hardcoded URL strings outside `endpoints/` | ERROR | AUTO |
| R3 | CONTROLLER_DEPENDENCY_CONTRACT | Controllers receive `ApiClient`, not `APIRequestContext` | ERROR | AUTO |
| R4 | TEARDOWN_MIRRORS_SETUP | Every setup call has a matching teardown call | ERROR | MANUAL |
| R5 | MOCKS_USE_CENTRALIZED_ENDPOINTS | Mocks use endpoint constants, not hardcoded strings | ERROR | AUTO |
| R6 | CORRECT_FOLDER_PLACEMENT | Files live in the correct `src/api/` subfolder | ERROR | AUTO |
| R7 | NO_LIFECYCLE_INSTANTIATION_IN_SPEC | Specs never instantiate `ApiClient` or controllers | ERROR | AUTO |
| R8 | LIFECYCLE_FIXTURE_NAMING_CONVENTION | `<resource>Controller` / `created<R>` / `clean<R>` / `mock<R>` | WARNING | AUTO |
| R10 | TOKEN_REFRESH_IN_TEARDOWN | Fixtures covering UI-login tests must regenerate the API token in teardown | WARNING | MANUAL |
| R11 | API_CLIENT_STATUS_CHECKED | Every `ApiClient` method checks `response.ok()` and throws on non-2xx | ERROR | AUTO |

