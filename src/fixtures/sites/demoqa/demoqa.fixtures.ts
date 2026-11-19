import { test as base, expect } from '@fixtures';

// ── demoqa UI POs ─────────────────────────────────────────────────────────
import { BookStoreLoginPage } from '@pages/sites/demoqa/BookStoreLoginPage';
import { BookStorePage } from '@pages/sites/demoqa/BookStorePage';
import { BookDetailPage } from '@pages/sites/demoqa/BookDetailPage';
import { ProfilePage } from '@pages/sites/demoqa/ProfilePage';

// ── demoqa API layer ──────────────────────────────────────────────────────
import { ApiClient } from '@api/sites/demoqa/client/ApiClient';
import { AccountController } from '@api/sites/demoqa/controllers/AccountController';
import { BookController } from '@api/sites/demoqa/controllers/BookController';

// ── demoqa test data ──────────────────────────────────────────────────────
import { bookStoreUsers } from '@data/sites/demoqa/auth.data';
import { buildBookStoreUser, BookStoreTestUser } from '@data/sites/demoqa/user.factory';

import { ENV } from '@config/env';

/** A worker-owned Book Store identity (credentials + demoqa userId). */
export type BookStoreWorkerUser = BookStoreTestUser & { userId: string };

// Re-export expect so demoqa specs import from this file only
export { expect };

type DemoqaFixtures = {
  // ── Book Store UI ──────────────────────────────────────────────────────
  /** Hands off a BookStoreLoginPage instance (no navigation). */
  bookStoreLoginPage: BookStoreLoginPage;
  /** Logs in as the app user and hands off the page (authenticated, on /profile). */
  authenticatedBookStoreUser: BookStoreLoginPage;
  /** Navigates to /books and hands off the BookStorePage instance. */
  bookStorePage: BookStorePage;
  /** Wraps the current page as a BookDetailPage (no navigation — user clicks there from bookStorePage). */
  bookDetailPage: BookDetailPage;
  /** Wraps the current page as a ProfilePage (call po.navigate('/profile') in the spec). */
  profilePage: ProfilePage;

  // ── Book Store API ─────────────────────────────────────────────────────
  /**
   * Unauthenticated BookController for public catalog reads (discovery of expected values).
   * No token, no teardown — cleanBookshelf is the only token owner in a test.
   */
  bookController: BookController;
  /**
   * BookController for the worker's user with setup AND teardown.
   * Setup: empties workerUser's collection. Teardown: regenerates the token (the UI login
   * invalidates it) and empties the collection again. Scope: only data owned by workerUser.
   */
  cleanBookshelf: BookController;
};

type DemoqaWorkerFixtures = {
  /**
   * Book Store user created via API once per worker and deleted when the worker ends.
   * Unique and prefixed (qa_) — no two workers ever share an identity (spec-data-standard R1).
   */
  workerUser: BookStoreWorkerUser;
};

// No baseURL override: demoqa is the primary site, so it uses the config default (BASE_URL).
// Overriding it here with the same value made TC02 flaky (1/3 vs 8/8 without) — keep it out.
export const test = base.extend<DemoqaFixtures, DemoqaWorkerFixtures>({
  // ── Book Store UI fixtures ──────────────────────────────────────────────

  bookStoreLoginPage: async ({ page }, use) => {
    const po = new BookStoreLoginPage(page);
    // No navigation — login page is reached by clicking the sidebar link from /books.
    await use(po);
  },

  authenticatedBookStoreUser: async ({ page }, use) => {
    const lp = new BookStoreLoginPage(page);
    await lp.navigate('/login');
    await lp.login(bookStoreUsers.appUser.username, bookStoreUsers.appUser.password);
    await use(lp);
  },

  // No auth prerequisite — the spec handles login as explicit test steps.
  bookStorePage: async ({ page }, use) => {
    const po = new BookStorePage(page);
    await po.navigate('/books');
    await use(po);
  },

  // No navigation — detail page is reached by clicking a book title.
  bookDetailPage: async ({ page }, use) => {
    const po = new BookDetailPage(page);
    await use(po);
  },

  // No navigation — the spec calls profilePage.navigate('/profile') explicitly.
  profilePage: async ({ page }, use) => {
    const po = new ProfilePage(page);
    await use(po);
  },

  // ── Book Store API fixtures ─────────────────────────────────────────────

  // Worker-scoped identity: created once per worker via API, deleted after the worker's last test.
  workerUser: [
    async ({ playwright }, use, workerInfo) => {
      const request = await playwright.request.newContext({
        baseURL: ENV.baseUrl,
        ignoreHTTPSErrors: true,
      });
      const client = new ApiClient(request);
      const accountCtrl = new AccountController(client);

      const user = buildBookStoreUser(workerInfo.parallelIndex);
      const userId = await accountCtrl.createUser(user.username, user.password);

      await use({ ...user, userId });

      // Teardown: the token must belong to this user; generate a fresh one.
      client.setAuthToken(await accountCtrl.generateToken(user.username, user.password));
      await accountCtrl.deleteUser(userId);
      await request.dispose();
    },
    { scope: 'worker' },
  ],

  // Setup-only: BookController for public catalog reads (discovery). No auth, no teardown.
  // It must NOT generate a token: demoqa keeps one active token per user, so a second
  // token generated in the same test invalidates cleanBookshelf's token (spec-data-standard R15).
  bookController: async ({ request }, use) => {
    await use(new BookController(new ApiClient(request)));
  },

  // Setup + teardown scoped to the worker's own user (spec-data-standard R1, R12).
  //
  // Setup  (before use): empties workerUser's collection (a previous test in the same worker
  //                      may have left books if it failed before teardown).
  // Teardown (after use): regenerates the token — the UI login in the test body invalidates
  //                      the setup token (single-active-token) — then empties the collection.
  cleanBookshelf: async ({ request, workerUser }, use) => {
    const client = new ApiClient(request);
    const accountCtrl = new AccountController(client);
    client.setAuthToken(await accountCtrl.generateToken(workerUser.username, workerUser.password));
    const bookCtrl = new BookController(client);

    const existingBooks = await accountCtrl.getUserBooks(workerUser.userId);
    if (existingBooks.length > 0) {
      await bookCtrl.deleteAllBooks(workerUser.userId);
    }

    await use(bookCtrl);

    client.setAuthToken(await accountCtrl.generateToken(workerUser.username, workerUser.password));
    await bookCtrl.deleteAllBooks(workerUser.userId);
  },
});
