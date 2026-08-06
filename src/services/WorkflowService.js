/**
 * WorkflowService.gs — workflow lookup, validation, cloning (FR-004).
 *
 * @see docs/17_Service_Contracts.md §6
 */
const WorkflowService = (function () {

  const MODULE = 'WorkflowService';

  /** @private */
  function repo() { return new WorkflowRepository(); }

  /**
   * @param {string} platform
   * @param {string} format
   * @returns {Object|null} {workflowId, name} or null
   */
  function findWorkflow(platform, format) { return repo().findByPlatformFormat(platform, format); }

  /**
   * @param {string} workflowId
   * @returns {Object[]} steps ordered by Task_Sequence
   */
  function getSteps(workflowId) { return repo().getSteps(workflowId); }

  /**
   * Validate a workflow's steps (present, ordered, unique sequences, valid deps).
   * @param {string} workflowId
   * @returns {{valid: boolean, errors: string[]}}
   */
  function validateWorkflow(workflowId) {
    const steps = repo().getSteps(workflowId);
    const errors = [];
    if (!steps.length) { errors.push('no steps'); return { valid: false, errors: errors }; }
    const seen = {};
    steps.forEach(function (s) {
      if (seen[s.Task_Sequence]) errors.push('duplicate sequence ' + s.Task_Sequence);
      seen[s.Task_Sequence] = true;
      if (!s.Task_Name) errors.push('step ' + s.Task_Sequence + ' missing name');
      if (!(Number(s.Default_Duration_Minutes) > 0)) errors.push('step ' + s.Task_Sequence + ' invalid duration');
    });
    // Dependencies must reference existing sequences.
    steps.forEach(function (s) {
      WorkflowSeed.parseDependencies(s.Dependency_Sequences).forEach(function (dep) {
        if (!seen[dep]) errors.push('step ' + s.Task_Sequence + ' depends on missing sequence ' + dep);
      });
    });
    return { valid: errors.length === 0, errors: errors };
  }

  /**
   * Clone a workflow's steps under a new Workflow_ID and name (docs 27 §10).
   * @param {string} workflowId
   * @param {string} name
   * @returns {Object} ServiceResult (data.workflowId)
   */
  function cloneWorkflow(workflowId, name) {
    try {
      const steps = repo().getSteps(workflowId);
      if (!steps.length) throw appError(ERR.WORKFLOW_NOT_FOUND, { recordId: workflowId, userMessage: 'That workflow was not found.' });
      const newId = IdService.next(ID_PREFIX.WORKFLOW);
      const clones = steps.map(function (s) {
        return {
          Workflow_ID: newId,
          Workflow_Name: name,
          Platform: s.Platform,
          Format: s.Format,
          Task_Sequence: s.Task_Sequence,
          Task_Name: s.Task_Name,
          Task_Type: s.Task_Type,
          Default_Duration_Minutes: s.Default_Duration_Minutes,
          Offset_From_Publish_Days: s.Offset_From_Publish_Days,
          Dependency_Sequences: s.Dependency_Sequences,
          Required: s.Required,
          Active: true,
        };
      });
      repo().createMany(clones);
      LoggerService.info(MODULE, 'Workflow cloned', { detail: { from: workflowId, to: newId, steps: clones.length } });
      return ok('WORKFLOW_CLONED', 'Workflow cloned as "' + name + '".', { workflowId: newId, steps: clones.length });
    } catch (err) { return failFromError(err); }
  }

  return {
    findWorkflow: findWorkflow,
    getSteps: getSteps,
    validateWorkflow: validateWorkflow,
    cloneWorkflow: cloneWorkflow,
  };
})();
