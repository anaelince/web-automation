import { test as base, expect } from '@playwright/test';

// ── SauceDemo UI POs ──────────────────────────────────────────────────────
import { LoginPage } from '@pages/sites/saucedemo/LoginPage';
import { InventoryPage } from '@pages/sites/saucedemo/InventoryPage';

// ── AutomationExercise UI POs ─────────────────────────────────────────────
import { HomePage } from '@pages/sites/automationexercise/HomePage';

// ── demoqa UI POs ─────────────────────────────────────────────────────────
import { BookStoreLoginPage } from '@pages/sites/demoqa/BookStoreLoginPage';
import { BookStorePage } from '@pages/sites/demoqa/BookStorePage';
import { BookDetailPage } from '@pages/sites/demoqa/BookDetailPage';
import { ProfilePage } from '@pages/sites/demoqa/ProfilePage';

// ── demoqa API layer ──────────────────────────────────────────────────────
import { ApiClient } from '@api/sites/demoqa/client/ApiClient';
import { AccountController } from '@api/sites/demoqa/controllers/AccountController';
import { BookController } from '@api/sites/demoqa/controllers/BookController';

// ── Site-specific test data ───────────────────────────────────────────────
import { users as sauceUsers } from '@data/sites/saucedemo/auth.data';
import { bookStoreUsers } from '@data/sites/demoqa/auth.data';

import { ENV } from '@config/env';

// Re-export expect so all spec files import from '@fixtures' only
export { expect };

type Fixtures = {
  // ── SauceDemo ──────────────────────────────────────────────────────────
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  authenticatedPage: LoginPage;
  homePage: HomePage;

  // ── Book Store UI ──────────────────────────────────────────────────────
  /** Navigates to /login and hands off the BookStoreLoginPage instance. */
  bookStoreLoginPage: BookStoreLoginPage;
  /** Logs in as the app user and hands off the page (authenticated, on /profile). */
  authenticatedBookStoreUser: BookStoreLoginPage;
  /** Navigates to /books (requires authenticatedBookStoreUser). */
  bookStorePage: BookStorePage;
  /** Wraps the current page as a BookDetailPage (no navigation — user clicks there from bookStorePage). */
  bookDetailPage: BookDetailPage;
  /** Wraps the current page as a ProfilePage (call po.navigate('/profile') in the spec). */
  profilePage: ProfilePage;

  // ── Book Store API ─────────────────────────────────────────────────────
  /**
   * Authenticated BookController — use for read operations and API access during tests.
   * No teardown: the controller is provided as-is.
   */
  bookController: BookController;
  /**
   * Authenticated BookController with teardown.
   * After `use()`, calls deleteAllBooks() to restore a clean shelf state.
   * Inject this in any test that adds books (via UI or API) and needs post-test cleanup.
   */
  cleanBookshelf: BookController;
};

export const test = base.extend<Fixtures>({
  // ── SauceDemo fixtures ──────────────────────────────────────────────────

  loginPage: async ({ page }, use) => {
    const po = new LoginPage(page);
    await po.navigate();
    await use(po);
  },

  authenticatedPage: async ({ page }, use) => {
    const lp = new LoginPage(page);
    await lp.navigate();
    await lp.login(sauceUsers.appUser.username, sauceUsers.appUser.password);
    await use(lp);
  },

  inventoryPage: async ({ authenticatedPage }, use) => {
    const po = new InventoryPage(authenticatedPage.currentPage);
    await use(po);
  },

  homePage: async ({ page }, use) => {
    const po = new HomePage(page);
    await po.navigate('/');
    await use(po);
  },

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

  // Setup-only: provides an authenticated BookController, no teardown.
  bookController: async ({ request }, use) => {
    const client = new ApiClient(request);
    const accountController = new AccountController(client);
    const token = await accountController.generateToken(
      bookStoreUsers.appUser.username,
      bookStoreUsers.appUser.password,
    );
    client.setAuthToken(token);
    const controller = new BookController(client);
    await use(controller);
  },

  // Self-contained fixture with pre-test setup AND post-test teardown.
  //
  // Setup  (before use): checks if the user already has books from a previous run →
  //                      deletes them so the test always starts with a clean shelf.
  // Teardown (after use): deletes all books added during the test.
  //
  // Using `request` directly (not `bookController`) keeps auth and check logic together.
  cleanBookshelf: async ({ request }, use) => {
    if (!ENV.testUser.id) {
      throw new Error(
        '[cleanBookshelf] ENV.testUser.id is empty. ' +
        'Set TEST_USER_ID=<your-demoqa-UUID> in .env — find it on https://demoqa.com/profile.',
      );
    }

    // ── Build authenticated client ──────────────────────────────────────
    const client = new ApiClient(request);
    const accountCtrl = new AccountController(client);
    const token = await accountCtrl.generateToken(
      bookStoreUsers.appUser.username,
      bookStoreUsers.appUser.password,
    );
    client.setAuthToken(token);
    const bookCtrl = new BookController(client);

    // ── Setup: clean any books left from a previous run ─────────────────
    const existingBooks = await accountCtrl.getUserBooks(ENV.testUser.id);
    if (existingBooks.length > 0) {
      await bookCtrl.deleteAllBooks(ENV.testUser.id);
    }

    await use(bookCtrl);

    // ── Teardown: regenerate token before deleting ───────────────────────
    // The test body performs a UI login which causes demoqa to issue a new token
    // for the session, invalidating the token generated during setup.
    // A fresh API token must be obtained here before calling deleteAllBooks.
    const teardownToken = await accountCtrl.generateToken(
      bookStoreUsers.appUser.username,
      bookStoreUsers.appUser.password,
    );
    client.setAuthToken(teardownToken);
    await bookCtrl.deleteAllBooks(ENV.testUser.id);
  },
});
