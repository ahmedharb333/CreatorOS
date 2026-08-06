/**
 * RecoveryLogRepository.gs — data access for the RECOVERY_LOG system sheet.
 *
 * Recovery actions are logged here for future analytics/AI (M5+). This sheet is
 * system-internal and never creator-facing (ADR-019); creators do not read it.
 */
class RecoveryLogRepository extends BaseRepository {
  constructor() { super(SHEETS.RECOVERY_LOG); }

  /** All recovery entries for a task, newest first. @param {string} taskId @returns {Object[]} */
  getByTask(taskId) {
    return this.find({ Task_ID: taskId }).sort(function (a, b) {
      const ta = a.Timestamp instanceof Date ? a.Timestamp.getTime() : 0;
      const tb = b.Timestamp instanceof Date ? b.Timestamp.getTime() : 0;
      return tb - ta;
    });
  }
}
