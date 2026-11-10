import { BasePage } from '@pages/BasePage';

export class ProductDetailPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────────────────

  /** Product name heading inside the product information section. */
  get productName() {
    return this.page.locator('.product-information h2');
  }

  /** Category line, e.g. "Category: Women > Tops". */
  get productCategory() {
    return this.page.locator('.product-information').getByText(/Category:/);
  }

  /** Price element, e.g. "Rs. 500". */
  get productPrice() {
    return this.page.locator('.product-information').getByText(/Rs\./);
  }

  /** Availability line, e.g. "Availability: In Stock". */
  get productAvailability() {
    return this.page.locator('.product-information').getByText(/Availability:/);
  }

  /** Condition line, e.g. "Condition: New". */
  get productCondition() {
    return this.page.locator('.product-information').getByText(/Condition:/);
  }

  /** Brand line, e.g. "Brand: Polo". */
  get productBrand() {
    return this.page.locator('.product-information').getByText(/Brand:/);
  }
}
