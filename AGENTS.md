# Web Automation — Agent Context (Universal)

> This file is the shared agent context for both **Kiro** and **Claude Code**.
> - Kiro reads this alongside `.kiro/steering/project-context.md`
> - Claude Code reads `CLAUDE.md` (Claude-specific config) which references this via convention
>
> For governance decisions: `docs/wiki/ai-governance.md`  
> For dual-agent setup: `docs/wiki/dual-agent-setup.md`

---

## Repo Layout

```
src/
  api/sites/{site}/{client|controllers|endpoints|models}
  ui/pages/
    BasePage.ts           ← shared base class
    sites/{site}/         ← Page Objects per site
  fixtures/index.ts       ← all Playwright fixtures
  data/sites/{site}/      ← test data per site
  config/env.ts           ← ENV validation

tests/
  ui/smoke/sites/{site}/{feature}/TC{N}-{name}.spec.ts

docs/
  wiki/                   ← living framework docs
  decisions/              ← ADRs
  skills/                 ← skill meta-prompts (portable, agent-agnostic)
  agents/claude/          ← Claude-specific skill reference

.kiro/                    ← Kiro AI config (gitignored)
CLAUDE.md                 ← Claude Code config (auto-loaded)
AGENTS.md                 ← this file (universal context)
.mcp.example.json         ← MCP server template (copy → .mcp.json)
```

## Governance Rules

- **Language:** English for all code and docs
- **Secrets:** Never commit `.env`, credentials, or tokens
- **Imports:** Path aliases only — no relative `./` or `../` imports
- **Fixtures:** No `new Page()` in test bodies — use Playwright fixtures
- **Commits:** Conventional Commits format (`feat|fix|docs|chore|refactor`)
- **Git:** Push directly to `main` (single-developer course project)
- **Docs:** Update `docs/wiki/ai-governance.md` when AI tooling decisions change

## Skills (7 active)

| Skill | Domain |
|---|---|
| `automation-architect` | Hub — orchestrates all skills |
| `ui-pom-standard` | Page Object Model structure |
| `api-setup-teardown-standard` | API layer + setup/teardown |
| `spec-organisation-standard` | Spec file organisation |
| `spec-code-standard` | Spec code quality |
| `spec-quality-lifecycle-standard` | TC lifecycle quality |
| `git-workflow-docs-standard` | Git workflow + docs sync |

Full rules: `docs/agents/claude/skill-reference.md` (Claude) or `.kiro/skills/` (Kiro)

### Skills by role

When working as a specific role, load only the relevant skills:

| Role | Load these skills | Primary trigger |
|---|---|---|
| **QA Engineer** | `spec-organisation-standard` · `spec-code-standard` · `spec-quality-lifecycle-standard` · `api-setup-teardown-standard` | `"review tc quality"` / `"write tc"` |
| **Developer** | `ui-pom-standard` · `api-setup-teardown-standard` · `spec-code-standard` | `"apply architecture"` on `src/` |
| **Tech Lead / Architect** | `automation-architect` (full pipeline) | `"apply architecture"` |
| **Any role (pre-commit)** | `git-workflow-docs-standard` | `"check git"` |

> For single-developer projects: load `automation-architect` for the full pipeline,
> or load sub-skills directly for targeted work (lower credit cost).

## MCP Configuration

Template: `.mcp.example.json` → copy to `.mcp.json` and fill in credentials.  
Claude Code and Kiro both read `.mcp.json` from the project root.
