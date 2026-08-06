/**
 * DashboardService.gs — dashboard presentation (FR-016).
 *
 * Presentation only: it consumes KPIs from AnalyticsService and renders them to the
 * creator-facing DASHBOARD sheet, organized to answer four decisions rather than dump
 * numbers (D4-4):
 *   1. Am I publishing consistently?   2. Am I keeping my commitments?
 *   3. What needs attention?           4. What should I work on next?
 * Execution Score is the flagship metric. Refresh never mutates source data.
 *
 * @see docs/17_Service_Contracts.md §13
 * @see docs/25_Detailed_UI_Specification.md §13
 */
const DashboardService = (function () {

  const MODULE = 'DashboardService';

  /**
   * @returns {Object} the KPI set (delegates to AnalyticsService).
   */
  function getKpis() { return AnalyticsService.getKpis(); }

  /**
   * Recompute KPIs and render the DASHBOARD sheet.
   * @returns {Object} ServiceResult
   */
  function refresh() {
    try {
      const k = AnalyticsService.getKpis();
      const rows = [];

      // 1. Am I publishing consistently?
      section(rows, 'Publishing consistency');
      row(rows, 'Publishing consistency', 'Publishing completion', k.publishingCompletionRate + '%', k.contentPublished + ' of ' + k.contentPlanned + ' planned published');
      row(rows, 'Publishing consistency', 'On-time publishing', k.onTimePublishRate + '%', 'Published on or before planned date');

      // 2. Am I keeping my commitments?  (flagship first)
      section(rows, 'Commitments');
      row(rows, 'Commitments', 'Execution Score ★', k.executionScore + '%', k.executionDetail.completedOnTime + ' on-time of ' + k.executionDetail.plannedDue + ' planned tasks due');
      row(rows, 'Commitments', 'Task completion', k.taskCompletionRate + '%', 'Completed of tasks due');

      // 3. What needs attention?
      section(rows, 'Needs attention');
      row(rows, 'Needs attention', 'Overdue tasks', k.overdueCount, k.overdueCount > 0 ? 'Run Recovery' : 'Nothing overdue');
      const atRisk = atRiskContent();
      row(rows, 'Needs attention', 'At-risk content', atRisk.length, atRisk.length ? 'Publishing within 3 days with open tasks' : 'No content at risk');

      // 4. What should I work on next?
      section(rows, 'Work next');
      nextTasks(3).forEach(function (t, i) {
        row(rows, 'Work next', (i + 1) + '. ' + t.Task_Name, t.Priority, dueLabel(t) + ' · ' + t.Content_ID);
      });
      if (!nextTasks(1).length) row(rows, 'Work next', 'Nothing scheduled', '—', 'Add ideas and build a weekly plan');

      // Supporting: reach & engagement / mix.
      section(rows, 'Reach & mix');
      row(rows, 'Reach & mix', 'Avg views', k.avgViews, 'Latest measurement per content');
      row(rows, 'Reach & mix', 'Avg engagement', k.avgEngagementPercent + '%', '(likes+comments+shares+saves)/reach');
      row(rows, 'Reach & mix', 'Repurposing ratio', k.repurposingRatio + '%', 'Derivatives per published item');
      row(rows, 'Reach & mix', 'By platform', topEntries(k.contentByPlatform), 'Content count by platform');
      row(rows, 'Reach & mix', 'By pillar', topEntries(k.contentByPillar), 'Content count by pillar');

      render(rows);
      LoggerService.info(MODULE, 'Dashboard refreshed', { detail: { executionScore: k.executionScore } });
      return ok('DASHBOARD_REFRESHED', 'Dashboard updated. Execution Score: ' + k.executionScore + '%.', { rows: rows.length, kpis: k });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'refresh' });
      return failFromError(err);
    }
  }

  /** @private */
  function section(rows, name) { /* section header is the Section column; no separate row needed */ }
  /** @private */
  function row(rows, sec, metric, value, detail) { rows.push([sec, metric, value == null ? '' : value, detail || '']); }

  /** @private content publishing within 3 days that still has open tasks. */
  function atRiskContent() {
    const ds = new Date(); const soon = new Date(ds.getTime() + 3 * 86400000);
    const openByContent = {};
    new TaskRepository().getAll().forEach(function (t) {
      if (['Not Started', 'Ready', 'In Progress', 'Blocked'].indexOf(t.Status) !== -1) openByContent[t.Content_ID] = true;
    });
    return new ContentRepository().getAll().filter(function (c) {
      const p = c.Planned_Publish_Date instanceof Date ? c.Planned_Publish_Date : (c.Planned_Publish_Date ? new Date(c.Planned_Publish_Date) : null);
      return p && ['Approved', 'In Production', 'Ready', 'Scheduled'].indexOf(c.Status) !== -1 &&
        p.getTime() >= ds.getTime() && p.getTime() <= soon.getTime() && openByContent[c.Content_ID];
    });
  }

  /** @private top open tasks by priority then due date. */
  function nextTasks(n) {
    const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return new TaskRepository().getAll()
      .filter(function (t) { return ['Not Started', 'Ready', 'In Progress'].indexOf(t.Status) !== -1; })
      .sort(function (a, b) {
        const pr = (rank[b.Priority] || 0) - (rank[a.Priority] || 0);
        if (pr) return pr;
        const da = a.Due_Date instanceof Date ? a.Due_Date.getTime() : Infinity;
        const db = b.Due_Date instanceof Date ? b.Due_Date.getTime() : Infinity;
        return da - db;
      }).slice(0, n);
  }

  /** @private */
  function dueLabel(t) {
    const d = t.Due_Date instanceof Date ? t.Due_Date : (t.Due_Date ? new Date(t.Due_Date) : null);
    if (!d) return 'no due date';
    return 'due ' + Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  /** @private compact "k:v, k:v" of a count map (top 4). */
  function topEntries(map) {
    return Object.keys(map).sort(function (a, b) { return map[b] - map[a]; }).slice(0, 4)
      .map(function (k) { return k + ': ' + map[k]; }).join(', ') || '(none)';
  }

  /** @private clear + write DASHBOARD data rows. */
  function render(rows) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.DASHBOARD);
    const last = sheet.getLastRow();
    for (let r = last; r >= 2; r--) sheet.deleteRow(r);
    if (rows.length) sheet.getRange(2, 1, rows.length, SCHEMA[SHEETS.DASHBOARD].headers.length).setValues(rows);
  }

  return { refresh: refresh, getKpis: getKpis };
})();
