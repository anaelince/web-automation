# Manual steps: Module 10 — CI with GitHub Actions + Reports

Companion of [`m10-ci-github-actions-implementation-prompt.md`](m10-ci-github-actions-implementation-prompt.md).

The prompt makes the AI agent do every change **inside the repository**. The steps below are
done **by you**, on your machine or on `https://github.com/anaelince/web-automation`, because they
involve account settings, credentials, or the live demo. The agent cannot see GitHub pages and
never enters secret values.

---

## How both parts interleave

```
 YOU                                   AGENT (prompt)
 ───                                   ──────────────
 M0  Prepare the workspace
       │
       ├──────────────────────────────▶ Tasks 1–8  implement + verify locally
       │                                Task 9     commit locally (no push)
       │                                Task 10    ⏸ STOP → lists Variables/Secrets
       │◀──────────────────────────────┘
 M1  Settings → Actions
 M2  Create Variables + Secrets
       │  reply "done"
       ├──────────────────────────────▶ Task 11    git push → triggers Run 1
       │◀──────────────────────────────┘
 M3  Check Run 1 (automatic)
 M4  Run 2 (manual, @smoke)
 M5  Run 3 (optional, failure demo) ──▶ agent pushes failing test, then reverts it
 M6  Show report + trace
 M7  After the demo (pause workflow)
```

| Step | Who | Where | Depends on | Unblocks |
|---|---|---|---|---|
| M0 | You | Local machine | — | Tasks 1–9 |
| Tasks 1–9 | Agent | Repository (local) | M0 | Task 10 |
| Task 10 | Agent | Chat | Task 9 | M1–M2 |
| M1–M2 | You | github.com → Settings | Task 10 list | Task 11 |
| Task 11 | Agent | `git push` | M2 "done" | M3 |
| M3–M7 | You | github.com → Actions | Task 11 | — |

---

## M0 — Prepare the workspace (before running the prompt)

- [ ] Close PowerPoint / LibreOffice so the `docs/course/.~lock.*.pptx#` files disappear.
- [ ] Decide whether the M7–M10 `.pptx` files are committed (the prompt does not commit them).
- [ ] Make sure your local `.env` has `BASE_URL=https://demoqa.com` — the agent's local
      verification (Task 8) runs the real suite.
- [ ] `git status` is clean or only has changes you want to keep; `git pull` on `main`.
- [ ] Confirm `git push` works from this machine (credentials already configured).

➡ Run the prompt. The agent works until **Task 10** and stops.

---

## M1 — Settings → Actions → General

- [ ] **Actions permissions:** *Allow all actions and reusable workflows* (or at least
      GitHub-authored + verified creators).
- [ ] **Workflow permissions:** *Read repository contents and packages permissions*.
      The workflow declares `contents: read` itself.
- [ ] **Artifact and log retention:** 14 days or more (the report artifact uses 14).

## M2 — Settings → Secrets and variables → Actions

Use the exact list the agent prints in Task 10. Expected names:

**Variables tab** (not secret, visible in logs):

| Name | Value | Required |
|---|---|---|
| `BASE_URL` | `https://demoqa.com` | ✅ — Run 1 fails without it |
| `SAUCEDEMO_BASE_URL` | `https://www.saucedemo.com` | optional (default) |
| `AUTOMATIONEXERCISE_BASE_URL` | `https://automationexercise.com` | optional (default) |
| `TEST_DATA_PREFIX` | `qa_` | optional |
| `ALLOW_DESTRUCTIVE_CLEANUP` | `false` | optional |

**Secrets tab** (masked, never printed):

| Name | Required |
|---|---|
| `TEST_USER_NAME` / `TEST_USER_PASSWORD` | only if a test logs in with a seeded demoqa user |
| `SAUCEDEMO_USER_NAME` / `SAUCEDEMO_USER_PASSWORD` | optional (public demo account is the default) |

- [ ] Create them with **New repository variable** / **New repository secret**.
- [ ] Type the values only in GitHub — never paste them in the chat.
- [ ] Reply **"done"** to the agent.

➡ The agent runs **Task 11**: `git push origin main`, which triggers Run 1.

---

## M3 — Run 1 (automatic, triggered by the push)

- [ ] **Actions** tab → **Playwright Tests** → latest run on `main`.
- [ ] Two jobs `test (1, 2)` and `test (2, 2)` run in parallel on Windows, then `merge-reports`.
- [ ] Open the run **Summary**: title `[Full][PASSED]` (or `[FAILED]`), metadata table
      (event, branch, commit, author, OS, Node, Playwright, browser, target host) and counts
      table (✅ passed, ❌ failed, ⚠️ flaky, ⏭️ skipped, duration).
- [ ] Artifacts section: `playwright-report` exists (the `blob-report-*` ones are intermediate).
- [ ] README badge turns green (or red if Run 1 failed).

If Run 1 fails: open the failing job log. `Missing required variable(s) "BASE_URL"` → go back to
M2. A test failure → tell the agent the test name and error and ask for a diagnosis.

## M4 — Run 2 (manual, for the demo)

- [ ] **Actions** → **Playwright Tests** → **Run workflow ▾**.
- [ ] Branch `main`, `suite` = `@smoke` (dropdown), `workers` = `2` → **Run workflow**.
- [ ] Show that only the smoke tests ran: Summary title `[Smoke][PASSED]`, 3 tests
      (event = `workflow_dispatch`).
- [ ] Optional: repeat with `@critical` (2 tests) to show selection by risk (M10 slide 8).

Optional from a terminal (requires GitHub CLI: `winget install GitHub.cli` + `gh auth login`):

```powershell
gh workflow run playwright.yml -R anaelince/web-automation -f suite=@smoke -f workers=2
```

## M5 — Run 3 (optional, failure demo)

- [ ] Ask the agent: *"prepare the failure demo"* — it pushes a temporary wrong assertion.
- [ ] The push triggers the run automatically → Summary title `[Full][FAILED]`, ❌ count and
      the failed-tests table; the run is red; the `github` reporter adds an annotation pointing
      to the spec line.
- [ ] Ask the agent: *"revert the failure demo"* — it reverts and pushes (one more green run).

## M6 — Show the report, screenshot and trace

- [ ] Download the `playwright-report` artifact (zip) and extract it.
- [ ] `npx playwright show-report <extracted-folder>` → open a failed test →
      **Screenshots** and **Traces** sections.
- [ ] Open the trace: click it in the report, or drag `trace.zip` into `https://trace.playwright.dev`.

## M7 — After the demo

- [ ] Optional: pause CI — **Actions** → **Playwright Tests** → `···` → **Disable workflow**.
- [ ] The scheduled run stays commented out in the YAML; to enable it, see
      `docs/wiki/ci/github-actions.md` → *Execution frequency*.
- [ ] Optional: profile → **Settings → Notifications → Actions** → email only on failed workflows.

---

## D — Adjustments to the M10 deck (by hand, in PowerPoint)

Validated against `docs/course/M10-CI-GitHub-Actions-Reports.pptx`. Per the `pptx-workflow`
rule the deck is edited by hand — it is never regenerated or overwritten by the agent.
Do these before the class so the slides and the demo tell the same story.

### Must fix (technical or consistency errors)

| Slide | Current | Change to |
|---|---|---|
| 14 | `Worker 1 → blob 1`, `Worker 2 → blob 2`, `Worker 3 → blob 3` | `Shard 1 → blob 1`, `Shard 2 → blob 2`, `Shard 3 → blob 3` — Playwright writes one blob per shard job; the workers inside a shard share it. Optional sub-label: "each shard runs N workers". |
| 14 | `merge-reports --reporter html ./blob-report` | `merge-reports --reporter html ./all-blob-reports` (the folder where the shard blobs are downloaded) |
| 1 vs 2 | Slide 1 subtitle "CI, GitHub Actions & Wrap-Up"; slide 2 and file name "& Reports" | Use one title in both slides |
| 11 | `path: reports/html` | `path: playwright-report/` (the folder this repo uses) |

### Recommended (explain the difference between the generic example and the demo)

| Slide | Point | Suggested note (slide or speaker notes) |
|---|---|---|
| 6, 7 | `runs-on: ubuntu-latest` | "Generic example. Our demo runs on `windows-latest` — same platform the team uses; see ADR-005." |
| 7 | `node-version: 20`, `timeout-minutes: 15` | Align with the demo: Node 22, timeout 20 — or add "values vary per project". |
| 7 | `BASE_URL: ${{ vars.BASE_URL }}` | Matches the demo — point to it live in the YAML. |
| 6, 8, 9 | Branch `develop`, PR triggers, daily/weekly runs | "The demo repo has only `main` and no PRs: push + manual run; the schedule is in the YAML, commented out." |
| 11 | Separate `failure-artifacts` upload of `test-results` | "With merged reports, screenshots and traces are already inside the HTML report artifact." |
| 11, 13 | Videos on failure, *Quarantined* state | "Demo: video off; quarantine is a future rule (`ci-pipeline-standard`)." |
| 12 | Email / Teams / Slack content | Show the run Summary title `[Smoke][PASSED]` — same format as the slide; notifications use GitHub's own email. |

### Demo ↔ slide mapping (use it as speaker notes)

| Slide | Show in the demo |
|---|---|
| 5, 8 | Manual run with `suite = @smoke` / `@critical` (M4) |
| 7 | `.github/workflows/playwright.yml`: `npm ci`, cache, `install chromium`, `vars`/`secrets` |
| 9 | The commented `schedule` block + wiki *Execution frequency* |
| 10, 12 | Run Summary: title, metadata, counts |
| 11 | `playwright-report` artifact, retention 14 days |
| 13 | ⚠️ flaky count in the Summary; retries = 2 |
| 14 | Two `test` jobs (shards) + `merge-reports` in the run graph |
| 15 | This prompt (AI-assisted) + the human checks in M2–M6 |
