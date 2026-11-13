# Getting Started with Claude on This Project

> Quick reference for switching from Kiro to Claude Code on the web-automation project.

---

## Existing Project (web-automation)

`CLAUDE.md` is already committed — no init script needed.

```bash
# 1. Clone
git clone https://github.com/anaelince/web-automation.git
cd web-automation

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and fill in:
#   BASE_URL=https://demoqa.com
#   TEST_USER_NAME=web-automation
#   TEST_USER_PASSWORD=Test123!
#   TEST_USER_ID=<your-UUID-from-demoqa.com/profile>

# 4. Open in Claude Code
# CLAUDE.md loads automatically — Claude is ready
```

---

## Verify Claude is Working

After opening in Claude Code, say:

```
"apply architecture"
```

Claude will scan the project using the rules from `CLAUDE.md` and report any violations.

For the full rule set:

```
@docs/agents/claude/skill-reference.md
"review tc quality on tests/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts"
```

---

## Daily Workflow with Claude

### Writing a new test case

```
@docs/agents/claude/skill-reference.md
"write tc for TC03: Browse all available books — demoqa/books"
```

### Reviewing code quality

```
@docs/agents/claude/skill-reference.md
"apply architecture on src/ui/pages/sites/demoqa/"
```

### Scaffolding a new Page Object

```
@docs/agents/claude/skill-reference.md
"scaffold a Page Object for the demoqa Profile page"
```

### Checking git commit format

```
"check commit format: feat(tc03): add browse all books test"
```
Claude checks against C1 (Conventional Commits) from `CLAUDE.md`.

### Docs sync check (manual — no hooks in Claude)

After every commit that touches architectural files:

```
@docs/skills/living-docs-prompt.md
"check if docs are out of sync for the last commit"
```

---

## Loading Context on Demand

Claude only loads what you explicitly reference. Use `@file` for targeted context:

| Need | Load |
|---|---|
| Full skill rules | `@docs/agents/claude/skill-reference.md` |
| Path aliases reference | `@.kiro/steering/framework-path-aliases.md` |
| Playwright config | `@.kiro/steering/framework-playwright-config.md` |
| All framework context at once | `@.kiro/steering/framework-reference.md` |
| AI governance decisions | `@docs/wiki/ai-governance.md` |
| API layer reference | `@docs/wiki/api/demoqa-api-layer.md` |

---

## What Works Differently vs Kiro

| Feature | Kiro | Claude Code |
|---|---|---|
| Skill auto-activation | Automatic (`disclose_context`) | Manual (`@file`) |
| Post-commit docs check | Automatic (hook) | Manual (`@docs/skills/living-docs-prompt.md`) |
| Steering always-active | `.kiro/steering/project-context.md` | `CLAUDE.md` (auto-loaded) |
| Spec workflow (Requirements → Tasks) | Native Kiro Spec mode | Manual prompting |
| Hooks | `.kiro/hooks/` | Not supported |

---

## New Project (not web-automation)

If you want to set up the AI Automation SDLC framework in a **different** project:

```bash
# From the web-automation repo, target a new project directory
node scripts/init-automation-sdlc.js ../my-new-project --agent=claude

# This creates:
#   CLAUDE.md
#   docs/agents/claude/skill-reference.md
#   docs/wiki/ai-governance.md
#   docs/wiki/dual-agent-setup.md
#   docs/decisions/ADR-001-skill-naming-convention.md
#   docs/skills/ (all skill meta-prompts)
```

Then adapt `CLAUDE.md` to reflect your new project's tech stack, site URLs, and conventions.

---

## Key Files for Reference

| File | Purpose |
|---|---|
| `CLAUDE.md` | Always-loaded config (auto-read by Claude Code) |
| `docs/agents/claude/skill-reference.md` | Full rules for all 7 skills in Claude format |
| `docs/wiki/ai-governance.md` | AI tooling conventions and decisions |
| `docs/wiki/dual-agent-setup.md` | Kiro vs Claude architecture comparison |
| `docs/wiki/init-script.md` | Init script reference and pending roadmap |
| `docs/skills/ai-automation-sdlc-onboarding-prompt.md` | Full bootstrap prompt for any agent |
