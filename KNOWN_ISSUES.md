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
| I-01 | Testing | On-Google execution of the GAS suites is still recommended as a final confirmation. **Downgraded** post-correction: the suites now **execute green via the Node Apps Script mock** (24/24) plus pure-logic (34/34), so this is a confirmation step, not a coverage gap. | Run `CreatorOS ▸ Run Tests` on a bound project; paste output into `TEST_RESULTS.md §5`. |
| I-03 | Deploy | `.clasp.json` `scriptId` is a placeholder until a bound Apps Script project exists. | Create a Sheet → Apps Script → copy Script ID into `.clasp.json` (or `clasp create`). |
| I-04 | Docs | Spec files `04_Master_PRD` and `16_Workbook_Schema` still show the 5-value Strategic Goal list; code/validations use the approved 7-value standard (ASSUMPTIONS C2). | Doc-maintenance pass to reconcile those two files to 7 values. |

## Resolved (this correction cycle)

| ID | Area | Resolution |
|---|---|---|
| I-02 | Schema | `CONTENT.Objective` is now a defined, documented enum (`Reach, Engage, Educate, Convert, Nurture, Monetize`), semantically distinct from Strategic Goal. See `docs/CONCEPTS_GOAL_VS_OBJECTIVE.md` (correction item 3). |
| I-05 | Schema | Workflow dependencies now use multi-valued `Dependency_Sequences` (CSV); the YouTube long-form Final QA step correctly stores `"7,8"`. See ADR-011 / DEVIATIONS D-03 (correction item 4). |

**Summary:** 0 Critical, 0 High, 0 Medium, 3 Low (I-01 downgraded to a confirmation step). Nothing blocks Milestone 2.
