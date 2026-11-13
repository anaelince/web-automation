import { BasePage } from '@pages/BasePage';
import { ProductDetailPage } from '@pages/sites/automationexercise/ProductDetailPage';

export class ProductsPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────────────────

  /** Heading that confirms the user landed on the All Products page. */
  get allProductsHeading() {
    return this.page.getByRole('heading', { name: 'All Products' });
  }

  /** First product card — confirms the product list is rendered. */
  get firstProductCard() {
    return this.page.locator('.product-image-wrapper').first();
  }

  /** "View Product" link for the first product in the list. */
  get viewFirstProductLink() {
    return this.page.getByRole('link', { name: ' View Product' }).first();
  }

  // ── Search locators ───────────────────────────────────────────────────────

  /** Search input field. */
  get searchInput() {
    return this.page.getByRole('textbox', { name: 'Search Product' });
  }

  /** Submit button for the search form. */
  get searchSubmitButton() {
    return this.page.locator('#submit_search');
  }

  /** Heading that appears after a search is submitted — confirms the results section. */
  get searchedProductsHeading() {
    return this.page.getByRole('heading', { name: 'Searched Products' });
  }

  /** All product cards in the current results list (All Products or Searched Products). */
  get productCards() {
    return this.page.locator('.product-overlay');
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Clicks 'View Product' on the first product and returns a ProductDetailPage instance. */
  async viewFirstProduct(): Promise<ProductDetailPage> {
    await this.viewFirstProductLink.click();
    return new ProductDetailPage(this.page);
  }

  /** Types a search term and submits the search form. */
  async searchFor(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchSubmitButton.click();
  }
}
