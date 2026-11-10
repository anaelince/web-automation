import { test, expect } from '@fixtures';

test.describe('Products', () => {
  /**
   * TC9: Search Product
   *
   * Steps:
   * 1. Navigate to home page and verify it loaded
   * 2. Click Products nav link and verify All Products page
   * 3. Enter product name in search input and submit
   * 4. Verify 'Searched Products' section and results are visible
   */
  test('TC9: Search Product', async ({ homePage }) => {
    await test.step('Verify home page is loaded', async () => {
      await expect(homePage.homePageIndicator).toBeVisible();
    });

    const productsPage = await test.step('Navigate to All Products page', async () => {
      const page = await homePage.clickProducts();
      await expect(page.allProductsHeading).toBeVisible();
      return page;
    });

    await test.step('Search for product and verify results', async () => {
      await productsPage.searchFor('summer white top');
      await expect(productsPage.searchedProductsHeading).toBeVisible();
      await expect(productsPage.productCards.first()).toBeVisible();
    });
  });
});
