import { BasePage } from '@pages/BasePage';

export class LoginPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────
  // Defined as getters — never constructor fields.
  // ES2022 useDefineForClassFields: true makes this.page undefined during
  // class field initialisation; getters evaluate lazily at call time.

  get usernameInput() {
    return this.page.locator('[data-test="username"]');
  }

  get passwordInput() {
    return this.page.locator('[data-test="password"]');
  }

  get loginButton() {
    return this.page.locator('[data-test="login-button"]');
  }

  get errorMessage() {
    return this.page.locator('[data-test="error"]');
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
