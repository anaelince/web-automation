import { test as base, expect } from '@fixtures';

import { LoginPage } from '@pages/sites/saucedemo/LoginPage';
import { InventoryPage } from '@pages/sites/saucedemo/InventoryPage';
import { users } from '@data/sites/saucedemo/auth.data';
import { ENV } from '@config/env';

// Re-export expect so saucedemo specs import from this file only
export { expect };

type SauceDemoFixtures = {
  loginPage: LoginPage;
  /** Logs in as the app user and hands off the LoginPage instance. */
  authenticatedPage: LoginPage;
  /** Wraps the post-login page as an InventoryPage (requires authenticatedPage). */
  inventoryPage: InventoryPage;
};

export const test = base.extend<SauceDemoFixtures>({
  // Every navigate() in saucedemo specs resolves against the SauceDemo URL.
  baseURL: async ({}, use) => {
    await use(ENV.siteUrls.saucedemo);
  },

  loginPage: async ({ page }, use) => {
    const po = new LoginPage(page);
    await po.navigate();
    await use(po);
  },

  authenticatedPage: async ({ page }, use) => {
    const lp = new LoginPage(page);
    await lp.navigate();
    await lp.login(users.appUser.username, users.appUser.password);
    await use(lp);
  },

  inventoryPage: async ({ authenticatedPage }, use) => {
    const po = new InventoryPage(authenticatedPage.currentPage);
    await use(po);
  },
});
