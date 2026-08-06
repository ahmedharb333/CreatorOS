# CreatorOS — Test Results

- Product `1.0.0` · Schema `1` · Milestone 1 (post-approval corrections applied)
- Run date: 2026-08-06

## Execution surfaces

| Surface | What it runs | Where | Status |
|---|---|---|---|
| **Pure-logic** | Spreadsheet-independent units | Node (`tests/node/pure_tests.js`) | **Executed** |
| **GAS suites via mock** | Schema/Id/Validation/Repository suites against an in-memory Apps Script + Sheets mock | Node (`tests/node/run_gas_suites.js`) | **Executed** |
| **On-Google** | Same GAS suites on real Sheets | Apps Script (`CreatorOS ▸ Run Tests`) | Recommended final confirmation |

The mock (`tests/node/mock_gas.js`) reproduces the Sheets/Properties/Lock semantics the code relies on —
header-mapped ranges, batch read/write, per-cell formula evaluation (priority formula), named ranges,
protections, Script/User properties, LockService. It is not the real Google engine, so the on-Google run
remains the final acceptance surface — but the previously-pending suites are now **executed with real
pass/fail**, not merely authored.

## Summary

| Metric | Count |
|---|---:|
| **Total test cases** | **58** |
| **Passed** | **58** |
| **Failed** | **0** |
| **Skipped** | **0** |
| Static analysis (`node --check`) | 27 / 27 files OK |

- Pure-logic: **34 / 34 passed** (`tests/pure_test_output.txt`).
- GAS suites via mock: **24 / 24 passed** (`tests/gas_mock_output.txt`).
- No skipped or disabled tests.

## 1. GAS suites via mock — EXECUTED ✅ (24/24)

Runner: `node tests/node/run_gas_suites.js`. Workbook is built + workflows seeded in the mock, then the
same `TestRunner` suites execute. Captured output: `tests/gas_mock_output.txt`.

```
INIT: WORKBOOK_READY — CreatorOS workbook initialized.
CreatorOS Milestone 1 tests
24 / 24 passed, 0 failed.
All green.
```

| Suite | Case | Result |
|---|---|---|
| Schema | SCH-001 all 16 sheets exist | PASS |
| Schema | SCH-002 verify() reports valid | PASS |
| Schema | SCH-003 headers match schema, no duplicates | PASS |
| Schema | SCH-004 CONFIG named ranges resolve | PASS |
| Schema | SCH-005 schema version marker set | PASS |
| Schema | SCH-006 protections exist on system sheets | PASS |
| Schema | SCH-007 default workflows loaded (8 workflows) | PASS |
| IdService | ID-001 next() returns PREFIX-000000 format | PASS |
| IdService | ID-002 sequential ids unique and increasing | PASS |
| IdService | ID-003 reserve() returns a contiguous block | PASS |
| IdService | ID-004 validate() enforces shape and prefix | PASS |
| IdService | ID-005 ensureAtLeast never lowers a counter | PASS |
| Validation | VAL-001…006 (enum/range/url/date/record/schedule) | PASS |
| Repository | REP-001 create idea assigns IDE id + timestamps | PASS |
| Repository | REP-002 priority score computed by formula (5,4,2 → 3.3) | PASS |
| Repository | REP-003 getById and find work by header | PASS |
| Repository | REP-004 updateById changes field, keeps id, bumps Updated_At | PASS |
| Repository | REP-005 invalid record rejected (RECORD_VALIDATION_FAILED) | PASS |
| Repository | REP-006 workflow steps ordered and complete (14) | PASS |

## 2. Pure-logic suite — EXECUTED ✅ (34/34)

Runner: `node tests/node/pure_tests.js`. Captured output: `tests/pure_test_output.txt`.

```
PURE-LOGIC RESULTS: 34 passed, 0 failed, total 34
```

Covers: ID validation ×4, enum ×2, numeric range/integer ×4, url/date ×4, record validation ×3,
cross-field date ×1, 7-value strategic goal ×3, priority arithmetic ×1, columnToLetter ×3, id padding ×1,
secret sanitization ×4, timezone ×2, AppError ×2.

## 3. Static analysis — EXECUTED ✅

`node --check`: **24/24** clasp-pushed files + **3/3** node harness files = 27/27 OK, 0 syntax errors.

## 4. Edge cases covered

- Numeric boundaries: 0 and 6 rejected for a 1–5 field; 2.5 rejected as non-integer.
- Empty values allowed at value level (required-ness handled separately).
- Wrong-prefix / malformed / unknown-prefix IDs rejected.
- Reversed schedule (`end ≤ start`) rejected.
- Self-referential `Source_Content_ID == Content_ID` rejected.
- Secret leakage: nested + header-cased secret keys redacted; non-secret siblings preserved.
- Invalid record on write throws `RECORD_VALIDATION_FAILED` — no partial row written (REP-005).
- ID counter floor never lowered (ID-005).
- Priority formula evaluates live from component scores + CONFIG weight named ranges (REP-002).
- Multi-dependency workflow step (`Dependency_Sequences = "7,8"`) seeded and parsed (see WorkflowSeed).
- Idempotent init: re-running does not duplicate seed rows (build guards; exercised by mock init + verify).

## 5. On-Google confirmation (recommended)

Run **CreatorOS ▸ Run Tests** on a bound project after `clasp push` and paste the summary below. This is a
final confirmation on the real Sheets engine; the logic is already executed green via the mock.

```
(paste on-Google run here)
```

## 6. Acceptance-exit status (docs 21 §14)

| Criterion | Target | Current |
|---|---|---|
| Critical tests pass | 100% | 100% (mock + pure) |
| No critical defect | required | met (0) |
| No API key exposure | required | met (design + sanitize verified) |
| No duplicate calendar events | required | N/A this milestone (calendar in M3) |

**Milestone 1: 58/58 executed green.** On-Google run recommended as final confirmation (no longer a gap).
