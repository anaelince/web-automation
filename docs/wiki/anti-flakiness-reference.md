# Anti-flakiness Quick Reference

> Moved from `spec-quality-lifecycle-standard` SKILL.md (context budget, ADR-002). Rules R1–R10 live in that skill.


| Root cause | Rule | Signal in code |
|-----------|------|---------------|
| Unknown starting state | R1 | No assertion in first step |
| Dirty state from previous test | R2 | No `clean<Resource>` fixture |
| Timing assumption | R3 | `waitForTimeout` |
| Point-in-time evaluation | R4 | `await locator.text()` in expect |
| DOM structure dependency | R5 | CSS chains, XPath, positional `.nth()` |
| Silent action failures | R6 | Step without assertion |
| Test order dependency | R7 | Shared `let` variables across tests |
| Non-deterministic path | R8 | `if/else` in test body |
| Race condition on navigation | R9 | Navigate without immediate assert |
| Wrong-value false positive | R10 | `toBeVisible()` when value matters |
