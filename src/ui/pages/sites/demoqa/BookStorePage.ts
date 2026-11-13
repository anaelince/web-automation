import { BasePage } from '@pages/BasePage';

/**
 * demoqa.com Book Store catalog page — /books
 * Displays the full list of available books in a React-Table.
 */
export class BookStorePage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────

  get pageHeading() {
    return this.page.getByText('Book Store', { exact: true });
  }

  /** "Login" link in the left sidebar — visible when no session is active. */
  get loginLink() {
    return this.page.getByRole('link', { name: 'Login' });
  }

  get searchInput() {
    return this.page.getByRole('textbox', { name: /search/i });
  }

  /**
   * All book rows in the catalog table (tbody rows only — excludes the header row).
   * demoqa renders the catalog as a standard HTML <table> with <tbody> rows.
   */
  get bookList() {
    return this.page.locator('table tbody tr');
  }

  /**
   * Title link of the first book.
   * Each row's second cell holds an <a> that links to the book detail page.
   */
  get firstBookTitleLink() {
    return this.page.locator('table tbody tr').first().getByRole('link').first();
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  /** Returns the visible text of the first book's title (trimmed). */
  async getFirstBookTitle(): Promise<string> {
    const title = await this.firstBookTitleLink.textContent();
    return title?.trim() ?? '';
  }

  /** Clicks the first book's title link to navigate to its detail page. */
  async clickFirstBook(): Promise<void> {
    await this.firstBookTitleLink.click();
  }
}
