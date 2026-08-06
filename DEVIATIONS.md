# CreatorOS — Deviations Register

Deviations from the letter of the source documentation, with justification. Each is traceable to an
entry in `ASSUMPTIONS.md`. None expand product scope.

| ID | Deviates from | Deviation | Reason | Assumption ref |
|---|---|---|---|---|
| D-01 | `05_Implementation_Brief` (`/apps-script`) | Repository code lives in **`/src`** (with subfolders) and a **`KNOWN_ISSUES.md`** is added | The Master Build Prompt (`23`) and Engineering Overview (`15`) are higher-priority and specify `/src` + `KNOWN_ISSUES.md` | C3 |
| D-02 | `06_Data_Model` (`WF-` workflow prefix) | Workflow ID prefix is **`WKF-`** (3 letters) | Consistency: every other entity prefix is 3 letters + 6 digits; `WF-` was the lone 2-letter prefix | G1 |

No other deviations at Milestone 1. Additional deviations will be appended as they arise.
