---
paths:
  - "playwright.config.ts"
  - "package.json"
  - ".env.example"
---


# Framework Playwright Configuration

## `playwright.config.ts` Settings

| Setting | Value | Notes |
|---------|-------|-------|
| `testDir` | `./tests` | All spec files must live here |
| `baseURL` | `ENV.baseUrl` | Primary site (demoqa). Loaded from `.env.<TEST_ENV>` (unset → `.env.local` or `.env`) by `src/config/env.ts`. Other sites override it in their fixture file with `ENV.siteUrls.{site}` (`SAUCEDEMO_BASE_URL`, `AUTOMATIONEXERCISE_BASE_URL`) |
| `fullyParallel` | `true` | Tests run in parallel by default |
| `retries` | `2` on CI, `0` local | Skills should not assume a specific retry count |
| `trace` | `on-first-retry` | Trace collected on CI failures |
| `reporter` | `list` + `html` | HTML report at `playwright-report/` |
| `viewport` | `{ width: 1920, height: 1080 }` | Full HD — demoqa collapses sidebar at smaller widths |
| `ignoreHTTPSErrors` | `true` | Required for demoqa.com on Windows (intermediate CA) |
| Browsers | chromium · firefox · webkit | All three run by default |
| `forbidOnly` | `true` on CI | `test.only` causes CI failure |

## npm Scripts

| Script | Command | When to reference |
|--------|---------|------------------|
| `test` | `playwright test` | Full test run |
| `test:smoke` | `playwright test --grep @smoke` | Smoke suite only |
| `test:headed` | `playwright test --headed` | Debug runs |
| `typecheck` | `tsc --noEmit` | Run after any code change to verify TypeScript |
| `report` | `playwright show-report` | Open the last HTML report |
