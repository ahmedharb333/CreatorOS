/**
 * CapacityService.gs — weekly capacity vs planned workload (FR-006).
 *
 * Capacity before ambition: this service reports utilization and a warning level;
 * it never silently drops tasks. Available minutes come from Setup (WEEKLY_HOURS),
 * thresholds from CONFIG.
 *
 * @see docs/17_Service_Contracts.md §8
 * @see docs/16_Workbook_Schema.md §8 (warning levels)
 */
const CapacityService = (function () {

  /** @returns {number} weekly available minutes from configured hours. */
  function weeklyAvailableMinutes() {
    const hours = Number(ConfigService.get('WEEKLY_HOURS', 10));
    return isNaN(hours) ? 0 : Math.max(0, hours) * 60;
  }

  /**
   * @param {Date} weekStart
   * @returns {{weekStart: Date, availableMinutes: number}}
   */
  function getWeeklyCapacity(weekStart) {
    return { weekStart: weekStart, availableMinutes: weeklyAvailableMinutes() };
  }

  /**
   * Classify a utilization ratio (docs 16 §8): Normal ≤85%, Watch ≤100%,
   * Overloaded ≤120%, Critical >120% (thresholds configurable).
   * @param {number} ratio planned/available
   * @returns {string} one of ENUMS.WARNING_LEVEL
   */
  function warningLevel(ratio) {
    const th = ConfigService.getCapacityThresholds(); // {warning:0.85, critical:1.2}
    if (ratio <= th.warning) return 'Normal';
    if (ratio <= 1) return 'Watch';
    if (ratio <= th.critical) return 'Overloaded';
    return 'Critical';
  }

  /**
   * @param {Task[]} tasks
   * @param {{availableMinutes:number}} capacity
   * @returns {{availableMinutes:number, plannedMinutes:number, utilizationPercent:number, warningLevel:string}}
   */
  function calculateUtilization(tasks, capacity) {
    const planned = (tasks || []).reduce(function (sum, t) { return sum + (Number(t.Estimated_Minutes) || 0); }, 0);
    const available = (capacity && capacity.availableMinutes) || 0;
    const ratio = available > 0 ? planned / available : (planned > 0 ? Number.POSITIVE_INFINITY : 0);
    return {
      availableMinutes: available,
      plannedMinutes: planned,
      utilizationPercent: available > 0 ? Math.round(ratio * 100) : 0,
      warningLevel: warningLevel(ratio),
    };
  }

  return {
    weeklyAvailableMinutes: weeklyAvailableMinutes,
    getWeeklyCapacity: getWeeklyCapacity,
    warningLevel: warningLevel,
    calculateUtilization: calculateUtilization,
  };
})();
