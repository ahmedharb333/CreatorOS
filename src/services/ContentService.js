/**
 * ContentService.gs — content creation, workflow selection, status, publishing (FR-004).
 *
 * @see docs/17_Service_Contracts.md §5
 */
const ContentService = (function () {

  const MODULE = 'ContentService';

  /** Allowed forward status transitions (docs 17 §5). Paused/Cancelled handled separately. */
  const FORWARD = {
    Backlog: ['Approved'],
    Approved: ['In Production'],
    'In Production': ['Ready'],
    Ready: ['Scheduled'],
    Scheduled: ['Published'],
  };
  const FINAL = ['Published', 'Cancelled'];
  const PAUSE_RESUMABLE = ['Backlog', 'Approved', 'In Production', 'Ready', 'Scheduled'];

  /** @private */
  function repo() { return new ContentRepository(); }

  /**
   * @param {Object} input CONTENT field values.
   * @returns {Object} ServiceResult (data.content)
   */
  function createContent(input) {
    try {
      const rec = Object.assign({ Status: 'Backlog', Priority: 'Medium' }, input || {});
      const stored = repo().create(rec);
      LoggerService.info(MODULE, 'Content created', { recordId: stored.Content_ID });
      return ok('CONTENT_CREATED', 'Content created.', { content: stored });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'createContent' });
      return failFromError(err);
    }
  }

  /**
   * @param {string} id
   * @param {Object} patch
   * @returns {Object} ServiceResult
   */
  function updateContent(id, patch) {
    try { return ok('CONTENT_UPDATED', 'Content updated.', { content: repo().updateById(id, patch) }); }
    catch (err) { return failFromError(err); }
  }

  /**
   * Find the workflow matching a content item's platform + format.
   * @param {string} id
   * @returns {Object} ServiceResult (data.workflowId, data.name)
   */
  function selectWorkflow(id) {
    try {
      const content = requireContent(id);
      const match = new WorkflowRepository().findByPlatformFormat(content.Primary_Platform, content.Format);
      if (!match) {
        throw appError(ERR.WORKFLOW_NOT_FOUND, {
          severity: SEVERITY.WARNING,
          userMessage: 'No workflow matches ' + content.Primary_Platform + ' / ' + content.Format + '.',
          technicalMessage: 'No active workflow for ' + content.Primary_Platform + '/' + content.Format,
          recordId: id,
          suggestedAction: 'Pick a supported platform/format or clone a workflow.',
        });
      }
      return ok('WORKFLOW_SELECTED', 'Workflow matched.', { workflowId: match.workflowId, name: match.name });
    } catch (err) { return failFromError(err); }
  }

  /**
   * Change content status with transition validation.
   * @param {string} id
   * @param {string} status target status
   * @returns {Object} ServiceResult
   */
  function changeStatus(id, status) {
    try {
      const content = requireContent(id);
      const from = content.Status;
      if (from === status) return ok('CONTENT_STATUS_UNCHANGED', 'Status unchanged.', { content: content });

      const allowed = isTransitionAllowed(from, status);
      if (!allowed) {
        throw appError(ERR.CONTENT_STATUS_TRANSITION_INVALID, {
          severity: SEVERITY.WARNING,
          userMessage: 'Cannot move content from "' + from + '" to "' + status + '".',
          technicalMessage: 'Invalid transition ' + from + ' -> ' + status,
          recordId: id,
          suggestedAction: 'Follow the flow: Backlog → Approved → In Production → Ready → Scheduled → Published.',
        });
      }
      // Publish date required once scheduling/publishing.
      if ((status === 'Scheduled' || status === 'Published') && !content.Planned_Publish_Date) {
        throw appError(ERR.CONTENT_PUBLISH_DATE_REQUIRED, {
          severity: SEVERITY.WARNING,
          userMessage: 'Set a planned publish date before scheduling or publishing.',
          recordId: id,
          suggestedAction: 'Enter Planned_Publish_Date on the content, then retry.',
        });
      }
      const updated = repo().updateById(id, { Status: status });
      LoggerService.info(MODULE, 'Content status changed', { recordId: id, detail: { from: from, to: status } });
      return ok('CONTENT_STATUS_CHANGED', 'Status changed to ' + status + '.', { content: updated });
    } catch (err) { return failFromError(err); }
  }

  /** @private */
  function isTransitionAllowed(from, to) {
    if (FINAL.indexOf(from) !== -1) return false;              // Published/Cancelled are terminal
    if (to === 'Cancelled') return true;                        // cancel from any nonfinal
    if (to === 'Paused') return PAUSE_RESUMABLE.indexOf(from) !== -1;
    if (from === 'Paused') return PAUSE_RESUMABLE.indexOf(to) !== -1; // resume
    return (FORWARD[from] || []).indexOf(to) !== -1;            // normal forward step
  }

  /**
   * Mark content published.
   * @param {string} id
   * @param {Object} publishData {url, date?}
   * @returns {Object} ServiceResult
   */
  function markPublished(id, publishData) {
    try {
      const content = requireContent(id);
      const data = publishData || {};
      if (!content.Planned_Publish_Date && !data.date) {
        throw appError(ERR.CONTENT_PUBLISH_DATE_REQUIRED, { recordId: id, userMessage: 'A publish date is required to mark content published.' });
      }
      const patch = {
        Status: 'Published',
        Actual_Publish_Date: data.date || now(),
      };
      if (data.url) patch.Published_URL = data.url;
      const updated = repo().updateById(id, patch);
      LoggerService.info(MODULE, 'Content published', { recordId: id });
      return ok('CONTENT_PUBLISHED', 'Content marked published.', { content: updated });
    } catch (err) { return failFromError(err); }
  }

  /** @private */
  function requireContent(id) {
    const content = repo().getById(id);
    if (!content) throw appError(ERR.RECORD_NOT_FOUND, { recordId: id, userMessage: 'That content no longer exists.' });
    return content;
  }

  return {
    createContent: createContent,
    updateContent: updateContent,
    selectWorkflow: selectWorkflow,
    changeStatus: changeStatus,
    markPublished: markPublished,
    _isTransitionAllowed: isTransitionAllowed, // exposed for tests
  };
})();
