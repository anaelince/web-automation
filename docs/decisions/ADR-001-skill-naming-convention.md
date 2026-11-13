# ADR-001 — Skill Naming Convention

**Date:** 2026-11-11  
**Status:** Accepted  
**Applies to:** All Kiro AI skills under `.kiro/skills/`

---

## Context

The project's Kiro skill system grew organically. Early skills were named after their
implementation role (`ui-pom-standard`, `api-setup-teardown-standard`) or their artifact type
(`test-standards`, `spec-standards`). As the system expanded beyond four skills, two
problems emerged:

1. **Names do not reveal purpose** — `ui-pom-standard` does not tell you it enforces the
   UI Page Object layer. `api-setup-teardown-standard` does not tell you it governs API
   setup and teardown.

2. **No shared pattern** — `ui-pom-standard`, `test-standards`, and `git-workflow-docs-standard` follow
   three different naming styles. A new team member cannot predict what a skill called
   `api-setup-teardown-standard` does without reading its SKILL.md.

The goal is a convention that makes each skill's domain and objective readable from
its name alone, without opening any file.

---

## Options Considered

### Option A — Keep current names, improve descriptions
Add a richer `description:` field to each SKILL.md frontmatter.

**Rejected:** Descriptions are only visible after loading the skill. Names must work
at the directory listing level.

### Option B — Prefix all skills with the layer they govern
`ui-ui-pom-standard`, `api-api-setup-teardown-standard`, `spec-organisation-architect`, …

**Rejected:** The `-architect` suffix implies design/scaffolding work. Most skills
primarily enforce standards, not design systems.

### Option C — `{domain}-{objective}-standard` pattern (selected)
Domain = the layer the skill governs (`ui`, `api`, `spec`, `git`).
Objective = what the skill enforces within that domain (`pom`, `code`, `organisation`, …).
Suffix = `standard` (consistent, communicates enforcement).

**Accepted:** Reads naturally, is consistent, and scales to new domains.

---

## Decision

Adopt `{domain}-{objective}-standard` as the naming pattern for all domain skills.
The hub skill (`automation-architect`) retains its name — it is an orchestrator, not
a domain standard, and the `-architect` suffix correctly signals orchestration.

### Full naming map

| Previous name | New name | Domain | Objective |
|---------------|----------|--------|-----------|
| `automation-architect` | `automation-architect` | Hub | Orchestration — no change |
| `ui-pom-standard` | `ui-pom-standard` | `ui` | Page Object Model structure |
| `api-setup-teardown-standard` | `api-setup-teardown-standard` | `api` | Setup and teardown infrastructure |
| `git-workflow-docs-standard` | `git-workflow-docs-standard` | `git` | Workflow conventions + docs sync |
| `spec-standards` | `spec-organisation-standard` | `spec` | File organisation and naming |
| `test-standards` | `spec-code-standard` | `spec` | Spec code quality |
| `spec-quality-lifecycle-standard` *(new)* | `spec-quality-lifecycle-standard` | `spec` | TC quality across the full test lifecycle |

### Naming rules for future skills

1. **Domain prefix** — matches the source layer it governs:
   - `ui-` → `src/ui/`
   - `api-` → `src/api/`
   - `spec-` → `tests/**/*.spec.ts`
   - `git-` → git state and workflow
   - `data-` → `src/data/` (reserved)
   - `config-` → `src/config/` (reserved)

2. **Objective segment** — describes what the skill enforces within that domain.
   Use a noun or compound noun, not a verb.
   ✅ `pom`, `code`, `organisation`, `quality-lifecycle`, `workflow-docs`
   ❌ `checking`, `enforcing`, `reviewing`

3. **`-standard` suffix** — always. Signals enforcement/standards role.

4. **Hub exception** — `automation-architect` retains `-architect` to signal
   orchestration. Future hub/orchestrator skills may use `-architect`.

5. **Split rule** — if a skill's scope grows beyond its domain prefix, split into two
   skills rather than rename. Do not create `ui-api-standard`.

---

## Consequences

**Immediate:**
- Three skills renamed: `ui-pom-standard`, `api-setup-teardown-standard`, `git-workflow-docs-standard`
- All references in `docs/`, `README.md`, and `automation-architect/SKILL.md` updated
- `docs/skills/` prompt files renamed to match

**Ongoing:**
- Every new skill proposal must include a name that follows this pattern
- The PR checklist for new skills includes: "name follows `{domain}-{objective}-standard`"
- `spec-code-standard` has a documented growth note: if general TypeScript code quality
  rules are needed across all `src/` layers, create a separate `code-standard` skill
  rather than expanding `spec-code-standard` beyond its `spec` domain

**Not affected:**
- Skill SKILL.md content (rules, modes, examples) — only names and references change
- `.gitignore` excludes `.kiro/` so skill folder renames are not committed to git
  (prompt files in `docs/skills/` are committed)

