/**
 * PlanningService.gs — weekly planning + Today view (FR-007, FR-008).
 *
 * This is where task scheduling lives (ADR-015): `autoAllocate` assigns
 * Scheduled_Start/End into the creator's work days; task generation only set due
 * dates. Weekly plan reports capacity utilization and requires approval before any
 * calendar push (calendar push itself is Milestone 3 and not built yet).
 *
 * @see docs/17_Service_Contracts.md §9
 * @see docs/04_Master_PRD.md FR-007, FR-008
 */
const PlanningService = (function () {

  const MODULE = 'PlanningService';
  const OPEN = ['Not Started', 'Ready', 'In Progress', 'Blocked'];
  const CLOSED = ['Completed', 'Skipped', 'Cancelled'];
  const PRIORITY_RANK = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  /** @private Midnight of a date. */
  function dayStart(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }

  /**
   * Monday-based week bounds for a date.
   * @param {Date} date
   * @returns {{start: Date, end: Date}}
   */
  function weekBounds(date) {
    const d = dayStart(date);
    const dow = d.getDay();
    const toMonday = (dow === 0 ? -6 : 1 - dow);
    const start = new Date(d.getTime()); start.setDate(d.getDate() + toMonday);
    const end = new Date(start.getTime()); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
    return { start: start, end: end };
  }

  /** @private open tasks whose Due_Date falls within [start,end]. */
  function openTasksDueInRange(start, end) {
    return new TaskRepository().getAll().filter(function (t) {
      if (OPEN.indexOf(t.Status) === -1) return false;
      const due = asDate(t.Due_Date);
      return due && due.getTime() >= start.getTime() && due.getTime() <= end.getTime();
    });
  }

  /** @private */
  function asDate(v) { return v instanceof Date ? v : (v ? new Date(v) : null); }

  /**
   * Build (or refresh) the weekly plan record for the week containing weekStart.
   * @param {Date} weekStart
   * @returns {Object} ServiceResult (data.week, data.utilization, data.taskCount)
   */
  function buildWeeklyPlan(weekStart) {
    try {
      const b = weekBounds(weekStart);
      const tasks = openTasksDueInRange(b.start, b.end);
      const util = CapacityService.calculateUtilization(tasks, CapacityService.getWeeklyCapacity(b.start));
      const repo = new WeeklyPlanRepository();
      const existing = repo.getByWeekStart(b.start);
      const fields = {
        Week_Start: b.start, Week_End: b.end,
        Available_Minutes: util.availableMinutes, Planned_Minutes: util.plannedMinutes,
        Utilization_Percent: util.utilizationPercent, Warning_Level: util.warningLevel,
      };
      let week;
      if (existing) {
        week = repo.updateById(existing.Week_ID, Object.assign({}, fields, { Status: existing.Status || 'Draft' }));
      } else {
        week = repo.create(Object.assign({}, fields, { Status: 'Draft' }));
      }
      const warnings = util.warningLevel === 'Overloaded' || util.warningLevel === 'Critical'
        ? ['This week is at ' + util.utilizationPercent + '% of capacity (' + util.warningLevel + '). Approve only if realistic.'] : [];
      LoggerService.info(MODULE, 'Weekly plan built', { recordId: week.Week_ID, detail: { util: util } });
      return ok('WEEKLY_PLAN_BUILT', 'Weekly plan built: ' + util.utilizationPercent + '% capacity (' + util.warningLevel + ').',
        { week: week, utilization: util, taskCount: tasks.length }, warnings);
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'buildWeeklyPlan' });
      return failFromError(err);
    }
  }

  /**
   * Approve a weekly plan.
   * @param {string} weekId
   * @returns {Object} ServiceResult
   */
  function approveWeeklyPlan(weekId) {
    try {
      const repo = new WeeklyPlanRepository();
      const wk = repo.getById(weekId);
      if (!wk) throw appError(ERR.RECORD_NOT_FOUND, { recordId: weekId, userMessage: 'That week plan was not found.' });
      if (wk.Status === 'Approved') {
        throw appError(ERR.WEEK_ALREADY_APPROVED, { severity: SEVERITY.WARNING, recordId: weekId, userMessage: 'This week is already approved.' });
      }
      const updated = repo.updateById(weekId, { Status: 'Approved', Approved_At: now() });
      LoggerService.info(MODULE, 'Weekly plan approved', { recordId: weekId });
      return ok('WEEKLY_PLAN_APPROVED', 'Weekly plan approved.', { week: updated });
    } catch (err) { return failFromError(err); }
  }

  /**
   * Assign Scheduled_Start/End for open tasks due in the week, spread across the
   * creator's work days (ADR-015). Overloaded days stack past capacity (planner
   * warns, never drops). Does not create calendar events.
   * @param {Date} weekStart
   * @returns {Object} ServiceResult (data.allocated)
   */
  function autoAllocate(weekStart) {
    try {
      const b = weekBounds(weekStart);
      const tasks = openTasksDueInRange(b.start, b.end).sort(function (a, c) {
        const da = asDate(a.Due_Date).getTime(), dc = asDate(c.Due_Date).getTime();
        if (da !== dc) return da - dc;
        return (PRIORITY_RANK[c.Priority] || 0) - (PRIORITY_RANK[a.Priority] || 0);
      });
      const workDows = parseWorkDays();
      const startHour = Number(ConfigService.get('DAILY_START_HOUR', 9)) || 9;
      const repo = new TaskRepository();
      const usedByDay = {}; // dateKey -> minutes already scheduled
      let allocated = 0;

      tasks.forEach(function (t) {
        const est = Number(t.Estimated_Minutes) || 30;
        const target = targetWorkDay(asDate(t.Due_Date), b, workDows);
        const key = dateKey(target);
        const used = usedByDay[key] || 0;
        const start = new Date(target.getTime()); start.setHours(startHour, 0, 0, 0); start.setMinutes(start.getMinutes() + used);
        const end = new Date(start.getTime() + est * 60000);
        repo.updateById(t.Task_ID, { Scheduled_Start: start, Scheduled_End: end });
        usedByDay[key] = used + est;
        allocated++;
      });
      LoggerService.info(MODULE, 'Auto-allocation complete', { detail: { allocated: allocated } });
      return ok('TASKS_ALLOCATED', allocated + ' task(s) scheduled into work days.', { allocated: allocated });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'autoAllocate' });
      return failFromError(err);
    }
  }

  /** @private Parse WORK_DAYS config into a set of day-of-week numbers. */
  function parseWorkDays() {
    const raw = String(ConfigService.get('WORK_DAYS', 'Mon, Tue, Wed, Thu, Fri'));
    const set = {};
    raw.split(',').forEach(function (name) {
      const n = DOW[name.trim().slice(0, 3)];
      if (n != null) set[n] = true;
    });
    return set;
  }

  /** @private Choose the work day on/before the due date within the week (fallback: first work day, else week start). */
  function targetWorkDay(due, bounds, workDows) {
    let d = dayStart(due < bounds.start ? bounds.start : (due > bounds.end ? bounds.end : due));
    for (let i = 0; i < 7; i++) {
      if (workDows[d.getDay()] && d.getTime() >= bounds.start.getTime()) return d;
      const prev = new Date(d.getTime()); prev.setDate(d.getDate() - 1); d = prev;
    }
    // No work day on/before within week: first work day of the week, else week start.
    for (let j = 0; j < 7; j++) {
      const day = new Date(bounds.start.getTime()); day.setDate(bounds.start.getDate() + j);
      if (workDows[day.getDay()]) return day;
    }
    return bounds.start;
  }

  /** @private */
  function dateKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /**
   * Prioritized Today view (FR-008). Returns sections; does not mutate data.
   * Order of importance: overdue → due today → blocked → high-impact upcoming → publishing soon.
   * @param {Date} [date]
   * @returns {{overdue:Task[], mustDo:Task[], blocked:Task[], ifTime:Task[], publishingSoon:Object[]}}
   */
  function getTodayPlan(date) {
    const day = date || now();
    const ds = dayStart(day);
    const de = new Date(ds.getTime()); de.setHours(23, 59, 59, 999);
    const open = new TaskRepository().getAll().filter(function (t) { return OPEN.indexOf(t.Status) !== -1; });
    const sections = { overdue: [], mustDo: [], blocked: [], ifTime: [], publishingSoon: [] };

    open.forEach(function (t) {
      if (t.Status === 'Blocked') { sections.blocked.push(t); return; }
      const due = asDate(t.Due_Date);
      if (due && due.getTime() < ds.getTime()) { sections.overdue.push(t); return; }
      if (due && due.getTime() >= ds.getTime() && due.getTime() <= de.getTime()) { sections.mustDo.push(t); return; }
      if (t.Priority === 'High' || t.Priority === 'Critical') sections.ifTime.push(t);
    });
    byPriority(sections.overdue); byPriority(sections.mustDo); byPriority(sections.ifTime);

    // Publishing soon: content with a planned publish date within 3 days, not yet published.
    const soonEnd = new Date(ds.getTime()); soonEnd.setDate(ds.getDate() + 3);
    sections.publishingSoon = new ContentRepository().getAll().filter(function (c) {
      const p = asDate(c.Planned_Publish_Date);
      return p && ['Backlog', 'Approved', 'In Production', 'Ready', 'Scheduled'].indexOf(c.Status) !== -1 &&
        p.getTime() >= ds.getTime() && p.getTime() <= soonEnd.getTime();
    });
    return sections;
  }

  /** @private sort a task list by priority desc then due asc. */
  function byPriority(list) {
    list.sort(function (a, c) {
      const pr = (PRIORITY_RANK[c.Priority] || 0) - (PRIORITY_RANK[a.Priority] || 0);
      if (pr !== 0) return pr;
      const da = asDate(a.Due_Date), dc = asDate(c.Due_Date);
      return (da ? da.getTime() : 0) - (dc ? dc.getTime() : 0);
    });
  }

  /**
   * Render the Today view into the TODAY sheet.
   * @param {Date} [date]
   * @returns {Object} ServiceResult
   */
  function renderTodayView(date) {
    try {
      const s = getTodayPlan(date);
      const rows = [];
      pushRows(rows, 'Overdue', s.overdue, 'Past its due date');
      pushRows(rows, 'Must Do Today', s.mustDo, 'Due today');
      pushRows(rows, 'Blocked', s.blocked, function (t) { return t.Blocked_Reason || 'Blocked'; });
      pushRows(rows, 'If Time Allows', s.ifTime, 'High-impact upcoming');
      s.publishingSoon.forEach(function (c) {
        rows.push(['Publishing Soon', '', c.Title, c.Content_ID, c.Priority, c.Status, c.Planned_Publish_Date, '', 'Publishes soon']);
      });

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.TODAY);
      const last = sheet.getLastRow();
      for (let r = last; r >= 2; r--) sheet.deleteRow(r);
      if (rows.length) sheet.getRange(2, 1, rows.length, SCHEMA[SHEETS.TODAY].headers.length).setValues(rows);
      return ok('TODAY_RENDERED', rows.length + ' item(s) on Today.', { count: rows.length });
    } catch (err) { LoggerService.error(MODULE, err, { fn: 'renderTodayView' }); return failFromError(err); }
  }

  /** @private */
  function pushRows(rows, section, tasks, reason) {
    tasks.forEach(function (t) {
      const r = typeof reason === 'function' ? reason(t) : reason;
      rows.push([section, t.Task_ID, t.Task_Name, t.Content_ID, t.Priority, t.Status, t.Due_Date, t.Estimated_Minutes, r]);
    });
  }

  return {
    weekBounds: weekBounds,
    buildWeeklyPlan: buildWeeklyPlan,
    approveWeeklyPlan: approveWeeklyPlan,
    autoAllocate: autoAllocate,
    getTodayPlan: getTodayPlan,
    renderTodayView: renderTodayView,
  };
})();
