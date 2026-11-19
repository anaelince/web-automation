import { test as base, expect } from '@fixtures';

import { HomePage } from '@pages/sites/automationexercise/HomePage';
import { ENV } from '@config/env';

// Re-export expect so automationexercise specs import from this file only
export { expect };

type AutomationExerciseFixtures = {
  /** Navigates to / and hands off the HomePage instance. */
  homePage: HomePage;
};

export const test = base.extend<AutomationExerciseFixtures>({
  // Every navigate() in automationexercise specs resolves against the AutomationExercise URL.
  baseURL: async ({}, use) => {
    await use(ENV.siteUrls.automationexercise);
  },

  homePage: async ({ page }, use) => {
    const po = new HomePage(page);
    await po.navigate('/');
    await use(po);
  },
});
