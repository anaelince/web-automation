# Anti-flakiness Quick Reference

> Moved from `spec-quality-lifecycle-standard` SKILL.md (context budget, ADR-002). Rules R1–R10 live in that skill; R3 and R5 are delegated to `ui-locator-wait-standard` (ADR-004).


| Root cause | Rule | Signal in code |
|-----------|------|---------------|
| Unknown starting state | R1 | No assertion in first step |
| Dirty state from previous test | R2 | No `clean<Resource>` fixture |
| Timing assumption | R3 → `ui-locator-wait-standard` R13–R20 | `waitForTimeout`, `networkidle`, unbounded polling |
| Point-in-time evaluation | R4 | `await locator.text()` in expect |
| DOM structure dependency | R5 → `ui-locator-wait-standard` R1–R8 | CSS chains, XPath, positional `.nth()`, silenced strict mode |
| Silent action failures | R6 | Step without assertion |
| Test order dependency | R7 | Shared `let` variables across tests |
| Non-deterministic path | R8 | `if/else` in test body |
| Race condition on navigation | R9 | Navigate without immediate assert |
| Wrong-value false positive | R10 | `toBeVisible()` when value matters |
