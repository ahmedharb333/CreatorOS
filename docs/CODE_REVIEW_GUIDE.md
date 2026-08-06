# CreatorOS — Code Review Guide (Milestone 1)

For the Product Architect / QA reviewer. This orients you to the codebase, the review order, and the
specific invariants each file must uphold, so review time goes to the decisions that matter.

## How to read the code (recommended order)

1. **`src/Constants.js`** — the single source of truth. Everything downstream is driven by `SCHEMA`,
   `ENUMS`, `ID_PREFIX`, `CONFIG_DEFAULTS`. Confirm the 16 sheets, headers, validations and protection
   strategy match `16_Workbook_Schema.md`.
2. **`src/Errors.js` + `src/Common.js`** — error catalog + service-result envelope + sanitization/utilities.
3. **`src/IdService.js`** — immutability & collision-safety (FR-002).
4. **`src/ConfigService.js`** — config tiers and version markers.
5. **`src/ValidationService.js`** — value/record rules (docs 26).
6. **`src/repositories/BaseRepository.js`** — the only cell-touching layer; then the 7 entity repos.
7. **`src/WorkbookService.js`** — builder + `verify()` (idempotency, protection, named ranges).
8. **`src/WorkflowSeed.js`** — default library (docs 27).
9. **`src/Menu.js` / `src/Main.js`** — menu + lifecycle.
10. **`tests/*`** — runner + suites; `tests/node_pure_tests.js` for the executed evidence.

## Invariants to verify (the things that must be true)

| Invariant | Where enforced | How to check |
|---|---|---|
| Business logic never reads cells directly | only repositories import Sheet ranges | grep for `getRange`/`getSheetByName` outside `repositories/`, `WorkbookService`, `LoggerService`, `ConfigService`, `Menu`/`Main` |
| No fixed column indexes in domain code | `BaseRepository` header maps | confirm repos use `_headers()`/header names, not numeric columns |
| IDs immutable, never row-derived, never reused | `IdService` (Script Props + Lock); `BaseRepository.updateById` re-pins id | ID-001…005; REP-004 |
| Secrets never in cells or logs | User Properties only; `sanitizeForLog` | `USER_PROP` usage; pure sanitize tests; grep logs for key writes |
| Idempotent, data-preserving init | `WorkbookService` create-if-missing + seed-if-empty; `alignIdCounters_` | re-run Initialize/Repair twice; row counts stable |
| Formula-owned columns not overwritten | `SCHEMA.formulaColumns`; `BaseRepository` skips them on write | inspect `createMany`/`updateById`; REP-002 |
| Validation blocks bad writes | `ValidationService.validateRecord` in `createMany`/`updateById` | REP-005; pure VAL suite |
| Minimal OAuth scopes | `appsscript.json` (2 scopes) | confirm no calendar/mail/urlfetch scopes yet |
| Every conflict/gap recorded, none silent | `ASSUMPTIONS.md` / `DEVIATIONS.md` | C1–C3, G1–G3, D1–D3, E1–E2; D-01, D-02 |

## Deliberate design choices (not defects)

- **Warning-only protections** — chosen so a copied workbook cannot lock its owner out; still flags
  accidental edits to IDs/formulas/logs/config.
- **Data-validation `setAllowInvalid(true)`** — the sheet dropdowns are a soft guide; the hard gate is
  `ValidationService` at write time (avoids blocking imports/paste while keeping data clean on write).
- **7-value Strategic Goal enum** — approved documentation correction (C2), not a scope change.
- **`WKF-` workflow prefix** — standardized from doc-06 `WF-` for prefix consistency (deviation D-02).
- **`Dependency_Sequences` (CSV, multi-valued)** — replaces doc-16's single `Dependency_Sequence` so a step
  can depend on multiple predecessors (ADR-011 / D-03). Parsed via `WorkflowSeed.parseDependencies`.
- **Content Objective ≠ Strategic Goal** — distinct funnel-verb vocabulary (`Reach…Monetize`) vs idea-level
  goal nouns; see `CONCEPTS_GOAL_VS_OBJECTIVE.md` (ADR-012).
- **Node Apps Script mock** (`tests/node/mock_gas.js`) — executes the GAS suites off-Google for CI-style
  evidence; not a replacement for the on-Google run (ADR-013).
- **Global scope, no modules** — required by Apps Script; classes/functions are intentionally global.

## Suggested review checklist

- [ ] `SCHEMA` matches the Workbook Schema doc (headers, enums, protections).
- [ ] Error codes used in code all exist in `ERR` (docs 20).
- [ ] Repositories contain **no** domain decisions (docs 17 §1).
- [ ] `LoggerService` cannot throw into callers and redacts secrets.
- [ ] Tests cover each foundational requirement (see `REQUIREMENT_COVERAGE.md`).
- [ ] Assumptions/deviations are complete and acceptable.
- [ ] Recommendations (`RECOMMENDATIONS.md`) reviewed — approve R-02/R-05 for M2 if desired.

## Out of scope for this review (later milestones)

Setup/Ideas/Content/Task-gen/Capacity/Planning (M2), Calendar (M3), Recovery/Analytics (M4), AI (M5),
Release/migration (M6). No code for these ships in Milestone 1.
