import { test, expect } from '@fixtures';

test.describe('Login', () => {
  test('TC0: Valid login redirects to inventory page', async ({ inventoryPage }) => {
    await test.step('Verify inventory page is displayed after login', async () => {
      await expect(inventoryPage.inventoryContainer).toBeVisible();
      await expect(inventoryPage.secondaryHeader).toContainText('Products');
      await expect(inventoryPage.swagLabsLogo).toBeVisible();
    });
  });
});
