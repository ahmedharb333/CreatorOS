# 18 — Google Calendar Synchronization

## 1. Objective

Calendar integration converts approved CreatorOS tasks into work blocks while preventing duplication and preserving traceability.

## 2. Task sync states

- `Not Synced`
- `Synced`
- `Changed`
- `Missing`
- `Failed`

## 3. State transitions

```text
Not Synced
  └─ push success → Synced
  └─ push failure → Failed

Synced
  └─ task scheduling field changed → Changed
  └─ event deleted externally → Missing
  └─ task completed → Synced

Changed
  └─ sync success → Synced
  └─ event missing → Missing
  └─ sync failure → Failed

Missing
  └─ recreate success → Synced
  └─ recreate failure → Failed

Failed
  └─ retry success → Synced
```

## 4. Event contract

### Title

```text
[CreatorOS] {Task_Name}
```

### Description

```text
Content: {Content_Title}
Task ID: {Task_ID}
Content ID: {Content_ID}
Priority: {Priority}
Status: {Status}
Workbook: {Workbook_URL}
```

### Time

- start = Scheduled_Start;
- end = Scheduled_End;
- if end is absent, derive from Estimated_Minutes;
- all-day events are prohibited for tasks;
- publishing milestones may be all-day only if explicitly configured.

## 5. Duplicate prevention

Before event creation:

1. check `Calendar_Event_ID`;
2. if present, query event;
3. if event exists, update rather than create;
4. if absent, search by Task_ID marker within a narrow time window;
5. create only when no valid match exists.

## 6. Push eligibility

A task is eligible only when:

- status is Not Started, Ready, In Progress, or Blocked;
- Scheduled_Start exists;
- Estimated_Minutes or Scheduled_End exists;
- weekly plan is approved;
- Calendar_Sync_Status is not Synced unless change exists.

## 7. Update detection

Fields that mark a synced task as Changed:

- Task_Name
- Scheduled_Start
- Scheduled_End
- Estimated_Minutes
- Priority
- Status
- Notes

## 8. External event deletion

When stored Event_ID cannot be found:

- set state to Missing;
- do not silently recreate;
- show recovery option;
- log `CALENDAR_EVENT_MISSING`.

## 9. Completion behavior

Completing a task must:

- update task status;
- keep calendar event;
- optionally prefix event title with `✓`;
- never delete event automatically.

## 10. Deletion behavior

Event deletion requires:

- confirmation;
- successful deletion or missing-event confirmation;
- clearing Calendar_Event_ID;
- state set to Not Synced;
- audit log.

## 11. Partial failure

Bulk operations must return per-record results.

Example:

```javascript
{
  requested: 10,
  created: 8,
  updated: 1,
  failed: 1,
  failures: [
    {
      taskId: "TSK-000120",
      code: "CALENDAR_INVALID_TIME"
    }
  ]
}
```

## 12. Authorization

The product must clearly disclose:

- permission to view and edit calendar events;
- selected calendar;
- no access to social platforms;
- no centralized storage.

## 13. Quota strategy

- batch operations in manageable groups;
- avoid scanning entire calendars;
- query narrow time ranges;
- cache calendar connection test briefly;
- stop before Apps Script execution timeout;
- provide continuation guidance for large batches.
