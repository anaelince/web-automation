import { BasePage } from '@pages/BasePage';

/**
 * demoqa.com Book Store login page — /login
 * Selectors are specific to demoqa (different from the SauceDemo LoginPage).
 */
export class BookStoreLoginPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────

  get usernameInput() {
    return this.page.locator('#userName');
  }

  get passwordInput() {
    return this.page.locator('#password');
  }

  get loginButton() {
    return this.page.locator('#login');
  }

  get errorMessage() {
    return this.page.locator('#name');
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  /**
   * Fills credentials and clicks Login.
   * Uses a UI-based wait: once the "Log out" button appears on the redirected /profile page
   * the session is fully established and demoqa's React app has initialised its auth state.
   * No localStorage polling needed — demoqa persists auth in sessionStorage/cookies.
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL('**/profile');
    // UI confirmation: "Logout" button proves the session is active and the app is ready.
    await this.page.getByRole('button', { name: 'Logout' }).waitFor({ state: 'visible' });
  }
}
