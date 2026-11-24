# Web Automation Course

A hands-on repository for learning browser automation with Playwright and TypeScript.
Learners build a maintainable test framework from scratch, following industry patterns
for Page Objects, fixtures, test organisation, and CI/CD with GitHub Actions.

## Course Scope

The course covers the complete web automation lifecycle, from framework setup and test design to reporting, debugging, and continuous integration with GitHub Actions. The main topics include:

- Web automation foundations and Playwright setup
- Test framework structure and the first automated test
- Design patterns and maintainable test architecture
- Development lifecycle and team practices
- Test lifecycle control
- Locators, selectors, and the DOM
- Assertions and validation strategies
- Wait strategies and synchronization
- Browser automation workflows
- Reports and debugging techniques
- CI/CD with GitHub Actions

## Learning Path

The course material is organized into progressive modules:

| Module | Topic |
| --- | --- |
| M1 | Course overview |
| M2 | Introduction to web automation |
| M3 | Framework setup and first test |
| M4 | Design patterns |
| M5 | Development lifecycle and team practices |
| M6 | Test lifecycle control |
| M7 | Locators, selectors, and the DOM |
| M8 | Assertions |
| M9 | Wait strategies |
| M10 | Browser automation |
| M11 | Reports and debugging |
| M12 | CI, GitHub Actions, and wrap-up |

## Prerequisites

Install the following tools before starting:

- Node.js (LTS)
- npm
- Git + GitHub CLI (`gh`) — required for git-workflow-docs-standard workflow
- Visual Studio Code or **Kiro IDE** (recommended — required to use AI skills)
- Playwright browsers (installed via `npx playwright install`)
- Basic TypeScript knowledge
- Basic software testing concepts

## Quick Start

```bash
# 1. Clone and enter the project
git clone https://github.com/anaelince/web-automation.git
cd web-automation

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install

# 4. Configure environment variables
cp .env.example .env
# Edit .env and set BASE_URL and credentials

# 5. Verify TypeScript compiles
npm run typecheck

# 6. Run smoke tests
npm run test:smoke

# 7. Open the HTML report
npm run report
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests across chromium, firefox, and webkit |
| `npm run test:smoke` | Run smoke suite only |
| `npm run test:headed` | Run tests with a visible browser window |
| `npm run test:debug` | Run tests in Playwright debug mode |
| `npm run typecheck` | Type-check TypeScript without running tests |
| `npm run report` | Open the last Playwright HTML report |

## Repository Structure

```text
web-automation/
│
├── src/                          # Framework source code
│   ├── ui/
│   │   ├── pages/
│   │   │   ├── BasePage.ts       # Shared base class (all POs extend this)
│   │   │   └── sites/            # Page Objects organised by target site
│   │   │       ├── saucedemo/    # SauceDemo POs (LoginPage, InventoryPage)
│   │   │       ├── demoqa/       # demoqa POs (BookStorePage, ProfilePage, …)
│   │   │       └── automationexercise/  # AutomationExercise POs
│   │   └── components/           # Reusable UI component objects (reserved)
│   ├── api/
│   │   └── sites/                # API layer organised by target site
│   │       └── demoqa/
│   │           ├── client/       # ApiClient — sole HTTP entry point
│   │           ├── controllers/  # AccountController, BookController
│   │           ├── endpoints/    # URL constants (no HTTP logic)
│   │           └── models/       # TypeScript interfaces for payloads
│   ├── fixtures/
│   │   ├── index.ts              # Shared, site-agnostic base fixtures
│   │   └── sites/                # One fixture file per site (extends the base)
│   │       ├── saucedemo/saucedemo.fixtures.ts
│   │       ├── demoqa/demoqa.fixtures.ts          # incl. workerUser, cleanBookshelf
│   │       └── automationexercise/automationexercise.fixtures.ts
│   ├── data/
│   │   └── sites/                # Test data organised by target site
│   │       ├── saucedemo/        # auth.data.ts (users)
│   │       └── demoqa/           # auth.data.ts, user.factory.ts (unique test identities)
│   ├── config/
│   │   └── env.ts                # Multi-environment loading (TEST_ENV) + fail-fast validation
│   └── helpers/                  # (reserved for shared utilities)
│
├── tests/                        # Spec files
│   └── ui/
│       └── smoke/
│           └── sites/            # Test cases organised by target site
│               ├── saucedemo/    # SauceDemo TCs
│               ├── demoqa/       # demoqa TCs (TC02-add-book-to-collection)
│               └── automationexercise/  # AutomationExercise TCs
│
├── docs/
│   ├── README.md                 # Documentation index
│   ├── course/                   # Course presentation slides (M1–M6)
│   ├── decisions/                # Architecture Decision Records (ADRs)
│   ├── skills/                   # Meta-prompts for creating/updating AI skills
│   ├── test-cases/               # Test case specifications per site
│   │   └── demoqa/
│   └── wiki/                     # Living framework documentation
│       ├── api/                  # API layer reference
│       └── anti-flakiness-reference.md
│
├── .claude/                      # Claude Code configuration (CLAUDE.md at repo root)
│   ├── skills/                   # Claude skills (same set as .kiro/skills + spec-data,
│   │                             #   spec-requirements, ui-locator-wait, framework-reference)
│   ├── rules/                    # Path-scoped rules (former Kiro manual steering)
│   ├── hooks/                    # docs-sync-on-push.cjs (PostToolUse after git push)
│   └── settings.json             # Shared permissions + hook registration
│
├── .kiro/
│   ├── skills/                   # Kiro AI skill definitions
│   │   ├── automation-architect/         # Hub — orchestrates all 6 sub-skills
│   │   ├── ui-pom-standard/              # Page Object Model rules
│   │   ├── api-setup-teardown-standard/  # API layer structure and teardown rules
│   │   ├── spec-organisation-standard/   # Spec organisation and TC naming rules
│   │   ├── spec-code-standard/           # Spec code quality + site placement rules
│   │   ├── spec-quality-lifecycle-standard/ # TC quality, assertions, flakiness prevention
│   │   └── git-workflow-docs-standard/   # Git workflow conventions + docs sync
│   ├── steering/                 # Context injected into Kiro sessions
│   │   ├── project-context.md            # Always-active project conventions
│   │   ├── framework-reference.md        # Manual orchestrator — loads all 4 below at once
│   │   ├── framework-path-aliases.md     # Manual — full alias map
│   │   ├── framework-playwright-config.md # Manual — config settings + npm scripts
│   │   ├── framework-tech-stack.md       # Manual — dependency versions
│   │   └── framework-basepage-contract.md # Manual — BasePage contract
│   └── hooks/                    # Event-driven automation
│       └── docs-sync-on-push.json        # Checks doc sync after git push
│
├── .env.example                  # Environment variable template
├── playwright.config.ts          # Playwright configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

## Framework Architecture

### Page Object Model

All page interactions are encapsulated in Page Objects (`src/ui/pages/`).
Every Page Object extends `BasePage`, which provides the `page` reference and a
`navigate()` method. Locators are defined as `get` properties — never as constructor
fields — because TypeScript's `ES2022` target initialises class fields before the
parent constructor runs.

```typescript
// ✅ Correct — getter runs lazily, this.page is already set
get searchInput() {
  return this.page.locator('[data-test="search-input"]');
}
```

### Fixtures

Page Object instantiation is handled by Playwright fixtures. Each site has its own
fixture file (`src/fixtures/sites/{site}/{site}.fixtures.ts`) that extends the shared,
site-agnostic base in `src/fixtures/index.ts` and sets Playwright's `baseURL` to that
site's URL. Tests never create `new Page()` directly — they declare a fixture as a
parameter and import `test`/`expect` from their site's fixture file.

```typescript
import { test, expect } from '@fixtures/sites/automationexercise/automationexercise.fixtures';

test('TC9: Search Product', async ({ homePage }) => {
  // homePage is already instantiated and navigated by the fixture
});
```

### Test Case Organisation

Each test case lives in its own file under `tests/ui/{suite}/sites/{site}/{feature}/`:

```
tests/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts
tests/ui/smoke/sites/automationexercise/products/TC8-verify-all-products-and-detail.spec.ts
tests/ui/smoke/sites/saucedemo/login/TC0-valid-login.spec.ts
```

Steps inside each test use `test.step()` — which appears as named entries in the
Playwright HTML report — instead of inline comments.

```typescript
test('TC8: Verify All Products and product detail page', async ({ homePage }) => {
  await test.step('Verify home page is visible', async () => {
    await expect(homePage.homePageIndicator).toBeVisible();
  });

  const productsPage = await test.step('Navigate to All Products page', async () => {
    const page = await homePage.clickProducts();
    await expect(page.allProductsHeading).toBeVisible();
    return page;
  });
});
```

## Environment Setup

The project requires a `.env` file in the root (not committed to git).
Copy `.env.example` and fill in the values:

```bash
cp .env.example .env
```

To target another environment, create `.env.<name>` (e.g. `.env.qa`) and select it
with `TEST_ENV`:

```bash
TEST_ENV=qa npx playwright test
```

With `TEST_ENV` unset, `.env.local` is loaded, falling back to `.env`. All `.env.*`
files except `.env.example` are git-ignored; `.env.example` documents every variable.

The variables are defined and validated in `src/config/env.ts`.
The test run will fail with a descriptive error if the environment file or any
required variable is missing, or if a URL variable is not a valid http(s) URL.

## AI Skills

This project includes AI skills that enforce and apply the framework's conventions
automatically — for Claude Code under `.claude/skills/` and for Kiro under `.kiro/skills/`.
Skills marked *(Claude only)* are not yet available in Kiro.

| Skill | Purpose | Load when... |
|-------|---------|--------------|
| `ui-pom-standard` | Enforces Page Object Model rules | Creating or reviewing Page Objects |
| `api-setup-teardown-standard` | Enforces API layer structure, teardown contract, and token refresh rules | Implementing API-based setup/teardown or scaffolding a new API resource |
| `spec-organisation-standard` | Enforces TC folder structure and naming | Creating or reorganising test cases |
| `spec-code-standard` | Enforces spec code quality and site-layer placement | Writing or reviewing spec files |
| `spec-quality-lifecycle-standard` | Enforces TC lifecycle quality: preconditions, assertions, anti-flakiness. Orchestrates `spec-requirements-standard`, `spec-data-standard` and `ui-locator-wait-standard` | Writing, reviewing, or debugging test cases |
| `ui-locator-wait-standard` *(Claude only)* | Locators and waits: contract-aware locator hierarchy (test id → role → label → placeholder → text → alt → title → CSS/XPath), uniqueness, action semantics, terminal-state waits, bounded polling, timeouts, verification runs | Writing or reviewing locators, Page Object getters, waits or polling; diagnosing timeouts or strict-mode failures |
| `spec-requirements-standard` *(Claude only)* | Writes and assesses TC specifications in `docs/test-cases/**`: traceability, preconditions, deterministic expected results, automation readiness | Before automating a TC or when writing TCs from requirements |
| `spec-data-standard` *(Claude only)* | Test data robustness: data maturity levels, parallel isolation, typed/data-driven data, multi-environment portability, verification runs | Tests that create or read data, enabling parallel runs, adding an environment |
| `git-workflow-docs-standard` | Validates and executes git workflow + docs sync | Before committing, pushing, or opening a PR |
| `framework-reference` *(Claude only)* | Loads path aliases, Playwright config, tech stack and BasePage contract at once | Scaffolding a feature or reviewing architecture |
| `automation-architect` | Hub — orchestrates the sub-skills above | Full architecture review or scaffolding a new feature |

See [ADR-002](docs/decisions/ADR-002-spec-data-standard.md),
[ADR-003](docs/decisions/ADR-003-spec-requirements-standard.md) and
[ADR-004](docs/decisions/ADR-004-ui-locator-wait-standard.md) for the rationale of the three newest skills.

**Example usage in chat:**

```
"apply architecture"       → runs all skills on the project (full pipeline)
"scaffold LoginPage"       → generates Page Object + fixture + spec skeleton
"scaffold api for books"   → scaffolds API client, controller, model, endpoints + fixture
"review tc quality"        → scans all specs for flaky patterns and assertion issues
"write tc"                 → scaffolds a new quality TC from scratch
"write test case"          → writes a TC specification from a requirement
"assess test data"         → reports the data maturity level of the suite
"check git"                → validates branch name and commit messages
"git workflow"             → commit + push + open PR following conventions
"update docs"              → syncs README + wiki with current project state (Mode 5)
```

> **Note for maintainers:** This section is auto-updated by `automation-architect`
> Mode 5 — README Sync. After adding or retiring a skill, trigger Mode 5 to keep
> this table accurate.

## Git Workflow

This project follows a structured git workflow enforced by the `git-workflow-docs-standard` skill.

> **Project override:** this course repository has a single developer, so changes are
> pushed directly to `main` (no branches/PRs). Commit message conventions still apply.
> See [ai-governance.md](docs/wiki/ai-governance.md). The branch/PR flow below is the
> standard for team projects.

**Branch naming:**
```
test/<kebab-case-scope>    # for new test cases
fix/<kebab-case-scope>     # for defect corrections

Examples:
  test/tc8-verify-products
  fix/login-redirect
```

**Commit message format** (Conventional Commits):
```
type(scope): description

Allowed types: feat · fix · refactor · chore · docs
Scope: optional, kebab-case

Examples:
  feat(tc8): add products page verification
  fix(login): correct redirect after logout
  chore: update playwright version
```

Every branch must contain at least one `feat` or `fix` commit before opening a PR.

Run `git-workflow-docs-standard` (load the skill in Kiro and say `"check git"`) before every PR.
If architectural files changed in your branch, `git-workflow-docs-standard` will warn you to run
`"update readme"` in `automation-architect` before pushing.

> **Note for maintainers:** This section is auto-updated by `automation-architect`
> Mode 5 — README Sync when branch patterns or commit types change in `git-workflow-docs-standard`.

## Contribution Guidelines

1. Write all documentation and code examples in English.
2. Follow the TC folder structure: `tests/ui/{suite}/sites/{site}/{feature}/TC{N}-{name}.spec.ts`
3. One test case per file. Data-driven variants stay in the same file.
4. Use `test.step()` for step labelling — no inline `// Step N:` comments.
5. Respect the git workflow conventions (branch naming, commit format).
6. Do not commit secrets, `.env` files, test reports, or generated Playwright artifacts.
7. Run `npm run typecheck` before committing.
8. Load the appropriate Kiro skill before creating or refactoring files to verify
   conventions are met.


