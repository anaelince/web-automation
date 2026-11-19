# Book Store — CRUD Test Cases

**Site:** https://demoqa.com/books  
**Entity under test:** User book collection (profile shelf)

---

## Prerequisites

- A registered user account exists with known credentials.
- The user is logged in before any test that requires authentication (unless the TC is testing an unauthenticated flow).
- The test user's collection is empty at the start of each test (clean state), unless the TC explicitly requires existing data.

---

## CREATE

---

### TC01: Register a new user account

**Steps:**

1. Navigate to `https://demoqa.com/register`.
2. Assert the "Register to Book Store" form is visible with fields: First Name, Last Name, Username, Password, and the CAPTCHA widget.
3. Enter a valid first name (e.g., `John`).
4. Enter a valid last name (e.g., `Doe`).
5. Enter a unique username (e.g., `johndoe_auto01`).
6. Enter a valid password that meets the strength requirements (e.g., `Test@12345!`).
7. Complete the CAPTCHA verification manually or via automation workaround.
8. Click the **Register** button.
9. Assert a success alert with the text `"User Register Successfully."` appears.
10. Dismiss the alert.
11. Assert the page redirects to `https://demoqa.com/login`.

---

### TC02: Add a book to the user's collection

| Field | Value |
|-------|-------|
| Requirement / AC | REQ-BS-02 · AC1: an authenticated user can add a catalog book to their collection, and the book appears in their profile |
| Objective | Verify that adding a book from its detail page persists it in the user's collection, the core value of the Book Store for a logged-in user |
| Priority | High |
| Suite | smoke |
| Type | positive |
| Tags | `@smoke` · `@mutates-data` |
| Automation | Automatable — UI flow; identity and collection state provisioned via API |

**Preconditions**

| # | State | Provisioned by | Scope |
|---|-------|----------------|-------|
| P1 | User `{user}` exists and is not logged in | API — `workerUser` fixture (POST /Account/v1/User) | worker |
| P2 | `{user}` has an empty collection | API — `cleanBookshelf` fixture | test |

**Test data**

| Item | Value or generation rule | Class | Source |
|------|--------------------------|-------|--------|
| `{user}.username` | `qa_` + parallel index + timestamp + random suffix | Transactional | factory |
| `{user}.password` | Generated; meets the demoqa password policy | Transactional | factory |
| `{book}` | First entry of GET /BookStore/v1/Books (`title`, `author`) | Reference | discovery |
| Alert text | `Book added to your collection.` | Reference | dataset (product message) |

**Steps**

| # | Action | Expected result (oracle) |
|---|--------|--------------------------|
| 1 | Open `/books` | Heading `Book Store` is visible · first row title = `{book.title}` |
| 2 | Click **Login** in the sidebar | Login form is visible |
| 3 | Log in as `{user}` | URL is `/profile` · username value = `{user.username}` |
| 4 | Open `/books` | First row title = `{book.title}` |
| 5 | Click the `{book.title}` link | Detail page Title value = `{book.title}` · **Add To Your Collection** is enabled |
| 6 | Click **Add To Your Collection** and accept the alert | Alert text = `Book added to your collection.` |
| 7 | Open `/profile` | Exactly 1 row with title `{book.title}` · that row contains `{book.author}` |

**Postconditions**

| State after the test | Cleanup | Scope |
|----------------------|---------|-------|
| `{user}` collection is empty | `cleanBookshelf` teardown deletes the books of `{user}` (token regenerated) | only `{user}`, owned by this worker |
| `{user}` no longer exists after the worker ends | `workerUser` teardown (DELETE /Account/v1/User) | worker |

**Risks / notes** — demoqa allows one active token per user: the UI login in step 3 invalidates
the API token, so teardown must regenerate it. A shared user across workers causes login
collisions and 401 errors (see `docs/course/evidence/m6/data-m5-baseline.txt`).

**Change log (spec-requirements-standard M2, 2026-11-18)**
- Q1 — Added requirement/AC, priority, suite, type, tags, automation decision
- Q2 — Added objective
- Q3 — Preconditions state the provisioning method and scope (worker identity, clean collection)
- Q4 — Credentials and book are declared data items with class and source; no "e.g."
- Q5 — One action per step, each with its oracle (login no longer without result)
- Q6 — "at least one entry" / "visible and non-empty" replaced by exact `{book.title}` / `{book.author}`
- Q9 — Postconditions with scoped cleanup added
- Q11 — Absolute URLs replaced by relative paths
- Q12 — Automation decision stated
- Q13 — Lost step 1 restored; "title added in step 3" replaced by the captured value `{book.title}`

**Automation handoff (M4)**

```yaml
tc: TC02
title: Add a book to the user's collection
suite: smoke
tags: ['@smoke', '@mutates-data']
automation: automatable
fixtures:
  identity: workerUser          # worker-scoped identity (spec-data-standard M1)
  state: cleanBookshelf         # empty collection before, scoped cleanup after
  discovery: bookController     # catalog read for the expected book
data:
  - name: user
    class: transactional
    source: factory             # qa_ prefix, unique per worker
  - name: book
    class: reference
    source: discovery           # bookController.getAll()[0]
captured: []
steps:
  - action: open /books
    oracle: heading "Book Store" visible; first row title = book.title
  - action: click Login
    oracle: login form visible
  - action: login as user
    oracle: url /profile; username value = user.username
  - action: open /books
    oracle: first row title = book.title
  - action: click book.title
    oracle: detail title = book.title; add button enabled
  - action: add to collection, accept alert
    oracle: alert text = "Book added to your collection."
  - action: open /profile
    oracle: exactly 1 row with book.title; row contains book.author
postconditions:
  - collection of user emptied by cleanBookshelf (owned identity)
  - user deleted by workerUser teardown
```

---

## READ

---

### TC03: Browse all available books in the catalog

**Steps:**

1. Navigate to `https://demoqa.com/books`.
2. Assert the page header `"Book Store"` is visible.
3. Assert the search input field is visible and empty.
4. Assert the books list is rendered with at least one book row.
5. For the first book row, assert all of the following are visible and non-empty:
   - Book cover image.
   - Book title link.
   - Author name.
   - Publisher name.
6. Assert the total number of displayed book rows is greater than zero.

---

### TC04: Search for a book by title

**Prerequisite:** Book Store catalog page is open.

**Steps:**

1. Navigate to `https://demoqa.com/books`.
2. Assert the search input is visible.
3. Type `Git` in the search input field.
4. Assert the book list updates to show only books whose title or author contains `"Git"`.
5. Assert no books unrelated to the search term are shown.
6. Clear the search input field (delete all text).
7. Assert the full catalog is restored and shows all books.

---

### TC05: View a book's detail page

**Steps:**

1. Navigate to `https://demoqa.com/books`.
2. Click on the title of any book in the catalog.
3. Assert the URL changes to `https://demoqa.com/books?book=<isbn>`.
4. Assert the following fields are visible and non-empty on the detail page:
   - Book cover image.
   - **Title**.
   - **Sub Title**.
   - **Author**.
   - **Publisher**.
   - **Total Pages** (numeric value > 0).
   - **Website** (clickable link).
   - **ISBN**.
5. Assert the **"Add To Your Collection"** button (or a login prompt for unauthenticated users) is present.
6. Assert the **"Back To Book Store"** link is visible.
7. Click **"Back To Book Store"**.
8. Assert the catalog page (`https://demoqa.com/books`) is displayed again.

---

### TC06: View the user's book collection in the profile

**Prerequisite:** User is logged in and has at least one book in their collection.

**Steps:**

1. Navigate to `https://demoqa.com/profile`.
2. Assert the profile page is displayed.
3. Assert the **UserName** label and the logged-in username value are visible.
4. Assert the **User ID** label and a non-empty UUID value are visible.
5. Assert the books table is present and contains the expected columns: image, title, author, publisher, action.
6. Assert at least one book row is visible in the table.
7. For the first book row, assert title, author, and publisher cells are non-empty.
8. Assert the **"Delete Account"** button is visible.

---

## UPDATE

> **Note:** The demoqa Book Store UI does not provide an "edit book" form. The Update scenario is modelled as replacing a book in the collection: deleting an existing entry and adding a different one, resulting in a net-zero collection size change.

---

### TC07: Replace a book in the user's collection

**Prerequisite:** User is logged in and has exactly one book (Book A) in their collection.

**Steps:**

1. Navigate to `https://demoqa.com/profile`.
2. Assert the books table shows exactly one book row; note its title as `Book A`.
3. Click the **delete icon** (trash icon) in the Action column for `Book A`.
4. Assert a confirmation dialog appears with an **OK** button.
5. Click **OK** to confirm deletion.
6. Assert the dialog closes.
7. Assert `Book A` no longer appears in the books table.
8. Assert the table shows zero book rows.
9. Navigate to `https://demoqa.com/books`.
10. Click on a different book title (`Book B`, different from Book A) in the catalog.
11. Assert the detail page for `Book B` is displayed.
12. Click **"Add To Your Collection"**.
13. Assert the confirmation alert `"Book added to your collection."` appears and accept it.
14. Navigate to `https://demoqa.com/profile`.
15. Assert `Book B` is visible in the books table.
16. Assert `Book A` is no longer present in the books table.
17. Assert the books table contains exactly one row (net-zero change confirmed).

---

## DELETE

---

### TC08: Delete a specific book from the user's collection

**Prerequisite:** User is logged in and has at least two books in their collection.

**Steps:**

1. Navigate to `https://demoqa.com/profile`.
2. Assert the books table contains at least two book rows.
3. Note the title of the first book as `Book A` and count the total rows as `N`.
4. Click the **delete icon** in the Action column for `Book A`.
5. Assert a confirmation dialog appears.
6. Assert the dialog contains an **OK** button and a **Cancel** button.
7. Click **OK**.
8. Assert the dialog closes.
9. Assert `Book A` no longer appears in the books table.
10. Assert the books table now contains `N - 1` rows.
11. Assert all remaining books (i.e., books other than Book A) are still present and unchanged.

---

### TC09: Delete all books from the user's collection

**Prerequisite:** User is logged in and has at least two books in their collection.

**Steps:**

1. Navigate to `https://demoqa.com/profile`.
2. Assert the books table contains at least two book rows.
3. Assert the **"Delete All Books"** button is visible and enabled.
4. Click **"Delete All Books"**.
5. Assert a confirmation dialog appears.
6. Click **OK** to confirm.
7. Assert the dialog closes.
8. Assert the books table is now empty (zero book rows visible).
9. Navigate away from the profile page (e.g., to `https://demoqa.com/books`).
10. Navigate back to `https://demoqa.com/profile`.
11. Assert the books table remains empty after the page reload.
12. Assert the **"Delete All Books"** button is no longer visible or is disabled when the collection is empty.

---

### TC10: Delete the user account

**Prerequisite:** User is logged in.

**Steps:**

1. Navigate to `https://demoqa.com/profile`.
2. Assert the profile page is displayed with the correct username.
3. Assert the **"Delete Account"** button is visible and enabled.
4. Click **"Delete Account"**.
5. Assert a confirmation dialog appears asking to confirm account deletion.
6. Click **OK** to confirm.
7. Assert the dialog closes.
8. Assert the user is logged out and redirected to the login page (`https://demoqa.com/login`).
9. Attempt to log in using the deleted account's credentials.
10. Assert a login error message is displayed (e.g., `"Invalid username or password!"`).
11. Assert the user is **not** redirected to the profile or any authenticated page.
