/**
 * PlanningTests.gs — capacity + weekly planning + Today tests (FR-006, FR-007, FR-008).
 * Mutating tests clean up created rows and restore CONFIG. Requires an initialized workbook.
 * @returns {Array<{name:string, fn:Function}>}
 */
function PlanningTests_() {
  return [
    {
      name: 'CAP-001 utilization sums estimates vs capacity',
      fn: function (t) {
        const u = CapacityService.calculateUtilization(
          [{ Estimated_Minutes: 200 }, { Estimated_Minutes: 250 }],
          { availableMinutes: 600 });
        t.equal(u.plannedMinutes, 450, 'planned');
        t.equal(u.availableMinutes, 600, 'available');
        t.equal(u.utilizationPercent, 75, 'utilization %');
        t.equal(u.warningLevel, 'Normal', 'warning level');
      },
    },
    {
      name: 'CAP-002 warning-level boundaries',
      fn: function (t) {
        t.equal(CapacityService.warningLevel(0.50), 'Normal', '50%');
        t.equal(CapacityService.warningLevel(0.95), 'Watch', '95%');
        t.equal(CapacityService.warningLevel(1.10), 'Overloaded', '110%');
        t.equal(CapacityService.warningLevel(1.50), 'Critical', '150%');
      },
    },
    {
      name: 'PLN-BUILD builds week record + approval is one-shot',
      fn: function (t) {
        const cfg = snapshotCfg_(['WEEKLY_HOURS']);
        ConfigService.set('WEEKLY_HOURS', 10); // 600 min
        const anchor = new Date(2026, 8, 23);
        const b = PlanningService.weekBounds(anchor);
        const cid = makeContent_();
        const due = new Date(b.start.getTime()); due.setDate(b.start.getDate() + 1);
        const taskRepo = new TaskRepository();
        taskRepo.createMany([planTask_(cid, 1, 200, due), planTask_(cid, 2, 250, due)]);
        let wid = null;
        try {
          const res = PlanningService.buildWeeklyPlan(anchor);
          t.truthy(res.success, 'build failed: ' + res.message);
          t.equal(res.data.utilization.plannedMinutes, 450, 'planned minutes');
          t.equal(res.data.utilization.availableMinutes, 600, 'available minutes');
          t.equal(res.data.week.Status, 'Draft', 'new week should be Draft');
          wid = res.data.week.Week_ID;

          const appr = PlanningService.approveWeeklyPlan(wid);
          t.truthy(appr.success && appr.data.week.Status === 'Approved', 'approve failed');
          const again = PlanningService.approveWeeklyPlan(wid);
          t.truthy(!again.success && again.code === ERR.WEEK_ALREADY_APPROVED, 'double approve should fail');
        } finally {
          if (wid) new WeeklyPlanRepository().deleteById(wid);
          taskRepo.getByContent(cid).forEach(function (x) { taskRepo.deleteById(x.Task_ID); });
          new ContentRepository().deleteById(cid);
          restoreCfg_(cfg);
        }
      },
    },
    {
      name: 'PLN-ALLOCATE assigns Scheduled_Start/End on work days',
      fn: function (t) {
        const cfg = snapshotCfg_(['WORK_DAYS', 'DAILY_START_HOUR']);
        ConfigService.set('WORK_DAYS', 'Mon, Tue, Wed, Thu, Fri');
        ConfigService.set('DAILY_START_HOUR', 9);
        const anchor = new Date(2026, 8, 23);
        const b = PlanningService.weekBounds(anchor);
        const cid = makeContent_();
        const due = new Date(b.start.getTime()); due.setDate(b.start.getDate() + 2); // Wednesday
        const taskRepo = new TaskRepository();
        taskRepo.createMany([planTask_(cid, 1, 120, due)]);
        try {
          const res = PlanningService.autoAllocate(anchor);
          t.truthy(res.success, 'allocate failed');
          t.equal(res.data.allocated, 1, 'one allocated');
          const task = taskRepo.getByContent(cid)[0];
          t.truthy(task.Scheduled_Start instanceof Date, 'start not set');
          t.truthy(task.Scheduled_End instanceof Date, 'end not set');
          const dow = task.Scheduled_Start.getDay();
          t.truthy(dow >= 1 && dow <= 5, 'scheduled on a work day');
          t.equal((task.Scheduled_End - task.Scheduled_Start) / 60000, 120, 'duration matches estimate');
        } finally {
          taskRepo.getByContent(cid).forEach(function (x) { taskRepo.deleteById(x.Task_ID); });
          new ContentRepository().deleteById(cid);
          restoreCfg_(cfg);
        }
      },
    },
    {
      name: 'PLN-TODAY sorts tasks into overdue / due-today / blocked',
      fn: function (t) {
        const cid = makeContent_();
        const taskRepo = new TaskRepository();
        const today = new Date();
        const yesterday = new Date(today.getTime() - 2 * 86400000);
        taskRepo.createMany([
          planTask_(cid, 1, 60, yesterday),                       // overdue
          planTask_(cid, 2, 60, today),                            // due today
          Object.assign(planTask_(cid, 3, 60, today), { Status: 'Blocked', Blocked_Reason: 'waiting' }),
        ]);
        try {
          const plan = PlanningService.getTodayPlan(today);
          t.truthy(plan.overdue.some(function (x) { return x.Content_ID === cid; }), 'overdue not found');
          t.truthy(plan.mustDo.some(function (x) { return x.Content_ID === cid; }), 'due-today not found');
          t.truthy(plan.blocked.some(function (x) { return x.Content_ID === cid; }), 'blocked not found');
        } finally {
          taskRepo.getByContent(cid).forEach(function (x) { taskRepo.deleteById(x.Task_ID); });
          new ContentRepository().deleteById(cid);
        }
      },
    },
  ];
}

/** @private */
function makeContent_() {
  const c = ContentService.createContent({
    Title: 'Plan Test', Content_Pillar: 'Education', Primary_Platform: 'YouTube',
    Format: 'YouTube Long-Form', Objective: 'Reach', Priority: 'High', Status: 'Backlog',
  });
  return c.data.content.Content_ID;
}
/** @private */
function planTask_(contentId, seq, minutes, due) {
  return {
    Content_ID: contentId, Task_Name: 'T' + seq, Task_Type: 'Writing', Sequence: seq,
    Priority: 'High', Status: 'Not Started', Estimated_Minutes: minutes, Due_Date: due,
    Calendar_Sync_Status: 'Not Synced', Recovery_Status: 'Not Required',
  };
}
/** @private */
function snapshotCfg_(keys) { const s = {}; keys.forEach(function (k) { s[k] = ConfigService.get(k); }); return s; }
/** @private */
function restoreCfg_(snap) { Object.keys(snap).forEach(function (k) { ConfigService.set(k, snap[k]); }); }
