# CreatorOS — Calendar Event Contract (Milestone 3 design)

**Status:** DRAFT for Product Architect / QA approval. **No CalendarService code ships until this is approved.**
Product 1.0.0 · Schema 1 · 2026-08-07

This contract defines how CreatorOS tasks become Google Calendar work blocks and how the two stay consistent.
It is derived from `18_Calendar_Synchronization.md`, `17_Service_Contracts.md §10`, `20_Error_Catalog.md §8`,
and `29_Permissions_Privacy_and_Security.md`, and it respects the Milestone 2 architecture (repository-only
cell access, typed results/errors, approved-plan gating, ADR-015 scheduling ownership).

---

## 1. Scope and principles

- Calendar events are created **only** from tasks that already have `Scheduled_Start`/`Scheduled_End`
  assigned by `PlanningService.autoAllocate` (ADR-015) and belong to an **approved** weekly plan.
- **The workbook is the system of record.** A calendar event is a projection of a task; on conflict for
  CreatorOS-managed fields, the task wins.
- **Every calendar mutation is explicit and user-initiated** (push / sync / delete), except an optional
  scheduled sync trigger the user turns on (Milestone 5 territory; not in M3 core).
- **Idempotent:** running push/sync repeatedly must never create duplicate events.
- **Non-destructive:** completing a task never deletes its event; deletion always requires confirmation.
- AI is not involved. Calendar works fully without AI.

## 2. Event schema (the projection)

One task ↔ at most one calendar event. The link is stored on the task.

| Task field | Role |
|---|---|
| `Calendar_Event_ID` | Google's native event id (authoritative link). Empty = not synced. |
| `Calendar_Sync_Status` | `Not Synced` · `Synced` · `Changed` · `Missing` · `Failed` |

Event content written by CreatorOS (docs 18 §4):

- **Title:** `[CreatorOS] {Task_Name}` (completion may prefix a `✓`).
- **Start / End:** `Scheduled_Start` / `Scheduled_End`. If end is absent, derive `end = start + Estimated_Minutes`.
  All-day events are **prohibited** for tasks; publishing milestones may be all-day only if explicitly configured.
- **Description** (the idempotency marker lives here):
  ```
  Content: {Content_Title}
  Task ID: {Task_ID}
  Content ID: {Content_ID}
  Priority: {Priority}
  Status: {Status}
  Workbook: {Workbook_URL}
  ```
- **Reminder:** the configured default reminder minutes (optional).
- **Calendar:** the single calendar id from User Properties `CALENDAR_ID` (mirrored, non-secret, into CONFIG).

CreatorOS writes only Title/Start/End/Description/Reminder. It does **not** manage other event fields
(attendees, colors set by the user, etc.).

## 3. Push eligibility

A task is eligible for push only when **all** hold (docs 18 §6):

1. `Status` ∈ { Not Started, Ready, In Progress, Blocked };
2. `Scheduled_Start` is set;
3. `Scheduled_End` or `Estimated_Minutes` is set;
4. the task's week has an **approved** `WEEKLY_PLAN` (`Status = Approved`);
5. `Calendar_Sync_Status` ≠ `Synced` **unless** a tracked change exists (`Changed`).

Ineligible tasks are skipped and reported, never silently mutated.

## 4. Synchronization lifecycle (state machine)

```
Not Synced ──push success──▶ Synced
Not Synced ──push failure──▶ Failed

Synced ──task scheduling field changed──▶ Changed
Synced ──event deleted externally (on next sync)──▶ Missing
Synced ──task completed──▶ Synced   (event kept; title may gain ✓)

Changed ──sync success──▶ Synced
Changed ──event missing──▶ Missing
Changed ──sync failure──▶ Failed

Missing ──recreate (user action) success──▶ Synced
Missing ──recreate failure──▶ Failed

Failed ──retry success──▶ Synced
```

**Change detection.** A `Synced` task becomes `Changed` when any of these edit (docs 18 §7):
`Task_Name`, `Scheduled_Start`, `Scheduled_End`, `Estimated_Minutes`, `Priority`, `Status`, `Notes`.
(Detection is evaluated at sync time by comparing the task's managed fields against what the event should be;
CreatorOS does not poll continuously.)

## 5. Idempotency

Before creating an event (docs 18 §5):

1. If `Calendar_Event_ID` is present → fetch that event. If it exists → **update** it (never create).
2. If the id is present but the event is gone → mark `Missing` (see §8), do not create.
3. If no id → **search** the target calendar within a **narrow time window** around `Scheduled_Start`
   (e.g. ±1 day) for an event whose description contains this `Task ID`. If found → adopt it (store its id,
   update it) instead of creating a duplicate.
4. Only when no valid match exists → **create**, then store the returned `Calendar_Event_ID`.

The `Task ID` marker in the description is the durable idempotency key; `Calendar_Event_ID` is the fast path.
Bulk push is idempotent: re-running yields updates, not duplicates (acceptance AT-005).

## 6. Update policy

- Updates use the stored `Calendar_Event_ID`.
- CreatorOS overwrites only its managed fields (title/time/description/reminder). User edits to unmanaged
  fields are preserved.
- If a task's scheduling fields change, the task goes `Synced → Changed`; the next `syncTasks` pushes the
  new values and returns to `Synced`.
- If the stored event id no longer resolves during update → `Missing` (do not recreate silently).

## 7. Deletion policy

- **Completion never deletes** an event (docs 18 §9). The event is kept; title may be prefixed with `✓`.
- Explicit deletion (`deleteLinkedEvent`) requires (docs 18 §10, docs 29 §9):
  1. user confirmation;
  2. successful deletion **or** confirmation the event is already gone;
  3. clearing `Calendar_Event_ID`;
  4. `Calendar_Sync_Status → Not Synced`;
  5. an audit `SYSTEM_LOG` entry.
- CreatorOS never bulk-deletes events implicitly (e.g. on content cancellation it flags, it does not purge).

## 8. Conflict handling

| Situation | Policy |
|---|---|
| Local task changed, remote unchanged | Task wins → update event (`Changed → Synced`). |
| Remote event deleted externally | Detected as `Missing` on next sync; **no silent recreate** — offer recovery; log `CALENDAR_EVENT_MISSING`. |
| Remote event edited by the user (managed fields) | v1 does **not** diff remote content; on sync, CreatorOS re-asserts managed fields (task is source of truth). Unmanaged fields untouched. Documented limitation (see §12 open question O-1). |
| Duplicate candidate found by marker search | Adopt the existing event; never create a second. If two events carry the same `Task ID`, report `CALENDAR_EVENT_DUPLICATE` and adopt the earliest, flag the rest for user cleanup. |
| Invalid time (end ≤ start, or missing both end and estimate) | Reject that task with `CALENDAR_INVALID_TIME`; other tasks in the batch proceed. |

## 9. Recovery behavior

- `Missing` → `recreateMissingEvent(taskId)` (user-initiated) creates a fresh event and relinks.
- `Failed` → retriable; `pushTasks`/`syncTasks` re-attempt. Transient failures (quota/network) are retried
  with backoff (max 2), permanent failures (permission/invalid) are not.
- **Partial failure is first-class.** Bulk operations return per-record results and never abort the whole
  batch for one bad record (docs 18 §11):
  ```json
  { "requested": 10, "created": 8, "updated": 1, "failed": 1,
    "failures": [ { "taskId": "TSK-000120", "code": "CALENDAR_INVALID_TIME" } ] }
  ```
  This maps to the standard `ServiceResult` (`success:false`, `code:"CALENDAR_PARTIAL_FAILURE"`, populated
  `data` + `errors[]`).

## 10. Permissions & privacy

- Calendar scope is requested **only when calendar is enabled** (staged authorization, docs 29 §3) — it is
  **not** in the Milestone-1/2 `appsscript.json`. Enabling calendar adds
  `https://www.googleapis.com/auth/calendar` (or the narrower events scope) at that point.
- CreatorOS reads/writes only its own events on the selected calendar and only within **narrow operational
  time windows** — it never scans unrelated calendar history (docs 29 §2).
- Disclosure shown before enabling: it will create/update/inspect CreatorOS task events on the chosen
  calendar; no social platforms; no centralized storage.
- No secrets are involved (calendar id is not a secret; still stored in User Properties + mirrored to CONFIG).

## 11. Service API (to be implemented after approval)

Per `17_Service_Contracts.md §10`, all returning the standard `ServiceResult`:

```javascript
CalendarService.testConnection(calendarId)      // validates access; brief cache
CalendarService.pushTasks(taskIds)              // eligible tasks → create/update; per-record results
CalendarService.syncTasks(taskIds)              // reconcile Changed/Missing; per-record results
CalendarService.deleteLinkedEvent(taskId)       // confirmed deletion; clears link
CalendarService.recreateMissingEvent(taskId)    // recovery for Missing
```

Quota strategy (docs 18 §13): batch in manageable groups, query narrow windows, cache the connection test
briefly, stop before the Apps Script execution timeout, and report continuation guidance for large batches.

## 12. Error scenarios (catalog, docs 20 §8)

| Code | Trigger | User-facing behavior |
|---|---|---|
| `CALENDAR_NOT_CONFIGURED` | no calendar id set | prompt to connect a calendar |
| `CALENDAR_PERMISSION_DENIED` | scope not granted / revoked | explain authorization, offer re-auth |
| `CALENDAR_NOT_FOUND` | calendar id invalid/inaccessible | ask to reselect calendar |
| `CALENDAR_EVENT_MISSING` | stored event id no longer resolves | mark Missing, offer recreate |
| `CALENDAR_EVENT_DUPLICATE` | 2+ events share a Task ID marker | adopt earliest, flag rest |
| `CALENDAR_INVALID_TIME` | end ≤ start / no end+estimate | skip that task, report |
| `CALENDAR_PARTIAL_FAILURE` | some records failed in a bulk op | per-record results; no data lost |
| `CALENDAR_QUOTA_EXCEEDED` | Apps Script/Calendar quota hit | stop, report progress + continuation |

Every user-facing error states what failed, the affected record, whether data changed, and the next action
(docs 20 §11); raw stack traces are logged, not shown.

## 13. Edition-awareness (commercial tiers)

Per the commercial roadmap (`COMMERCIAL_ROADMAP.md`), Calendar is designed so tiers gate **behavior via
configuration, not code rewrites**:

- **Free:** manual push/sync only; single calendar; no auto-sync trigger; no reminders.
- **Pro:** optional scheduled auto-sync trigger, email reminders (M5), and (future) multiple calendars.
- **Team:** (future) shared/team calendars — the calendar id abstraction already isolates "which calendar",
  so multi-calendar is an additive change, not a redesign.

Design implications honored now: CalendarService takes the calendar id as a parameter (not hard-coded);
auto-sync and reminders are separate opt-in features behind flags; nothing assumes exactly one global
calendar in a way that blocks Team. **No tier gating or billing is implemented in v1** (out of scope) — this
is a design constraint only.

## 14. Open questions for approval

- **O-1 — Remote-edit reconciliation:** v1 treats the task as source of truth and does not diff remote event
  content (only existence). Acceptable for v1, or should sync detect and warn on user-edited managed fields?
- **O-2 — Marker-search window:** ±1 day around `Scheduled_Start` for duplicate detection — wider/narrower?
- **O-3 — Publishing milestones:** create optional all-day "Publish {Content}" events from
  `Planned_Publish_Date`, or keep M3 to task work-blocks only?
- **O-4 — Auto-sync trigger:** include an opt-in time-based sync trigger in M3, or defer to M5 with notifications?

## 15. Acceptance criteria (from the PRD, must pass before M3 sign-off)

AT-004 (five approved tasks → five unique events with stored ids), AT-005 (re-push creates no duplicates),
AT-006 (rescheduled task updates its event), AT-010 (one failed calendar op doesn't corrupt others), plus the
calendar test cases in `21_Test_Specification.md §9`.
