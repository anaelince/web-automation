import { test as base, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { InventoryPage } from '@pages/InventoryPage';
import { users } from '@data/auth.data';

// Re-export expect so all spec files import from '@fixtures' only
export { expect };

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  authenticatedPage: LoginPage;
};

export const test = base.extend<Fixtures>({
  // Unauthenticated — navigates to the login page, then hands off
  loginPage: async ({ page }, use) => {
    const po = new LoginPage(page);
    await po.navigate();
    await use(po);
  },

  // Authenticated — logs in, then hands off the LoginPage instance
  // Playwright destroys the browser context after each test — no logout needed
  authenticatedPage: async ({ page }, use) => {
    const lp = new LoginPage(page);
    await lp.navigate();
    await lp.login(users.appUser.username, users.appUser.password);
    await use(lp);
  },

  // Inventory page — requires an authenticated session
  inventoryPage: async ({ authenticatedPage }, use) => {
    const po = new InventoryPage(authenticatedPage.currentPage);
    await use(po);
  },
});
