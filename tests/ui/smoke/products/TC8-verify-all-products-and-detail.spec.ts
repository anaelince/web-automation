import { test, expect } from '@fixtures';

test.describe('Products', () => {
  /**
   * TC8: Verify All Products and product detail page
   *
   * Steps:
   * 1. Navigate to home page and verify it loaded
   * 2. Click Products nav link and verify All Products page
   * 3. Open the first product's detail page
   * 4. Verify all required detail fields are visible
   */
  test('TC8: Verify All Products and product detail page', async ({ homePage }) => {
    await test.step('Verify home page is loaded', async () => {
      await expect(homePage.homePageIndicator).toBeVisible();
    });

    const productsPage = await test.step('Navigate to All Products page', async () => {
      const page = await homePage.clickProducts();
      await expect(page.allProductsHeading).toBeVisible();
      await expect(page.firstProductCard).toBeVisible();
      return page;
    });

    const productDetailPage = await test.step('Open first product detail page', async () => {
      return await productsPage.viewFirstProduct();
    });

    await test.step('Verify product detail fields are visible', async () => {
      await expect(productDetailPage.productName).toBeVisible();
      await expect(productDetailPage.productCategory).toBeVisible();
      await expect(productDetailPage.productPrice).toBeVisible();
      await expect(productDetailPage.productAvailability).toBeVisible();
      await expect(productDetailPage.productCondition).toBeVisible();
      await expect(productDetailPage.productBrand).toBeVisible();
    });
  });
});
