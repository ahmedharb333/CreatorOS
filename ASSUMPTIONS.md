# CreatorOS — Assumptions Register

This file records every architectural assumption, resolved documentation conflict, and
undocumented requirement discovered during implementation. Per the Master Project Charter,
no business rule is invented silently — each entry states **why**, the **options**, the
**recommendation**, and the **impact**.

- **Product version:** 1.0.0
- **Schema version:** 1
- **Status legend:** `ACCEPTED` (approved by Product Owner) · `OPEN` (awaiting decision) · `SUPERSEDED`

---

## Resolved conflicts

### C1 — Weekly plan tab name (`WEEK` vs `WEEKLY_PLAN`) — ACCEPTED
- **Why:** Doc `07_Google_Sheets_Architecture` names the tab `WEEK`, while the Master PRD (`04`),
  Workbook Schema (`16`), UI Spec (`25`), and Traceability Matrix (`24`) all use `WEEKLY_PLAN`.
- **Options:** (a) `WEEK` · (b) `WEEKLY_PLAN`.
- **Recommendation / Decision:** Use **`WEEKLY_PLAN`** — four higher-authority docs agree; `WEEK`
  is treated as an informal abbreviation.
- **Impact:** Single canonical tab name in `Constants.gs` (`SHEETS.WEEKLY_PLAN`). No functional change.

### C2 — Strategic Goal enum (5 vs 7 values) — ACCEPTED (approved documentation correction)
- **Why:** PRD (`04`) and Workbook Schema (`16`) list 5 goals (Awareness, Engagement, Leads, Sales,
  Authority). The Formula & Validation Catalog (`26`) lists 7 (adds **Community**, **Retention**).
- **Options:** (a) 5-value PRD set · (b) 7-value superset · (c) route to architect.
- **Decision:** Adopt the **7-value enum** as the authoritative project standard:
  `Awareness, Engagement, Authority, Leads, Sales, Community, Retention`. Approved by Product Owner
  and Product Architect as a **documentation correction — not a product deviation** (therefore not
  listed in `DEVIATIONS.md`). All documentation, workbook schema, validations, formulas, and code
  references use these 7 values.
- **Impact:** `ENUMS.STRATEGIC_GOAL` has 7 members; IDEAS data validation uses all 7. The canonical
  spec docs under `/docs` (04, 16) are to be reconciled to 7 values as a doc-maintenance follow-up
  (tracked in `KNOWN_ISSUES` I-04).

### C3 — Repository layout (`/apps-script` vs `/src`) — ACCEPTED
- **Why:** Implementation Brief (`05`) specifies `/apps-script`; the Master Build Prompt (`23`,
  higher priority) and Engineering Overview (`15`) specify `/src` with subfolders, and `23` adds
  `KNOWN_ISSUES.md`.
- **Decision:** Follow doc `23`/`15`: **`/src`** with `repositories/`, `services/`, `providers/`,
  `ui/` subfolders; include **`KNOWN_ISSUES.md`**. Logged in `DEVIATIONS.md` (D-01).
- **Impact:** Directory structure; no code behavior change.

---

## Filled gaps

### G1 — ID prefix registry — ACCEPTED
- **Why:** Doc `06_Data_Model` defines only CRT/IDE/CNT/TSK/WF/EVT/PER/LOG. Formats for `Week_ID`,
  `Repurpose_ID`, `Repurpose_Group_ID`, workflow `Step_ID`, and `Request_ID` were undefined, and
  `WF-` used 2 letters while every other prefix used 3.
- **Decision:** Standardize **`XXX-000000`** (3 uppercase letters + 6 zero-padded digits) for every
  entity. Canonical registry (see `Constants.gs` `ID_PREFIX`):

  | Entity | Prefix | Example |
  |---|---|---|
  | Creator | `CRT` | `CRT-000001` |
  | Idea | `IDE` | `IDE-000001` |
  | Content | `CNT` | `CNT-000001` |
  | Task | `TSK` | `TSK-000001` |
  | Workflow | `WKF` | `WKF-000001` |
  | Workflow step | `WFS` | `WFS-000001` |
  | Weekly plan (week) | `WEK` | `WEK-000001` |
  | Repurpose suggestion | `RPS` | `RPS-000001` |
  | Repurpose group | `RPG` | `RPG-000001` |
  | Performance record | `PER` | `PER-000001` |
  | AI request | `AIR` | `AIR-000001` |
  | System log | `LOG` | `LOG-000001` |
  | Correlation (bulk ops) | `COR` | `COR-000001` |
  | Calendar event (Google) | — | stored as Google's native event ID |

- **Impact:** `Workflow_ID` prefix becomes `WKF` (was `WF-` in doc `06`) → logged as **D-02** in
  `DEVIATIONS.md`. All other prefixes are additive, not conflicting.

### G2 — `CONTENT.Objective` enum undefined — RESOLVED (correction item 3)
- **Why:** Workbook Schema marks `CONTENT.Objective` as `ENUM "configured objective"` but no value
  list exists in any document, and it was easy to confuse with Strategic Goal.
- **Decision:** Define a distinct, funnel-stage **verb** vocabulary that cannot be confused with the
  Strategic Goal nouns: `Reach, Engage, Educate, Convert, Nurture, Monetize`. Documented authoritatively in
  `docs/CONCEPTS_GOAL_VS_OBJECTIVE.md` and `ARCHITECTURE_DECISION_RECORDS.md` ADR-012.
- **Impact:** `ENUMS.CONTENT_OBJECTIVE` + CONTENT validation use these 6 values; sample data updated.
  Making the list end-user-editable at runtime is deferred (RECOMMENDATIONS R-06).

---

### G3 — Single-valued dependency vs multi-predecessor step — RESOLVED (correction item 4)
- **Why:** Workbook Schema (`16` §7) typed workflow `Dependency_Sequence` as a single `NUMBER`, but the
  default library (`27`) YouTube long-form "Final QA" step depends on two predecessors (steps 7 **and** 8),
  and this had to be settled before M2 task-generation scheduling is built.
- **Decision:** Replace the single field with multi-valued **`Dependency_Sequences`** (CSV of predecessor
  sequence numbers, e.g. `"7,8"`). `WorkflowSeed.parseDependencies()` converts CSV → number[]. CSV chosen
  over JSON for sheet readability. See `ARCHITECTURE_DECISION_RECORDS.md` ADR-011.
- **Impact:** Task backward-scheduling in M2 can honor all predecessor edges. Deviation from doc 16's
  single-NUMBER type recorded as `DEVIATIONS` D-03. `KNOWN_ISSUES` I-05 resolved.

## Design decisions

### D1 — `Priority_Score` computed as a protected sheet formula — ACCEPTED
- **Why:** FR-003 requires the score to "recalculate when component scores change"; Schema marks it
  non-user-editable/computed; doc `26` supplies the formula but warns fragile logic belongs in
  Apps Script.
- **Decision:** Implement `Priority_Score` as a **protected sheet formula** referencing CONFIG named
  ranges (`CFG_IMPACT_WEIGHT`, `CFG_CONFIDENCE_WEIGHT`, `CFG_EFFORT_WEIGHT`). This satisfies live
  recalculation with no script execution. Repositories read the computed value back. The same
  weights are also exposed to Apps Script (`ConfigService`) so services can compute identically
  when needed (e.g. AI context, ranking) — single source of weights.
- **Impact:** IDEAS `Priority_Score` column is formula-owned and protected.

### D2 — AI default model identifiers are editable, never hard-coded permanently — ACCEPTED
- **Why:** Doc `19` §5 states model availability changes over time and identifiers must not be
  hard-coded as permanent assumptions.
- **Decision:** Ship current default model IDs as **editable** values in `CONFIG` / User Properties.
  Any custom model string is accepted. Defaults are documented in the AI provider guide, not frozen
  in source constants. (Milestone 5.)
- **Impact:** No AI code in Milestone 1; recorded now to bind the later implementation.

### D3 — GAS-native test runner — ACCEPTED
- **Why:** Apps Script has no built-in test framework; doc `15` implies `tests/TestRunner.gs`.
- **Decision:** Build a lightweight assertion runner (`tests/TestRunner.gs`) that registers suites,
  runs them inside Apps Script, logs pass/fail per case, and exports a Markdown summary to
  `TEST_RESULTS.md` (and the `SYSTEM_LOG`). Pure-logic units that need no Spreadsheet API are also
  runnable to give deterministic evidence.
- **Impact:** Defines the "test runner approach" required by the Build Start Gate (doc `30`).

---

## Environment assumptions

### E1 — Deployment via clasp — ACCEPTED
- Source lives in this repo as `.js` files and is pushed to Apps Script with `clasp push`. Apps Script
  concatenates all files into one global scope, so code uses **global classes/functions, no
  `import`/`require`**. Subfolders are cosmetic in the online editor.
- The Product Owner runs `clasp push` and any git pushes (credential-gated).

### E2 — Milestone 1 test execution is machine-side — ACCEPTED
- This environment cannot run the Spreadsheet/Calendar APIs. Milestone 1 is delivered **code-complete**
  with a runnable in-workbook test suite. Runtime evidence (pass/fail log, screenshots) is produced by
  running `CreatorOS ▸ Run Tests` after `clasp push`. `TEST_RESULTS.md` marks each case
  `PENDING-EXECUTION` until run. This is disclosed, not hidden.
