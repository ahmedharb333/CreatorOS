/**
 * AnalyticsTests.gs — performance (FR-015), analytics KPIs, and dashboard (FR-016).
 * Requires an initialized workbook. Mutating tests clean up.
 */
function PerformanceTests_() {
  return [
    {
      name: 'PERF-001 record for published content; reject negative metric',
      fn: function (t) {
        const cid = publishedContent_();
        try {
          const res = PerformanceService.recordPerformance(cid, { Views: 100, Likes: 10 });
          t.truthy(res.success, 'record failed: ' + res.message);
          t.truthy(PerformanceService.getLatest(cid), 'no latest measurement');
          const bad = PerformanceService.recordPerformance(cid, { Views: -5 });
          t.truthy(!bad.success, 'negative views should be rejected');
        } finally { cleanupContent_(cid); }
      },
    },
    {
      name: 'PERF-002 non-published content is rejected without force',
      fn: function (t) {
        const c = ContentService.createContent(baseContent_('Backlog'));
        const cid = c.data.content.Content_ID;
        try {
          const res = PerformanceService.recordPerformance(cid, { Views: 10 });
          t.truthy(!res.success && res.code === ERR.RECORD_VALIDATION_FAILED, 'should reject non-published');
        } finally { cleanupContent_(cid); }
      },
    },
    {
      name: 'PERF-003 multiple measurements aggregate',
      fn: function (t) {
        const cid = publishedContent_();
        try {
          PerformanceService.recordPerformance(cid, { Views: 100 });
          PerformanceService.recordPerformance(cid, { Views: 50, Measurement_Date: new Date(new Date().getTime() + 86400000) });
          const agg = PerformanceService.aggregate(cid);
          t.equal(agg.Views, 150, 'aggregate views');
          t.equal(agg.measurements, 2, 'measurement count');
        } finally { cleanupContent_(cid); }
      },
    },
  ];
}

function AnalyticsTests_() {
  return [
    {
      name: 'AN-001 Execution Score = on-time ÷ planned due',
      fn: function (t) {
        const D = new Date(2026, 5, 10);
        const onTime = { Status: 'Completed', Due_Date: D, Completed_At: new Date(2026, 5, 9) };
        const late = { Status: 'Completed', Due_Date: D, Completed_At: new Date(2026, 5, 12) };
        const openDue = { Status: 'Not Started', Due_Date: D };
        const skipped = { Status: 'Skipped', Due_Date: D };
        const es = AnalyticsService.executionScore([onTime, late, openDue, skipped]);
        t.equal(es.plannedDue, 3, 'planned due excludes skipped');
        t.equal(es.completedOnTime, 1, 'one on time');
        t.approx(es.score, 33.3, 0.2, 'score ≈ 33.3%');
      },
    },
    {
      name: 'AN-002 getKpis returns the full metric set',
      fn: function (t) {
        const k = AnalyticsService.getKpis();
        ['executionScore', 'taskCompletionRate', 'overdueCount', 'contentPlanned', 'contentPublished',
          'publishingCompletionRate', 'onTimePublishRate', 'repurposingRatio', 'avgViews', 'avgEngagementPercent',
          'contentByPlatform', 'contentByPillar'].forEach(function (key) {
          t.truthy(k[key] !== undefined, 'missing KPI: ' + key);
        });
      },
    },
  ];
}

function DashboardTests_() {
  return [
    {
      name: 'DASH-001 refresh renders DASHBOARD with an Execution Score row',
      fn: function (t) {
        const res = DashboardService.refresh();
        t.truthy(res.success, 'refresh failed: ' + res.message);
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.DASHBOARD);
        t.truthy(sheet.getLastRow() > 1, 'dashboard has no rows');
        const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, SCHEMA[SHEETS.DASHBOARD].headers.length).getValues();
        const hasExec = values.some(function (r) { return String(r[1]).indexOf('Execution Score') !== -1; });
        t.truthy(hasExec, 'no Execution Score row');
      },
    },
    {
      name: 'DASH-002 refresh is non-destructive to source and safe when empty-ish',
      fn: function (t) {
        const contentBefore = new ContentRepository().getAll().length;
        DashboardService.refresh();
        t.equal(new ContentRepository().getAll().length, contentBefore, 'refresh must not mutate source content');
      },
    },
  ];
}

// ---- helpers ----
function baseContent_(status) {
  return { Title: 'Perf Test', Content_Pillar: 'Education', Primary_Platform: 'YouTube', Format: 'YouTube Long-Form', Objective: 'Reach', Priority: 'High', Status: status || 'Backlog' };
}
function publishedContent_() {
  const c = ContentService.createContent(baseContent_('Backlog'));
  const cid = c.data.content.Content_ID;
  new ContentRepository().updateById(cid, { Status: 'Published', Planned_Publish_Date: new Date(), Actual_Publish_Date: new Date() });
  return cid;
}
function cleanupContent_(cid) {
  const pr = new PerformanceRepository();
  pr.getByContent(cid).forEach(function (p) { pr.deleteById(p.Performance_ID); });
  new ContentRepository().deleteById(cid);
}
