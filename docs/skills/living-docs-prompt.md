# Meta-prompt: Living Documentation Enhancement

Apply this prompt to implement commit-time living documentation in an existing
Playwright + TypeScript project that already has `git-workflow-docs-standard` and `automation-architect`
skills configured.

**No new skill is created.** Two existing skills are updated and one Kiro hook is added:

1. **`git-workflow-docs-standard`** — expand check C4 from "README only" to "README + wiki" detection
2. **`automation-architect`** — expand Mode 5 from "README Sync" to "Docs Sync"
3. **Kiro hook** — `Stop` trigger that runs the sync automatically after a commit session

---

## Core principle — Docs that earn their place

Living documentation is **not** auto-generated prose on every commit. It is a targeted
update to a small set of authoritative documents that reflect the actual state of the
framework at a given point in time.

A documentation update is justified when and only when:

> **The public interface of a layer changed** — meaning another developer's mental model
> of the framework would be wrong without the update.

Internal changes (variable rename, extract method, bug fix inside a function, test
assertion tweak) do not change the public interface and do not warrant doc updates.

---

## Trigger Map — what changes require what docs

This is the single source of truth for all doc-sync decisions in both skills and the hook.

| Files changed in commit | Doc(s) to update | Section |
|------------------------|-----------------|---------|
| New site added under any `sites/` layer | `README.md` | §6 Repository Structure |
| New skill added/retired in `.kiro/skills/` | `README.md` | §9 Kiro AI Skills |
| `playwright.config.ts` — new project/browser/setting | `README.md` | §3 Prerequisites or §5 Commands |
| `package.json` — new/changed script or major dep version | `README.md` | §3 or §5 |
| `src/api/sites/{site}/` — new controller, endpoint, or model | `docs/wiki/api/{site}-api-layer.md` | Relevant layer section |
| New site added to `src/api/sites/` | Create `docs/wiki/api/{site}-api-layer.md` | Full file |
| `tests/ui/smoke/sites/{site}/{feature}/` — new TC file | `docs/test-cases/{site}/{feature}-test-cases.md` | Add TC entry |
| New site added to `tests/` | Create `docs/test-cases/{site}/` folder and index | Full file |
| `.kiro/skills/*.md` content changed (rules, modes) | `docs/skills/{skill-name}-skill-prompt.md` | Relevant rule/mode |
| `src/ui/pages/BasePage.ts` changed | `README.md` | §7 Framework Architecture |
| `src/fixtures/index.ts` — new fixture type added | `README.md` | §7 Framework Architecture |

### Changes that do NOT trigger documentation

| Change type | Reason |
|-------------|--------|
| Bug fix inside a controller or PO method | Internal — no interface change |
| Rename a variable or extract a helper | Refactor — public API unchanged |
| Add/modify a test assertion | Test quality — no structural change |
| Fix a selector in a Page Object | Bug fix — same locator concept |
| Update a comment or JSDoc | Already documented inline |
| `src/config/env.ts` — add an optional ENV var | Only update `.env.example`; not a structural change |
| Add a new `test.step()` to an existing spec | Step labelling — no TC boundary change |

---

## Documentation quality guidelines

Apply these when writing or updating any doc in `docs/`:

### 1 — Write for the new team member

The target reader is a developer joining the team today. They know TypeScript and
Playwright but have never seen this codebase. Every doc should answer one of:
- "What does this layer do and when do I use it?"
- "What are the rules I must follow in this area?"
- "Where do I put a new file of type X?"

### 2 — Table-first, prose-second

Prefer tables and code examples over explanatory prose. A well-structured table is
faster to scan and harder to misread than three paragraphs of narrative.

### 3 — One file, one concern

Each wiki file covers exactly one layer or one site. `docs/wiki/api/demoqa-api-layer.md`
covers the demoqa API layer. It does not describe the UI Page Objects or the fixtures.
Cross-references are links, not embedded content.

### 4 — Reflect reality, not aspiration

Document what the code **currently does**, not what it might do in the future. Future
work belongs in a TODO comment in the code or an ADR, not in the wiki.

### 5 — Minimal viable update

When updating an existing doc:
- Change only the section(s) affected by the commit
- Do not rewrite unrelated sections
- Do not add commentary about why something changed — that belongs in the commit message

### 6 — Stale beats wrong

If you are unsure whether a doc section is accurate, leave it unchanged and add a note:
`> ⚠ This section may be outdated — verify against the code before relying on it.`
Never update a doc to reflect something you have not verified in the code.

---

## C4 expansion for `git-workflow-docs-standard`

Replace the existing C4 check with this expanded version.

### C4 — DOCS_SYNC (WARNING)

**Condition:** The branch contains commits that modified architectural files but
the corresponding documentation was NOT updated in the same branch.

**How to check:**
```bash
git diff origin/main...HEAD --name-only
```

**Detection matrix:**

| If these files appear in the diff... | And these doc files do NOT appear... | Warning |
|--------------------------------------|---------------------------------------|---------|
| `.kiro/skills/**` or `playwright.config.ts` or `package.json` | `README.md` | README out of sync |
| `src/api/sites/{site}/**` | `docs/wiki/api/{site}-api-layer.md` | Wiki out of sync |
| `tests/ui/smoke/sites/{site}/{feature}/**` new TC files | `docs/test-cases/{site}/**` | Test cases doc out of sync |
| `src/ui/pages/BasePage.ts` or `src/fixtures/index.ts` | `README.md` | README out of sync |

**Output when triggered:**
```
[git-workflow-docs-standard] WARNING — DOCS_SYNC
  README.md out of sync:        architectural files changed without README update
  → run: "update docs" in automation-architect (Mode 5) to sync

  docs/wiki/api/demoqa-api-layer.md out of sync: src/api/sites/demoqa/ was modified
  → run: "update docs" in automation-architect (Mode 5) to sync
```

**Output when clean:**
```
[git-workflow-docs-standard] DOCS_SYNC — ✅ No documentation drift detected
```

---

## Mode 5 expansion for `automation-architect`

Rename Mode 5 from "README Sync" to **"Docs Sync"** and add wiki and test-cases sync.

### New Mode 5 trigger phrases

Add: `"update docs"` · `"sync docs"` · `"docs out of date"` · `"update wiki"`
Keep existing: `"update readme"` · `"sync readme"` · `"readme out of date"` · `"update docs"`

### New tracked files and sections

Extend the tracked sections table:

| Document | Trigger files | Update rule |
|----------|--------------|-------------|
| `README.md` §3–§10 | (existing rules) | (existing logic) |
| `docs/wiki/api/{site}-api-layer.md` | `src/api/sites/{site}/**` | Update the section for the changed layer (client, controllers, endpoints, models); apply Trigger Map |
| `docs/test-cases/{site}/{feature}-test-cases.md` | `tests/ui/smoke/sites/{site}/{feature}/**` | Add entry for each new TC; remove entry for each deleted TC |

### New Steps (insert after existing Step 4, before "Output")

```
5. For each src/api/sites/{site}/ directory modified since the last docs update:
   - Read the corresponding docs/wiki/api/{site}-api-layer.md
   - Compare each section against the actual source files
   - Update only the sections whose source content changed
   - Do NOT rewrite unchanged sections

6. For each new *.spec.ts file added under tests/ui/smoke/sites/{site}/{feature}/:
   - Check if docs/test-cases/{site}/ exists; create it if not
   - Check if a TC doc for this feature exists; create or update it
   - Add a row for each new test() found in the spec file
   - Remove rows for any test() that was deleted
```

### Updated output format

```
[automation-architect] DOCS SYNC
─────────────────────────────────────────
README.md:
  §3 Prerequisites:                 IN SYNC | UPDATED
  §5 Commands:                      IN SYNC | UPDATED — added 'test:regression'
  §6 Structure:                     IN SYNC | UPDATED — added 'src/api/' folder entry
  §7 Architecture:                  IN SYNC
  §9 Kiro AI Skills:                IN SYNC | UPDATED — added 'api-setup-teardown-standard' row
  §10 Git Workflow:                 IN SYNC

Wiki:
  docs/wiki/api/demoqa-api-layer.md IN SYNC | UPDATED — BookController.deleteBook added
  docs/wiki/api/saucedemo-api.md    SKIPPED — no src/api/sites/saucedemo/ exists yet

Test cases:
  docs/test-cases/demoqa/           IN SYNC | UPDATED — TC02 entry added
─────────────────────────────────────────
[automation-architect] ✅ All documentation is up to date.
                     OR
[automation-architect] Documentation updated — <N> file(s) changed.
```

---

## Kiro Hook — Stop trigger

Create `.kiro/hooks/docs-sync-reminder.json`:

```json
{
  "version": "v1",
  "hooks": [{
    "name": "Docs Sync Reminder",
    "trigger": "Stop",
    "action": {
      "type": "agent",
      "prompt": "Check if the current session included any git commits. If it did, run git diff HEAD~1 HEAD --name-only and compare the changed files against the Trigger Map in docs/skills/living-docs-prompt.md. If any architectural files changed without a corresponding docs update in this session, output a concise summary of which docs are out of sync and suggest running 'update docs' in automation-architect. If everything is in sync or no commits were made, say nothing."
    }
  }]
}
```

**What it does:**
- Fires at the end of every Kiro session
- Checks only the diff since the last commit (not the full history)
- Outputs at most one reminder block — never noisy
- Silent when there's nothing to do

---

## Anti-patterns to enforce

Document these as explicit rules in both skills to prevent doc rot:

| Anti-pattern | Rule |
|---|---|
| Documenting implementation details | Only document **what** and **when**, not **how** (that's what code comments are for) |
| Creating a doc for every new file | Only create wiki entries for **layers** and **sites**, not individual files |
| Keeping docs that describe deleted code | Delete or archive the section immediately |
| Duplicating README content in the wiki | README = project-level orientation; wiki = layer-level reference. No overlap |
| Adding "planned features" to wiki | Aspirational content belongs in issues/ADRs, not live docs |

