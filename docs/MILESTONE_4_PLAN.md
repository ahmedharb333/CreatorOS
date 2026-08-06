# CreatorOS — Milestone 4 Implementation Plan (for approval)

**Milestone 4 — Recovery & Analytics** · Product 1.0.0 · Schema 1 · 2026-08-07
Status: **PLAN — awaiting Product Owner / Architect approval before any code** (per the milestone process).

Covers FR-012 (overdue detection), FR-013 (recovery workflow), FR-014 (repurposing), FR-015 (performance
entry), FR-016 (dashboard). Built to honor **ADR-019 (Hide the Complexity)** — every creator interaction is
menu/dialog/service-driven; no feature requires editing an internal sheet.

---

## 1. Scope

| Req | Deliverable | Owner service |
|---|---|---|
| FR-012 | Overdue detection (exists in `TaskService.detectOverdue`) surfaced for recovery | `RecoveryService` |
| FR-013 | Recovery workflow: scan → analyze → apply action; logs; updates linked calendar event | `RecoveryService` |
| FR-014 | Repurposing: **rule-based** derivative suggestions; accept/reject → new content | `RepurposingService` |
| FR-015 | Performance entry (published content, multiple measurements, validation) | `PerformanceService` |
| FR-016 | Dashboard KPIs + charts rendered to the creator-facing DASHBOARD sheet | `DashboardService` |

**Out of scope (later milestones):** AI repurposing/analysis (M5), notifications/auto-sync (M5), HTML
dialogs/wizard (services are UI-agnostic; menu-driven flows now). AI is not touched — all M4 logic is
rule-based (docs 19 §14 fallback posture).

## 2. Build sequence

1. **RecoveryService** (`services/RecoveryService.js`) — contract docs 17 §11.
   - `scan()` → overdue/at-risk `RecoveryCase[]` (uses `TaskService.detectOverdue` + dependency/publish impact).
   - `analyzeTask(taskId)` → impact (blocks which publish date; dependent tasks) + recommended action.
   - `applyAction(taskId, action, params)` → mutate + log; supported actions below.
2. **RepurposingService** (`services/RepurposingService.js`) — docs 17 §12 (rule-based half).
   - `suggestRuleBased(contentId)` → derivatives from the repurposing map (docs 27 §9), writes REPURPOSING rows.
   - `acceptSuggestion(repurposeId)` → creates a new CONTENT record (linked via `Source_Content_ID` /
     `Repurpose_Group_ID`), sets `New_Content_ID`. `rejectSuggestion(repurposeId)`.
   - `suggestWithAi` is a stub returning `AI_DISABLED` until M5.
3. **PerformanceService** (`services/PerformanceService.js`) — FR-015.
   - `recordPerformance(contentId, metrics)` → validates (published content default; non-negative; multiple
     measurement dates allowed) via `PerformanceRepository`.
   - `getLatest(contentId)` / `aggregate(contentId)` for the dashboard.
4. **DashboardService** (`services/DashboardService.js`) — docs 17 §13, FR-016.
   - `refresh()` computes KPIs + chart data from source repositories (read-only) and **renders** them to the
     DASHBOARD sheet (creator-facing). `getKpis(filters)` / `getCharts(filters)`.
5. **Menu + Main**: Run Recovery, Suggest Repurposing, Record Performance, Refresh Dashboard.
6. **Tests**: `RecoveryTests`, `RepurposingTests`, `PerformanceTests`, `DashboardTests` — executed via the
   Node mock; plus regression of existing 85.

## 3. Recovery actions (docs 17 §11) — proposed M4 depth

| Action | M4 behavior |
|---|---|
| `MANUAL_RESCHEDULE` | set new Due_Date (+ Scheduled_Start/End if provided); recompute `Recovery_Status` |
| `NEXT_AVAILABLE_SLOT` | move to the next work-day slot (reuses PlanningService allocation logic) |
| `DEFER_CONTENT` | push the content's Planned_Publish_Date by N days and shift its open task due dates |
| `SKIP_TASK` | status → Skipped (excluded from plans); logged |
| `CANCEL_CONTENT` | content → Cancelled (never automatic; explicit action only) |
| `MOVE_LOWER_PRIORITY` | reschedule a lower-priority task in the week to free capacity (basic version) |
| `REDUCE_SCOPE` | reduce a task's Estimated_Minutes (scope trim), logged |

**Calendar coupling (respecting O-4 explicit-only):** when recovery changes a task that has a linked event,
the task is marked `Calendar_Sync_Status = Changed` (not auto-pushed); the creator runs **Sync Calendar** to
apply it. No automatic calendar mutation.

## 4. Decisions needing your ruling

- **D4-1 — Repurposing scope:** M4 implements **rule-based only** (AI deferred to M5). Confirm.
- **D4-2 — Recovery ↔ Calendar:** recovery marks affected events **Changed** for an explicit sync (not
  auto-push). Confirm (recommended, honors O-4).
- **D4-3 — Performance entry UX:** menu-driven `Record Performance` (select published content + enter metrics
  via a prompt) backed by `PerformanceService`; the raw PERFORMANCE sheet stays **system-internal** (ADR-019),
  not a data-entry surface. Confirm. (Rich dialog deferred with the rest of the UI layer.)
- **D4-4 — Dashboard KPIs:** compute the full set (content planned/published, publishing + task completion
  rates, overdue count, capacity utilization, content by platform/pillar, repurposing ratio, avg views/
  engagement, consistency) per docs 04 §5.12 / doc 26, rendered to DASHBOARD. Confirm scope.
- **D4-5 — Hide-Complexity enabler (ADR-019):** add an inert `visibility: 'creator' | 'system'` tag to each
  sheet in `Constants.SCHEMA` now (no behavior change) so a future Creator Mode/Advanced Workspace toggle can
  hide system sheets by config with zero refactor. Approve including this small step in M4?

## 5. Test plan (mock-executed, mirrors prior milestones)

| Suite | Cases (representative) |
|---|---|
| Recovery | scan finds overdue; analyze reports publish-date impact; MANUAL_RESCHEDULE updates due date + logs; DEFER_CONTENT shifts publish + task dates; SKIP_TASK/CANCEL_CONTENT status; recovery marks linked event `Changed`; no auto-cancel |
| Repurposing | suggestRuleBased writes mapped derivatives; accept creates linked content + sets New_Content_ID; reject; idempotent (no duplicate suggestions) |
| Performance | record for published content; reject negative metrics; multiple measurements; getLatest/aggregate |
| Dashboard | KPIs correct on a seeded dataset; empty-state shows zero/"No data" (no formula errors); render to DASHBOARD; refresh doesn't mutate source |

Target: all new suites green via the Node mock + full regression of the existing 85. `node --check` on all
pushed files. (No new external API in M4 → no bound-project gate like Calendar; existing on-Google
confirmation recommendation stands.)

## 6. Schema touch (additive, order-safe)

No new columns expected beyond what exists (REPURPOSING/PERFORMANCE/DASHBOARD already defined). If D4-5 is
approved, the only change is the inert `visibility` tag in `Constants.SCHEMA` (code metadata, not a sheet
column) — schema stays version 1.

## 7. Deliverables at the M4 gate

Implemented services + tests (all green), updated registers (REQUIREMENT_COVERAGE FR-012…016, TEST_RESULTS,
CHANGELOG, ADRs, KNOWN_ISSUES), Milestone 4 report, and a **Milestone 4 Release Package** zip — then stop for
QA. No Milestone 5 until approval.

---

**Requested:** approve this plan (with your rulings on D4-1…D4-5), or adjust. On approval I implement M4,
execute all tests, package it, and stop for QA.
