/**
 * CalendarService.gs — Google Calendar integration (FR-009, FR-010, FR-011).
 *
 * Projects approved, scheduled tasks onto Google Calendar work blocks and keeps them
 * consistent. Task is source of truth (ADR-018): only title/start/end/description are
 * managed, so attendees/conferencing/attachments are never touched. Idempotent via the
 * `Task ID` marker + stored `Calendar_Event_ID`; explicit user actions only; per-record
 * partial-failure reporting.
 *
 * @see docs/Calendar_Event_Contract.md
 * @see docs/18_Calendar_Synchronization.md
 * @see docs/17_Service_Contracts.md §10
 */
const CalendarService = (function () {

  const MODULE = 'CalendarService';
  const ELIGIBLE_STATUS = ['Not Started', 'Ready', 'In Progress', 'Blocked'];
  const WINDOW_MS = 24 * 60 * 60 * 1000; // ±1 day marker-search window (O-2)
  const MARKER = 'Task ID: ';

  // ---- calendar handles ----

  /** @private @returns {string} */
  function calendarId() {
    const id = ConfigService.getUserProp(USER_PROP.CALENDAR_ID);
    if (!id) throw appError(ERR.CALENDAR_NOT_CONFIGURED, { severity: SEVERITY.WARNING, userMessage: 'Connect a Google Calendar first (CreatorOS ▸ Connect Calendar).' });
    return id;
  }

  /** @private @param {string} [id] @returns {GoogleAppsScript.Calendar.Calendar} */
  function getCalendar(id) {
    const cid = id || calendarId();
    let cal;
    try { cal = CalendarApp.getCalendarById(cid); }
    catch (e) { throw appError(ERR.CALENDAR_PERMISSION_DENIED, { technicalMessage: String(e && e.message), userMessage: 'CreatorOS could not access your calendar. Check authorization.' }); }
    if (!cal) throw appError(ERR.CALENDAR_NOT_FOUND, { recordId: cid, userMessage: 'That calendar could not be found. Reselect a calendar.' });
    return cal;
  }

  // ---- event field builders (managed fields only, O-1) ----

  /** @private */
  function workbookUrl() { try { return SpreadsheetApp.getActiveSpreadsheet().getUrl(); } catch (e) { return ''; } }

  /** @private */
  function buildTitle(task) {
    const tick = task.Status === 'Completed' ? '✓ ' : '';
    return tick + '[CreatorOS] ' + task.Task_Name;
  }

  /** @private */
  function buildDescription(task, content) {
    return [
      'Content: ' + (content ? content.Title : ''),
      MARKER + task.Task_ID,
      'Content ID: ' + task.Content_ID,
      'Priority: ' + task.Priority,
      'Status: ' + task.Status,
      'Workbook: ' + workbookUrl(),
    ].join('\n');
  }

  /** @private start Date or null. */
  function startOf(task) { return task.Scheduled_Start instanceof Date ? task.Scheduled_Start : (task.Scheduled_Start ? new Date(task.Scheduled_Start) : null); }

  /** @private end Date, derived from Estimated_Minutes if needed; null if underivable. */
  function endOf(task, start) {
    if (task.Scheduled_End instanceof Date) return task.Scheduled_End;
    if (task.Scheduled_End) return new Date(task.Scheduled_End);
    const mins = Number(task.Estimated_Minutes);
    if (start && mins > 0) return new Date(start.getTime() + mins * 60000);
    return null;
  }

  // ---- eligibility (§3, O-2) ----

  /** @private @returns {{ok:boolean, code?:string, start?:Date, end?:Date}} */
  function eligibility(task) {
    if (ELIGIBLE_STATUS.indexOf(task.Status) === -1) return { ok: false, code: ERR.CALENDAR_INVALID_TIME, reason: 'status not eligible' };
    const start = startOf(task);
    if (!start) return { ok: false, code: ERR.CALENDAR_INVALID_TIME, reason: 'no Scheduled_Start' };
    const end = endOf(task, start);
    if (!end || end.getTime() <= start.getTime()) return { ok: false, code: ERR.CALENDAR_INVALID_TIME, reason: 'invalid time' };
    if (!isWeekApproved(start)) return { ok: false, code: ERR.PLAN_NOT_APPROVED, reason: 'week not approved' };
    return { ok: true, start: start, end: end };
  }

  /** @private */
  function isWeekApproved(scheduledStart) {
    const b = PlanningService.weekBounds(scheduledStart);
    const wk = new WeeklyPlanRepository().getByWeekStart(b.start);
    return !!(wk && wk.Status === 'Approved');
  }

  // ---- idempotent upsert (§5) ----

  /**
   * @private Find-or-create the event for a task, updating managed fields only.
   * @returns {{event:Object, action:'created'|'updated', duplicate:boolean}|{action:'missing'}}
   */
  function upsertEvent(calendar, task, content, start, end) {
    const title = buildTitle(task);
    const desc = buildDescription(task, content);

    if (task.Calendar_Event_ID) {
      const ev = safeGetEvent(calendar, task.Calendar_Event_ID);
      if (!ev) return { action: 'missing' };
      applyManaged(ev, title, start, end, desc);
      return { event: ev, action: 'updated', duplicate: false };
    }
    // No stored id — search by marker within ±1 day.
    const matches = findByMarker(calendar, task.Task_ID, start);
    if (matches.length) {
      applyManaged(matches[0], title, start, end, desc);
      return { event: matches[0], action: 'updated', duplicate: matches.length > 1 };
    }
    const created = calendar.createEvent(title, start, end, { description: desc });
    return { event: created, action: 'created', duplicate: false };
  }

  /** @private Apply only managed fields (never attendees/conferencing/attachments — O-1). */
  function applyManaged(ev, title, start, end, desc) {
    ev.setTitle(title);
    ev.setTime(start, end);
    ev.setDescription(desc);
  }

  /** @private */
  function safeGetEvent(calendar, eventId) {
    try { return calendar.getEventById(eventId); } catch (e) { return null; }
  }

  /** @private events in ±1 day window whose description carries this Task ID, earliest first. */
  function findByMarker(calendar, taskId, start) {
    const from = new Date(start.getTime() - WINDOW_MS);
    const to = new Date(start.getTime() + WINDOW_MS);
    const events = calendar.getEvents(from, to) || [];
    return events.filter(function (e) {
      const d = e.getDescription();
      return d && d.indexOf(MARKER + taskId) !== -1;
    }).sort(function (a, b) { return a.getStartTime().getTime() - b.getStartTime().getTime(); });
  }

  // ---- public API (§11) ----

  /**
   * Validate calendar access and (on success) store the id.
   * @param {string} [id] calendar id to test; defaults to the stored one.
   * @returns {Object} ServiceResult
   */
  function testConnection(id) {
    try {
      const cid = id || ConfigService.getUserProp(USER_PROP.CALENDAR_ID);
      if (!cid) throw appError(ERR.CALENDAR_NOT_CONFIGURED, { userMessage: 'Enter a calendar id to connect.' });
      const cal = getCalendar(cid);
      ConfigService.setUserProp(USER_PROP.CALENDAR_ID, cid);
      try { ConfigService.set('CALENDAR_ID', cid); } catch (e) { /* config mirror optional */ }
      LoggerService.info(MODULE, 'Calendar connected', { detail: { calendar: cal.getName() } });
      return ok('CALENDAR_CONNECTED', 'Connected to "' + cal.getName() + '".', { calendarId: cid, name: cal.getName() });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'testConnection' });
      return failFromError(err);
    }
  }

  /**
   * Push eligible tasks to the calendar (create/update). Idempotent, per-record results.
   * @param {string[]} taskIds
   * @returns {Object} ServiceResult
   */
  function pushTasks(taskIds) {
    return runBatch('push', taskIds, function (calendar, task, repo, result) {
      const elig = eligibility(task);
      if (!elig.ok) { fail1(result, task.Task_ID, elig.code); return; }
      const content = new ContentRepository().getById(task.Content_ID);
      const out = upsertEvent(calendar, task, content, elig.start, elig.end);
      if (out.action === 'missing') {
        repo.updateById(task.Task_ID, { Calendar_Sync_Status: 'Missing' });
        result.missing++; result.failures.push({ taskId: task.Task_ID, code: ERR.CALENDAR_EVENT_MISSING });
        return;
      }
      repo.updateById(task.Task_ID, { Calendar_Event_ID: out.event.getId(), Calendar_Sync_Status: 'Synced' });
      if (out.action === 'created') result.created++; else result.updated++;
      if (out.duplicate) result.warnings.push('Multiple events share Task ID ' + task.Task_ID + '; adopted the earliest (' + ERR.CALENDAR_EVENT_DUPLICATE + ').');
    });
  }

  /**
   * Reconcile linked tasks: re-assert managed fields, mark missing events, keep completed events (✓).
   * @param {string[]} taskIds
   * @returns {Object} ServiceResult
   */
  function syncTasks(taskIds) {
    return runBatch('sync', taskIds, function (calendar, task, repo, result) {
      // Completed tasks: keep the event, prefix ✓, stay Synced (non-destructive, §9).
      if (task.Status === 'Completed') {
        if (!task.Calendar_Event_ID) { result.skipped++; return; }
        const ev = safeGetEvent(calendar, task.Calendar_Event_ID);
        if (!ev) { repo.updateById(task.Task_ID, { Calendar_Sync_Status: 'Missing' }); result.missing++; result.failures.push({ taskId: task.Task_ID, code: ERR.CALENDAR_EVENT_MISSING }); return; }
        ev.setTitle(buildTitle(task));
        repo.updateById(task.Task_ID, { Calendar_Sync_Status: 'Synced' });
        result.updated++;
        return;
      }
      const elig = eligibility(task);
      if (!elig.ok) { fail1(result, task.Task_ID, elig.code); return; }
      const content = new ContentRepository().getById(task.Content_ID);
      const out = upsertEvent(calendar, task, content, elig.start, elig.end);
      if (out.action === 'missing') {
        repo.updateById(task.Task_ID, { Calendar_Sync_Status: 'Missing' });
        result.missing++; result.failures.push({ taskId: task.Task_ID, code: ERR.CALENDAR_EVENT_MISSING });
        return;
      }
      repo.updateById(task.Task_ID, { Calendar_Event_ID: out.event.getId(), Calendar_Sync_Status: 'Synced' });
      result.updated++;
    });
  }

  /**
   * Delete a task's linked event (caller must have confirmed). Clears the link.
   * @param {string} taskId
   * @returns {Object} ServiceResult
   */
  function deleteLinkedEvent(taskId) {
    try {
      const repo = new TaskRepository();
      const task = repo.getById(taskId);
      if (!task) throw appError(ERR.RECORD_NOT_FOUND, { recordId: taskId, userMessage: 'That task no longer exists.' });
      if (!task.Calendar_Event_ID) return ok('CALENDAR_NOT_LINKED', 'No calendar event is linked to this task.', { taskId: taskId });
      const calendar = getCalendar();
      const ev = safeGetEvent(calendar, task.Calendar_Event_ID);
      if (ev) ev.deleteEvent();
      repo.updateById(taskId, { Calendar_Event_ID: '', Calendar_Sync_Status: 'Not Synced' });
      LoggerService.info(MODULE, 'Linked event deleted', { recordId: taskId, userAction: 'deleteLinkedEvent' });
      return ok('CALENDAR_EVENT_DELETED', 'Calendar event removed.', { taskId: taskId });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'deleteLinkedEvent', recordId: taskId });
      return failFromError(err);
    }
  }

  /**
   * Recreate a missing event for a task (recovery).
   * @param {string} taskId
   * @returns {Object} ServiceResult
   */
  function recreateMissingEvent(taskId) {
    try {
      const repo = new TaskRepository();
      const task = repo.getById(taskId);
      if (!task) throw appError(ERR.RECORD_NOT_FOUND, { recordId: taskId, userMessage: 'That task no longer exists.' });
      const elig = eligibility(task);
      if (!elig.ok) throw appError(elig.code, { recordId: taskId, severity: SEVERITY.WARNING, userMessage: 'This task is not eligible for a calendar event (' + elig.reason + ').' });
      const calendar = getCalendar();
      const content = new ContentRepository().getById(task.Content_ID);
      const ev = calendar.createEvent(buildTitle(task), elig.start, elig.end, { description: buildDescription(task, content) });
      repo.updateById(taskId, { Calendar_Event_ID: ev.getId(), Calendar_Sync_Status: 'Synced' });
      LoggerService.info(MODULE, 'Missing event recreated', { recordId: taskId });
      return ok('CALENDAR_EVENT_RECREATED', 'Calendar event recreated.', { taskId: taskId, eventId: ev.getId() });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'recreateMissingEvent', recordId: taskId });
      return failFromError(err);
    }
  }

  // ---- batch harness (partial-failure reporting, §9) ----

  /** @private */
  function runBatch(kind, taskIds, perTask) {
    try {
      const ids = taskIds || [];
      const calendar = getCalendar(); // one connection for the batch
      const repo = new TaskRepository();
      const result = { requested: ids.length, created: 0, updated: 0, missing: 0, skipped: 0, failed: 0, failures: [], warnings: [] };
      ids.forEach(function (id) {
        try {
          const task = repo.getById(id);
          if (!task) { fail1(result, id, ERR.RECORD_NOT_FOUND); return; }
          perTask(calendar, task, repo, result);
        } catch (e) {
          const code = (e instanceof AppError) ? e.code : ERR.CALENDAR_QUOTA_EXCEEDED;
          fail1(result, id, code);
          try { repo.updateById(id, { Calendar_Sync_Status: 'Failed' }); } catch (e2) { /* ignore */ }
        }
      });
      const anyFail = result.failed > 0 || result.missing > 0;
      const msg = summarize(kind, result);
      LoggerService.info(MODULE, kind + ' batch complete', { detail: result });
      return anyFail
        ? { success: false, code: ERR.CALENDAR_PARTIAL_FAILURE, message: msg, data: result, warnings: result.warnings, errors: result.failures }
        : ok('CALENDAR_' + kind.toUpperCase() + 'ED', msg, result, result.warnings);
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: kind });
      return failFromError(err);
    }
  }

  /** @private */
  function fail1(result, taskId, code) { result.failed++; result.failures.push({ taskId: taskId, code: code }); }

  /** @private */
  function summarize(kind, r) {
    const parts = [];
    if (r.created) parts.push(r.created + ' created');
    if (r.updated) parts.push(r.updated + ' updated');
    if (r.missing) parts.push(r.missing + ' missing');
    if (r.skipped) parts.push(r.skipped + ' skipped');
    if (r.failed) parts.push(r.failed + ' failed');
    return (parts.join(', ') || 'no changes') + ' of ' + r.requested + ' task(s).';
  }

  return {
    testConnection: testConnection,
    pushTasks: pushTasks,
    syncTasks: syncTasks,
    deleteLinkedEvent: deleteLinkedEvent,
    recreateMissingEvent: recreateMissingEvent,
  };
})();
