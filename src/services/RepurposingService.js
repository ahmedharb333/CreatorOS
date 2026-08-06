/**
 * RepurposingService.gs — rule-based derivative suggestions (FR-014).
 *
 * Milestone 4 is entirely rule-based (D4-1): suggestions come only from the approved
 * repurposing mappings (docs 27 §9). AI-assisted repurposing is Milestone 5 — the
 * `suggestWithAi` entry point is a guarded stub until then.
 *
 * @see docs/17_Service_Contracts.md §12
 * @see docs/27_Default_Workflow_Library.md §9
 */
const RepurposingService = (function () {

  const MODULE = 'RepurposingService';

  /** Source Format → derivative targets (only valid PLATFORM/FORMAT enum values). */
  const MAP = {
    'YouTube Long-Form': [
      { platform: 'YouTube', format: 'YouTube Short', angle: 'Cut a standout moment into a Short' },
      { platform: 'LinkedIn', format: 'LinkedIn Post', angle: 'Summarize the core insight as a post' },
      { platform: 'LinkedIn', format: 'LinkedIn Carousel', angle: 'Turn the key points into a carousel' },
      { platform: 'Newsletter', format: 'Newsletter', angle: 'Recap as a newsletter section' },
    ],
    'Podcast Episode': [
      { platform: 'YouTube', format: 'YouTube Short', angle: 'Clip a memorable exchange' },
      { platform: 'Blog', format: 'Blog Article', angle: 'Write a summary article with quotes' },
      { platform: 'Newsletter', format: 'Newsletter', angle: 'Recap the episode in the newsletter' },
    ],
    'Newsletter': [
      { platform: 'LinkedIn', format: 'LinkedIn Post', angle: 'Adapt the top section as a post' },
      { platform: 'LinkedIn', format: 'LinkedIn Carousel', angle: 'Turn the takeaways into a carousel' },
    ],
    'Blog Article': [
      { platform: 'LinkedIn', format: 'LinkedIn Post', angle: 'Share the thesis as a post' },
      { platform: 'YouTube', format: 'YouTube Short', angle: 'Explain one point in a Short' },
    ],
  };

  /** @private */
  function repo() { return new RepurposingRepository(); }

  /**
   * Suggest rule-based derivatives for a content item. Idempotent: skips a target that
   * already has a suggestion for this source.
   * @param {string} contentId
   * @returns {Object} ServiceResult (data.suggestions)
   */
  function suggestRuleBased(contentId) {
    try {
      const content = new ContentRepository().getById(contentId);
      if (!content) throw appError(ERR.RECORD_NOT_FOUND, { recordId: contentId, userMessage: 'That content no longer exists.' });
      const targets = MAP[content.Format] || [];
      if (!targets.length) return ok('NO_REPURPOSING', 'No repurposing mappings for ' + content.Format + '.', { suggestions: [] });

      const existing = repo().getBySource(contentId);
      const has = {};
      existing.forEach(function (r) { has[r.Target_Platform + '|' + r.Target_Format] = true; });

      const toCreate = targets.filter(function (tg) { return !has[tg.platform + '|' + tg.format]; }).map(function (tg) {
        return {
          Source_Content_ID: contentId,
          Target_Platform: tg.platform,
          Target_Format: tg.format,
          Suggested_Angle: tg.angle,
          Status: 'Suggested',
          AI_Generated: false,
          Created_At: now(),
        };
      });
      const created = toCreate.length ? repo().createMany(toCreate) : [];
      LoggerService.info(MODULE, 'Rule-based suggestions created', { recordId: contentId, detail: { created: created.length } });
      return ok('REPURPOSING_SUGGESTED', created.length + ' suggestion(s) added for "' + content.Title + '".', { suggestions: created });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'suggestRuleBased', recordId: contentId });
      return failFromError(err);
    }
  }

  /** AI-assisted repurposing — deferred to Milestone 5. */
  function suggestWithAi() {
    return fail(ERR.AI_DISABLED, 'AI repurposing arrives in Milestone 5. Use rule-based suggestions for now.');
  }

  /**
   * Accept a suggestion → create a linked derivative content record.
   * @param {string} repurposeId
   * @returns {Object} ServiceResult (data.content)
   */
  function acceptSuggestion(repurposeId) {
    try {
      const sug = repo().getById(repurposeId);
      if (!sug) throw appError(ERR.RECORD_NOT_FOUND, { recordId: repurposeId, userMessage: 'That suggestion no longer exists.' });
      if (sug.Status === 'Accepted' && sug.New_Content_ID) {
        return ok('REPURPOSING_ALREADY_ACCEPTED', 'Already accepted.', { content: new ContentRepository().getById(sug.New_Content_ID), reused: true });
      }
      const source = new ContentRepository().getById(sug.Source_Content_ID);
      if (!source) throw appError(ERR.RECORD_NOT_FOUND, { recordId: sug.Source_Content_ID, userMessage: 'Source content is missing.' });

      // Reuse the source's group (or start one) so derivatives are traceable.
      let groupId = source.Repurpose_Group_ID;
      if (!groupId) {
        groupId = IdService.next(ID_PREFIX.REPURPOSE_GROUP);
        new ContentRepository().updateById(source.Content_ID, { Repurpose_Group_ID: groupId });
      }
      const created = ContentService.createContent({
        Title: source.Title + ' — ' + sug.Target_Format,
        Content_Pillar: source.Content_Pillar,
        Primary_Platform: sug.Target_Platform,
        Format: sug.Target_Format,
        Objective: source.Objective,
        Priority: source.Priority || 'Medium',
        Status: 'Backlog',
        Source_Content_ID: source.Content_ID,
        Repurpose_Group_ID: groupId,
      });
      if (!created.success) return created;

      repo().updateById(repurposeId, { Status: 'Accepted', New_Content_ID: created.data.content.Content_ID });
      LoggerService.info(MODULE, 'Suggestion accepted', { recordId: repurposeId, detail: { newContent: created.data.content.Content_ID } });
      return ok('REPURPOSING_ACCEPTED', 'Derivative content created.', { content: created.data.content });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'acceptSuggestion', recordId: repurposeId });
      return failFromError(err);
    }
  }

  /**
   * @param {string} repurposeId
   * @returns {Object} ServiceResult
   */
  function rejectSuggestion(repurposeId) {
    try {
      const sug = repo().getById(repurposeId);
      if (!sug) throw appError(ERR.RECORD_NOT_FOUND, { recordId: repurposeId, userMessage: 'That suggestion no longer exists.' });
      const updated = repo().updateById(repurposeId, { Status: 'Rejected' });
      return ok('REPURPOSING_REJECTED', 'Suggestion rejected.', { suggestion: updated });
    } catch (err) { return failFromError(err); }
  }

  return {
    suggestRuleBased: suggestRuleBased,
    suggestWithAi: suggestWithAi,
    acceptSuggestion: acceptSuggestion,
    rejectSuggestion: rejectSuggestion,
    MAP: MAP,
  };
})();
