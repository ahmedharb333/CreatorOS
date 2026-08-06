/**
 * AnalyticsService.gs — KPI calculation layer (FR-016 metrics).
 *
 * The single source of truth for CreatorOS metrics. Reads from repositories and
 * computes KPIs; performs no presentation. DashboardService (and, later, AiService in
 * M5) both consume this layer so calculations are never duplicated.
 *
 *   PERFORMANCE ─▶ AnalyticsService ─▶ DashboardService
 *
 * Flagship metric: **Execution Score** = Completed-on-time ÷ Planned tasks due (%).
 *
 * @see docs/04_Master_PRD.md §5.12
 * @see docs/26_Formula_Validation_and_Formatting_Catalog.md
 */
const AnalyticsService = (function () {

  const CLOSED = ['Completed', 'Skipped', 'Cancelled'];

  /** @private */
  function asDate(v) { return v instanceof Date ? v : (v ? new Date(v) : null); }
  /** @private round to 1 decimal percent. */
  function pct(n, d) { return d > 0 ? Math.round((n / d) * 1000) / 10 : 0; }

  /**
   * Flagship Execution Score (v1): completed-on-time ÷ planned tasks due, as a percentage.
   * "Planned tasks due" = tasks with a due date, excluding Cancelled/Skipped.
   * "On time" = Completed with Completed_At on or before Due_Date.
   * (Future: overdue penalties, streaks, weighted priorities — intentionally simple for v1.)
   * @param {Task[]} tasks
   * @returns {{score:number, completedOnTime:number, plannedDue:number}}
   */
  function executionScore(tasks) {
    let plannedDue = 0, onTime = 0;
    tasks.forEach(function (t) {
      const due = asDate(t.Due_Date);
      if (!due) return;
      if (t.Status === 'Cancelled' || t.Status === 'Skipped') return;
      plannedDue++;
      if (t.Status === 'Completed') {
        const done = asDate(t.Completed_At);
        if (done && done.getTime() <= endOfDay(due)) onTime++;
      }
    });
    return { score: pct(onTime, plannedDue), completedOnTime: onTime, plannedDue: plannedDue };
  }

  /** @private end-of-day ms for lenient "on or before due date". */
  function endOfDay(d) { const e = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); return e.getTime(); }

  /**
   * Compute the full KPI set.
   * @returns {Object} KPIs
   */
  function getKpis() {
    const content = new ContentRepository().getAll();
    const tasks = new TaskRepository().getAll();
    const perfRepo = new PerformanceRepository();

    const notCancelled = content.filter(function (c) { return c.Status !== 'Cancelled'; });
    const published = content.filter(function (c) { return c.Status === 'Published'; });
    const plannedWithDate = notCancelled.filter(function (c) { return asDate(c.Planned_Publish_Date); });

    // Execution + task completion.
    const exec = executionScore(tasks);
    const dueTasks = tasks.filter(function (t) { return asDate(t.Due_Date) && CLOSED.indexOf(t.Status) === -1 || t.Status === 'Completed'; });
    const completedTasks = tasks.filter(function (t) { return t.Status === 'Completed'; }).length;
    const taskCompletionRate = pct(completedTasks, tasks.filter(function (t) { return ['Cancelled', 'Skipped'].indexOf(t.Status) === -1 && asDate(t.Due_Date); }).length);
    const overdueCount = tasks.filter(function (t) {
      const due = asDate(t.Due_Date);
      return due && CLOSED.indexOf(t.Status) === -1 && due.getTime() < now().getTime();
    }).length;

    // Publishing consistency / commitments.
    const publishingCompletionRate = pct(published.length, plannedWithDate.length);
    const onTimePublishes = published.filter(function (c) {
      const a = asDate(c.Actual_Publish_Date), p = asDate(c.Planned_Publish_Date);
      return a && p && a.getTime() <= endOfDay(p);
    }).length;
    const onTimePublishRate = pct(onTimePublishes, published.length);

    // Distributions.
    const byPlatform = countBy(notCancelled, 'Primary_Platform');
    const byPillar = countBy(notCancelled, 'Content_Pillar');

    // Repurposing ratio = derivative content ÷ published source content.
    const derivatives = content.filter(function (c) { return c.Source_Content_ID; }).length;
    const repurposingRatio = pct(derivatives, published.length);

    // Performance averages (latest measurement per content).
    const perf = latestPerContent(perfRepo);
    const avgViews = average(perf.map(function (p) { return Number(p.Views) || 0; }));
    const avgEngagement = average(perf.map(function (p) {
      const reach = Number(p.Reach) || Number(p.Impressions) || 0;
      const eng = (Number(p.Likes) || 0) + (Number(p.Comments) || 0) + (Number(p.Shares) || 0) + (Number(p.Saves) || 0);
      return reach > 0 ? (eng / reach) * 100 : 0;
    }));

    return {
      executionScore: exec.score,
      executionDetail: exec,
      taskCompletionRate: taskCompletionRate,
      overdueCount: overdueCount,
      contentPlanned: notCancelled.length,
      contentPublished: published.length,
      publishingCompletionRate: publishingCompletionRate,
      onTimePublishRate: onTimePublishRate,
      contentByPlatform: byPlatform,
      contentByPillar: byPillar,
      repurposingRatio: repurposingRatio,
      avgViews: Math.round(avgViews),
      avgEngagementPercent: Math.round(avgEngagement * 10) / 10,
    };
  }

  /** @private */
  function countBy(rows, field) {
    const m = {};
    rows.forEach(function (r) { const k = r[field] || '(none)'; m[k] = (m[k] || 0) + 1; });
    return m;
  }
  /** @private */
  function average(nums) { return nums.length ? nums.reduce(function (a, b) { return a + b; }, 0) / nums.length : 0; }
  /** @private latest performance record per content. */
  function latestPerContent(perfRepo) {
    const byContent = {};
    perfRepo.getAll().forEach(function (p) {
      const cur = byContent[p.Content_ID];
      const d = asDate(p.Measurement_Date);
      if (!cur || (d && (!asDate(cur.Measurement_Date) || d.getTime() > asDate(cur.Measurement_Date).getTime()))) byContent[p.Content_ID] = p;
    });
    return Object.keys(byContent).map(function (k) { return byContent[k]; });
  }

  return { getKpis: getKpis, executionScore: executionScore };
})();
