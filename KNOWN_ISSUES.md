# CreatorOS — Known Issues & Limitations

Severity: **Critical** (blocks release / data loss) · **High** (major function broken/unsafe) ·
**Medium** (limitation with a workaround) · **Low** (cosmetic / documentation / deferred detail).

## Critical
_None._

## High
_None._

## Medium
_None._

## Low

| ID | Area | Description | Plan / Status |
|---|---|---|---|
| I-04 | Docs | Spec files `04_Master_PRD` and `16_Workbook_Schema` still show the 5-value Strategic Goal list; code/validations use the approved 7-value standard (ASSUMPTIONS C2). | Doc-maintenance pass to reconcile those two files to 7 values. |
| I-06 | Testing | Milestone 3 Calendar is executed green via the Node CalendarApp mock (10/10), but **bound-project (real Google Calendar) integration evidence is required before M3 approval** (per the M3 conditions). | Run `docs/Calendar_Integration_Test_Plan.md` (INT-CAL-001…012) on a bound project; paste results there. |
| I-07 | Testing | Milestone 5 AI is executed green via stub providers + mock `UrlFetchApp` (10/10) — provider adapters, validation, fallback, approval, key-safety, error normalization. **Live provider calls (real key + network) are not exercised in the mock.** | On a bound project with a customer key: AI Set Up Provider → Test Connection → AI Weekly Plan / Explain Execution Score for each provider; confirm key never appears in cells/AI_LOG. |
| I-08 | Testing | Creator Experience data/logic is executed green via the mock (9/9), but **HTML dialog rendering and the felt five-minute flow are inherently visual** and not rendered by the mock. | Capture the bound-project walkthrough (first launch → sample → Creator Mode → Add Idea → Create Content → AI Review → HOME) per the CX QA package. |

## Resolved (this correction cycle)

| ID | Area | Resolution |
|---|---|---|
| I-01 | Testing | **On-Google run completed: 76/76 green** on the bound "CreatorOS Beta Master" project (2026-08-07). See `TEST_RESULTS.md §5`. The run also surfaced and fixed two real, mock-invisible bugs: self-healing `seedSetup`/`saveSettings` (SETUP-002) and the `clearData` delete-all-non-frozen-rows crash in Try Sample Workspace (CX-SAMPLE-001). |
| I-02 | Schema | `CONTENT.Objective` is now a defined, documented enum (`Reach, Engage, Educate, Convert, Nurture, Monetize`), semantically distinct from Strategic Goal. See `docs/CONCEPTS_GOAL_VS_OBJECTIVE.md` (correction item 3). |
| I-03 | Deploy | Bound Apps Script project now exists; `.clasp.json` `scriptId`/`parentId` point at the live "CreatorOS Beta Master" Sheet and `clasp push` deploys 65 files cleanly. |
| I-05 | Schema | Workflow dependencies now use multi-valued `Dependency_Sequences` (CSV); the YouTube long-form Final QA step correctly stores `"7,8"`. See ADR-011 / DEVIATIONS D-03 (correction item 4). |

**Summary:** 0 Critical, 0 High, 0 Medium, 4 Low. Nothing blocks QA review. Remaining items are optional
visual/live confirmations that complement the green suites: **I-06** (bound Calendar), **I-07**
(live-provider AI), **I-08** (CX dialog walkthrough).
