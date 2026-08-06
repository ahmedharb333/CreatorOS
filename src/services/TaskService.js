/**
 * TaskService.gs — task generation and lifecycle (FR-005).
 *
 * generateTasks builds ordered production tasks from a workflow, backward-scheduled
 * from the content's Planned_Publish_Date. Per the approved decision (ADR-015) it
 * sets Due_Date, Estimated_Minutes and dependencies ONLY — Scheduled_Start/End are
 * left empty for PlanningService/CalendarService (M3). Completed tasks are never
 * replaced automatically.
 *
 * @see docs/17_Service_Contracts.md §7
 * @see docs/04_Master_PRD.md FR-005
 */
const TaskService = (function () {

  const MODULE = 'TaskService';

  const MODES = { CREATE_ONLY: 'CREATE_ONLY', APPEND_MISSING: 'APPEND_MISSING', REPLACE_OPEN_TASKS: 'REPLACE_OPEN_TASKS' };
  const OPEN_STATUSES = ['Not Started', 'Ready', 'In Progress', 'Blocked'];
  const CLOSED_STATUSES = ['Completed', 'Skipped', 'Cancelled'];

  /** @private */
  function taskRepo() { return new TaskRepository(); }
  /** @private */
  function contentRepo() { return new ContentRepository(); }

  /** @private */
  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + Number(days || 0));
    return d;
  }

  /**
   * Generate tasks for a content item from a workflow.
   * @param {string} contentId
   * @param {string} workflowId
   * @param {string} [mode] one of MODES.* (default CREATE_ONLY)
   * @returns {Object} ServiceResult (data.created, data.taskIds, data.mode)
   */
  function generateTasks(contentId, workflowId, mode) {
    mode = mode || MODES.CREATE_ONLY;
    try {
      const content = contentRepo().getById(contentId);
      if (!content) throw appError(ERR.RECORD_NOT_FOUND, { recordId: contentId, userMessage: 'That content no longer exists.' });
      if (!content.Planned_Publish_Date) {
        throw appError(ERR.CONTENT_PUBLISH_DATE_REQUIRED, {
          severity: SEVERITY.WARNING,
          userMessage: 'Set a planned publish date before generating tasks — task dates are calculated backward from it.',
          recordId: contentId,
          suggestedAction: 'Enter Planned_Publish_Date on the content, then generate tasks.',
        });
      }
      const publishDate = content.Planned_Publish_Date instanceof Date ? content.Planned_Publish_Date : new Date(content.Planned_Publish_Date);
      const steps = new WorkflowRepository().getSteps(workflowId);
      if (!steps.length) throw appError(ERR.WORKFLOW_NOT_FOUND, { recordId: workflowId, userMessage: 'That workflow has no steps.' });

      const repo = taskRepo();
      let existing = repo.getByContent(contentId);

      // Mode handling.
      if (mode === MODES.CREATE_ONLY && existing.length) {
        throw appError(ERR.TASKS_ALREADY_EXIST, {
          severity: SEVERITY.WARNING,
          userMessage: 'This content already has tasks. Choose Append or Replace to regenerate.',
          technicalMessage: existing.length + ' tasks exist for ' + contentId,
          recordId: contentId,
          suggestedAction: 'Use APPEND_MISSING or REPLACE_OPEN_TASKS.',
        });
      }
      if (mode === MODES.REPLACE_OPEN_TASKS) {
        existing.filter(function (t) { return OPEN_STATUSES.indexOf(t.Status) !== -1; })
          .forEach(function (t) { repo.deleteById(t.Task_ID); });
        existing = repo.getByContent(contentId); // refresh (keeps completed/skipped/cancelled)
      }

      const existingSeqs = {};
      existing.forEach(function (t) { existingSeqs[t.Sequence] = t; }); // TASKS use `Sequence`, not `Task_Sequence`

      // Which steps to create.
      const toCreate = steps.filter(function (s) {
        if (mode === MODES.APPEND_MISSING || mode === MODES.REPLACE_OPEN_TASKS) return !existingSeqs[s.Task_Sequence];
        return true; // CREATE_ONLY on empty content
      });

      const records = toCreate.map(function (s) {
        return {
          Content_ID: contentId,
          Task_Name: s.Task_Name,
          Task_Type: s.Task_Type,
          Sequence: s.Task_Sequence,
          Priority: content.Priority || 'Medium',
          Status: 'Not Started',
          Estimated_Minutes: s.Default_Duration_Minutes,
          Due_Date: addDays(publishDate, s.Offset_From_Publish_Days),
          Calendar_Sync_Status: 'Not Synced',
          Recovery_Status: 'Not Required',
          // Scheduled_Start/End intentionally left empty (ADR-015).
        };
      });

      const created = records.length ? repo.createMany(records) : [];

      // Wire dependencies (single primary predecessor = highest dep sequence present).
      wireDependencies(repo, contentId, steps);

      LoggerService.info(MODULE, 'Tasks generated', { recordId: contentId, detail: { mode: mode, created: created.length } });
      return ok('TASKS_CREATED', created.length + ' task(s) created for "' + content.Title + '".', {
        created: created.length,
        taskIds: created.map(function (t) { return t.Task_ID; }),
        mode: mode,
      });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'generateTasks', recordId: contentId });
      return failFromError(err);
    }
  }

  /**
   * @private Set each task's dependencies from the workflow's Dependency_Sequences.
   * `Dependency_Task_IDs` (JSON array) is authoritative (ADR-011); `Dependency_Task_ID`
   * keeps the primary (latest) predecessor for display/back-compat. Closed tasks are
   * never recalculated (correction 3) — their dependency history is immutable here.
   */
  function wireDependencies(repo, contentId, steps) {
    const tasks = repo.getByContent(contentId);
    const seqToId = {};
    // A TASKS record's sequence column is `Sequence`; a WORKFLOWS step's is `Task_Sequence`.
    tasks.forEach(function (t) { seqToId[t.Sequence] = t.Task_ID; });
    const stepBySeq = {};
    steps.forEach(function (s) { stepBySeq[s.Task_Sequence] = s; });

    tasks.forEach(function (t) {
      if (CLOSED_STATUSES.indexOf(t.Status) !== -1) return; // only new + open tasks
      const step = stepBySeq[t.Sequence];
      if (!step) return;
      const depSeqs = WorkflowSeed.parseDependencies(step.Dependency_Sequences)
        .filter(function (seq) { return seqToId[seq]; })
        .sort(function (a, b) { return a - b; });
      const depIds = depSeqs.map(function (seq) { return seqToId[seq]; });
      const idsJson = depIds.length ? JSON.stringify(depIds) : '';
      const primary = depSeqs.length ? seqToId[depSeqs[depSeqs.length - 1]] : ''; // latest predecessor
      if ((t.Dependency_Task_IDs || '') !== idsJson || (t.Dependency_Task_ID || '') !== primary) {
        repo.updateById(t.Task_ID, { Dependency_Task_IDs: idsJson, Dependency_Task_ID: primary });
      }
    });
  }

  /**
   * Parse a task's authoritative dependency list.
   * @param {Object} task
   * @returns {string[]} predecessor Task IDs
   */
  function getDependencies(task) {
    if (!task || !task.Dependency_Task_IDs) return [];
    try { const a = JSON.parse(task.Dependency_Task_IDs); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }

  /**
   * @param {string} id
   * @param {Object} patch
   * @returns {Object} ServiceResult
   */
  function updateTask(id, patch) {
    try { return ok('TASK_UPDATED', 'Task updated.', { task: taskRepo().updateById(id, patch) }); }
    catch (err) { return failFromError(err); }
  }

  /**
   * @param {string} id
   * @returns {Object} ServiceResult
   */
  function completeTask(id) {
    try {
      const task = taskRepo().updateById(id, { Status: 'Completed', Completed_At: now() });
      LoggerService.info(MODULE, 'Task completed', { recordId: id });
      return ok('TASK_COMPLETED', 'Task completed.', { task: task });
    } catch (err) { return failFromError(err); }
  }

  /**
   * @param {string} id
   * @param {string} reason required
   * @returns {Object} ServiceResult
   */
  function blockTask(id, reason) {
    try {
      if (!reason) {
        throw appError(ERR.RECORD_VALIDATION_FAILED, {
          severity: SEVERITY.WARNING, recordId: id,
          userMessage: 'A reason is required to block a task.',
          suggestedAction: 'Provide a blocked reason.',
        });
      }
      const task = taskRepo().updateById(id, { Status: 'Blocked', Blocked_Reason: reason });
      LoggerService.info(MODULE, 'Task blocked', { recordId: id });
      return ok('TASK_BLOCKED', 'Task blocked.', { task: task });
    } catch (err) { return failFromError(err); }
  }

  /**
   * @param {string} contentId
   * @returns {Task[]} open tasks for the content
   */
  function getOpenTasks(contentId) {
    return taskRepo().getByContent(contentId).filter(function (t) { return OPEN_STATUSES.indexOf(t.Status) !== -1; });
  }

  /**
   * Detect overdue tasks (past Due_Date, still open).
   * @param {Date} [asOf]
   * @returns {Task[]}
   */
  function detectOverdue(asOf) {
    const ref = asOf || now();
    return taskRepo().getAll().filter(function (t) {
      if (CLOSED_STATUSES.indexOf(t.Status) !== -1) return false;
      const due = t.Due_Date instanceof Date ? t.Due_Date : (t.Due_Date ? new Date(t.Due_Date) : null);
      return due && due.getTime() < ref.getTime();
    });
  }

  return {
    MODES: MODES,
    generateTasks: generateTasks,
    updateTask: updateTask,
    completeTask: completeTask,
    blockTask: blockTask,
    getOpenTasks: getOpenTasks,
    detectOverdue: detectOverdue,
    getDependencies: getDependencies,
  };
})();
