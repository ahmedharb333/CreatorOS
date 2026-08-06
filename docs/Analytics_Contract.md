# CreatorOS — Analytics Contract

**Status:** Authoritative reference for CreatorOS metrics. Pre-Milestone-5 gate.
Product 1.0.0 · Schema 1 · 2026-08-07

`AnalyticsService` is the **single source of truth** for every KPI. `DashboardService` renders them and, from
Milestone 5, `AiService` consumes them — **both read only through `AnalyticsService.getKpis()` / `executionScore()`,
never the raw sheets.** This contract documents every KPI: its formula, source, refresh rule, and intended AI
consumer / selling moment.

```
Repositories ─▶ AnalyticsService ─▶ DashboardService (render)
                       │
                       └──────────▶ AiService (M5, read-only KPIs)
```

## Global rules

- **Source of truth:** `src/services/AnalyticsService.js`. No other module computes KPIs; duplication is a defect.
- **Read-only:** analytics never mutates data. `DashboardService.refresh()` only renders.
- **Refresh model:** KPIs are computed **live on demand** (`getKpis()` reads current repository state each call).
  There is no cached KPI store in v1 (full-table scans accepted for MVP; caching is R-04, future). The DASHBOARD
  sheet is refreshed explicitly (menu **Refresh Dashboard**) or whenever `refresh()` is called.
- **AI access:** `AiService` calls `AnalyticsService.getKpis()` (and `executionScore()`); it must not query
  `TaskRepository`/`ContentRepository`/`PerformanceRepository` for metrics directly.
- **Data minimization:** only KPI values (not raw private notes) are passed into AI context (docs 29 §6).

## Sources

| Source | Provides |
|---|---|
| `TaskRepository` | tasks: Status, Due_Date, Completed_At, Estimated_Minutes, Priority |
| `ContentRepository` | content: Status, Planned_/Actual_Publish_Date, Primary_Platform, Content_Pillar, Source_Content_ID |
| `PerformanceRepository` | performance: Views, Reach/Impressions, Likes/Comments/Shares/Saves (latest per content) |

## KPI catalog

### Flagship — Execution Score
- **Formula (v1):** `completed-on-time ÷ planned-tasks-due` × 100.
  - *planned-tasks-due* = tasks with a `Due_Date`, excluding `Cancelled`/`Skipped`.
  - *on-time* = `Status = Completed` and `Completed_At ≤ end-of-day(Due_Date)`.
- **Source:** `TaskRepository`. **Fn:** `AnalyticsService.executionScore(tasks)` → `{score, completedOnTime, plannedDue}`.
- **Refresh:** live. **AI consumer:** `analyzePerformance` → selling moment **"Your Execution Score dropped to
  68% this week — here's why."** Future: overdue penalties, streaks, weighted priorities (out of v1).

### Task completion rate
- **Formula:** `completed tasks ÷ tasks due (excl. Cancelled/Skipped)` × 100. **Source:** tasks. **AI:** performance narrative.

### Overdue task count
- **Formula:** count of open tasks with `Due_Date < now`. **Source:** tasks. **AI:** `explainRecovery` → selling
  moment **"You missed a task yesterday — here's how to recover without delaying Friday's video."**

### Content planned / published
- **contentPlanned:** content where `Status ≠ Cancelled`. **contentPublished:** `Status = Published`. **Source:** content.

### Publishing completion rate
- **Formula:** `published ÷ planned-with-date (not cancelled)` × 100. **Source:** content. **AI:** consistency narrative.

### On-time publish rate
- **Formula:** `published where Actual ≤ end-of-day(Planned) ÷ published` × 100. **Source:** content.
- **AI:** selling moment **"Are you keeping your commitments?"**

### Content by platform / by pillar
- **Formula:** count map of non-cancelled content grouped by `Primary_Platform` / `Content_Pillar`. **Source:** content.
- **AI:** mix/coverage suggestions in `generateWeeklyPlan` / `generateIdeas`.

### Repurposing ratio
- **Formula:** `derivative content (Source_Content_ID set) ÷ published` × 100. **Source:** content. **AI:** repurposing suggestions.

### Avg views / Avg engagement
- **avgViews:** mean of latest `Views` per content. **avgEngagement:** mean of
  `(Likes+Comments+Shares+Saves) ÷ (Reach|Impressions)` × 100 over latest per content. **Source:** performance.
- **AI:** performance analysis (observations only; AI must not invent metrics, docs 28 §5).

### Capacity utilization (derived, per week)
- Not in `getKpis()` (which is workbook-wide); computed per week by `CapacityService.calculateUtilization`
  (`planned-minutes ÷ available-minutes`, warning levels Normal/Watch/Overloaded/Critical). **Source:** tasks + Setup hours.
- **AI:** selling moment **"Based on your actual available hours, this publishing plan is realistic."**
  (`generateWeeklyPlan` uses `CapacityService` + these KPIs to label overloaded plans.)

## `getKpis()` return shape (stable contract)

```json
{
  "executionScore": 0, "executionDetail": { "score": 0, "completedOnTime": 0, "plannedDue": 0 },
  "taskCompletionRate": 0, "overdueCount": 0,
  "contentPlanned": 0, "contentPublished": 0,
  "publishingCompletionRate": 0, "onTimePublishRate": 0,
  "contentByPlatform": {}, "contentByPillar": {},
  "repurposingRatio": 0, "avgViews": 0, "avgEngagementPercent": 0
}
```
Percentages are numbers (e.g. `68` = 68%). Additions must be backward-compatible (append keys, never repurpose).

## Intended AI consumers (Milestone 5)

| AiService method | KPIs consumed | Selling moment |
|---|---|---|
| `analyzePerformance` | executionScore, taskCompletionRate, publishing/on-time rates, avg views/engagement | "Execution Score dropped to 68% — here's why." |
| `explainRecovery` | overdueCount + `RecoveryService.analyzeTask` (dependency/publish impact) | "Recover without delaying Friday's video." |
| `generateWeeklyPlan` | capacity utilization, overdue, by-platform/pillar | "This plan is realistic for your actual hours." |
| `generateIdeas` / `generateRepurposing` | by-pillar/platform, repurposing ratio | Coverage + repurposing prompts |

**Rule (M5):** AI produces narrative/suggestions from these KPIs; it never recomputes metrics, never invents
performance data, and never writes records without user approval (docs 19 §10, 28 §1). If AI is disabled or
fails, the same KPIs still power the rule-based dashboard and planners.
