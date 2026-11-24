# Implementation prompt: Module 10 — CI with GitHub Actions + Reports

Use this prompt with the AI agent (Claude Code / Kiro) to implement the full CI and reporting
setup for this repository (`https://github.com/anaelince/web-automation`).

It covers **repo work** (the agent does it). The **manual GitHub steps** (the user does them — the
agent has no access to repository settings) and the order in which both parts interleave are in
[`m10-ci-github-actions-manual-steps.md`](m10-ci-github-actions-manual-steps.md).

**Flow:** agent Tasks 1–9 (local, committed, not pushed) → ⏸ user M1–M2 (GitHub settings,
variables, secrets) → agent Task 11 (push → Run 1) → user M3–M6 (check runs, demo).

**Course alignment:** validated against `docs/course/M10-CI-GitHub-Actions-Reports.pptx`
(16 slides). Where the repo intentionally differs from a generic slide example (Windows runner,
shard-based blobs), the ADR and the wiki explain why — see Task 7.

---

## Prompt

```
Implement Module 10 — CI with GitHub Actions and test reports — for this repository.

Before editing, load and follow:
- CLAUDE.md (project conventions, path aliases, commit format, push directly to main)
- .claude/rules/playwright-config.md and .claude/rules/tech-stack.md
- the git-workflow-docs-standard skill (commits + docs sync)
- the spec-data-standard skill, environment rules (E1 env selection, E2 fail-fast) — Task 1
- the spec-organisation-standard skill, tag syntax rules — Task 5

Read these files first: playwright.config.ts, src/config/env.ts, .env.example, package.json,
.github/workflows/playwright.yml, .gitignore, README.md, every spec under tests/.

## Fixed decisions (do not change them, do not ask about them)

| Topic | Decision |
|---|---|
| Browser | Chrome only → a single Playwright project `chromium` (`devices['Desktop Chrome']`, viewport 1920×1080). Remove firefox and webkit projects. |
| CI OS | Windows only → every job uses `runs-on: windows-latest` and `shell: pwsh`. No Linux/macOS jobs. Reason (must be recorded in ADR-005 and the wiki, because the M10 slides use `ubuntu-latest` as the generic example): the team develops and runs the suite on Windows, and demoqa needs `ignoreHTTPSErrors` on Windows — CI reproduces the same platform. |
| Runtime | Node 22 LTS, job timeout 20 minutes. |
| Parallelism | `fullyParallel: true` + sharding across jobs + several workers per shard. One blob report per SHARD (not per worker). Shard reports MUST be merged into one report. |
| Test selection | Tags `@smoke`, `@critical`, `@regression` (M10 slide 8) + npm scripts per tag + a manual-run `suite` choice. |
| Report content | Header with execution metadata (M10 slide 10) + counts (total / passed / failed / flaky / skipped / duration) + for each FAILED test its screenshot and its trace. No videos, no attachments for passed tests. |
| Gate | `typecheck` + `forbidOnly` must pass; any failed test makes the run red; flaky tests are a warning only. Direct pushes to main → the gate signals, it does not block. |
| Frequency | Demo setup (2–3 runs, no recurring execution): `push` to main (ignoring docs-only changes) + manual run (`workflow_dispatch`). No `pull_request` (the project pushes directly to main). The nightly `schedule` is written in the YAML but COMMENTED OUT, and documented in the wiki. |

## Task 1 — Environment variables in CI (no .env file on the runner)

Problem: src/config/env.ts throws when no `.env.<TEST_ENV>` file exists, and every `.env*`
file is git-ignored, so the current workflow fails on GitHub.

Solution (matches M10 slide 7: `BASE_URL: ${{ vars.BASE_URL }}` as a job env var):
- Change src/config/env.ts so that a missing env file is NOT an error by itself:
  - if the file for the selected TEST_ENV exists → load it with dotenv (unchanged behaviour;
    dotenv does not override variables already present in process.env)
  - if it does not exist → continue with the variables already in process.env
  - the fail-fast validation stays exactly as it is: a missing BASE_URL (or invalid URL) still
    throws, and the error message must now say both options: "create .env.<TEST_ENV> from
    .env.example, or export the variables (CI: GitHub Variables/Secrets)".
  - keep spec-data-standard E1/E2 compliance; update the header comment of env.ts.
- The workflow passes values as environment variables only:
  - job-level `env:` for non-secret `vars.*`: BASE_URL, SAUCEDEMO_BASE_URL,
    AUTOMATIONEXERCISE_BASE_URL, TEST_DATA_PREFIX, ALLOW_DESTRUCTIVE_CLEANUP, and `TEST_ENV: ci`
  - step-level `env:` (only on the test step) for `secrets.*`: TEST_USER_NAME,
    TEST_USER_PASSWORD, SAUCEDEMO_USER_NAME, SAUCEDEMO_USER_PASSWORD
  - never write secrets to a file, never print them, never inline `${{ secrets.X }}` in a script.
- `.env.example`: document that in CI the same variable names come from GitHub Variables/Secrets
  and that `TEST_ENV=ci` runs without a file.

## Task 2 — playwright.config.ts

- Projects: only `chromium` (see fixed decisions).
- Workers: configurable with env var `PW_WORKERS`; default on CI = 2 per shard (windows-latest
  has 4 vCPU), local = Playwright default (undefined). Parse it as a number; ignore invalid values.
- Retries: keep 2 on CI, 0 local.
- Failure evidence:
  - `screenshot: 'only-on-failure'`
  - `trace: 'retain-on-failure'` (replaces `on-first-retry`, so a trace exists for every failed test)
  - `video: 'off'`
- Reporters:
  - local: `[['list'], ['html', { open: 'never' }]]` (unchanged behaviour)
  - CI: `[['blob'], ['github'], ['list']]` — `blob` is the input for merge-reports (one blob
    per shard job), `github` adds failure annotations in the run.
- Keep `forbidOnly`, `ignoreHTTPSErrors`, viewport and baseURL as they are.

## Task 3 — Workflow `.github/workflows/playwright.yml` (rewrite)

Triggers — use exactly this `on:` block (demo configuration, no recurring runs):

    on:
      push:
        branches: [main]
        paths-ignore:            # do not run when only docs or course decks change
          - 'docs/**'
          - '**/*.md'

      workflow_dispatch:         # "Run workflow" button for live demo runs
        inputs:
          suite:
            description: 'Test selection by tag'
            type: choice
            options: [all, '@smoke', '@critical', '@regression']
            default: all
          workers:
            description: 'Workers per shard'
            required: false
            default: '2'

      # ── Scheduled run (disabled for the demo) ──────────────────────
      # To enable it, uncomment the 2 lines below. Cron is in UTC (Bolivia = UTC-4).
      # schedule:
      #   - cron: '0 6 * * 1-5'   # 02:00 Bolivia, Monday to Friday — full regression

- Do NOT add a `pull_request` trigger.
- Resolve the suite once, at workflow level:
  `SUITE: ${{ inputs.suite || 'all' }}` (a `push` run has no inputs → `all`).
  In the test step add `--grep "$env:SUITE"` only when SUITE is not `all` (pwsh `if`).
  `PW_WORKERS: ${{ inputs.workers || '2' }}`.

Global:
- `concurrency: { group: playwright-${{ github.ref }}, cancel-in-progress: true }`
- `permissions: { contents: read }` at workflow level
- `defaults: run: shell: pwsh`
- `env:` with TEST_ENV, SUITE and the `vars.*` listed in Task 1

Job `test` (matrix, windows-latest, timeout 20 min):
- `strategy: { fail-fast: false, matrix: { shardIndex: [1, 2], shardTotal: [2] } }`
- steps: checkout → setup-node (Node 22, `cache: npm`) → `npm ci` → `npm run typecheck`
  → cache Playwright browsers (`~\AppData\Local\ms-playwright`, key on OS + Playwright version
  from package-lock.json) → `npx playwright install chromium`
  → `npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}` plus
  `--grep` only when SUITE is not `all`; secrets in this step's `env:` only
- upload `blob-report/` as artifact `blob-report-${{ matrix.shardIndex }}` with
  `if: ${{ !cancelled() }}`, retention 1 day.

Job `merge-reports` (windows-latest, `needs: test`, `if: ${{ !cancelled() }}`, timeout 10 min):
- checkout → setup-node → `npm ci`
- `actions/download-artifact@v4` with `pattern: blob-report-*`, `merge-multiple: true`, path `all-blob-reports`
- `npx playwright merge-reports --config playwright.merge.config.ts ./all-blob-reports`
  producing an HTML report (`playwright-report/`) and a JSON file (`playwright-report/results.json`)
- run `node scripts/ci/report-summary.cjs playwright-report/results.json` (Task 4)
- upload `playwright-report/` as artifact `playwright-report` (retention 14 days,
  `if: ${{ !cancelled() }}` so it is uploaded also when tests failed)
- the job must FAIL when there are failed tests (exit code from the summary script), so the
  run status reflects the suite result even though `test` jobs use fail-fast false.
- never use `continue-on-error` (M10 slide 15: do not hide failures).

Create `playwright.merge.config.ts` at the root with only `testDir: './tests'` and
`reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }], ['json', { outputFile: 'playwright-report/results.json' }]]`
(merge-reports needs the same testDir to resolve file paths). Screenshots and traces of failed
tests travel inside the blobs and end up inside the merged HTML report — no separate
"failure-artifacts" upload is needed. Use action versions `actions/checkout@v4`,
`actions/setup-node@v4`, `actions/cache@v4`, `actions/upload-artifact@v4`,
`actions/download-artifact@v4`.

## Task 4 — Report summary (metadata + counts + failed evidence)

Create `scripts/ci/report-summary.cjs` (plain Node, no new dependencies):
- input: path to the merged Playwright JSON report
- compute: total, passed, failed, flaky, skipped, duration
- write Markdown to `$GITHUB_STEP_SUMMARY` (fallback: stdout when the variable is missing, so it
  can be tested locally; missing GitHub variables print as `local`):
  1. Title in the notification format of M10 slides 4 and 12:
     `[<Suite>][PASSED]` or `[<Suite>][FAILED]` — Suite = `Full` when SUITE is `all`,
     otherwise the tag without `@` capitalised (`Smoke`, `Critical`, `Regression`).
  2. Metadata table (M10 slide 10 — "what ran, what changed, where, when"):
     - Execution: date/time UTC, event (`GITHUB_EVENT_NAME`), run link
       (`$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID`)
     - Code: branch (`GITHUB_REF_NAME`), short commit (`GITHUB_SHA`), author (`GITHUB_ACTOR`),
       commit message first line (from `GITHUB_EVENT_PATH` → `head_commit.message`, when present)
     - Environment: OS (`RUNNER_OS`), Node (`process.version`), Playwright version
       (`config.version` in the JSON report), browser (project names in the JSON report),
       target host (hostname of `BASE_URL`, never the full URL with credentials)
  3. Counts table: ✅ passed, ❌ failed, ⚠️ flaky, ⏭️ skipped, total, duration (`Xm Ys`)
  4. If there are failures: a table `Test | File:line | Error (first line)` and a sentence saying
     that the screenshot and trace of each failed test are in the `playwright-report` artifact
     (HTML report → open the test → Screenshots / Traces), with the run link.
- exit code 1 when failed > 0, otherwise 0.
- Windows-safe: use `path` and `fs`, no shell commands.

## Task 5 — Test selection: tags and npm scripts (M10 slide 8)

Today only TC02 has `@smoke`, so a manual `@smoke` run would execute a single test.
Tag the specs following spec-organisation-standard tag syntax (the `tag` option; keep existing
tags such as `@mutates-data`):

| Spec | Tags |
|---|---|
| saucedemo `TC0-valid-login` | `@smoke` `@critical` `@regression` |
| demoqa `TC02-add-book-to-collection` | `@smoke` `@critical` `@regression` (+ `@mutates-data`) |
| automationexercise `TC9-search-product` | `@smoke` `@regression` |
| automationexercise `TC8-verify-all-products-and-detail` | `@regression` |

If the TC documents under docs/test-cases/ list tags, update them too.

Add to package.json:
- `test:critical` → `playwright test --grep @critical`
- `test:regression` → `playwright test --grep @regression`
- (`test:smoke` already exists)
- `report:merge` → `playwright merge-reports --config playwright.merge.config.ts ./all-blob-reports`
- `report:summary` → `node scripts/ci/report-summary.cjs playwright-report/results.json`

Verify the selection with `npx playwright test --list --grep @smoke` (3 tests),
`--grep @critical` (2), `--grep @regression` (4).

Document in the wiki how to reproduce CI locally in PowerShell:
`$env:CI='true'; npx playwright test --shard=1/2`.

## Task 6 — Housekeeping

- `.gitignore`: add `.~lock.*` and `all-blob-reports/`.
- Do NOT commit the `docs/course/.~lock.*` files.

## Task 7 — Docs (git-workflow-docs-standard docs sync)

- Update `.claude/rules/playwright-config.md`:
  - Frontmatter `paths`: add `.github/workflows/**`, `playwright.merge.config.ts` and
    `scripts/ci/**`, so the rule also loads when the workflow or the CI scripts are edited.
  - Existing tables: browsers (chromium only), trace, screenshot, video, workers (`PW_WORKERS`),
    reporters (local vs CI), new npm scripts, `playwright.merge.config.ts`.
  - New section `## CI pipeline` with two subsections. Write them as short imperative rules
    (one line each, MUST / MUST NOT) — this content is the seed of the reserved skill
    `ci-pipeline-standard`, so keep both subsections self-contained:

    ### Execution — how and when tests run
    - Runner: every job `runs-on: windows-latest`, `shell: pwsh`, Node 22. No Linux/macOS jobs.
    - Browser: only the `chromium` project. Do not add projects without an ADR.
    - Selection: tags `@smoke` / `@critical` / `@regression`; manual runs pick one with the
      `suite` input; a push runs the full suite.
    - Parallelism: `fullyParallel: true`; sharding via matrix (`shardIndex`/`shardTotal`);
      workers per shard from `PW_WORKERS` (CI default 2). Change shard count only in the matrix.
    - Reports: each shard job emits ONE `blob` (workers inside a shard share it); one
      `merge-reports` job merges them with `playwright.merge.config.ts` into HTML + JSON.
      Never upload per-shard HTML reports.
    - Evidence: `screenshot: only-on-failure`, `trace: retain-on-failure`, `video: off`.
    - Environment: values come from GitHub `vars.*` (job `env:`) and `secrets.*` (test step
      `env:` only); no env file on the runner; never print or inline secrets.
    - Triggers: `push` to `main` with `paths-ignore` (`docs/**`, `**/*.md`) + `workflow_dispatch`
      (`suite`, `workers`). No `pull_request` (no PRs in this project). `schedule` stays
      commented out; enabling it requires updating the wiki and ADR-005.
    - Hygiene: `concurrency` cancels superseded runs; `permissions: contents: read`;
      job timeouts; pin actions to a major version (`@v4`).

    ### Gate — when a run is accepted or rejected
    - Mandatory checks before tests: `npm run typecheck` must pass.
    - `forbidOnly: !!process.env.CI` stays enabled — `test.only` fails the run.
    - Failure threshold: `failed > 0` → `merge-reports` exits 1 → run is red. No tolerance.
    - Flaky (passed on retry): reported as ⚠️ warning in the summary, does not fail the run.
    - Retries: 2 on CI, 0 local. Never raise retries to make a run pass.
    - Never use `continue-on-error` on test or report steps.
    - Test jobs use `fail-fast: false` so every shard reports; the verdict is taken once,
      in `merge-reports`, from the merged results.
    - Scope of the gate: with direct pushes to `main` the gate signals after the push (red run
      + badge); it does not block the change. Blocking requires PRs + a ruleset with a required
      status check — out of scope, document it as a future step.
- `docs/wiki/ci/github-actions.md`:
  - pipeline diagram: `test (shard 1) → blob-report-1`, `test (shard 2) → blob-report-2`
    → `merge-reports` → HTML + JSON + summary
  - **Shard vs worker vs blob**: a shard is a job on its own runner; workers are parallel
    processes inside one shard; Playwright writes one blob per shard, so blobs are merged per
    shard, not per worker
  - **Why Windows and not ubuntu-latest** (the slides use Ubuntu as the generic example): the
    reason from the fixed decisions, and what would change to move to Ubuntu
    (`runs-on`, `shell`, browser cache path, `install --with-deps`)
  - required GitHub Variables/Secrets and how env.ts reads them without a file
  - test selection: tags table from Task 5, npm scripts, manual `suite` input
  - how to read the summary (metadata, counts, failures) and how to open a trace
    (`npx playwright show-trace` or trace.playwright.dev)
  - how to tune shards/workers
  - section **"Execution frequency: automatic vs manual"** with:
    - automatic on push (what `paths-ignore` skips) and `[skip ci]` in a commit message
    - manual run step by step (Actions → Playwright Tests → Run workflow → `suite`, `workers`)
      and the optional `gh workflow run playwright.yml -f suite=@smoke -f workers=2`
    - how to enable the scheduled run: uncomment `schedule`, cron fields explained, UTC vs
      Bolivia (UTC-4) table (02:00 weekdays `0 6 * * 1-5`, 22:00 daily `0 2 * * *`,
      08:00 and 18:00 `0 12,22 * * *`), caveats: runs only from the default branch, may start
      late, GitHub disables it after 60 days without repository activity
    - how the slide 9 cadence maps here (push = smoke/fast, daily = full regression,
      weekly = broad coverage) and that the demo keeps only push + manual
    - how to pause everything: Actions → Playwright Tests → ··· → Disable workflow
    - why the schedule is disabled: the project is a demo with 2–3 planned runs
- `docs/decisions/ADR-005-ci-github-actions-windows-chrome.md`: Windows-only (with the reason
  and the explicit difference from the Ubuntu slide examples) + Chrome-only, env vars without a
  file on the runner, tag-based selection, sharding + merge (one blob per shard), retain-on-failure
  trace, summary with metadata + counts + failure evidence, the demo frequency (push + manual
  only; schedule documented but disabled), and the gate policy (failed > 0 → red run, flaky =
  warning, post-push signal only). Record that CI rules live as a path-scoped rule for now,
  organised as Execution + Gate, and that the reserved skill `ci-pipeline-standard` will absorb
  both sections when any of these happens: PRs + rulesets are adopted, a flaky/quarantine
  policy is needed, gates differ per stage, or the rule grows beyond what a rule file should
  hold. Reporting content stays owned by the reserved `test-report-standard`. Follow the
  existing ADR format.
- README.md: workflow status badge
  `![Playwright Tests](https://github.com/anaelince/web-automation/actions/workflows/playwright.yml/badge.svg)`,
  the new npm scripts, and a short "CI" section linking to the wiki.

## Task 8 — Verify locally before committing

1. `npm run typecheck` passes.
2. `npx playwright test --list` shows only the chromium project; the three `--grep` counts from
   Task 5 match.
3. env.ts: with the local `.env` the suite starts as before; with `$env:TEST_ENV='ci'` and
   `$env:BASE_URL='https://demoqa.com'` (no `.env.ci` file) it starts too; with
   `$env:TEST_ENV='ci'` and no BASE_URL it fails fast with the new message. Clear the variables
   afterwards.
4. In PowerShell, simulate two shards with blob output and merge them:
   `$env:CI='true'; npx playwright test --shard=1/2; Move-Item blob-report blob-1`
   `npx playwright test --shard=2/2; Move-Item blob-report blob-2`
   then copy both zips into `all-blob-reports/`, run `npm run report:merge` and
   `npm run report:summary` (metadata prints `local` where GitHub variables are missing).
5. Force one failure temporarily (e.g. a wrong expected text), confirm the HTML report shows a
   screenshot and a trace for it, the summary title is `[Full][FAILED]` and it exits 1.
   Revert the forced failure.
6. Report results honestly: what passed, what failed, what could not be verified locally
   (the GitHub run itself).

## Task 9 — Commit locally (CLAUDE.md conventions) — DO NOT PUSH YET

Separate commits, Conventional Commits, on main:
- `refactor(config): read ci environment variables without an env file`
- `chore(tests): tag specs with smoke, critical and regression for ci selection`
- `chore(ci): run playwright on windows with chrome shards and merged report`
- `feat(reports): add ci summary with metadata, counts and failure evidence`
- `docs(ci): add github actions wiki, adr-005 and readme badge`

## Task 10 — STOP: hand over to the user (GitHub configuration)

The push triggers Run 1, and Run 1 fails if the GitHub Variables/Secrets do not exist yet
(src/config/env.ts requires BASE_URL). So, after Task 9:

1. Stop and show the user:
   - the exact list of Variables and Secrets the workflow reads (names taken from the final YAML,
     marking which are required and which are optional)
   - a pointer to `docs/prompts/m10-ci-github-actions-manual-steps.md`, steps M1–M2
2. Ask the user to reply "done" when they are created. Do not push before that reply.
   Never ask the user to paste secret values in chat.

## Task 11 — Push and Run 1

After the user confirms:
1. `git push origin main` — this triggers Run 1 automatically.
2. Tell the user which run to open (Actions → Playwright Tests → latest run on main) and what
   to check (step M3 of the manual guide). You cannot see the GitHub run: do not claim it passed.

## Final output to the user

Finish with: what was implemented and verified locally, what was pushed, and the next manual
steps (M3 onward) from `docs/prompts/m10-ci-github-actions-manual-steps.md`.
```

---

## Manual steps (done by the user on github.com)

See [`m10-ci-github-actions-manual-steps.md`](m10-ci-github-actions-manual-steps.md) — steps
M0–M7, in execution order, interleaved with the agent tasks above, plus the M10 deck
adjustments (section D).
