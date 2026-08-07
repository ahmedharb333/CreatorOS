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

## ADR-018 — Calendar sync: task-as-source-of-truth, marker idempotency, explicit-only (Milestone 3)
**Context:** Tasks must project onto Google Calendar work blocks and stay consistent without a backend, without
duplicates, and without destroying user edits.
**Decision (approved, rulings O-1…O-4):**
- **Task is source of truth (O-1):** CalendarService manages only title/start/end/description/priority-status
  markers via `setTitle/setTime/setDescription`; it never calls attendee/conferencing/attachment setters, so
  those remote fields are preserved. No bidirectional reconciliation in M3.
- **Idempotency:** the `Calendar_Event_ID` on the task is the fast path; the `Task ID` marker embedded in the
  event description is the authoritative duplicate key. Duplicate search uses a **±1 day** window around
  `Scheduled_Start` (O-2). No `Scheduled_Start` ⇒ not push-eligible.
- **Explicit-only (O-4):** Push / Sync / Recreate-Missing are user-initiated; **no auto-sync trigger** in M3.
- **Task work blocks only (O-3):** all-day publishing milestones deferred.
- **Non-destructive:** completion keeps the event (optional `✓` prefix); deletion requires confirmation.
- **Partial failure is first-class:** bulk ops return per-record results and never abort the batch.
- **Staged scope:** calendar scope declared in the manifest only now that CalendarService ships (DEVIATIONS D-05);
  authorized when the user enables Calendar.
- **Capability-based:** push/sync gated by a `calendar_push` capability defaulting on, so commercial tiers can
  gate it later via config, not code (COMMERCIAL_ROADMAP).
**Consequences:** Idempotent, duplicate-safe, non-destructive calendar integration aligned to the approved
contract. Bidirectional reconciliation, publishing milestones, and auto-sync are explicitly future work.

## ADR-019 — Hide the Complexity: Creator Mode vs Advanced Workspace (product principle)
**Context:** Product direction (2026-08-07): CreatorOS is an application whose presentation layer happens to be
Google Sheets. Internal sophistication may grow, but the creator's surface must get progressively simpler —
"the creator should only see what helps them publish."
**Decision (binding for all future work):**
- **Creator Mode** exposes only: **HOME, TODAY, IDEAS, CONTENT, DASHBOARD.** Everything else
  (SETUP, TASKS, WORKFLOWS, WEEKLY_PLAN, CALENDAR, REPURPOSING, PERFORMANCE, AI_LOG, SYSTEM_LOG, CONFIG,
  CHANGELOG) is a **system sheet** — eventually hidden.
- Creators never need to understand repositories, services, workflow tables, IDs, logs, schema versions,
  validation tables, or configuration internals.
- **No feature may require the user to interact directly with an internal sheet.** All creator interactions go
  through menus/dialogs backed by the (UI-agnostic) services. Services stay the durable interface.
- A future **Advanced Workspace** ("Enable Advanced Workspace") toggle may reveal system sheets for power
  users. **Not implemented now** — but nothing may block this separation.
**Enabling step (proposed, low-risk):** tag each sheet in `Constants.SCHEMA` with `visibility: 'creator' |
'system'` (inert metadata) so a later Creator Mode can hide system sheets by config, with zero refactor.
**Consequences:** M4+ features (recovery, repurposing, performance, dashboard) must be menu/dialog/service-
driven; DASHBOARD/TODAY are rendered (computed) creator-facing views; PERFORMANCE/REPURPOSING remain data
sheets but are treated as system-internal, with creator interaction via services, not raw editing.

## ADR-020 — AI Integration: optional, customer-funded, analytics-sourced, approval-staged (Milestone 5)
**Context:** AI must add value without becoming a dependency, without exposing keys, and without duplicating
the analytics layer — while reinforcing the differentiating selling moments.
**Decision (approved):**
- **Optional + customer-funded:** AI is off by default; the customer supplies the key (User Properties only —
  never cells/logs, docs 29). Core features work fully with AI disabled; **every AI feature has a rule-based
  fallback**.
- **AnalyticsService is the sole analytics source:** `AiService` reads KPIs via `AnalyticsService.getKpis()` /
  `executionScore()`; it never queries repositories for metrics. (Operational lists like open tasks are not
  analytics and may be read for planning context.) See `docs/Analytics_Contract.md`.
- **Approval model:** AI outputs are **staged** and returned for review; AI writes **no records** — acceptance
  goes through the existing services (IdeaService/ContentService/etc.).
- **Provider abstraction:** `AiProvider` + 4 adapters (Anthropic/OpenAI/Gemini/OpenRouter); provider-specific
  code is isolated; models are editable defaults, not permanent (docs 19 §5). Errors normalize to `AI_*` codes;
  retry only rate-limit/transient (max 2).
- **Response validation:** responses are parsed + schema-checked → `AI_RESPONSE_SCHEMA_INVALID` on failure.
- **Selling moments** drive the feature set: `analyzePerformance` ("Execution Score dropped to X% — here's
  why"), `explainRecovery` ("recover without delaying Friday's video"), `generateWeeklyPlan` ("realistic for
  your actual hours"). Each has a rule-based version so the moment lands even without AI.
- **Scope:** Notifications (FR-020) + opt-in auto-sync trigger remain deferred (later increment).
**Consequences:** AI is a value-add layer over the same KPIs the dashboard uses; no lock-in, no key exposure,
no analytics duplication when M5 AI and the dashboard both consume AnalyticsService. Live provider calls need
bound-project + key evidence (KNOWN_ISSUES I-07).

## ADR-021 — Creator Experience: effortless by default (Creator Experience milestone)
**Context:** The system is powerful; the next competitive advantage is making that power feel simple —
judged by *"would a creator understand and value this in five minutes?"* (`docs/FIRST_5_MINUTES.md`).
**Decision (approved, CX-1…CX-5 + additions):**
- **Creator Mode by default** (CX-3): `WorkspaceService` hides system sheets, driven by the `visibility`
  metadata (never hardcoded names); only HOME/TODAY/IDEAS/CONTENT/DASHBOARD show. "Enable Advanced Workspace"
  reveals system sheets. This is the one new (UX-only) backend piece.
- **HOME leads with Execution Score** (CX-5): `HomeService` renders a console — hero Execution Score + a
  one-line "why", status, "what to do next", supporting KPIs, and the onboarding checklist until complete.
- **Flagship Sample Workspace** (CX-4): `SampleDataService.loadSampleWorkspace()` seeds a realistic creator
  through the real services (published + in-production content, completed + upcoming tasks, an overdue recovery
  example, an approved auto-allocated plan, performance, repurposing, a populated dashboard). `startEmptyWorkspace()`
  resets. The destructive test is guarded to never wipe a real workbook.
- **Guided onboarding** (CX-1): `OnboardingService` computes a live checklist + progress from data (no duplicate
  state); SETUP stays authoritative (a future HTML wizard must call SetupService).
- **Action-oriented dialogs** (CX-2): HTML dialogs for Add Idea, Create Content, AI Review; server functions in
  `UiService` write through the existing services, preserving validation and the AI approval model.
- **Empty State Library** + **contextual success moments**: every major screen has a designed empty state; subtle
  ✓ celebrations (including "Execution Score increased").
**Consequences:** No schema changes, no new external APIs — purely UX over the existing services. HTML rendering
and the felt five-minute flow are captured as bound-project screenshots at the gate (the mock can't render
HtmlService); all data/logic is mock-executed green.
