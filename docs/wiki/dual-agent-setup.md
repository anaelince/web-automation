# Dual-Agent Setup — Kiro + Claude

> This project supports two AI agents: **Kiro** and **Claude Code**.
> Both share the same skill rules and governance decisions — only the
> configuration format and activation mechanism differ.

---

## Why Dual-Agent

The AI Automation SDLC framework was designed to be agent-agnostic from day one
(see `docs/skills/ai-automation-sdlc-onboarding-prompt.md`). Supporting Kiro and
Claude simultaneously allows:

- Developers to use whichever agent they have access to
- The same conventions to be enforced regardless of agent
- Portability to new agents in the future (GitHub Copilot Workspace, Cursor, etc.)

---

## Architecture

```
docs/skills/           ← Canonical source of truth (agent-agnostic prompts)
     │                               │
     ▼                               ▼
.kiro/skills/           CLAUDE.md + docs/agents/claude/
(Kiro SKILL.md format)  (Claude Code format)
     │                               │
.kiro/steering/         @file references in conversation
.kiro/hooks/            (no Claude equivalent for hooks)
```

Both agents read from the same `docs/` governance layer.

---

## Configuration Files by Agent

| Purpose | Kiro | Claude Code |
|---|---|---|
| Always-active rules | `.kiro/steering/project-context.md` | `CLAUDE.md` |
| Skill enforcement | `.kiro/skills/{skill}/SKILL.md` (loaded via disclose_context) | `docs/agents/claude/skill-reference.md` (loaded via `@file`) |
| Framework reference | `.kiro/steering/framework-*.md` (manual, `#file`) | `@docs/agents/claude/skill-reference.md` or steering files |
| Event-driven automation | `.kiro/hooks/*.json` | Not supported by Claude |
| MCP servers | `.kiro/settings/mcp.json` | Same file (Claude Code also uses MCP) |

---

## Activation Comparison

| Task | Kiro | Claude Code |
|---|---|---|
| Load all framework context | `#framework-reference` | `@docs/agents/claude/skill-reference.md` |
| Run full pipeline | Say `"apply architecture"` with `automation-architect` loaded | Say `"apply architecture"` after loading `@skill-reference.md` |
| Review TC quality | Say `"review tc quality"` with `spec-quality-lifecycle-standard` loaded | Say `"review tc quality"` after loading `@skill-reference.md` |
| Check git conventions | Say `"check git"` with `git-workflow-docs-standard` loaded | Ask Claude to check commits against C1/C4 rules in `CLAUDE.md` |

---

## `CLAUDE.md` — What It Contains

`CLAUDE.md` in the project root is read automatically by Claude Code at the
start of every conversation. It contains:

1. **Project overview** — brief description, site URL, ENV vars
2. **Site-based architecture** — how `sites/` subfolders are organized
3. **Path aliases** — critical for correct imports
4. **Skills table** — which skills apply and how to load their full rules
5. **Critical rules** — the most important rules condensed (not the full R1–R10)
6. **Fixture naming** — `<r>Controller`, `created<R>`, `clean<R>`, `mock<R>`
7. **Documentation map** — where to find governance docs, ADRs, skill specs

**Credit strategy:** Keep `CLAUDE.md` concise. Full rules live in
`docs/agents/claude/skill-reference.md` and are loaded on demand with `@file`.

---

## `docs/agents/claude/skill-reference.md` — What It Contains

Condensed rule sets for all 7 skills in a format Claude can reason about.
Each rule includes: condition, why it matters, and the fix.

Load it when you need Claude to enforce a specific skill:
```
@docs/agents/claude/skill-reference.md
"review tc quality on tests/ui/smoke/sites/demoqa/books/TC02-add-book-to-collection.spec.ts"
```

---

## Init Script — Dual-Agent Support

`scripts/init-automation-sdlc.js` supports an `--agent` flag:

```bash
# Kiro only (default)
node scripts/init-automation-sdlc.js ../new-project --agent=kiro

# Claude only
node scripts/init-automation-sdlc.js ../new-project --agent=claude

# Both (recommended)
node scripts/init-automation-sdlc.js ../new-project --agent=both
```

| Flag | Creates |
|---|---|
| `--agent=kiro` | `.kiro/skills/`, `.kiro/steering/`, `.kiro/hooks/` |
| `--agent=claude` | `CLAUDE.md`, `docs/agents/claude/skill-reference.md` |
| `--agent=both` | All of the above |

---

## What Claude Cannot Do That Kiro Can

| Feature | Kiro | Claude Code |
|---|---|---|
| Hooks (event-driven automation) | ✅ `.kiro/hooks/` | ❌ Not supported |
| Auto-activation of skills by intent | ✅ `auto` steering + `disclose_context` | ❌ Manual `@file` only |
| Steering file composition (`#[[file:...]]`) | ✅ | ❌ |
| Spec workflow (requirements → design → tasks) | ✅ Kiro Spec mode | ❌ Manual prompting |

**Workaround for hooks in Claude:** Handle post-commit doc sync manually by
including the C4 trigger map in `CLAUDE.md` and checking it after each commit.

---

## Keeping Both Agents in Sync

When a skill rule changes:
1. Update the skill's `SKILL.md` in `.kiro/skills/` (Kiro format)
2. Update the corresponding section in `docs/agents/claude/skill-reference.md` (Claude format)
3. Update `CLAUDE.md` if the rule is in the "Critical Rules" section
4. Commit with `docs(agents): ...` prefix

The `docs/skills/` meta-prompts are the master source — SKILL.md and skill-reference.md
are both generated/derived from them.
