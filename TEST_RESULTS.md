# CreatorOS — Test Results

- Product 1.0.0 · Schema 1 · Milestone 1
- Two execution surfaces: **pure-logic** (Spreadsheet-independent, executed here in Node) and
  **Spreadsheet-bound** (executed in Apps Script via **CreatorOS ▸ Run Tests** after `clasp push`).

## 1. Pure-logic suite — EXECUTED ✅

Runner: `node tests/../` harness bundling `Errors.js, Common.js, Constants.js, IdService.js,
ValidationService.js` with minimal GAS stubs.

**Result: 34 / 34 passed, 0 failed.**

| Area | Checks | Result |
|---|---|---|
| `IdService.validate` shape + prefix | 4 | PASS |
| Enum validation | 2 | PASS |
| Numeric range + integer | 4 | PASS |
| URL / date validation | 4 | PASS |
| `validateRecord` (bad idea, effort/goal flagged) | 3 | PASS |
| Cross-field date (end > start) | 1 | PASS |
| Strategic-goal 7-value standard (C2) | 3 | PASS |
| Priority arithmetic (5,4,2 → 3.3) | 1 | PASS |
| `columnToLetter` (A / Z / AA) | 3 | PASS |
| `padNumber` id formatting | 1 | PASS |
| Secret sanitization (docs 29) | 4 | PASS |
| Timezone validation | 2 | PASS |
| `AppError` shape | 2 | PASS |

These map to test-spec sections §4 (IDs), §5–6 (validation), and the security logging requirement (NFR-003).

## 2. Static analysis — EXECUTED ✅

- `node --check` on all **24** source/test files: **24 / 24 OK** (0 syntax errors).

## 3. Spreadsheet-bound suites — PENDING-EXECUTION ⏳

These require a live workbook (Spreadsheet/Properties/Lock APIs) and run in Apps Script. Run
**CreatorOS ▸ Run Tests** after `clasp push` + **Initialize / Repair Workbook**, then paste the runner's
`markdown` output under §4 below.

| Suite | Case | Requirement | Expected |
|---|---|---|---|
| Schema | SCH-001 all 16 sheets exist | schema | 16 tabs present |
| Schema | SCH-002 `verify()` valid | schema | no issues |
| Schema | SCH-003 headers match, no duplicates | schema | headers exact |
| Schema | SCH-004 CONFIG named ranges resolve | docs 26 §13 | all `CFG_*` resolve |
| Schema | SCH-005 schema version marker | docs 22 §5 | == 1 |
| Schema | SCH-006 protections on system sheets | docs 16 §13 | protections present |
| Schema | SCH-007 8 workflows loaded | docs 27 | 8 workflows |
| IdService | ID-001 format | FR-002 | `TSK-000000` shape |
| IdService | ID-002 sequential unique | FR-002 | strictly increasing |
| IdService | ID-003 reserve block | docs 17 §2 | contiguous ×3 |
| IdService | ID-004 validate prefix | FR-002 | prefix-checked |
| IdService | ID-005 ensureAtLeast floor | FR-002 | never lowers |
| Validation | VAL-001..006 | docs 26 | (mirrors pure suite in-GAS) |
| Repository | REP-001 create idea id+timestamps | FR-003 | `IDE-` id, timestamps |
| Repository | REP-002 priority formula (→3.3) | FR-003, D1 | 3.3 in-sheet |
| Repository | REP-003 getById/find by header | NFR-005 | exact match |
| Repository | REP-004 updateById immutable id | FR-002 | id unchanged, Updated_At bumped |
| Repository | REP-005 invalid rejected | docs 20 | `RECORD_VALIDATION_FAILED` |
| Repository | REP-006 workflow steps ordered | docs 27 | 14 ordered steps |

## 4. In-GAS run output

_Paste the `CreatorOS ▸ Run Tests` summary here after execution (see KNOWN_ISSUES I-01)._

```
(pending)
```
