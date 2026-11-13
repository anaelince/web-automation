# docs/

Documentation root for the Web Automation course project.

## Structure

```
docs/
  course/            ← Presentation slides for each course module (M1–M5)
  skills/            ← Meta-prompts used to create or update Kiro AI skills
  test-cases/
    demoqa/          ← CRUD test case specifications for demoqa Book Store
  wiki/
    api/             ← Framework layer documentation (API client, controllers, models)
    framework/       ← Patterns, fixtures, POM design — add new guides here
```

## Quick links

| Document | Location |
|----------|----------|
| demoqa API Layer reference | [`wiki/api/demoqa-api-layer.md`](wiki/api/demoqa-api-layer.md) |
| demoqa Book Store test cases | [`test-cases/demoqa/book-store-crud-test-cases.md`](test-cases/demoqa/book-store-crud-test-cases.md) |
| api-setup-teardown-standard meta-prompt | [`skills/api-setup-teardown-standard-skill-prompt.md`](skills/api-setup-teardown-standard-skill-prompt.md) |
| automation-architect meta-prompt | [`skills/automation-architect-skill-prompt.md`](skills/automation-architect-skill-prompt.md) |
| spec-organisation-standard meta-prompt | [`skills/spec-organisation-standard-prompt.md`](skills/spec-organisation-standard-prompt.md) |
| spec-quality-lifecycle-standard meta-prompt | [`skills/spec-quality-lifecycle-standard-skill-prompt.md`](skills/spec-quality-lifecycle-standard-skill-prompt.md) |

## Conventions

- **`course/`** — read-only course material, do not edit
- **`skills/`** — updated when a skill is created or its rules change
- **`test-cases/`** — one subfolder per site (`demoqa/`, `saucedemo/`, `automationexercise/`); one file per feature area
- **`wiki/`** — living documentation; update alongside code changes; one file per framework layer

