# CreatorOS — Milestone 2 Report

**Milestone 2 — Core Domain** · Product `1.0.0` · Schema `1` · Date: 2026-08-07
Status: **Code-complete; stopped at the QA gate.** Awaiting Product Architect / QA approval before Milestone 3 (Calendar).

Includes the six approved post-review corrections (dependency model, pause/resume, rewiring scope, conversion
derivation, dead-variable cleanup, scan policy) applied before the planning engine was built.

---

## 1. Objectives completed

Milestone 2 delivers the core domain services on top of the M1 data layer — the logic that turns a creator's
goals and content into an executable plan:

- ✅ Guided, sheet-driven **setup** (validate / save / complete / rerun; records preserved).
- ✅ **Idea** capture, scoring, and conversion to content with derived (not arbitrary) objective & priority.
- ✅ **Content** creation, status transitions, and controlled pause/resume.
- ✅ **Workflow** matching, validation, and cloning.
- ✅ **Task generation** — backward-scheduled due dates, generation modes, and an authoritative dependency graph.
- ✅ **Capacity** calculation with warning levels.
- ✅ **Weekly planning** (build/approve) + work-day **auto-allocation** of scheduled times.
- ✅ **Today** view in priority order.
- ✅ Domain + planning test suites, executed green.

## 2. Features implemented

| Service | Requirement | Delivers |
|---|---|---|
| `SetupService` | FR-001 | `getSetupState/validateSetup/saveSettings/completeSetup/rerunSetup`; CONFIG mirroring; UI-agnostic (ADR-014); rerun preserves records |
| `IdeaService` | FR-003 | `createIdea/updateIdea/scoreIdea/convertToContent/archiveIdea`; convert derives Objective from Strategic Goal and Priority from Priority_Score, requiring confirmation when underivable |
| `ContentService` | FR-004 | `createContent/updateContent/selectWorkflow/changeStatus/markPublished` + `pauseContent/resumeContent` with persisted `Paused_From_Status` (ADR-016) |
| `WorkflowService` | FR-004 | `findWorkflow/getSteps/validateWorkflow/cloneWorkflow` |
| `TaskService` | FR-005 | `generateTasks` (CREATE_ONLY/APPEND_MISSING/REPLACE_OPEN_TASKS), backward `Due_Date`, authoritative `Dependency_Task_IDs` graph + primary pointer, never rewires closed tasks; `completeTask/blockTask/detectOverdue/getDependencies` |
| `CapacityService` | FR-006 | `getWeeklyCapacity/calculateUtilization/warningLevel` (Normal/Watch/Overloaded/Critical) |
| `PlanningService` | FR-007/008 | `buildWeeklyPlan/approveWeeklyPlan`; `autoAllocate` assigns `Scheduled_Start/End` across work days (ADR-015); `getTodayPlan/renderTodayView` |

Plus `SettingsRepository`, `BaseRepository.deleteById`, a `json` validation type, new CONFIG keys
(goal→objective map, priority thresholds, daily start hour), and menu actions (Complete Setup, Reopen Setup,
Build Weekly Plan, Open Today).

## 3. Architecture decisions

New/updated ADRs (see `ARCHITECTURE_DECISION_RECORDS.md`):

- **ADR-014** — sheet-driven Setup with a UI-agnostic service (a future HTML wizard reuses the same APIs).
- **ADR-015** — task generation sets due dates only; `PlanningService.autoAllocate` assigns scheduled times.
- **ADR-016** — controlled pause/resume via `Paused_From_Status`; generic transitions can't bypass it.
- **ADR-017** — authoritative `Dependency_Task_IDs` JSON graph; closed-task dependencies are immutable.

Invariants held: only repositories touch cells; services return `ServiceResult`/throw typed `AppError`;
no arbitrary business defaults (conversion derives or asks); AI still absent (not required until M5).

## 4. Files created (Milestone 2)

**Services (7):** `SetupService, IdeaService, ContentService, WorkflowService, TaskService, CapacityService,
PlanningService`. **Repository (1):** `SettingsRepository`. **Tests (2 suites):** `DomainTests` (12),
`PlanningTests` (5). Menu + BaseRepository extended. Schema/validation/CONFIG/error-catalog updated in place.

## 5. Remaining work

Not started, by instruction:

- **M3 Calendar:** connection, event creation, idempotent sync, duplicate prevention, missing-event recovery, reminders.
- **M4 Recovery & analytics:** overdue recovery actions, repurposing, performance entry, dashboard.
- **M5 AI:** provider abstraction, secure key storage, weekly plan/ideas/repurposing, response validation, fallback.
- **M6 Release:** installation flow, sample loader, migration/upgrade, complete tests, release artifact.
- **UI polish:** HTML dialogs/wizard (deferred; services are UI-agnostic so they slot in without backend change).

## 6. Known limitations

All Low severity (see `KNOWN_ISSUES.md`). Highlights: on-Google run is a recommended final confirmation
(I-01, downgraded — suites execute green via the Node mock); `.clasp.json` scriptId placeholder (I-03);
two spec files pending 7-goal reconciliation (I-04). Two `Sequence`/`Task_Sequence` field bugs found during
M2 were fixed and are now regression-covered.

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| On-Google behavior differs from the mock | Low | Medium | 75/75 executed via mock+pure; run on-Google first on a bound project; `verify()` structural check |
| `autoAllocate` overloads a day (stacks past capacity) | Medium | Low | By design (capacity before ambition: warn, never drop); weekly plan surfaces the warning level |
| Single primary `Dependency_Task_ID` misread as authoritative | Low | Medium | `Dependency_Task_IDs` is the authoritative graph; documented in ADR-017 and code comments |
| Full-table scans at scale | Low (MVP) | Medium | Accepted for MVP; R-04 header/index cache documented for later |

No High or Critical risks.

## 8. Recommendations for Milestone 3

1. **Run the suite on a bound project** (`clasp push` → Initialize/Repair → Run Tests) to close I-01.
2. Build **CalendarService** on top of the now-authoritative dependency graph + approved weekly plan;
   only `Scheduled_Start/End`-populated, approved-week tasks are push-eligible (docs 18 §6).
3. Consider **R-02** (schema-version write guard) before M3, since calendar sync writes across sessions.
4. Keep pause/resume and dependency immutability invariants covered as calendar mutations are added.
