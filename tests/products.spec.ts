import { test, expect } from '@fixtures';

test.describe('Products', () => {
  /**
   * TC8: Verify All Products and product detail page
   *
   * Steps:
   * 1. Navigate to home page
   * 2. Verify home page is visible
   * 3. Click Products button
   * 4. Verify navigation to All Products page
   * 5. Verify product list is visible
   * 6. Click 'View Product' of the first product
   * 7. Verify product detail page shows name, category, price,
   *    availability, condition, and brand
   */
  test('TC8: Verify All Products and product detail page', async ({ homePage }) => {
    // Step 3: Verify home page loaded successfully
    await expect(homePage.homePageIndicator).toBeVisible();

    // Step 4: Navigate to All Products page
    const productsPage = await homePage.clickProducts();

    // Step 5: Verify All Products heading is present
    await expect(productsPage.allProductsHeading).toBeVisible();

    // Step 6: Verify the product list is rendered
    await expect(productsPage.firstProductCard).toBeVisible();

    // Step 7: Open the first product's detail page
    const productDetailPage = await productsPage.viewFirstProduct();

    // Steps 8–9: Verify all required detail fields are visible
    await expect(productDetailPage.productName).toBeVisible();
    await expect(productDetailPage.productCategory).toBeVisible();
    await expect(productDetailPage.productPrice).toBeVisible();
    await expect(productDetailPage.productAvailability).toBeVisible();
    await expect(productDetailPage.productCondition).toBeVisible();
    await expect(productDetailPage.productBrand).toBeVisible();
  });

  /**
   * TC9: Search Product
   *
   * Steps:
   * 1. Navigate to home page
   * 2. Verify home page is visible
   * 3. Click Products button
   * 4. Verify navigation to ALL PRODUCTS page
   * 5. Enter product name in search input and click search button
   * 6. Verify 'SEARCHED PRODUCTS' is visible
   * 7. Verify all products related to the search are visible
   */
  test('TC9: Search Product', async ({ homePage }) => {
    // Step 3: Verify home page loaded successfully
    await expect(homePage.homePageIndicator).toBeVisible();

    // Step 4: Navigate to All Products page
    const productsPage = await homePage.clickProducts();

    // Step 5: Verify All Products heading is present
    await expect(productsPage.allProductsHeading).toBeVisible();

    // Step 6: Enter search term and submit
    await productsPage.searchFor('summer white top');

    // Step 7: Verify 'SEARCHED PRODUCTS' section is visible
    await expect(productsPage.searchedProductsHeading).toBeVisible();

    // Step 8: Verify at least one product matching the search is displayed
    await expect(productsPage.productCards.first()).toBeVisible();
  });
});
