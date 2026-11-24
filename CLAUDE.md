# Web Automation — Claude AI Configuration

> This file is read automatically by Claude Code at the start of every conversation.
> It is the Claude equivalent of Kiro's always-included steering files.
>
> For full skill rules, load: `@docs/agents/claude/skill-reference.md`
> For governance decisions, load: `@docs/wiki/ai-governance.md`

---

## Project

Playwright + TypeScript test automation framework for a web automation course.
Single developer. Push directly to `main` — no branches/PRs.

**Site under test:** `https://demoqa.com` (Book Store)  
**Base URL env var:** `BASE_URL` in `.env`

### Project conventions (migrated from `.kiro/steering/project-context.md`)

- Write documentation and code examples in English.
- Store published course material under `docs/`.
- Use Playwright and TypeScript for browser automation examples.
- Use GitHub for source control, collaboration, and CI/CD.
- Keep secrets, local environment files, reports, and generated Playwright artifacts out of version control.
- Prefer repository-local guidance (`CLAUDE.md`, `.claude/rules/`, `.claude/skills/`) over settings from unrelated workspaces.

**Path-scoped rules** in `.claude/rules/` (former Kiro manual steering) load automatically
when matching files are touched: `basepage-contract`, `path-aliases`, `playwright-config`,
`tech-stack`, `pptx-workflow`. Use the `framework-reference` skill to load all framework rules at once.

---

## Architecture — Site-Based Layers

Every source file belongs to a site-specific subfolder:

```
src/api/sites/{site}/{client|controllers|endpoints|models|mocks}
src/ui/pages/sites/{site}/{PageObject}.ts
src/data/sites/{site}/auth.data.ts
src/fixtures/sites/{site}/{site}.fixtures.ts
tests/ui/smoke/sites/{site}/{feature}/TC{N}-{name}.spec.ts
```

`BasePage.ts` and `src/fixtures/index.ts` (site-agnostic fixtures only) are the only shared files outside `sites/`.

**Active sites:** `demoqa` · `saucedemo` · `automationexercise`

---

## Path Aliases (tsconfig.json)

Always use aliases — never relative imports (`./` or `../`):

```
@pages/sites/{site}/{Page}        → src/ui/pages/sites/{site}/{Page}.ts
@api/sites/{site}/client/ApiClient → src/api/sites/{site}/client/ApiClient.ts
@data/sites/{site}/auth.data      → src/data/sites/{site}/auth.data.ts
@fixtures                         → src/fixtures/index.ts (shared base — site fixtures extend it)
@fixtures/sites/{site}/{site}.fixtures → src/fixtures/sites/{site}/{site}.fixtures.ts
@config/*                         → src/config/*
```

---

## Skills — Active Rules

This project enforces 10 AI Automation SDLC skills.  
For the **full rule set** load: `@docs/agents/claude/skill-reference.md`

**Quick trigger:** Say `"apply architecture"` after loading `@docs/agents/claude/skill-reference.md`

| Skill | Governs |
|---|---|
| `ui-pom-standard` | Page Object Model structure |
| `api-setup-teardown-standard` | API layer, setup/teardown, token lifecycle |
| `spec-organisation-standard` | Spec file location and naming |
| `spec-code-standard` | Imports, fixtures, credentials |
| `spec-quality-lifecycle-standard` | TC lifecycle orchestrator, assertions, anti-flakiness |
| `spec-requirements-standard` | TC specifications (`docs/test-cases/`) |
| `spec-data-standard` | Test data isolation, sourcing, environments |
| `ui-locator-wait-standard` | Locator hierarchy, uniqueness, actions, waits, polling |
| `git-workflow-docs-standard` | Commit format, docs sync |
| `automation-architect` | Hub: full pipeline |

---

## Critical Rules (always apply)

### Code quality
- Imports: path aliases only — no `./` or `../`
- `test` and `expect`: import from the site fixture file `@fixtures/sites/{site}/{site}.fixtures` — not `@playwright/test`, not `@fixtures`
- No hardcoded credentials — use `@data/sites/{site}/auth.data`
- No PO instantiation in `beforeEach` — use Playwright fixtures

### Page Objects
- All POs extend `BasePage` from `@pages/BasePage`
- Locators are `get` properties — NEVER constructor fields (ES2022 requirement)
- Actions are `async` methods — no assertions inside POs
- No `navigate()` override — `BasePage.navigate(path)` handles it
- Locator hierarchy: test-id contract (if the team defines one) → role → label → placeholder →
  text → alt text → title → CSS/XPath with a `// locator:` reason. No positions without a business rule

### API layer
- `ApiClient` is the ONLY file that calls `request.*` directly
- Controllers receive `ApiClient`, never `APIRequestContext`
- URL constants live in `endpoints/` files only
- Every fixture that creates data via API must have teardown after `use()`
- When UI login happens during the test body, the API token is invalidated —
  regenerate token in teardown before API cleanup calls

### Test cases
- First `test.step()` must assert preconditions are met
- Tests that create data must include a `clean<Resource>` fixture parameter
- Never use `page.waitForTimeout()` — use Playwright's auto-waits
- After every state-changing action, wait for the terminal state that proves completion;
  polling (`expect.poll` / `toPass`) always has timeout, intervals, failure states and a message
- Use web-first assertions: `expect(locator).toBeVisible()` not `expect(await locator.isVisible()).toBe(true)`
- No `if/else` inside `test()` body — conditional logic belongs in POs/fixtures
- After every navigation, assert that the target page loaded before interacting

### Git
- Commit format: `type(scope): description` (Conventional Commits)
- Allowed types: `feat` · `fix` · `refactor` · `chore` · `docs`
- Push directly to `main` (project override — no branches/PRs for this course project)

---

## Fixture Naming Conventions

| Fixture type | Pattern | Example |
|---|---|---|
| Controller (read-only) | `<resource>Controller` | `bookController` |
| Data + teardown | `created<Resource>` | `createdBook` |
| Cleanup fixture | `clean<Resource>` | `cleanBookshelf` |
| Mock fixture | `mock<Resource>` | `mockBooks` |
| Worker-scoped identity/resource | `worker<Resource>` | `workerUser` |

---

## Documentation

| Need | File |
|---|---|
| AI tooling conventions | `docs/wiki/ai-governance.md` |
| API layer reference | `docs/wiki/api/demoqa-api-layer.md` |
| Full skill rules | `docs/agents/claude/skill-reference.md` |
| Skill meta-prompts | `docs/skills/` |
| ADRs | `docs/decisions/` |
| Test case specs | `docs/test-cases/` |
