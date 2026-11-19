---
paths:
  - "src/**/*.ts"
  - "tests/**/*.ts"
  - "tsconfig.json"
---


# Framework Path Aliases

All imports in `src/` and `tests/` must use these aliases — relative imports are forbidden.

## Alias Map

| Alias | Resolves to | Site usage example | Used by |
|-------|-------------|-------------------|---------|
| `@pages/*` | `src/ui/pages/*` | `@pages/sites/demoqa/BookStorePage` | `ui-pom-standard`, `spec-code-standard` |
| `@components/*` | `src/ui/components/*` | `@components/SearchBar` | `ui-pom-standard` |
| `@fixtures` | `src/fixtures/index` | `import { test as base } from '@fixtures'` | site fixture files |
| `@fixtures/*` | `src/fixtures/*` | `@fixtures/sites/demoqa/demoqa.fixtures` | all spec files |
| `@data/*` | `src/data/*` | `@data/sites/saucedemo/auth.data` | `spec-code-standard`, `ui-pom-standard` |
| `@config/*` | `src/config/*` | `@config/env` | `spec-code-standard` |
| `@helpers/*` | `src/helpers/*` | (reserved for future helpers) | — |
| `@api/*` | `src/api/*` | `@api/sites/demoqa/client/ApiClient` | `api-setup-teardown-standard` |

## Site-based path pattern

The `sites/` subdirectory is covered by the existing wildcards:

```
@pages/sites/{site}/{Page}        →  src/ui/pages/sites/{site}/{Page}.ts
@api/sites/{site}/client/ApiClient →  src/api/sites/{site}/client/ApiClient.ts
@data/sites/{site}/auth.data      →  src/data/sites/{site}/auth.data.ts
@fixtures/sites/{site}/{site}.fixtures → src/fixtures/sites/{site}/{site}.fixtures.ts
```

No new alias is needed when adding a new site — use the full path with the existing alias.
