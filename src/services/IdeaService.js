/**
 * IdeaService.gs — idea capture, scoring, and conversion to content (FR-003).
 *
 * @see docs/17_Service_Contracts.md §4
 */
const IdeaService = (function () {

  const MODULE = 'IdeaService';
  const CONVERTIBLE = ['Approved', 'Reviewed'];

  /** @private */
  function repo() { return new IdeaRepository(); }

  /**
   * Create an idea. Applies sensible defaults; the Priority_Score is computed by the sheet formula.
   * @param {Object} input IDEAS field values.
   * @returns {Object} ServiceResult (data.idea = stored record)
   */
  function createIdea(input) {
    try {
      const rec = Object.assign({
        Created_Date: now(),
        Status: 'Captured',
        Source: 'Manual',
      }, input || {});
      const stored = repo().create(rec);
      LoggerService.info(MODULE, 'Idea created', { recordId: stored.Idea_ID });
      return ok('IDEA_CREATED', 'Idea captured.', { idea: stored });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'createIdea' });
      return failFromError(err);
    }
  }

  /**
   * @param {string} id
   * @param {Object} patch
   * @returns {Object} ServiceResult
   */
  function updateIdea(id, patch) {
    try { return ok('IDEA_UPDATED', 'Idea updated.', { idea: repo().updateById(id, patch) }); }
    catch (err) { LoggerService.error(MODULE, err, { fn: 'updateIdea', recordId: id }); return failFromError(err); }
  }

  /**
   * Return the computed priority score for an idea (formula-driven).
   * @param {string} id
   * @returns {Object} ServiceResult (data.priorityScore)
   */
  function scoreIdea(id) {
    try {
      SpreadsheetApp.flush();
      const idea = repo().getById(id);
      if (!idea) throw appError(ERR.RECORD_NOT_FOUND, { recordId: id, userMessage: 'That idea no longer exists.' });
      return ok('IDEA_SCORED', 'Priority score computed.', { priorityScore: idea.Priority_Score });
    } catch (err) { return failFromError(err); }
  }

  /**
   * Convert an Approved/Reviewed idea into a content record.
   * Idempotent: a second call returns the existing content unless overrides.force is set.
   * @param {string} id
   * @param {Object} [overrides] Content field overrides (+ optional {force:true} for a new variant).
   * @returns {Object} ServiceResult (data.content)
   */
  function convertToContent(id, overrides) {
    try {
      const idea = repo().getById(id);
      if (!idea) throw appError(ERR.RECORD_NOT_FOUND, { recordId: id, userMessage: 'That idea no longer exists.' });
      const force = overrides && overrides.force;

      if (idea.Status === 'Converted' && !force) {
        const existing = new ContentRepository().find({ Idea_ID: id })[0];
        if (existing) return ok('IDEA_ALREADY_CONVERTED', 'This idea was already converted.', { content: existing, reused: true });
      }
      if (CONVERTIBLE.indexOf(idea.Status) === -1 && idea.Status !== 'Converted') {
        throw appError(ERR.CONTENT_STATUS_TRANSITION_INVALID, {
          severity: SEVERITY.WARNING,
          userMessage: 'Only Reviewed or Approved ideas can be converted to content.',
          technicalMessage: 'Idea ' + id + ' status is ' + idea.Status,
          recordId: id,
          suggestedAction: 'Set the idea to Reviewed or Approved first.',
        });
      }

      // Derive Objective from the idea's Strategic Goal and Priority from its Priority_Score
      // (correction 4). No arbitrary defaults — if either cannot be derived and is not supplied,
      // require user confirmation rather than silently assigning a value.
      SpreadsheetApp.flush();
      const fresh = repo().getById(id); // ensure Priority_Score formula is computed
      const ov = cleanOverrides(overrides);
      const objective = ov.Objective || mapGoalToObjective(fresh.Strategic_Goal);
      const priority = ov.Priority || derivePriority(fresh.Priority_Score);
      const missing = [];
      if (!objective) missing.push('Objective');
      if (!priority) missing.push('Priority');
      if (missing.length) {
        return fail(ERR.CONVERSION_NEEDS_CONFIRMATION,
          'Cannot derive ' + missing.join(' and ') + ' from this idea. Supply ' + missing.join(' and ') + ' to convert.',
          { ideaId: id, missing: missing, derivedObjective: objective, derivedPriority: priority });
      }

      const contentInput = Object.assign({
        Idea_ID: fresh.Idea_ID,
        Title: fresh.Idea_Title,
        Content_Pillar: fresh.Content_Pillar,
        Primary_Platform: fresh.Primary_Platform,
        Format: fresh.Suggested_Format,
        Objective: objective,
        Priority: priority,
        Status: 'Backlog',
      }, ov);

      const created = ContentService.createContent(contentInput);
      if (!created.success) return created;

      repo().updateById(id, { Status: 'Converted' });
      LoggerService.info(MODULE, 'Idea converted to content', { recordId: id, detail: { contentId: created.data.content.Content_ID } });
      return ok('IDEA_CONVERTED', 'Idea converted to content.', { content: created.data.content });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'convertToContent', recordId: id });
      return failFromError(err);
    }
  }

  /** @private Strip control flags from overrides. */
  function cleanOverrides(overrides) {
    if (!overrides) return {};
    const o = Object.assign({}, overrides);
    delete o.force;
    delete o.confirm;
    return o;
  }

  /**
   * @private Map an idea's Strategic Goal to a content Objective via the CONFIG map.
   * @param {string} goal one of ENUMS.STRATEGIC_GOAL
   * @returns {string|null} a valid CONTENT_OBJECTIVE, or null if unmappable
   */
  function mapGoalToObjective(goal) {
    if (!goal) return null;
    const raw = ConfigService.get('GOAL_OBJECTIVE_MAP', '');
    const map = {};
    String(raw).split(',').forEach(function (pair) {
      const kv = pair.split(':');
      if (kv.length === 2) map[kv[0].trim()] = kv[1].trim();
    });
    const obj = map[goal];
    return (obj && ENUMS.CONTENT_OBJECTIVE.indexOf(obj) !== -1) ? obj : null;
  }

  /**
   * @private Derive a content Priority from an idea's Priority_Score using CONFIG thresholds.
   * @param {number|string} score
   * @returns {string|null} Low/Medium/High/Critical, or null if the score is not a number
   */
  function derivePriority(score) {
    if (score === '' || score == null) return null;
    const n = Number(score);
    if (isNaN(n)) return null;
    if (n >= ConfigService.get('PRIORITY_CRITICAL_MIN', 3.0)) return 'Critical';
    if (n >= ConfigService.get('PRIORITY_HIGH_MIN', 2.0)) return 'High';
    if (n >= ConfigService.get('PRIORITY_MEDIUM_MIN', 1.0)) return 'Medium';
    return 'Low';
  }

  /**
   * @param {string} id
   * @returns {Object} ServiceResult
   */
  function archiveIdea(id) {
    try { return ok('IDEA_ARCHIVED', 'Idea archived.', { idea: repo().updateById(id, { Status: 'Archived' }) }); }
    catch (err) { return failFromError(err); }
  }

  return {
    createIdea: createIdea,
    updateIdea: updateIdea,
    scoreIdea: scoreIdea,
    convertToContent: convertToContent,
    archiveIdea: archiveIdea,
  };
})();
