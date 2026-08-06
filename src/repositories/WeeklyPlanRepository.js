/** WeeklyPlanRepository.gs — data access for WEEKLY_PLAN (week records). */
class WeeklyPlanRepository extends BaseRepository {
  constructor() { super(SHEETS.WEEKLY_PLAN); }

  /**
   * Find the week record whose start date matches.
   * @param {Date} weekStart
   * @returns {Object|null}
   */
  getByWeekStart(weekStart) {
    const target = weekStart instanceof Date ? weekStart.getTime() : null;
    if (target == null) return null;
    return this.getAll().find(function (r) {
      return r.Week_Start instanceof Date && r.Week_Start.getTime() === target;
    }) || null;
  }
}
