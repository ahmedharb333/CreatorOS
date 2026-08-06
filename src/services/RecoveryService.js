/**
 * RecoveryService.gs — overdue detection surfacing + recovery workflow (FR-012, FR-013).
 *
 * Recovery NEVER pushes to the calendar automatically (permanent principle, D4-2):
 * when a recovery action changes a scheduled task that has a linked event, the task is
 * marked `Calendar_Sync_Status = Changed` and the result flags `syncRequired` — the
 * creator then runs Sync Calendar. Every action writes a RECOVERY_LOG entry (system
 * sheet, not creator-facing) for future analytics/AI. Content is never auto-cancelled.
 *
 * @see docs/17_Service_Contracts.md §11
 * @see docs/04_Master_PRD.md FR-013
 */
const RecoveryService = (function () {

  const MODULE = 'RecoveryService';
  const ACTIONS = {
    NEXT_AVAILABLE_SLOT: 'NEXT_AVAILABLE_SLOT', MOVE_LOWER_PRIORITY: 'MOVE_LOWER_PRIORITY',
    REDUCE_SCOPE: 'REDUCE_SCOPE', DEFER_CONTENT: 'DEFER_CONTENT', SKIP_TASK: 'SKIP_TASK',
    CANCEL_CONTENT: 'CANCEL_CONTENT', MANUAL_RESCHEDULE: 'MANUAL_RESCHEDULE',
  };
  const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const OPEN = ['Not Started', 'Ready', 'In Progress', 'Blocked'];
  const RANK = { Critical: 4, High: 3, Medium: 2, Low: 1 };

  /** @private */
  function taskRepo() { return new TaskRepository(); }
  /** @private */
  function asDate(v) { return v instanceof Date ? v : (v ? new Date(v) : null); }

  /**
   * Scan for overdue tasks and describe each as a recovery case.
   * @returns {RecoveryCase[]}
   */
  function scan() {
    const overdue = TaskService.detectOverdue(now());
    const today = now().getTime();
    return overdue.map(function (t) {
      const due = asDate(t.Due_Date);
      return {
        taskId: t.Task_ID, taskName: t.Task_Name, contentId: t.Content_ID,
        dueDate: due, priority: t.Priority,
        daysOverdue: due ? Math.floor((today - due.getTime()) / 86400000) : 0,
        recommendedAction: recommend(t),
      };
    });
  }

  /**
   * Analyze one task's recovery impact.
   * @param {string} taskId
   * @returns {Object}
   */
  function analyzeTask(taskId) {
    const task = requireTask(taskId);
    const content = new ContentRepository().getById(task.Content_ID);
    const dependents = taskRepo().getByContent(task.Content_ID).filter(function (o) {
      return TaskService.getDependencies(o).indexOf(taskId) !== -1;
    });
    return {
      task: task,
      content: content,
      blocksPublishDate: content ? content.Planned_Publish_Date : null,
      dependents: dependents.map(function (d) { return d.Task_ID; }),
      recommendedAction: recommend(task),
    };
  }

  /** @private recommend an action from simple heuristics. */
  function recommend(task) {
    if (task.Priority === 'Low') return ACTIONS.SKIP_TASK;
    if (task.Priority === 'Critical' || task.Priority === 'High') return ACTIONS.NEXT_AVAILABLE_SLOT;
    return ACTIONS.MANUAL_RESCHEDULE;
  }

  /**
   * Apply a recovery action. Always logged; never auto-pushes to calendar.
   * @param {string} taskId
   * @param {string} action one of ACTIONS
   * @param {Object} [params] {newDue, days, percent, reason}
   * @returns {Object} ServiceResult (data.task, data.syncRequired)
   */
  function applyAction(taskId, action, params) {
    params = params || {};
    try {
      const task = requireTask(taskId);
      const prevDue = asDate(task.Due_Date);
      const prevStart = asDate(task.Scheduled_Start);
      const reason = params.reason || ('Recovery: ' + action);
      let patch = {};
      let calImpact = 'None';
      let syncRequired = false;

      switch (action) {
        case ACTIONS.MANUAL_RESCHEDULE: {
          const newDue = asDate(params.newDue);
          if (!newDue) throw appError(ERR.TASK_DATE_INVALID, { recordId: taskId, severity: SEVERITY.WARNING, userMessage: 'Provide a new due date to reschedule.' });
          patch = { Due_Date: newDue, Recovery_Status: 'Recovered' };
          if (params.scheduledStart) patch.Scheduled_Start = asDate(params.scheduledStart);
          if (params.scheduledEnd) patch.Scheduled_End = asDate(params.scheduledEnd);
          break;
        }
        case ACTIONS.NEXT_AVAILABLE_SLOT: {
          const slot = nextSlot(task);
          patch = { Due_Date: slot.day, Scheduled_Start: slot.start, Scheduled_End: slot.end, Recovery_Status: 'Recovered' };
          break;
        }
        case ACTIONS.REDUCE_SCOPE: {
          const pctCut = Number(params.percent) || 25;
          const est = Number(task.Estimated_Minutes) || 30;
          const reduced = Math.max(5, Math.round(est * (1 - pctCut / 100)));
          patch = { Estimated_Minutes: reduced, Recovery_Status: 'Recovered' };
          break;
        }
        case ACTIONS.SKIP_TASK:
          patch = { Status: 'Skipped', Recovery_Status: 'Recovered' };
          calImpact = task.Calendar_Event_ID ? 'Event remains — delete manually if desired' : 'None';
          break;
        case ACTIONS.DEFER_CONTENT:
          return deferContent(task, Number(params.days) || 7, reason, prevDue, prevStart);
        case ACTIONS.CANCEL_CONTENT: {
          const res = ContentService.changeStatus(task.Content_ID, 'Cancelled');
          logRecovery(task, action, reason, prevDue, prevStart, prevDue, prevStart, 'None');
          if (!res.success) return res;
          return ok('CONTENT_CANCELLED', 'Content cancelled.', { task: task, syncRequired: false });
        }
        case ACTIONS.MOVE_LOWER_PRIORITY:
          return moveLowerPriority(task, reason);
        default:
          throw appError(ERR.RECORD_VALIDATION_FAILED, { recordId: taskId, userMessage: 'Unknown recovery action: ' + action });
      }

      // Calendar impact (D4-2): mark Changed, do not push.
      if (scheduleChanged(patch) && task.Calendar_Event_ID) { patch.Calendar_Sync_Status = 'Changed'; calImpact = 'Marked Changed — run Sync Calendar to apply'; syncRequired = true; }

      const updated = taskRepo().updateById(taskId, patch);
      logRecovery(task, action, reason, prevDue, prevStart, asDate(updated.Due_Date), asDate(updated.Scheduled_Start), calImpact);
      LoggerService.info(MODULE, 'Recovery action applied', { recordId: taskId, detail: { action: action, syncRequired: syncRequired } });
      const warnings = syncRequired ? ['Calendar out of date — run Sync Calendar to apply the new schedule.'] : [];
      return ok('RECOVERY_APPLIED', 'Recovery applied (' + action + ').' + (syncRequired ? ' Sync Calendar to update the event.' : ''), { task: updated, syncRequired: syncRequired }, warnings);
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'applyAction', recordId: taskId });
      return failFromError(err);
    }
  }

  /** @private defer content publish date + shift its open tasks. */
  function deferContent(triggerTask, days, reason, prevDue, prevStart) {
    const contentRepo = new ContentRepository();
    const content = contentRepo.getById(triggerTask.Content_ID);
    if (!content) throw appError(ERR.RECORD_NOT_FOUND, { recordId: triggerTask.Content_ID });
    if (content.Planned_Publish_Date) {
      contentRepo.updateById(content.Content_ID, { Planned_Publish_Date: shiftDate(content.Planned_Publish_Date, days) });
    }
    const repo = taskRepo();
    let anySync = false;
    repo.getByContent(content.Content_ID).forEach(function (t) {
      if (OPEN.indexOf(t.Status) === -1) return;
      const patch = { Due_Date: shiftDate(t.Due_Date, days), Recovery_Status: 'Deferred' };
      if (t.Calendar_Event_ID) { patch.Calendar_Sync_Status = 'Changed'; anySync = true; }
      if (t.Scheduled_Start) patch.Scheduled_Start = shiftDate(t.Scheduled_Start, days);
      if (t.Scheduled_End) patch.Scheduled_End = shiftDate(t.Scheduled_End, days);
      repo.updateById(t.Task_ID, patch);
    });
    logRecovery(triggerTask, ACTIONS.DEFER_CONTENT, reason, prevDue, prevStart, shiftDate(prevDue, days), shiftDate(prevStart, days), anySync ? 'Events marked Changed — run Sync Calendar' : 'None');
    LoggerService.info(MODULE, 'Content deferred', { recordId: content.Content_ID, detail: { days: days } });
    const warnings = anySync ? ['Calendar out of date — run Sync Calendar to apply.'] : [];
    return ok('CONTENT_DEFERRED', 'Content deferred by ' + days + ' day(s).', { contentId: content.Content_ID, syncRequired: anySync }, warnings);
  }

  /** @private push a lower-priority open task in the same content out by 1 day to free focus. */
  function moveLowerPriority(triggerTask, reason) {
    const repo = taskRepo();
    const candidates = repo.getByContent(triggerTask.Content_ID).filter(function (t) {
      return OPEN.indexOf(t.Status) !== -1 && t.Task_ID !== triggerTask.Task_ID && (RANK[t.Priority] || 0) < (RANK[triggerTask.Priority] || 0);
    }).sort(function (a, b) { return (RANK[a.Priority] || 0) - (RANK[b.Priority] || 0); });
    if (!candidates.length) return fail(ERR.NO_AVAILABLE_SLOT, 'No lower-priority task available to move.');
    const moved = candidates[0];
    const prevDue = asDate(moved.Due_Date), prevStart = asDate(moved.Scheduled_Start);
    const patch = { Due_Date: shiftDate(moved.Due_Date, 1) };
    let calImpact = 'None';
    if (moved.Calendar_Event_ID) { patch.Calendar_Sync_Status = 'Changed'; calImpact = 'Marked Changed — run Sync Calendar'; }
    if (moved.Scheduled_Start) patch.Scheduled_Start = shiftDate(moved.Scheduled_Start, 1);
    if (moved.Scheduled_End) patch.Scheduled_End = shiftDate(moved.Scheduled_End, 1);
    const updated = repo.updateById(moved.Task_ID, patch);
    logRecovery(moved, ACTIONS.MOVE_LOWER_PRIORITY, reason, prevDue, prevStart, asDate(updated.Due_Date), asDate(updated.Scheduled_Start), calImpact);
    return ok('LOWER_PRIORITY_MOVED', 'Moved "' + moved.Task_Name + '" to free capacity.', { task: updated, syncRequired: !!moved.Calendar_Event_ID });
  }

  /** @private next work-day slot from tomorrow. */
  function nextSlot(task) {
    const workDows = parseWorkDays();
    const startHour = Number(ConfigService.get('DAILY_START_HOUR', 9)) || 9;
    let d = new Date(now().getFullYear(), now().getMonth(), now().getDate() + 1);
    for (let i = 0; i < 14; i++) {
      if (workDows[d.getDay()]) break;
      d = new Date(d.getTime() + 86400000);
    }
    const start = new Date(d.getTime()); start.setHours(startHour, 0, 0, 0);
    const est = Number(task.Estimated_Minutes) || 30;
    return { day: d, start: start, end: new Date(start.getTime() + est * 60000) };
  }

  /** @private */
  function parseWorkDays() {
    const raw = String(ConfigService.get('WORK_DAYS', 'Mon, Tue, Wed, Thu, Fri'));
    const set = {};
    raw.split(',').forEach(function (name) { const n = DOW[name.trim().slice(0, 3)]; if (n != null) set[n] = true; });
    return set;
  }

  /** @private */
  function shiftDate(v, days) { const d = v instanceof Date ? new Date(v.getTime()) : (v ? new Date(v) : null); if (!d) return ''; d.setDate(d.getDate() + days); return d; }
  /** @private */
  function scheduleChanged(patch) { return patch.Due_Date != null || patch.Scheduled_Start != null || patch.Estimated_Minutes != null; }

  /** @private write a RECOVERY_LOG entry (system store, not creator-facing). */
  function logRecovery(task, action, reason, prevDue, prevStart, newDue, newStart, calImpact) {
    try {
      new RecoveryLogRepository().create({
        Timestamp: now(), Task_ID: task.Task_ID, Content_ID: task.Content_ID, Action: action, Reason: reason,
        Previous_Due_Date: prevDue || '', Previous_Scheduled_Start: prevStart || '',
        New_Due_Date: newDue || '', New_Scheduled_Start: newStart || '',
        User_Initiated: true, Calendar_Impact: calImpact, Notes: '',
      });
    } catch (e) { LoggerService.warn(MODULE, 'Recovery log write failed', { detail: String(e && e.message) }); }
  }

  /** @private */
  function requireTask(taskId) {
    const t = taskRepo().getById(taskId);
    if (!t) throw appError(ERR.RECORD_NOT_FOUND, { recordId: taskId, userMessage: 'That task no longer exists.' });
    return t;
  }

  return { ACTIONS: ACTIONS, scan: scan, analyzeTask: analyzeTask, applyAction: applyAction };
})();
