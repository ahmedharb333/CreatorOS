# CreatorOS — Changelog

All notable changes to this project. Format loosely follows Keep a Changelog. CreatorOS uses semantic
versioning with two tracked numbers: **PRODUCT_VERSION** (`MAJOR.MINOR.PATCH`) and **SCHEMA_VERSION** (integer).

## [Unreleased] — Milestone 1: Workbook & Repositories

- PRODUCT_VERSION `1.0.0`, SCHEMA_VERSION `1`.
- Repository scaffold: `/docs`, `/src` (+ `repositories`, `services`, `providers`, `ui`), `/tests`,
  `/sample-data`, `/release`, and governance files (`README`, `ASSUMPTIONS`, `DEVIATIONS`, `CHANGELOG`,
  `TEST_RESULTS`, `KNOWN_ISSUES`).
- clasp config (`appsscript.json`, `.clasp.json` placeholder), `.gitignore`.
- `Constants.gs`: sheet registry, ID prefix registry, enum catalog, schema/product version, named-range keys.
- `Errors.gs`: `AppError` + error catalog codes (docs 20).
- `LoggerService.gs`: structured INFO/WARN/ERROR/CRITICAL logging to `SYSTEM_LOG` with secret sanitization.
- `ConfigService.gs`: CONFIG sheet accessors, named ranges, Script/User Properties, version markers.
- `IdService.gs`: LockService-guarded, Script-Property-backed sequential immutable IDs; `next/reserve/validate`.
- `ValidationService.gs`: primitive + schema validators (enums, numeric ranges, dates, IDs).
- `WorkbookService.gs`: builds all 16 sheets with headers, data validations, protections, named ranges,
  formats; idempotent (safe re-run, preserves data).
- `BaseRepository.gs` + entity repositories (Idea, Content, Task, Workflow, Performance, Repurposing):
  header-mapped, batch read/write, immutable IDs.
- `WorkflowSeed.gs`: 8 default workflows (docs 27) loaded into WORKFLOWS.
- `Menu.gs` / `Main.gs`: `onOpen` menu, first-run initialization (schema verify, counters, workflows, version).
- `tests/`: GAS-native `TestRunner` + schema/ID/repository suites; menu entry `Run Tests`.
- Documentation register: resolved C1–C3, filled G1–G3, recorded D1–D3, E1–E2 (see `ASSUMPTIONS.md`).

### Milestone 1 — post-approval corrections (2026-08-06)

- **Tests executed** (correction 1): added Node Apps Script mock (`tests/node/mock_gas.js`) + runner; GAS
  suites now execute — **24/24 passed**; pure-logic **34/34**; `TEST_RESULTS.md` updated with actual results.
- **Folder READMEs** (correction 2): `src/services`, `src/providers`, `src/ui` responsibilities documented.
- **Goal vs Objective** (correction 3): `CONTENT.Objective` redefined to a distinct funnel-verb vocabulary
  (`Reach, Engage, Educate, Convert, Nurture, Monetize`); `docs/CONCEPTS_GOAL_VS_OBJECTIVE.md` added; G2 resolved.
- **Multi-dependency** (correction 4): workflow `Dependency_Sequence` → `Dependency_Sequences` (CSV);
  `parseDependencies()` added; YouTube long-form Final QA stores `"7,8"`; G3 resolved, D-03 recorded, ADR-011.
- **ADRs** (correction 5): `ARCHITECTURE_DECISION_RECORDS.md` added (ADR-001…013).
- `.claspignore` excludes `tests/node/**` (Node-only harness not pushed to Apps Script).

## [Unreleased] — Milestone 2: Core domain

- **SetupService** (FR-001): sheet-driven validate/save/complete/rerun; CONFIG mirroring; records preserved (ADR-014).
- **IdeaService** (FR-003): create/update/score/archive; convert derives Objective from Strategic Goal and
  Priority from Priority_Score (CONFIG map + thresholds), requiring confirmation when underivable — no arbitrary defaults.
- **ContentService** (FR-004): create/update/selectWorkflow/changeStatus; **pauseContent/resumeContent** with
  persisted `Paused_From_Status`; generic transitions cannot bypass pause/resume (ADR-016).
- **WorkflowService** (FR-004): find/getSteps/validate/clone.
- **TaskService** (FR-005): generateTasks (3 modes, backward due dates); **authoritative `Dependency_Task_IDs`
  JSON graph** + primary `Dependency_Task_ID`; dependency rewiring scoped to new/open tasks only (ADR-017).
- **CapacityService** (FR-006): utilization + warning levels (Normal/Watch/Overloaded/Critical).
- **PlanningService** (FR-007/008): buildWeeklyPlan/approveWeeklyPlan; **autoAllocate** assigns
  Scheduled_Start/End across work days (ADR-015); getTodayPlan/renderTodayView (priority-ordered Today).
- **Schema**: added `TASKS.Dependency_Task_IDs` (JSON) and `CONTENT.Paused_From_Status` (appended, order-safe;
  additive, schema stays v1 — DEVIATIONS D-04); new `json` validation type; CONFIG keys for goal→objective map,
  priority thresholds, daily start hour.
- **Menu**: Complete Setup, Reopen Setup, Build Weekly Plan, Open Today.
- **Tests**: Domain (12) + Planning (5) suites added. Executed **75/75 green** (34 pure + 41 GAS-mock).
  Fixed two `Sequence` vs `Task_Sequence` field bugs (dependency wiring + mode filter), now regression-covered.

## [Unreleased] — Milestone 3: Calendar Integration

- **CalendarService** (FR-009/010/011): `testConnection`, `pushTasks`, `syncTasks`, `deleteLinkedEvent`,
  `recreateMissingEvent`. Task-as-source-of-truth (ADR-018): manages only title/start/end/description, never
  attendees/conferencing/attachments (O-1). Idempotent via `Task ID` marker + `Calendar_Event_ID`; ±1 day
  duplicate window (O-2); explicit actions only, no auto-sync (O-4); task work blocks only, no all-day
  milestones (O-3). Per-record partial-failure reporting; narrow calendar queries.
- **Manifest**: added the `calendar` OAuth scope (declared only now that Calendar ships — DEVIATIONS D-05).
- **Menu**: Connect Calendar, Push to Calendar, Sync Calendar, Recreate Missing Events.
- **Tests**: Calendar suite (10) added — **85/85 green** (34 pure + 51 GAS-mock). Bound-project integration
  plan `docs/Calendar_Integration_Test_Plan.md` (required before M3 approval, I-06).
- **Docs**: Calendar_Event_Contract approved (O-1..O-4), COMMERCIAL_ROADMAP (Basic/Pro/Team, D-ROADMAP-1),
  ADR-018, DEVIATIONS D-05.

## [Unreleased] — Milestone 4: Recovery & Analytics

- **RecoveryService** (FR-012/013): `scan`/`analyzeTask`/`applyAction` (MANUAL_RESCHEDULE, NEXT_AVAILABLE_SLOT,
  REDUCE_SCOPE, DEFER_CONTENT, SKIP_TASK, CANCEL_CONTENT, MOVE_LOWER_PRIORITY). **Recover → Changed → Sync**
  (D4-2, permanent): recovery marks linked events `Changed` and never auto-pushes; content never auto-cancelled.
- **RECOVERY_LOG** system sheet + `RecoveryLogRepository`: every action logs timestamp/task/action/reason/
  previous+new schedule/user-initiated/calendar-impact (not creator-facing).
- **RepurposingService** (FR-014): rule-based derivatives from the approved mappings; accept creates linked
  content (Source_Content_ID + Repurpose_Group_ID); `suggestWithAi` guarded until M5.
- **PerformanceService** (FR-015): menu-driven entry; published-only default; multi-measurement; aggregate.
- **AnalyticsService** (KPI layer) + **DashboardService** (presentation): Performance→Analytics→Dashboard.
  Flagship **Execution Score** = completed-on-time ÷ planned tasks due (%). Decision-oriented dashboard
  answering: publishing consistently? keeping commitments? needs attention? work next? (D4-4).
- **Sheet visibility metadata** (ADR-019 / D4-5): every SCHEMA sheet tagged `visibility: creator|system`
  (metadata only; no hiding behavior). Creator sheets: HOME/TODAY/IDEAS/CONTENT/DASHBOARD.
- **Menu**: Run Recovery, Suggest Repurposing, Record Performance, Refresh Dashboard.
- **Tests**: Recovery 4, Repurposing 3, Performance 3, Analytics 2, Dashboard 2, + Schema visibility (SCH-008).
  **100/100 green** (34 pure + 66 GAS-mock). Full regression of M1–M3 intact.

## [Unreleased] — Milestone 5: AI Integration

- **AiService** (FR-017/018/019): optional, customer-funded AI. Key in User Properties (never cells/logs).
  Consumes analytics **only** via `AnalyticsService` (Analytics Contract). Outputs **staged for approval** —
  AI writes no records. Every feature has a **rule-based fallback**.
- **Provider abstraction**: `AiProvider` + `AnthropicProvider`/`OpenAIProvider`/`GeminiProvider`/
  `OpenRouterProvider`; isolated request shapes; editable default models (not permanent); normalized `AI_*`
  errors; retry only rate-limit/transient (max 2).
- **AiPrompts** (versioned, docs 28) + response parse/validate → `AI_RESPONSE_SCHEMA_INVALID`.
- **Selling-moment features**: `analyzePerformance` ("Execution Score dropped to X% — here's why"),
  `explainRecovery` ("recover without delaying Friday's video"), `generateWeeklyPlan` ("realistic for your
  actual hours") — each with a rule-based version.
- **AI_LOG** usage logging (provider/model/tokens/status only — no prompt, response, or key) via `AiLogRepository`.
- **Menu**: AI Set Up Provider (with data-transmission disclosure), Test Connection, Weekly Plan, Explain
  Execution Score, Disable.
- **Manifest/scope**: no new OAuth scope needed beyond existing (UrlFetchApp is implicit); Notifications
  (FR-020) + opt-in auto-sync trigger deferred.
- **Docs**: `Analytics_Contract.md` (KPI reference), ADR-020, REQUIREMENT_COVERAGE retitled cumulative.
- **Tests**: AI suite (10) via stub providers + mock UrlFetchApp. **110/110 green** (34 pure + 76 GAS-mock).
  Live-provider evidence recommended before sign-off (I-07).

## [Unreleased] — Creator Experience milestone

- **Creator Mode by default** (`WorkspaceService`): system sheets hidden via the `visibility` metadata (no
  hardcoded names); "Enable Advanced Workspace" reveals them. Applied on open + init (ADR-021).
- **HOME console** (`HomeService`): **Execution Score** as the hero + one-line "why", status, "what to do next",
  supporting KPIs, and the onboarding checklist until complete.
- **Flagship Sample Workspace** (`SampleDataService.loadSampleWorkspace`): one fictional creator, realistic
  schedule, published + in-production content, completed + upcoming tasks, an overdue recovery example, an
  approved auto-allocated (calendar-ready) plan, performance, repurposing, populated dashboard. `startEmptyWorkspace()`
  resets. The destructive test is guarded to never wipe real data.
- **Guided onboarding** (`OnboardingService`): live checklist + progress from data; SETUP stays authoritative.
- **Action-oriented HTML dialogs** (`ui/UiService` + `AddIdea.html`/`CreateContent.html`/`AiReview.html`):
  server functions write through existing services (validation + AI approval preserved). `.claspignore` pushes HTML.
- **Empty State Library** (`EMPTY_STATES`) + **contextual success moments** (`SuccessService`, incl. Execution
  Score increase detection).
- **Menu simplified**: creator actions up top; system/advanced tools under "More"; a "Workspace" submenu
  (Creator Mode / Advanced / Start Empty / Initialize).
- **`docs/FIRST_5_MINUTES.md`** — the benchmark for every UX decision.
- **Tests**: CreatorExperience suite (9). **119/119 green** (34 pure + 85 GAS-mock). No schema/API changes.
  Dialog rendering + the felt five-minute flow captured as bound-project screenshots (I-08).
