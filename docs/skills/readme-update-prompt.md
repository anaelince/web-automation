# Meta-prompt: Update README.md to reflect M5 architecture

Use this prompt directly with Kiro to rewrite `README.md` in the workspace root.

The current README was written at M3 (framework setup phase) and does not reflect
the framework architecture built in M4–M5. Rewrite it completely — keep the course
scope and module table accurate, but replace all structural and technical content
with the current state of the project.

**Important:** After this initial rewrite, the README is maintained automatically:
- `automation-architect` **Mode 5 — README Sync** detects and updates out-of-date
  sections whenever triggered with "update readme"
- `git-workflow-docs-standard` **C4 — README_SYNC** warns during PR validation if architectural
  files changed but README was not updated in the branch

The sections below are marked as **[AUTO]** (tracked by Mode 5) or **[MANUAL]**
(requires deliberate human decision to update).

---

## Prompt

Rewrite `README.md` with the following sections in order. Do not invent content —
derive all technical details from the actual project files.

---

### Section 1 — Title and description `[MANUAL]`

```markdown
# Web Automation Course
```

One short paragraph: what the repo is, what stack it uses, and what a learner gets
from it. Keep it factual and brief.

---

### Section 2 — Learning Path `[MANUAL]`

Keep the existing module table unchanged — it is still accurate.

---

### Section 3 — Prerequisites `[MANUAL]`

Update to reflect the actual tools needed today:

- Node.js (LTS) — exact version used in the project if available
- npm
- Git + GitHub CLI (`gh`) — required for git-workflow-docs-standard workflow
- Visual Studio Code or **Kiro IDE** (recommended — required to use AI skills)
- Playwright browsers (installed via `npx playwright install`)
- Basic TypeScript knowledge
- Basic software testing concepts

---

### Section 4 — Quick Start `[MANUAL]`

Replace the generic steps with the actual workflow:

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

---

### Section 5 — Available Commands `[AUTO — source: package.json scripts]`

Derive from `package.json` scripts. Present as a table:

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests across chromium, firefox, and webkit |
| `npm run test:smoke` | Run smoke suite only |
| `npm run test:headed` | Run tests with a visible browser window |
| `npm run test:debug` | Run tests in Playwright debug mode |
| `npm run typecheck` | Type-check TypeScript without running tests |
| `npm run report` | Open the last Playwright HTML report |

---

### Section 6 — Repository Structure `[AUTO — source: actual folder tree + .kiro/skills/]`

Replace the outdated structure with the actual layout, grouped by concern:

```text
web-automation/
│
├── src/                          # Framework source code
│   ├── ui/
│   │   ├── pages/                # Page Objects (extend BasePage)
│   │   └── components/           # Reusable UI component objects
│   ├── fixtures/
│   │   └── index.ts              # Playwright fixture definitions
│   ├── data/
│   │   └── auth.data.ts          # Test user accounts
│   ├── config/
│   │   └── env.ts                # Environment variable validation
│   ├── helpers/                  # (reserved for shared utilities)
│   └── api/                      # (reserved for API client layer)
│
├── tests/                        # Spec files
│   └── ui/
│       ├── smoke/                # Critical path test cases
│       │   └── {feature}/        # One folder per app feature
│       │       └── TC{N}-{name}.spec.ts   # One file per test case
│       └── regression/           # Edge cases and negative paths
│
├── docs/                         # Course material and architecture prompts
│   └── decisions/                # Architecture Decision Records (ADRs)
│
├── .kiro/
│   └── skills/                   # Kiro AI skill definitions
│       ├── automation-architect/ # Hub — orchestrates all sub-skills
│       ├── ui-pom-standard/        # Page Object Model rules
│       ├── spec-code-standard/       # Spec code quality rules
│       ├── spec-organisation-standard/       # Spec organisation and TC naming rules
│       └── git-workflow-docs-standard/        # Git workflow conventions and execution
│
├── .env.example                  # Environment variable template
├── playwright.config.ts          # Playwright configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

---

### Section 7 — Framework Architecture `[AUTO — source: BasePage.ts + fixtures/index.ts]`

#### Page Object Model

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

#### Fixtures

Page Object instantiation is handled by Playwright fixtures (`src/fixtures/index.ts`).
Tests never create `new Page()` directly — they declare a fixture as a parameter.

```typescript
test('TC9: Search Product', async ({ homePage }) => {
  // homePage is already instantiated and navigated by the fixture
});
```

#### Test Case Organisation

Each test case lives in its own file under `tests/ui/{suite}/{feature}/`:

```
tests/ui/smoke/products/TC8-verify-all-products-and-detail.spec.ts
tests/ui/smoke/products/TC9-search-product.spec.ts
```

Steps inside each test use `test.step()` — which appears as named entries in the
Playwright HTML report — instead of inline comments.

---

### Section 8 — Environment Setup `[MANUAL]`

Explain the `.env` file:

The project requires a `.env` file in the root (not committed to git).
Copy `.env.example` and fill in the values:

```bash
cp .env.example .env
```

The required variables are defined and validated in `src/config/env.ts`.
The test run will fail with a descriptive error if any required variable is missing.

---

### Section 9 — Kiro AI Skills `[AUTO — source: .kiro/skills/*/SKILL.md frontmatter]`

New section. Explain the skill system to learners using Kiro IDE.

This project includes a set of Kiro AI skills under `.kiro/skills/` that enforce
and apply the framework's conventions automatically.

| Skill | Purpose | Load when... |
|-------|---------|--------------|
| `ui-pom-standard` | Enforces Page Object Model rules | Creating or reviewing Page Objects |
| `spec-code-standard` | Enforces spec code quality | Writing or reviewing spec files |
| `spec-organisation-standard` | Enforces TC folder structure and naming | Creating or reorganising test cases |
| `git-workflow-docs-standard` | Validates and executes git workflow | Before committing, pushing, or opening a PR |
| `automation-architect` | Orchestrates all skills (hub) | Full architecture review or scaffolding a new page |

**Example usage in Kiro chat:**

```
"apply architecture"       → runs all code-quality skills on the project
"scaffold LoginPage"       → generates Page Object + fixture + spec skeleton
"check git"                → validates branch name and commit messages
"git workflow"             → commit + push + open PR following conventions
"check spec structure"     → validates TC folder hierarchy and naming
"update readme"            → syncs README sections with current project state (Mode 5)
```

> **Note for maintainers:** This section is auto-updated by `automation-architect`
> Mode 5 — README Sync. After adding or retiring a skill, trigger Mode 5 to keep
> this table accurate.

---

### Section 10 — Git Workflow `[AUTO — source: git-workflow-docs-standard SKILL.md]`

New section. Reference the `git-workflow-docs-standard` skill conventions.

This project follows a structured git workflow enforced by the `git-workflow-docs-standard` skill.

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

---

### Section 11 — Contribution Guidelines `[MANUAL]`

Update to reflect M5 conventions:

1. Write all documentation and code examples in English.
2. Follow the TC folder structure: `tests/ui/{suite}/{feature}/TC{N}-{name}.spec.ts`
3. One test case per file. Data-driven variants stay in the same file.
4. Use `test.step()` for step labelling — no inline `// Step N:` comments.
5. Respect the git workflow conventions (branch naming, commit format).
6. Do not commit secrets, `.env` files, test reports, or generated Playwright artifacts.
7. Run `npm run typecheck` before committing.
8. Load the appropriate Kiro skill before creating or refactoring files to verify
   conventions are met.

---

## Sections to REMOVE from the current README

- The generic repository structure block (`automation-course/` tree) — fully replaced
- The "Playwright and project dependencies will be added..." sentence — already done
- The vague "Repository Integration" section — replaced by Git Workflow section

## Sections to KEEP unchanged

- Course Scope bullet list
- Learning Path module table
- The general framing of what the course covers

---

## Tone and style guidelines

- Factual and direct — no marketing language
- Code blocks for all commands, file paths, and examples
- Tables for structured information (commands, skills, modules)
- Assume the reader is a learner who has cloned the repo and is following the course
- Do not describe future planned features as if they already exist


