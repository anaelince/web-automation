---
paths:
  - "src/ui/pages/**/*.ts"
  - "src/fixtures/**/*.ts"
---


# Framework BasePage Contract

## Source: `src/ui/pages/BasePage.ts`

```typescript
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
```

## Rules derived from this contract

- All Page Objects extend `BasePage` — no exceptions
- **No constructor override** — `BasePage` handles it; subclasses must not redeclare
- **No `navigate()` override** — call `po.navigate('/path')` from fixtures or specs
- **`currentPage` getter** — use to pass the underlying `page` between fixtures
  (e.g. `new InventoryPage(authenticatedPage.currentPage)`)
- Locators are `get` properties, NOT constructor fields — required because ES2022
  `useDefineForClassFields: true` runs field initializers before `super()` completes,
  making `this.page` undefined at field-init time
