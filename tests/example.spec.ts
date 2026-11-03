import { test, expect } from '@fixtures';

test.describe('Login', () => {
  test('redirects to inventory page after valid login', async ({ inventoryPage }) => {
    await expect(inventoryPage.inventoryContainer).toBeVisible();
    await expect(inventoryPage.secondaryHeader).toContainText('Products');
    await expect(inventoryPage.swagLabsLogo).toBeVisible();
  });
});
