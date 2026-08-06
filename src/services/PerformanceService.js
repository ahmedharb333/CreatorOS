/**
 * PerformanceService.gs — manual performance entry (FR-015).
 *
 * Menu/dialog-driven only (ADR-019, D4-3): creators never edit the raw PERFORMANCE
 * sheet, which is a system data store. Published content is the default target;
 * multiple measurement dates per content are supported; metrics are validated
 * (non-negative) by the repository schema.
 *
 * @see docs/17_Service_Contracts.md
 */
const PerformanceService = (function () {

  const MODULE = 'PerformanceService';
  const METRIC_FIELDS = ['Views', 'Impressions', 'Reach', 'Likes', 'Comments', 'Shares', 'Saves', 'Watch_Time_Minutes', 'Clicks', 'Leads', 'Sales', 'Revenue'];

  /** @private */
  function repo() { return new PerformanceRepository(); }

  /**
   * Record a performance measurement for a content item.
   * @param {string} contentId
   * @param {Object} metrics {Platform, Measurement_Date, Views, ...} (+ optional {force:true} to allow non-published)
   * @returns {Object} ServiceResult (data.performance)
   */
  function recordPerformance(contentId, metrics) {
    try {
      const content = new ContentRepository().getById(contentId);
      if (!content) throw appError(ERR.RECORD_NOT_FOUND, { recordId: contentId, userMessage: 'That content no longer exists.' });
      const m = metrics || {};
      if (content.Status !== 'Published' && !m.force) {
        throw appError(ERR.RECORD_VALIDATION_FAILED, {
          severity: SEVERITY.WARNING, recordId: contentId,
          userMessage: 'Performance can only be recorded for published content.',
          suggestedAction: 'Mark the content Published first.',
        });
      }
      const rec = {
        Content_ID: contentId,
        Platform: m.Platform || content.Primary_Platform,
        Measurement_Date: m.Measurement_Date || now(),
      };
      METRIC_FIELDS.forEach(function (f) { if (m[f] != null && m[f] !== '') rec[f] = m[f]; });
      if (m.Notes) rec.Notes = m.Notes;

      const stored = repo().create(rec);
      LoggerService.info(MODULE, 'Performance recorded', { recordId: contentId, detail: { platform: rec.Platform } });
      return ok('PERFORMANCE_RECORDED', 'Performance recorded.', { performance: stored });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'recordPerformance', recordId: contentId });
      return failFromError(err);
    }
  }

  /**
   * Latest measurement for a content item.
   * @param {string} contentId
   * @returns {Object|null}
   */
  function getLatest(contentId) {
    return repo().getByContent(contentId)[0] || null; // repo sorts newest first
  }

  /**
   * Aggregate metrics across all measurements for a content item (sums).
   * @param {string} contentId
   * @returns {Object}
   */
  function aggregate(contentId) {
    const rows = repo().getByContent(contentId);
    const agg = {};
    METRIC_FIELDS.forEach(function (f) { agg[f] = 0; });
    rows.forEach(function (r) { METRIC_FIELDS.forEach(function (f) { agg[f] += Number(r[f]) || 0; }); });
    agg.measurements = rows.length;
    return agg;
  }

  return { recordPerformance: recordPerformance, getLatest: getLatest, aggregate: aggregate, METRIC_FIELDS: METRIC_FIELDS };
})();
