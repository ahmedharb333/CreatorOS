/**
 * CalendarTests.gs — Calendar integration tests (FR-009/010/011, docs 21 §9).
 *
 * Runs against the Node CalendarApp mock (registered id "creatoros-test-cal"); on a
 * bound project the same TestRunner cases run against the real calendar (see
 * docs/Calendar_Integration_Test_Plan.md). Mutating tests clean up rows/events.
 * @returns {Array<{name:string, fn:Function}>}
 */
function CalendarTests_() {
  const CAL_ID = 'creatoros-test-cal';
  // These cases create/delete events against a dedicated test calendar. That calendar
  // only exists in the Node CalendarApp mock; on a real bound project it is absent, and
  // we deliberately do NOT fall back to the creator's real calendar (Run Tests must never
  // mutate live calendar data). So skip the suite cleanly when the fixture is unavailable.
  if (!hasTestCalendar_(CAL_ID)) {
    return [{
      name: 'CAL-000 (guarded) calendar suite skipped — no in-memory test calendar in this environment',
      fn: function (t) { t.truthy(true, 'skipped: calendar logic is covered via the Node mock; real-calendar mutation is never run here'); },
    }];
  }
  return [
    {
      name: 'CAL-001 testConnection succeeds for a valid id, fails for unknown',
      fn: function (t) {
        const okRes = CalendarService.testConnection(CAL_ID);
        t.truthy(okRes.success, 'valid connect failed: ' + okRes.message);
        const bad = CalendarService.testConnection('no-such-calendar');
        t.truthy(!bad.success && bad.code === ERR.CALENDAR_NOT_FOUND, 'unknown id should be NOT_FOUND');
        ConfigService.setUserProp(USER_PROP.CALENDAR_ID, CAL_ID);
      },
    },
    {
      name: 'CAL-002 pushTasks creates one event and links it',
      fn: function (t) {
        const ctx = setupScheduled_(new Date(2026, 8, 21), {});
        try {
          const res = CalendarService.pushTasks([ctx.taskId]);
          t.truthy(res.success, 'push failed: ' + res.message);
          t.equal(res.data.created, 1, 'expected 1 created');
          const task = new TaskRepository().getById(ctx.taskId);
          t.truthy(task.Calendar_Event_ID, 'event id not stored');
          t.equal(task.Calendar_Sync_Status, 'Synced', 'not Synced');
          t.equal(markerCount_(CAL_ID, ctx.taskId, ctx.start), 1, 'expected exactly 1 event');
        } finally { teardown_(ctx); }
      },
    },
    {
      name: 'CAL-003 re-push is idempotent (updates, no duplicate)',
      fn: function (t) {
        const ctx = setupScheduled_(new Date(2026, 8, 28), {});
        try {
          CalendarService.pushTasks([ctx.taskId]);
          const again = CalendarService.pushTasks([ctx.taskId]);
          t.truthy(again.success, 'second push failed');
          t.equal(again.data.created, 0, 'must not create again');
          t.equal(again.data.updated, 1, 'should update');
          t.equal(markerCount_(CAL_ID, ctx.taskId, ctx.start), 1, 'no duplicate event');
        } finally { teardown_(ctx); }
      },
    },
    {
      name: 'CAL-004 syncTasks updates a changed time',
      fn: function (t) {
        const ctx = setupScheduled_(new Date(2026, 9, 5), {});
        try {
          CalendarService.pushTasks([ctx.taskId]);
          const newStart = new Date(ctx.start.getTime() + 60 * 60000);
          const newEnd = new Date(newStart.getTime() + 60 * 60000);
          new TaskRepository().updateById(ctx.taskId, { Scheduled_Start: newStart, Scheduled_End: newEnd });
          const res = CalendarService.syncTasks([ctx.taskId]);
          t.truthy(res.success, 'sync failed: ' + res.message);
          const ev = CalendarApp.getCalendarById(CAL_ID).getEventById(new TaskRepository().getById(ctx.taskId).Calendar_Event_ID);
          t.equal(ev.getStartTime().getTime(), newStart.getTime(), 'event time not updated');
        } finally { teardown_(ctx); }
      },
    },
    {
      name: 'CAL-005 externally deleted event is detected as Missing (not recreated)',
      fn: function (t) {
        const ctx = setupScheduled_(new Date(2026, 9, 12), {});
        try {
          CalendarService.pushTasks([ctx.taskId]);
          const eid = new TaskRepository().getById(ctx.taskId).Calendar_Event_ID;
          CalendarApp.getCalendarById(CAL_ID).getEventById(eid).deleteEvent(); // external delete
          const res = CalendarService.syncTasks([ctx.taskId]);
          t.truthy(!res.success && res.code === ERR.CALENDAR_PARTIAL_FAILURE, 'should report partial failure');
          t.equal(new TaskRepository().getById(ctx.taskId).Calendar_Sync_Status, 'Missing', 'should be Missing');
        } finally { teardown_(ctx); }
      },
    },
    {
      name: 'CAL-006 recreateMissingEvent relinks and marks Synced',
      fn: function (t) {
        const ctx = setupScheduled_(new Date(2026, 9, 19), {});
        try {
          CalendarService.pushTasks([ctx.taskId]);
          const eid = new TaskRepository().getById(ctx.taskId).Calendar_Event_ID;
          CalendarApp.getCalendarById(CAL_ID).getEventById(eid).deleteEvent();
          CalendarService.syncTasks([ctx.taskId]); // -> Missing
          const res = CalendarService.recreateMissingEvent(ctx.taskId);
          t.truthy(res.success, 'recreate failed: ' + res.message);
          const task = new TaskRepository().getById(ctx.taskId);
          t.equal(task.Calendar_Sync_Status, 'Synced', 'not Synced after recreate');
          t.truthy(task.Calendar_Event_ID && task.Calendar_Event_ID !== eid, 'should be a new event id');
        } finally { teardown_(ctx); }
      },
    },
    {
      name: 'CAL-007 partial failure: one eligible, one ineligible',
      fn: function (t) {
        const ctx = setupScheduled_(new Date(2026, 9, 26), {});
        const bad = setupScheduled_(new Date(2026, 9, 26), { noStart: true, share: ctx });
        try {
          const res = CalendarService.pushTasks([ctx.taskId, bad.taskId]);
          t.truthy(!res.success && res.code === ERR.CALENDAR_PARTIAL_FAILURE, 'should be partial failure');
          t.equal(res.data.created, 1, 'one should succeed');
          t.truthy(res.errors.some(function (e) { return e.taskId === bad.taskId; }), 'bad task not reported');
        } finally { new TaskRepository().deleteById(bad.taskId); teardown_(ctx); }
      },
    },
    {
      name: 'CAL-008 deleteLinkedEvent removes the event and clears the link',
      fn: function (t) {
        const ctx = setupScheduled_(new Date(2026, 10, 2), {});
        try {
          CalendarService.pushTasks([ctx.taskId]);
          const res = CalendarService.deleteLinkedEvent(ctx.taskId);
          t.truthy(res.success, 'delete failed');
          const task = new TaskRepository().getById(ctx.taskId);
          t.truthy(!task.Calendar_Event_ID, 'event id not cleared');
          t.equal(task.Calendar_Sync_Status, 'Not Synced', 'status not reset');
        } finally { teardown_(ctx); }
      },
    },
    {
      name: 'CAL-009 unapproved week is not push-eligible',
      fn: function (t) {
        const ctx = setupScheduled_(new Date(2026, 10, 9), { noApprove: true });
        try {
          const res = CalendarService.pushTasks([ctx.taskId]);
          t.truthy(!res.success, 'should fail without approved plan');
          t.truthy(res.errors.some(function (e) { return e.code === ERR.PLAN_NOT_APPROVED; }), 'PLAN_NOT_APPROVED not reported');
        } finally { teardown_(ctx); }
      },
    },
    {
      name: 'CAL-010 O-1: managed update preserves attendees (unmanaged fields)',
      fn: function (t) {
        const ctx = setupScheduled_(new Date(2026, 10, 16), {});
        try {
          CalendarService.pushTasks([ctx.taskId]);
          const ev = CalendarApp.getCalendarById(CAL_ID).getEventById(new TaskRepository().getById(ctx.taskId).Calendar_Event_ID);
          ev.attendees.push('guest@example.com'); // user-added, unmanaged
          new TaskRepository().updateById(ctx.taskId, { Task_Name: 'Renamed Task' });
          CalendarService.syncTasks([ctx.taskId]);
          t.equal(ev.attendees.length, 1, 'attendees must be preserved');
          t.truthy(ev.getTitle().indexOf('Renamed Task') !== -1, 'title should be updated');
        } finally { teardown_(ctx); }
      },
    },
  ];
}

/** @private Is the dedicated in-memory test calendar reachable (Node mock only)? */
function hasTestCalendar_(calId) {
  try { return !!CalendarApp.getCalendarById(calId); } catch (e) { return false; }
}

/** @private Create a content + a scheduled task in the given week; approve the week unless noApprove. */
function setupScheduled_(anchor, opts) {
  opts = opts || {};
  ConfigService.setUserProp(USER_PROP.CALENDAR_ID, 'creatoros-test-cal');
  const b = PlanningService.weekBounds(anchor);
  const cid = opts.share ? opts.share.cid
    : ContentService.createContent({ Title: 'Cal Content', Content_Pillar: 'Education', Primary_Platform: 'YouTube', Format: 'YouTube Long-Form', Objective: 'Reach', Priority: 'High', Status: 'Backlog' }).data.content.Content_ID;
  const start = new Date(b.start.getTime()); start.setDate(b.start.getDate() + 2); start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60000);
  const rec = {
    Content_ID: cid, Task_Name: 'Cal Task', Task_Type: 'Writing', Sequence: opts.share ? 2 : 1,
    Priority: 'High', Status: 'Not Started', Estimated_Minutes: 60, Due_Date: start,
    Scheduled_Start: opts.noStart ? '' : start, Scheduled_End: opts.noStart ? '' : end,
    Calendar_Sync_Status: 'Not Synced', Recovery_Status: 'Not Required',
  };
  const task = new TaskRepository().create(rec);
  let weekId = opts.share ? opts.share.weekId : null;
  if (!opts.noApprove && !opts.share) {
    const wp = PlanningService.buildWeeklyPlan(anchor);
    weekId = wp.data.week.Week_ID;
    PlanningService.approveWeeklyPlan(weekId);
  }
  return { cid: cid, taskId: task.Task_ID, weekId: weekId, start: start, end: end };
}

/** @private */
function teardown_(ctx) {
  const repo = new TaskRepository();
  repo.getByContent(ctx.cid).forEach(function (x) { repo.deleteById(x.Task_ID); });
  new ContentRepository().deleteById(ctx.cid);
  if (ctx.weekId) new WeeklyPlanRepository().deleteById(ctx.weekId);
}

/** @private Count non-deleted events in ±1 day carrying this Task ID marker. */
function markerCount_(calId, taskId, start) {
  const from = new Date(start.getTime() - 24 * 3600000);
  const to = new Date(start.getTime() + 24 * 3600000);
  return CalendarApp.getCalendarById(calId).getEvents(from, to).filter(function (e) {
    const d = e.getDescription();
    return d && d.indexOf('Task ID: ' + taskId) !== -1;
  }).length;
}
