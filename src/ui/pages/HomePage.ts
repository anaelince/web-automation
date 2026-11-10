import { BasePage } from '@pages/BasePage';
import { ProductsPage } from '@pages/ProductsPage';

export class HomePage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────────────────

  /** Paragraph visible only on the home page — used to confirm successful load. */
  get homePageIndicator() {
    return this.page
      .getByRole('paragraph')
      .filter({ hasText: 'All QA engineers can use this' });
  }

  get productsNavLink() {
    return this.page.getByRole('link', { name: ' Products' });
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Clicks the Products nav link and returns a ProductsPage instance. */
  async clickProducts(): Promise<ProductsPage> {
    await this.productsNavLink.click();
    return new ProductsPage(this.page);
  }
}
