/**
 * SuccessService.gs — contextual success moments (Creator Experience milestone).
 *
 * Subtle encouragement, never distracting. `celebrate` surfaces a keyed message (a toast
 * in the UI); `checkExecutionScore` detects an Execution Score increase since last check
 * (persisted per user) so HOME can quietly celebrate momentum.
 */
const SuccessService = (function () {

  /**
   * @param {string} key one of SUCCESS_MOMENTS keys
   * @param {boolean} [toast] also show a toast
   * @returns {string} the message
   */
  function celebrate(key, toast) {
    const msg = SUCCESS_MOMENTS[key] || '';
    if (toast && msg) { try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'CreatorOS', 4); } catch (e) { /* headless */ } }
    return msg;
  }

  /**
   * Compare the current Execution Score to the last recorded value and update the store.
   * @returns {{previous:(number|null), current:number, increased:boolean, delta:number}}
   */
  function checkExecutionScore() {
    const current = AnalyticsService.getKpis().executionScore;
    const raw = ConfigService.getUserProp(USER_PROP.LAST_EXECUTION_SCORE);
    const previous = raw == null ? null : Number(raw);
    ConfigService.setUserProp(USER_PROP.LAST_EXECUTION_SCORE, String(current));
    const increased = previous != null && current > previous;
    return { previous: previous, current: current, increased: increased, delta: previous == null ? 0 : Math.round((current - previous) * 10) / 10 };
  }

  return { celebrate: celebrate, checkExecutionScore: checkExecutionScore };
})();
