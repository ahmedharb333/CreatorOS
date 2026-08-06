# CreatorOS — Deviations Register

Deviations from the letter of the source documentation, with justification. Each is traceable to an
entry in `ASSUMPTIONS.md`. None expand product scope.

| ID | Deviates from | Deviation | Reason | Assumption ref |
|---|---|---|---|---|
| D-01 | `05_Implementation_Brief` (`/apps-script`) | Repository code lives in **`/src`** (with subfolders) and a **`KNOWN_ISSUES.md`** is added | The Master Build Prompt (`23`) and Engineering Overview (`15`) are higher-priority and specify `/src` + `KNOWN_ISSUES.md` | C3 |
| D-02 | `06_Data_Model` (`WF-` workflow prefix) | Workflow ID prefix is **`WKF-`** (3 letters) | Consistency: every other entity prefix is 3 letters + 6 digits; `WF-` was the lone 2-letter prefix | G1 |
| D-03 | `16_Workbook_Schema` §7 (`Dependency_Sequence`, single `NUMBER`) | Field is **`Dependency_Sequences`** — a CSV `TEXT` of predecessor sequence numbers (multi-valued) | A default workflow step has two predecessors; single value is lossy. Approved as correction item 4 / ADR-011, settled before M2 task generation | G3 |
| D-04 | `16_Workbook_Schema` §6 (TASKS) / §5 (CONTENT) | Added columns **`TASKS.Dependency_Task_IDs`** (JSON array, authoritative dependency graph) and **`CONTENT.Paused_From_Status`** (persisted resume target) | Approved M2 corrections 1 & 2 (ADR-016, ADR-017). Both appended at end (column-order-safe); additive/backward-compatible, so schema stays version 1 — un-deployed, no migration required. | — |

Additional deviations will be appended as they arise.
