/** PerformanceRepository.gs — data access for PERFORMANCE. */
class PerformanceRepository extends BaseRepository {
  constructor() { super(SHEETS.PERFORMANCE); }

  /**
   * All measurements for a content item, newest measurement first.
   * @param {string} contentId
   * @returns {Object[]}
   */
  getByContent(contentId) {
    return this.find({ Content_ID: contentId }).sort(function (a, b) {
      const da = a.Measurement_Date instanceof Date ? a.Measurement_Date.getTime() : 0;
      const db = b.Measurement_Date instanceof Date ? b.Measurement_Date.getTime() : 0;
      return db - da;
    });
  }
}
