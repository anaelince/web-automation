import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Exposes the underlying Playwright Page for fixtures that need to pass it to another PO. */
  get currentPage(): Page {
    return this.page;
  }

  async navigate(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }
}
