# src/services — Domain & application services

The **domain / application layer** (layers 2–3 of the six-layer architecture, docs 15 §3). Services hold
CreatorOS's business logic and orchestrate use cases. They depend on the repositories for all data access
and **never read or write sheet cells directly** — that is the repository layer's job.

Each service returns a standard **ServiceResult** (`ok(...)` / `fail(...)` from `Common.js`) and raises typed
`AppError`s (from `Errors.js`) for failures; it validates inputs before mutating data and logs via
`LoggerService`.

## Intended responsibilities (delivered in later milestones)

| Service | Responsibility | Milestone | Contract |
|---|---|---|---|
| `SetupService` | Guided setup state, validation, save, complete, safe re-run (preserves records) | M2 | docs 17 §3 |
| `IdeaService` | Create/update/score ideas; convert Approved/Reviewed idea → content | M2 | docs 17 §4 |
| `ContentService` | Create content (manual or from idea); status transitions; mark published | M2 | docs 17 §5 |
| `WorkflowService` | Match workflow by platform+format; get steps; validate; clone | M2 | docs 17 §6 |
| `TaskService` | Generate tasks from a workflow (backward-scheduled); complete/block; detect overdue; generation modes | M2 | docs 17 §7 |
| `CapacityService` | Weekly capacity vs planned minutes; utilization + warning level | M2 | docs 17 §8 |
| `PlanningService` | Build/approve weekly plan; rebalance; today view (priority order) | M2 | docs 17 §9 |
| `CalendarService` | Test connection; push/sync tasks; duplicate prevention; recreate missing; delete | M3 | docs 17 §10, docs 18 |
| `RecoveryService` | Scan overdue; analyze; apply recovery action; log | M4 | docs 17 §11 |
| `RepurposingService` | Rule-based + AI derivative suggestions; accept/reject | M4 | docs 17 §12 |
| `DashboardService` | Refresh KPIs/charts from source data (read-only) | M4 | docs 17 §13 |
| `NotificationService` | Optional email reminders; enable/disable triggers | M5 | docs 17 §14 |
| `AiService` | Provider-agnostic AI requests; validate structured responses; rule-based fallback | M5 | docs 17 §15, docs 19 |

## Rules

- No direct cell access — go through `src/repositories/*`.
- No fixed column indexes — repositories map by header name.
- Return `ServiceResult`; throw `AppError` with catalog codes (docs 20).
- AI is optional: every AI-backed feature has a rule-based fallback (docs 19 §14).
- Nothing writes a final record without validation and (for AI) user approval.
