/**
 * WorkflowRepository.gs — data access for WORKFLOWS.
 *
 * Each row is one workflow *step*; a workflow is the set of rows sharing a
 * Workflow_ID (composite uniqueness Workflow_ID + Task_Sequence, docs 16 §7).
 */
class WorkflowRepository extends BaseRepository {
  constructor() { super(SHEETS.WORKFLOWS); }

  /**
   * Steps for one workflow, ordered by Task_Sequence.
   * @param {string} workflowId
   * @returns {Object[]}
   */
  getSteps(workflowId) {
    return this.find({ Workflow_ID: workflowId }).sort(function (a, b) {
      return (a.Task_Sequence || 0) - (b.Task_Sequence || 0);
    });
  }

  /**
   * Find the active workflow header matching a platform + format.
   * @param {string} platform
   * @param {string} format
   * @returns {{workflowId: string, name: string}|null}
   */
  findByPlatformFormat(platform, format) {
    const match = this.getAll().find(function (r) {
      return r.Platform === platform && r.Format === format && (r.Active === true || r.Active === 'TRUE');
    });
    return match ? { workflowId: match.Workflow_ID, name: match.Workflow_Name } : null;
  }

  /** @returns {string[]} distinct workflow ids present. */
  listWorkflowIds() {
    const seen = {};
    this.getAll().forEach(function (r) { if (r.Workflow_ID) seen[r.Workflow_ID] = true; });
    return Object.keys(seen);
  }
}
