---
name: git-workflow-docs-standard
description: >
  Enforce and execute git workflow conventions for Playwright + TypeScript projects.
  Two capabilities: Validate (read-only check of branch name, commit format, type
  coverage) and Execute (create branch, commit, push, open PR following conventions).
  Load independently for any git workflow task or invoke through automation-architect
  Mode 4.
---

## Project Context

- Branch naming pattern: `(test|fix)/<kebab-case-scope>`
  - `test/` — new test case additions
  - `fix/` — defect corrections
- Commit messages follow Conventional Commits: `type(scope): description`
  - Allowed types: `feat`, `fix`, `refactor`, `chore`, `docs`
  - Scope is optional; when present it must be kebab-case
  - Description starts with lowercase, no period at end
- Every branch must contain at least one `feat` or `fix` commit before merging
- PR target branch is always `main`; never push directly to `main`
- Use `gh` CLI for PR creation
- Stage specific files only — never `git add .` or `git add -A`
- Never force-push, never skip hooks (`--no-verify`)

---

## Capability 1 — Validate (read-only)

**Triggers:** `"check git"` · `"verify commits"` · `"git conventions"` · `"pre-PR check"`

Reads current git state and reports violations. Never modifies commits, branches, or files.

### Checks

---

#### C1 — COMMIT_FORMAT (ERROR)

**Condition:** A commit message on the branch does not match:
```
^(feat|fix|refactor|chore|docs)(\([a-z0-9][a-z0-9-]*\))?: [a-z].+[^.]$
```

**How to get commits:**
```bash
git log origin/main..HEAD --format="%s"
# fallback:
git log main..HEAD --format="%s"
```

**Valid examples:**
```
feat(tc8): add products page verification          ✅
fix(login): correct redirect after logout          ✅
chore: update playwright version                   ✅
docs(readme): add setup instructions               ✅
refactor(products): extract search method to po    ✅
```

**Invalid examples:**
```
Added products test                                ❌  no type
feat: Added products test                          ❌  uppercase in description
fix: correct redirect after logout.               ❌  ends with period
Feature(tc8): add products page                    ❌  type not lowercase
```

---

#### C2 — BRANCH_NAME (ERROR)

**Condition:** Current branch name does not match `^(test|fix)/[a-z0-9][a-z0-9-]*$`

**How to get branch name:**
```bash
git branch --show-current
```

**Valid examples:**
```
test/tc8-verify-products        ✅
test/tc9-search-product         ✅
fix/login-redirect              ✅
fix/tc3-incorrect-credentials   ✅
```

**Invalid examples:**
```
feature/products                ❌  prefix not allowed
test/TC8_VerifyProducts         ❌  uppercase and underscore
main                            ❌  no prefix
fix/                            ❌  empty scope
```

---

#### C3 — SUBSTANTIVE_COMMIT (ERROR)

**Condition:** The branch has no commit with type `feat` or `fix`.

A branch with only `chore`, `docs`, or `refactor` commits has no substantive change
and cannot be merged until it contains at least one `feat` or `fix`.

---

#### C4 — DOCS_SYNC (WARNING)

**Condition:** The branch contains commits that modified architectural files but the
corresponding documentation was NOT updated in the same branch.

**How to check:**
```bash
git diff origin/main...HEAD --name-only
```

**Detection matrix — apply each row independently:**

| If these files appear in the diff... | And these doc files do NOT appear... | Warning text |
|--------------------------------------|---------------------------------------|--------------|
| `.kiro/skills/**` | `README.md` | README §9 Kiro AI Skills out of sync |
| `playwright.config.ts` or `package.json` or `tsconfig.json` | `README.md` | README §3 or §5 out of sync |
| `src/ui/pages/BasePage.ts` or `src/fixtures/index.ts` (new fixture type) | `README.md` | README §7 out of sync |
| Any new `src/api/sites/{site}/` files | `docs/wiki/api/{site}-api-layer.md` | Wiki API layer out of sync |
| Any new `tests/ui/smoke/sites/{site}/{feature}/*.spec.ts` | `docs/test-cases/{site}/**` | Test cases doc out of sync |

**Changes that do NOT trigger C4** (internal, no public interface change):
- Bug fixes inside a method body
- Selector updates in a Page Object
- Test assertion changes
- Comment or JSDoc updates
- Adding `test.step()` to an existing spec

**Why:** Documentation must reflect the current state of the framework — but only
when the **public interface** of a layer changed. Over-triggering creates noise that
makes developers ignore warnings.

**Fix guidance:**
Load `automation-architect` and trigger Mode 5:
> "update docs"

Mode 5 will detect which sections are stale and update only those. This is a
**WARNING** — the developer decides whether the change is significant enough to document.

---

### Validate output format

```
[git-workflow-docs-standard] VALIDATE
──────────────────────────────────────
Branch name:      PASS | VIOLATION — <detail>
Commit format:    <N> valid / <N> invalid
  VIOLATION: "<raw message>"
             — expected: type(scope): description
             — allowed types: feat, fix, refactor, chore, docs
Commit coverage:  PASS | VIOLATION
                  — no feat or fix commit found on this branch
Docs sync:        IN SYNC | WARNING
                  — README.md: .kiro/skills/ changed but README §9 not updated
                  — docs/wiki/api/demoqa-api-layer.md: src/api/sites/demoqa/ changed
                  — run "update docs" in automation-architect (Mode 5) to sync
──────────────────────────────────────
[git-workflow-docs-standard] ✅ Conventions valid — ready to push / open PR.
             OR
[git-workflow-docs-standard] ⚠️  <N> issue(s) found — resolve before proceeding.
```

### Fix guidance (included in output when violations exist)

| Violation | Command |
|-----------|---------|
| Bad branch name | `git branch -m <new-name>` |
| Bad last commit message | `git commit --amend -m "type(scope): description"` |
| Bad older commit message | `git rebase -i origin/main` → `reword` the offending commits |
| No feat or fix commit | Add a `feat` or `fix` commit before pushing |

---

## Capability 2 — Execute (write operations)

Performs git operations following the project's conventions. Always validates
conventions before executing. Stops and reports if validation fails.

### Safety rules (non-negotiable)

- Never push to `main` or `master` directly
- Never use `--force` or `--force-with-lease` without explicit user confirmation
- Never use `--no-verify`
- Never amend a commit that has already been pushed to the remote
- Always stage specific files — never `git add .` or `git add -A`
- Always run Validate (Capability 1) before any write operation

---

### E1 — Create Branch

**Triggers:** `"create branch"` · `"new branch"` · `"start branch"`

**Steps:**
1. Ask (or infer from context):
   - Type: `test` (new TC) or `fix` (defect correction)?
   - Scope: TC ID or feature name in kebab-case (e.g. `tc8`, `login`, `products`)
2. Construct branch name: `{type}/{scope}` (e.g. `test/tc8-verify-products`)
3. Validate the name against C2 pattern before creating
4. Execute:
   ```bash
   git checkout -b {type}/{scope}
   ```

**Output:**
```
[git-workflow-docs-standard] BRANCH CREATED
Branch: test/tc8-verify-products
```

---

### E2 — Commit

**Triggers:** `"commit"` · `"git commit"` · `"create commit"`

**Steps:**
1. Run Validate — stop if C2 (branch name) fails
2. Show uncommitted changes:
   ```bash
   git status
   ```
3. Ask (or infer from context):
   - Which files to stage? (list specific files — never all)
   - Commit type: `feat` / `fix` / `refactor` / `chore` / `docs`
   - Scope (optional): kebab-case, e.g. `tc8`, `products`, `login`
   - Description: lowercase imperative, no period (e.g. `add products page verification`)
4. Construct and validate the message:
   ```
   {type}({scope}): {description}
   ```
5. Stage the specified files:
   ```bash
   git add {file1} {file2} ...
   ```
6. Execute commit:
   ```bash
   git commit -m "{type}({scope}): {description}"
   ```

**Output:**
```
[git-workflow-docs-standard] COMMIT CREATED
Message: feat(tc8): add products page verification
Files staged: tests/ui/smoke/products/TC8-verify-all-products-and-detail.spec.ts
              src/ui/pages/ProductsPage.ts
```

---

### E3 — Push

**Triggers:** `"push"` · `"git push"` · `"push branch"`

**Steps:**
1. Run full Validate — stop if any violation exists
2. Check if branch has a remote tracking branch:
   ```bash
   git rev-parse --abbrev-ref --symbolic-full-name @{u}
   ```
3. If no tracking branch (new branch):
   ```bash
   git push -u origin {branch-name}
   ```
4. If tracking branch already exists:
   ```bash
   git push
   ```

**Output:**
```
[git-workflow-docs-standard] PUSHED
Branch: test/tc8-verify-products → origin/test/tc8-verify-products
```

---

### E4 — Create PR

**Triggers:** `"create PR"` · `"open PR"` · `"pull request"` · `"new PR"`

**Steps:**
1. Run full Validate — stop if any violation exists
2. Collect PR metadata:
   - Title: derived from branch name and last `feat`/`fix` commit message
   - TC list: read from `test()` names in changed spec files
   - Changed files: from `git diff main...HEAD --name-only`
3. Create PR using `gh` CLI:
   ```bash
   gh pr create \
     --title "{type}({scope}): {description}" \
     --body "{structured body below}" \
     --base main
   ```

**PR body template:**
```markdown
## Summary
{description derived from feat/fix commits on the branch}

## Test Cases
{list of TC{N}: names from changed spec files}

## Changes
{list of new or modified files}

## Checklist
- [ ] All tests pass locally
- [ ] No hardcoded credentials
- [ ] Spec files follow TC folder/naming conventions
- [ ] Page Objects follow POM rules
```

**Output:**
```
[git-workflow-docs-standard] PR CREATED
Title:  feat(tc8): add products page verification
URL:    https://github.com/{owner}/{repo}/pull/{number}
```

---

### E5 — Full Workflow

**Triggers:** `"git workflow"` · `"commit push PR"` · `"full git"` · `"submit work"`

Runs the complete sequence: validate → commit → push → PR.

**Steps:**
1. Run Validate — stop and report if any violation
2. Execute E2 (Commit) — collect details and commit
3. Execute E3 (Push)
4. Execute E4 (Create PR)

**Output:**
```
[git-workflow-docs-standard] WORKFLOW COMPLETE
──────────────────────────────────────
Committed:  feat(tc8): add products page verification
Pushed:     test/tc8-verify-products → origin
PR:         https://github.com/{owner}/{repo}/pull/{number}
──────────────────────────────────────
[git-workflow-docs-standard] ✅ Work submitted — ready for review.
```


