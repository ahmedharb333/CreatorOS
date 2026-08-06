# CreatorOS — Architecture Decision Records (ADRs)

Lightweight ADRs capturing the significant architectural decisions made in Milestone 1. Each records the
context, the decision, and its consequences. Status: **Accepted** unless noted. Cross-references:
`ASSUMPTIONS.md`, `DEVIATIONS.md`.

---

## ADR-001 — Google Sheets + Apps Script as the platform
**Context:** v1 must be a commercial product a solo creator can copy and run, with no backend to operate.
**Decision:** Google Sheets is the system of record; Google Apps Script (V8) is the execution layer. No SaaS
backend, no external database.
**Consequences:** Zero-ops distribution and customer data ownership; constrained by Apps Script quotas and a
single global code scope. Fixed by charter — not revisited.

## ADR-002 — Single source of truth for the schema (`Constants.SCHEMA`)
**Context:** Doc/code drift produced conflict C2 (5 vs 7 goals).
**Decision:** Every sheet, header, enum, validation, protection strategy, formula column and timestamp lives
in `src/Constants.js`. `WorkbookService` builds the workbook from it and repositories map records from it.
**Consequences:** One edit point per schema change; validations and the builder cannot diverge. Enables a
future doc-generator (RECOMMENDATIONS R-01).

## ADR-003 — Repository-only cell access
**Context:** Business logic reading cells directly is the classic Sheets-app maintainability failure.
**Decision:** Only the repository layer (`src/repositories/*`), plus `WorkbookService`/`ConfigService`/
`LoggerService`, touch cells. Services operate on records. Columns are mapped by **header name**, never fixed
indexes (NFR-005).
**Consequences:** Reordering columns doesn't break logic; services are unit-testable against records.

## ADR-004 — Immutable IDs in Script Properties under LockService
**Context:** FR-002 requires immutable, collision-safe, never-reused IDs.
**Decision:** `IdService` stores per-prefix counters in Script Properties, guarded by LockService; IDs are
`PREFIX-000000`; never derived from row counts; `ensureAtLeast` floors counters to existing data on init.
**Consequences:** Safe under concurrent executions and after sorting/importing rows. Counters are global
per script (acceptable for the single-user v1 model).

## ADR-005 — Secrets in User Properties, sanitized logs
**Context:** NFR-003 / docs 29 forbid keys in cells or logs.
**Decision:** API keys and per-user settings live in User Properties (`CREATOROS_AI_API_KEY`); `LoggerService`
runs `sanitizeForLog` (redacts `key/token/secret/authorization/password`, recursively) before every write.
**Consequences:** Keys never surface in the workbook or SYSTEM_LOG. Verified by executed tests.

## ADR-006 — Idempotent, data-preserving initialization
**Context:** FR-001/NFR-006/NFR-008: setup can be re-run; copies must initialize cleanly without data loss.
**Decision:** `WorkbookService.build` creates sheets/headers only when missing and seeds CONFIG/SETUP/
CHANGELOG/workflows only when empty; `Main.alignIdCounters_` floors counters to existing data.
**Consequences:** "Initialize / Repair" is safe to run any time; a repaired workbook keeps user records.

## ADR-007 — Warning-only protections
**Context:** IDs/formulas/logs/config must be protected (docs 16 §13) without risking owner lock-out on a
copied workbook.
**Decision:** Protections are created with `setWarningOnly(true)`.
**Consequences:** Accidental manual edits are flagged; scripts and the owner are never blocked; copy-safe.
Trade-off: not a hard lock (acceptable for a solo-owner product).

## ADR-008 — `Priority_Score` as a protected sheet formula
**Context:** FR-003 wants live recalculation when component scores change; doc 26 supplies a formula but
warns fragile logic belongs in Apps Script.
**Decision:** `Priority_Score` is a per-row sheet formula referencing CONFIG weight **named ranges**
(`CFG_*`); repositories skip it on write and read the computed value back. The same weights are exposed to
`ConfigService` so services can compute identically when needed.
**Consequences:** No script run needed for recalculation; weights are user-tunable in one place. Verified by
REP-002 (→ 3.3) in the mock run.

## ADR-009 — clasp deployment, global-scope code
**Context:** Approved decision: Git + clasp; never the online editor except hotfixes.
**Decision:** Source lives in Git and is pushed with `clasp push`. Because Apps Script concatenates files
into one global scope, code uses global classes/functions (no import/require); folders are cosmetic. Node-only
test harness lives under `tests/node/**` and is excluded from push.
**Consequences:** Real version control and review; must avoid global-name collisions and order `class extends`
correctly (handled).

## ADR-010 — 7-value Strategic Goal enum (approved documentation correction)
**Context:** Conflict C2 — PRD/schema list 5 goals, formula catalog lists 7.
**Decision:** Adopt the 7-value set (`Awareness, Engagement, Authority, Leads, Sales, Community, Retention`)
as the project standard, applied in code and validations. Recorded as a documentation correction, not a
product deviation.
**Consequences:** Consistent enum everywhere; two spec files pending textual reconciliation (I-04).

## ADR-011 — Multi-valued workflow dependencies (`Dependency_Sequences`, CSV)
**Context:** Correction item 4 / ASSUMPTIONS G3 — doc 16 typed `Dependency_Sequence` as a single NUMBER, but
a default step (YouTube long-form Final QA) depends on two predecessors (7 and 8), and this must be settled
**before** M2 task-generation scheduling is built.
**Options considered:** (a) keep single value + store primary predecessor (lossy); (b) CSV string of sequence
numbers; (c) JSON array string.
**Decision:** **(b) CSV** — field renamed `Dependency_Sequences`, values like `"7,8"`. Chosen over JSON for
sheet readability and trivial hand-editing; `WorkflowSeed.parseDependencies()` converts CSV → number[] for
task generation.
**Consequences:** Task scheduling can honor all predecessor edges. Deviates from doc 16's single-NUMBER type
(recorded as DEVIATIONS D-03). Schema stays version 1 (never shipped). JSON remains a future option if
dependencies ever need per-edge metadata.

## ADR-012 — Content Objective as a distinct funnel-stage vocabulary
**Context:** Correction item 3 — Strategic Goal and Content Objective were conceptually blurred and shared words.
**Decision:** Keep them distinct: Strategic Goal (idea-level intent, 7 nouns) vs Content Objective (per-asset
funnel job, 6 verbs: `Reach, Engage, Educate, Convert, Nurture, Monetize`), documented in
`docs/CONCEPTS_GOAL_VS_OBJECTIVE.md`. Vocabularies are deliberately disjoint.
**Consequences:** No overlap/ambiguity; sample data and validations updated. Making Objective end-user-editable
is deferred (RECOMMENDATIONS R-06).

## ADR-013 — GAS-native tests + Node mock execution surface
**Context:** Apps Script has no built-in test framework, and the build environment can't reach Google.
**Decision:** A GAS-native `TestRunner` runs Schema/Id/Validation/Repository suites in Apps Script; a Node
mock of the Sheets/Properties/Lock runtime (`tests/node/`) executes those same suites plus pure-logic units
for CI-style evidence without Google.
**Consequences:** 58/58 executed green pre-deployment; the on-Google run remains the final confirmation, not a
coverage gap. Risk: mock fidelity — mitigated by keeping the mock limited to relied-upon semantics.

## ADR-014 — Sheet-driven Setup with a UI-agnostic service (Milestone 2)
**Context:** M2 needs setup capture; docs 25 envisions a wizard, but building HTML now is heavy.
**Decision (approved):** The SETUP tab is the authoritative input; the creator edits Setting_Value cells and
runs "Complete Setup". All logic (validation, persistence, CONFIG mirroring, onboarding status) lives in
`SetupService` behind UI-agnostic APIs (`getSetupState/validateSetup/saveSettings/completeSetup/rerunSetup`),
so a future HTML onboarding wizard can reuse them without backend changes. No wizard is built in M2.
**Consequences:** Ships fast; rerun preserves all records; secure API-key entry still uses a dialog (M5).

## ADR-015 — Task generation sets due dates only, not scheduled times (Milestone 2)
**Context:** M2 generates tasks; who owns Scheduled_Start/End and calendar placement?
**Decision (approved):** `generateTasks` computes `Due_Date = Planned_Publish_Date + Offset_From_Publish_Days`
(true calendar dates), `Estimated_Minutes`, and dependencies only. `Scheduled_Start/End` are left empty;
assigning work-block times and calendar placement belongs to `PlanningService` (M2 planning increment) and
`CalendarService` (M3). Schema fields exist now but stay unpopulated.
**Consequences:** Clean separation; generation is idempotent per mode (CREATE_ONLY / APPEND_MISSING /
REPLACE_OPEN_TASKS) and never replaces completed tasks. **Update:** `PlanningService.autoAllocate` now
implements the scheduled-time assignment (work-day spread); calendar placement remains M3.

## ADR-016 — Controlled pause/resume for content (Milestone 2 correction)
**Context:** Generic status transitions let Paused content jump to any forward state, losing where it paused.
**Decision (approved):** Add a persisted `Paused_From_Status` column and explicit `pauseContent(id)` /
`resumeContent(id)` methods. Pause stores the current status; resume returns content **only** to that stored
status. The generic `changeStatus` cannot enter or leave `Paused` (except cancel), so it can't bypass the rule.
**Consequences:** Predictable resume; one extra column. Errors `CONTENT_ALREADY_PAUSED` / `CONTENT_NOT_PAUSED`.

## ADR-017 — TASKS authoritative multi-dependency (`Dependency_Task_IDs`) (Milestone 2 correction)
**Context:** A single `Dependency_Task_ID` pointer is lossy; workflows are multi-dependency (ADR-011), and the
planner/calendar may need the full predecessor set.
**Decision (approved):** Add `Dependency_Task_IDs` (JSON array of predecessor Task IDs) as the **authoritative**
dependency graph. `Dependency_Task_ID` is kept as the primary/latest predecessor for display/back-compat.
`wireDependencies` writes both, only for new/open tasks — **closed tasks are never rewired** (their dependency
history is immutable unless an explicit repair/migration runs).
**Consequences:** Full dependency fidelity for scheduling. New JSON validation type. Additive column
(appended at end, order-safe); schema stays version 1 (un-deployed, no migration — see DEVIATIONS D-04).
