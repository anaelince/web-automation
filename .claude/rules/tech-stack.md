---
paths:
  - "package.json"
  - "package-lock.json"
  - "tsconfig.json"
---


# Framework Tech Stack

## Dependencies

| Dependency | Version | Impact on rules |
|------------|---------|-----------------|
| `@playwright/test` | ^1.64.1 | `test.step()` ✅ · native tag option ✅ · trace viewer ✅ |
| `typescript` | ^7.0.2 | strict mode · ES2022 target |
| `dotenv` | ^18.0.8 | ENV vars loaded before test run |
| Node.js | `@types/node` ^26 | CommonJS module system |

## TypeScript Compiler Settings (`tsconfig.json`)

| Setting | Value | Why it matters for skills |
|---------|-------|--------------------------|
| `target` | `ES2022` | Enables `useDefineForClassFields: true` — locators MUST be `get` properties |
| `module` / `moduleResolution` | `NodeNext` | Affects how path aliases resolve |
| `strict` | `true` | All type errors are errors; no implicit any |
| `noUncheckedIndexedAccess` | `true` | Array/object access returns `T \| undefined` |
| `noImplicitOverride` | `true` | Sub-class method overrides require `override` keyword |
| `noEmit` | `true` | TypeScript is type-check only — no compiled output |

## Playwright Version Compatibility

| API / Feature | Min Playwright version | Used by |
|---------------|----------------------|---------|
| `test.step()` | 1.22 | `spec-organisation-standard` R5 |
| `test()` native tag option `{ tag: [] }` | 1.42 | `spec-organisation-standard` (future tagging rules) |
| `--grep @tag` (current approach) | any | `package.json test:smoke` |
