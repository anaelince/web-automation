import { BasePage } from '@pages/BasePage';

/**
 * demoqa.com User profile page — /profile
 * Shows the logged-in user's details and their book collection.
 */
export class ProfilePage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────

  get usernameValue() {
    return this.page.locator('#userName-value');
  }

  /**
   * All book rows in the user's collection table.
   * demoqa renders the profile book table as a standard HTML <table> with <tbody> rows.
   */
  get bookList() {
    return this.page.locator('table tbody tr');
  }

  /**
   * Returns a locator scoped to the row that contains the given book title.
   * Used to verify a specific book appears in the collection.
   */
  bookRowByTitle(title: string) {
    return this.page.locator('table tbody tr').filter({ hasText: title });
  }

  get deleteAllBooksButton() {
    return this.page.getByRole('button', { name: /Delete All Books/i });
  }

  get deleteAccountButton() {
    return this.page.getByRole('button', { name: /Delete Account/i });
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  /**
   * Deletes all books from the user's collection via the UI.
   * - If the button is not visible or not enabled (empty collection) it does nothing.
   * - After clicking, confirms the custom modal that demoqa shows.
   * Used by the `cleanBookshelf` fixture as a reliable post-test teardown.
   */
  async deleteAllBooks(): Promise<void> {
    const btn = this.deleteAllBooksButton;
    const visible = await btn.isVisible().catch(() => false);
    if (!visible) return;
    const enabled = await btn.isEnabled().catch(() => false);
    if (!enabled) return;
    await btn.click();
    // demoqa shows a confirmation modal with an OK button (not a browser alert)
    await this.page.getByRole('button', { name: 'OK' }).click();
  }
}
