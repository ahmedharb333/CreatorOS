/**
 * RecoveryTests.gs — recovery (FR-012/013) + repurposing (FR-014) tests.
 * Mutating tests clean up rows they create (incl. RECOVERY_LOG / REPURPOSING). Requires init.
 */
function RecoveryTests_() {
  return [
    {
      name: 'REC-001 scan finds an overdue task',
      fn: function (t) {
        const ctx = makeContentTask_({ overdue: true });
        try {
          const cases = RecoveryService.scan();
          t.truthy(cases.some(function (c) { return c.taskId === ctx.taskId; }), 'overdue task not scanned');
        } finally { cleanup_(ctx); }
      },
    },
    {
      name: 'REC-002 MANUAL_RESCHEDULE updates due date, marks event Changed, logs',
      fn: function (t) {
        const ctx = makeContentTask_({ overdue: true, withEvent: true });
        try {
          const newDue = new Date(new Date().getTime() + 5 * 86400000);
          const res = RecoveryService.applyAction(ctx.taskId, RecoveryService.ACTIONS.MANUAL_RESCHEDULE, { newDue: newDue, reason: 'test' });
          t.truthy(res.success, 'apply failed: ' + res.message);
          t.truthy(res.data.syncRequired, 'should require sync (had event)');
          const task = new TaskRepository().getById(ctx.taskId);
          t.equal(task.Calendar_Sync_Status, 'Changed', 'event not marked Changed');
          t.truthy(new RecoveryLogRepository().getByTask(ctx.taskId).length >= 1, 'no recovery log entry');
        } finally { cleanup_(ctx); }
      },
    },
    {
      name: 'REC-003 DEFER_CONTENT shifts publish + open task due dates',
      fn: function (t) {
        const publish = new Date(2026, 8, 20);
        const ctx = makeContentTask_({ publish: publish, dueOffsetDays: -3 });
        try {
          const before = new TaskRepository().getById(ctx.taskId).Due_Date;
          const res = RecoveryService.applyAction(ctx.taskId, RecoveryService.ACTIONS.DEFER_CONTENT, { days: 7 });
          t.truthy(res.success, 'defer failed');
          const content = new ContentRepository().getById(ctx.cid);
          t.equal(daysBetween_(publish, content.Planned_Publish_Date), 7, 'publish not shifted +7');
          const after = new TaskRepository().getById(ctx.taskId).Due_Date;
          t.equal(daysBetween_(before, after), 7, 'task due not shifted +7');
        } finally { cleanup_(ctx); }
      },
    },
    {
      name: 'REC-004 SKIP_TASK skips; CANCEL_CONTENT cancels (no auto-cancel elsewhere)',
      fn: function (t) {
        const ctx = makeContentTask_({ overdue: true });
        try {
          RecoveryService.applyAction(ctx.taskId, RecoveryService.ACTIONS.SKIP_TASK, {});
          t.equal(new TaskRepository().getById(ctx.taskId).Status, 'Skipped', 'task not skipped');
          RecoveryService.applyAction(ctx.taskId, RecoveryService.ACTIONS.CANCEL_CONTENT, {});
          t.equal(new ContentRepository().getById(ctx.cid).Status, 'Cancelled', 'content not cancelled');
        } finally { cleanup_(ctx); }
      },
    },
  ];
}

function RepurposingTests_() {
  return [
    {
      name: 'RPS-001 suggestRuleBased writes mapped derivatives (idempotent)',
      fn: function (t) {
        const ctx = makeContentTask_({ format: 'YouTube Long-Form', noTask: true });
        try {
          const res = RepurposingService.suggestRuleBased(ctx.cid);
          t.truthy(res.success && res.data.suggestions.length === 4, 'expected 4 suggestions, got ' + res.data.suggestions.length);
          const again = RepurposingService.suggestRuleBased(ctx.cid);
          t.equal(again.data.suggestions.length, 0, 'should not duplicate');
        } finally { cleanupRepurposing_(ctx.cid); cleanup_(ctx); }
      },
    },
    {
      name: 'RPS-002 accept creates linked derivative content',
      fn: function (t) {
        const ctx = makeContentTask_({ format: 'YouTube Long-Form', noTask: true });
        let newCid = null;
        try {
          const sug = RepurposingService.suggestRuleBased(ctx.cid).data.suggestions[0];
          const res = RepurposingService.acceptSuggestion(sug.Repurpose_ID);
          t.truthy(res.success, 'accept failed: ' + res.message);
          newCid = res.data.content.Content_ID;
          t.equal(res.data.content.Source_Content_ID, ctx.cid, 'not linked to source');
          t.truthy(res.data.content.Repurpose_Group_ID, 'no repurpose group');
          const sugAfter = new RepurposingRepository().getById(sug.Repurpose_ID);
          t.equal(sugAfter.Status, 'Accepted', 'suggestion not accepted');
        } finally {
          if (newCid) new ContentRepository().deleteById(newCid);
          cleanupRepurposing_(ctx.cid); cleanup_(ctx);
        }
      },
    },
    {
      name: 'RPS-003 suggestWithAi is disabled until M5',
      fn: function (t) {
        const res = RepurposingService.suggestWithAi('CNT-000001');
        t.truthy(!res.success && res.code === ERR.AI_DISABLED, 'should be AI_DISABLED');
      },
    },
  ];
}

// ---- shared helpers ----
function makeContentTask_(opts) {
  opts = opts || {};
  const c = ContentService.createContent({
    Title: 'Rec Test', Content_Pillar: 'Education', Primary_Platform: 'YouTube',
    Format: opts.format || 'YouTube Long-Form', Objective: 'Reach', Priority: opts.priority || 'High', Status: 'Backlog',
  });
  const cid = c.data.content.Content_ID;
  if (opts.publish) new ContentRepository().updateById(cid, { Planned_Publish_Date: opts.publish });
  let taskId = null;
  if (!opts.noTask) {
    let due;
    if (opts.overdue) due = new Date(new Date().getTime() - 3 * 86400000);
    else if (opts.publish) { due = new Date(opts.publish.getTime()); due.setDate(due.getDate() + (opts.dueOffsetDays || 0)); }
    else due = new Date();
    const rec = {
      Content_ID: cid, Task_Name: 'Rec Task', Task_Type: 'Writing', Sequence: 1, Priority: opts.priority || 'High',
      Status: 'Not Started', Estimated_Minutes: 60, Due_Date: due, Calendar_Sync_Status: 'Not Synced', Recovery_Status: 'Not Required',
    };
    if (opts.withEvent) { rec.Calendar_Event_ID = 'evt-fake-1'; rec.Calendar_Sync_Status = 'Synced'; }
    taskId = new TaskRepository().create(rec).Task_ID;
  }
  return { cid: cid, taskId: taskId };
}
function cleanup_(ctx) {
  const tr = new TaskRepository();
  if (ctx.taskId) new RecoveryLogRepository().getByTask(ctx.taskId).forEach(function (r) { new RecoveryLogRepository().deleteById(r.Recovery_Log_ID); });
  tr.getByContent(ctx.cid).forEach(function (x) { tr.deleteById(x.Task_ID); });
  new ContentRepository().deleteById(ctx.cid);
}
function cleanupRepurposing_(cid) {
  const rr = new RepurposingRepository();
  rr.getBySource(cid).forEach(function (r) { rr.deleteById(r.Repurpose_ID); });
}
function daysBetween_(a, b) {
  const da = a instanceof Date ? a : new Date(a);
  const db = b instanceof Date ? b : new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}
