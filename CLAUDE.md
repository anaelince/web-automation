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

---

## Architecture — Site-Based Layers

Every source file belongs to a site-specific subfolder:

```
src/api/sites/{site}/{client|controllers|endpoints|models|mocks}
src/ui/pages/sites/{site}/{PageObject}.ts
src/data/sites/{site}/auth.data.ts
tests/ui/smoke/sites/{site}/{feature}/TC{N}-{name}.spec.ts
```

`BasePage.ts` is the only shared file outside `sites/`.

**Active sites:** `demoqa` · `saucedemo` · `automationexercise`

---

## Path Aliases (tsconfig.json)

Always use aliases — never relative imports (`./` or `../`):

```
@pages/sites/{site}/{Page}        → src/ui/pages/sites/{site}/{Page}.ts
@api/sites/{site}/client/ApiClient → src/api/sites/{site}/client/ApiClient.ts
@data/sites/{site}/auth.data      → src/data/sites/{site}/auth.data.ts
@fixtures                         → src/fixtures/index.ts
@config/*                         → src/config/*
```

---

## Skills — Active Rules

This project enforces the following AI Automation SDLC skills:

| Skill | Governs | Load full rules |
|---|---|---|
| `ui-pom-standard` | Page Object Model structure | `@docs/agents/claude/skill-reference.md#ui-pom-standard` |
| `api-setup-teardown-standard` | API layer, setup/teardown, token lifecycle | `#api-setup-teardown-standard` |
| `spec-organisation-standard` | Spec file location and naming | `#spec-organisation-standard` |
| `spec-code-standard` | Imports, fixtures, credentials | `#spec-code-standard` |
| `spec-quality-lifecycle-standard` | TC lifecycle, assertions, anti-flakiness | `#spec-quality-lifecycle-standard` |
| `git-workflow-docs-standard` | Commit format, docs sync | `#git-workflow-docs-standard` |
| `automation-architect` | Hub: full pipeline | `#automation-architect` |

---

## Critical Rules (always apply)

### Code quality
- Imports: path aliases only — no `./` or `../`
- `test` and `expect`: import from `@fixtures`, not `@playwright/test`
- No hardcoded credentials — use `@data/sites/{site}/auth.data`
- No PO instantiation in `beforeEach` — use Playwright fixtures

### Page Objects
- All POs extend `BasePage` from `@pages/BasePage`
- Locators are `get` properties — NEVER constructor fields (ES2022 requirement)
- Actions are `async` methods — no assertions inside POs
- No `navigate()` override — `BasePage.navigate(path)` handles it

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
