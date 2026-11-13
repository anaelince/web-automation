# AI Automation SDLC — Init Script Reference

> Script: `scripts/init-automation-sdlc.js`  
> Onboarding prompt: `docs/skills/ai-automation-sdlc-onboarding-prompt.md`

---

## What it does

Bootstraps the AI Automation SDLC configuration into any project directory.
Run it once in a new project to get all skills, steering files, hooks, and
governance documentation set up without manual copy-paste.

---

## Usage

```bash
# From this repo, into a specific directory
node scripts/init-automation-sdlc.js ../my-new-project

# Defaults to current directory if no argument is given
node scripts/init-automation-sdlc.js

# Future (after publishing to npm)
npx automation-sdlc init [target-dir]
automation-sdlc init [target-dir]        # global install
```

---

## What it copies (26 files)

### `.kiro/skills/` — 7 skill SKILL.md files

| Skill | Governs |
|---|---|
| `automation-architect` | Hub: orchestrates all standards |
| `ui-pom-standard` | Page Object Model structure |
| `api-setup-teardown-standard` | API layer, setup/teardown, token lifecycle |
| `spec-organisation-standard` | Spec file organisation and TC naming |
| `spec-code-standard` | Spec code quality, imports, fixtures |
| `spec-quality-lifecycle-standard` | TC lifecycle quality, assertions, anti-flakiness |
| `git-workflow-docs-standard` | Git workflow + docs sync detection |

### `.kiro/steering/` — 7 steering files

| File | Inclusion | Purpose |
|---|---|---|
| `project-context.md` | always | Core project conventions |
| `framework-reference.md` | manual | Orchestrator — loads all 4 below at once |
| `framework-path-aliases.md` | manual | Full alias map |
| `framework-playwright-config.md` | manual | Config settings + npm scripts |
| `framework-tech-stack.md` | manual | Dependency versions |
| `framework-basepage-contract.md` | manual | BasePage contract |
| `pptx-workflow.md` | *(check)* | PowerPoint workflow reference |

### `.kiro/hooks/` — 1 hook

| File | Trigger | Purpose |
|---|---|---|
| `docs-sync-on-push.json` | PostToolUse | Checks doc sync after git push |

### `docs/` — 11 governance files

- `docs/wiki/ai-governance.md` — AI tooling conventions
- `docs/decisions/ADR-001-skill-naming-convention.md` — naming rationale
- All 9 skill meta-prompts in `docs/skills/`

---

## What it does NOT copy — manual configuration required

### MCP (Model Context Protocol)

`.kiro/settings/mcp.json` is intentionally excluded — it contains machine-specific
paths and authentication tokens that must be configured per developer.

**After running init:**
1. Create `.kiro/settings/mcp.json` manually
2. Use `.kiro/settings/mcp.example.json` (copied by init) as the starting template
3. Fill in the actual server paths and tokens for your machine

**Example `mcp.json`:**
```json
{
  "mcpServers": {
    "aws-docs": {
      "command": "uvx",
      "args": ["awslabs.aws-documentation-mcp-server@latest"],
      "env": { "FASTMCP_LOG_LEVEL": "ERROR" },
      "disabled": false
    }
  }
}
```

### Environment variables

`.env` is never copied. After init:
1. Copy `.env.example` to `.env`
2. Fill in `BASE_URL`, `TEST_USER_NAME`, `TEST_USER_PASSWORD`, `TEST_USER_ID`

### Framework steering files

The copied `framework-*.md` steering files contain configuration from this
(template) project. After init, adapt:
- `framework-tech-stack.md` — update dependency versions for your project
- `framework-path-aliases.md` — update aliases to match your `tsconfig.json`
- `framework-playwright-config.md` — update settings to match your config
- `framework-basepage-contract.md` — update if your BasePage differs

### `project-context.md` steering

Update with your project's specific conventions (project name, site URLs,
team conventions) — it's always-included, so keep it short (<50 lines).

---

## Skipping existing files

If a file already exists in the target, the init script skips it and reports
it as `(already exists — skipped)`. This makes it safe to run multiple times
or to selectively update: delete the files you want to regenerate, then re-run.

---

## Pending roadmap

These features are planned for future versions of the script. Document them
here so they inform the npm package design.

### Phase 2 — Flags and modes

| Flag | Behaviour |
|---|---|
| `--dry-run` | Print what would be copied without writing any files |
| `--skills-only` | Copy only `.kiro/skills/` — skip steering, hooks, docs |
| `--docs-only` | Copy only the `docs/` governance files |
| `--yes` | Skip confirmation prompts (non-interactive mode for CI) |
| `--force` | Overwrite existing files instead of skipping them |
| `--version` | Print the template version being used |

### Phase 3 — Interactive mode

When run without flags, prompt the user:
- Project name and tech stack (Playwright version, TypeScript version)
- Which skills to include (all, or select)
- Whether to initialize `tsconfig.json` path aliases
- Whether to configure MCP servers interactively

### Phase 4 — Smart adaptation

Instead of copying templates verbatim, adapt content to the target project:
- Replace placeholder project names in `project-context.md`
- Update tech stack versions in `framework-tech-stack.md` by reading the
  target's `package.json`
- Update path aliases in `framework-path-aliases.md` by reading the target's
  `tsconfig.json`

### Phase 5 — npm package

Extract the script into its own repo `automation-sdlc`:

```
automation-sdlc/
  bin/
    cli.js          ← entrypoint: automation-sdlc init [dir]
  templates/
    skills/         ← SKILL.md files (copied from web-automation repo on publish)
    steering/
    hooks/
    docs/
  src/
    init.js         ← core copy logic
    adapt.js        ← Phase 4 smart adaptation
    config.js       ← interactive prompts
  package.json      ← "bin": { "automation-sdlc": "bin/cli.js" }
```

Publish: `npm publish` → users run `npx automation-sdlc init`

### Phase 6 — Version updates

After a project is initialized, allow updating skills to the latest version:

```bash
# Update all skills from the template repo
automation-sdlc update

# Update a specific skill
automation-sdlc update spec-quality-lifecycle-standard
```

This requires a version manifest (`versions.json`) tracking which version of
each skill was installed.

---

## File structure created by `--init`

```
target-project/
  .kiro/
    skills/
      automation-architect/SKILL.md
      ui-pom-standard/SKILL.md
      api-setup-teardown-standard/SKILL.md
      spec-organisation-standard/SKILL.md
      spec-code-standard/SKILL.md
      spec-quality-lifecycle-standard/SKILL.md
      git-workflow-docs-standard/SKILL.md
    steering/
      project-context.md           ← adapt to your project
      framework-reference.md
      framework-path-aliases.md    ← adapt to your tsconfig.json
      framework-playwright-config.md ← adapt to your config
      framework-tech-stack.md      ← adapt to your versions
      framework-basepage-contract.md ← adapt if BasePage differs
    hooks/
      docs-sync-on-push.json
    settings/
      mcp.example.json             ← copy to mcp.json and fill in tokens
  docs/
    wiki/
      ai-governance.md
    decisions/
      ADR-001-skill-naming-convention.md
    skills/
      ai-automation-sdlc-onboarding-prompt.md
      automation-architect-skill-prompt.md
      api-setup-teardown-standard-prompt.md
      spec-organisation-standard-prompt.md
      spec-quality-lifecycle-standard-prompt.md
      git-workflow-docs-standard-prompt.md
      [and more...]
```
