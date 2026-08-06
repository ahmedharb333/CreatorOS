# CreatorOS — Known Issues & Limitations

Tracks open limitations, provisional decisions, and defects. Severity: `LOW` / `MEDIUM` / `HIGH` / `CRITICAL`.

| ID | Severity | Area | Description | Plan |
|---|---|---|---|---|
| I-01 | LOW | Testing | Milestone 1 tests are delivered as runnable code but not yet executed in this environment (no Spreadsheet API here). Runtime evidence pending `clasp push` + `Run Tests`. | Product Owner runs the suite; `TEST_RESULTS.md` updated with real output. |
| I-02 | LOW | Schema | `CONTENT.Objective` value list is provisional (undocumented in specs; see ASSUMPTIONS G2). | Confirm/refine the list with Product Owner; it is CONFIG-driven so no code change needed. |
| I-03 | LOW | Deploy | `.clasp.json` contains a placeholder `scriptId`; the real script ID is set once the bound Apps Script project exists. | Product Owner creates a Google Sheet, opens Apps Script, and pastes the script ID (or runs `clasp create`). |
| I-04 | LOW | Docs | Canonical spec docs `04_Master_PRD` and `16_Workbook_Schema` still show the 5-value Strategic Goal list; code/validations use the approved 7-value standard (ASSUMPTIONS C2). | Doc-maintenance pass to reconcile the two spec files to 7 values. |
| I-05 | LOW | Schema | Workflow `Dependency_Sequence` is single-valued; one default step (YouTube long-form Final QA) has two logical predecessors (ASSUMPTIONS G3). | If Milestone 2 scheduling needs both edges, add a delimited multi-dependency field (MINOR schema bump). |

No CRITICAL or HIGH issues open at Milestone 1.
