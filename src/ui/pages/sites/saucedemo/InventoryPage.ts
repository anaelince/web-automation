import { BasePage } from '@pages/BasePage';

export class InventoryPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────────────────

  get inventoryContainer() {
    return this.page.locator('[data-test="inventory-container"]');
  }

  get secondaryHeader() {
    return this.page.locator('[data-test="secondary-header"]');
  }

  get swagLabsLogo() {
    return this.page.getByText('Swag Labs');
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  async addToCart(productTestId: string): Promise<void> {
    await this.page.locator(`[data-test="add-to-cart-${productTestId}"]`).click();
  }
}
