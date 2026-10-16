import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await page.locator('[data-test="username"]').click();
  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').click();
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="password"]').press('Enter');
  await page.locator('[data-test="inventory-container"]').click();
  await expect(page.locator('[data-test="inventory-container"]')).toBeVisible();
  await expect(page.locator('[data-test="secondary-header"]')).toContainText('ProductsName (A to Z)Name (A to Z)Name (Z to A)Price (low to high)Price (high to low)');
  await expect(page.getByText('Swag Labs')).toBeVisible();
});
