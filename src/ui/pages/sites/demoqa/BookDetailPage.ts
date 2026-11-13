import { BasePage } from '@pages/BasePage';

/**
 * demoqa.com Book detail page — /books?book={isbn}
 * Reached by clicking a book title in the Book Store catalog.
 */
export class BookDetailPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────

  /**
   * "Add To Your Collection" button.
   * demoqa assigns id="addNewRecordButton" to BOTH buttons on this page (a duplicate ID bug),
   * so we target by role + accessible name to avoid a strict mode violation.
   */
  get addToCollectionButton() {
    return this.page.getByRole('button', { name: 'Add To Your Collection' });
  }

  /**
   * "Back To Book Store" button — only present on detail pages.
   * Used to confirm the detail page is fully loaded.
   */
  get backToBookStoreButton() {
    return this.page.getByRole('button', { name: 'Back To Book Store' });
  }

  /**
   * The "Title :" label div — only present on book detail pages.
   * demoqa renders each field as a pair of generic divs (label + value), not a table.
   * Asserting its visibility confirms the detail content is loaded and non-empty.
   */
  get bookInfoBlock() {
    return this.page.getByText('Title :', { exact: true });
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  /**
   * Clicks "Add To Your Collection", waits for the browser alert, accepts it,
   * and returns the alert message text so the spec can assert on it.
   */
  async addToCollection(): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.addToCollectionButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    return message;
  }
}
