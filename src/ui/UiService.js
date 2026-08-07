/**
 * UiService.gs — HTML dialog support for the highest-frequency actions (CX-2):
 * Add Idea, Create Content, AI Review. Show-functions open the dialogs; the data +
 * submit functions (called from the HTML via google.script.run) are the tested seam.
 * All writes go through the existing services, preserving validation and the AI approval
 * model — the dialog is only a nicer front door.
 */
const UiService = (function () {

  // ---- show (presentation; not unit-tested) ----
  function showAddIdea() { openDialog_('AddIdea', 'Add Idea', 460, 560); }
  function showCreateContent() { openDialog_('CreateContent', 'Create Content', 480, 620); }
  function showAiReview() { openDialog_('AiReview', 'AI Review', 520, 620); }

  /** @private */
  function openDialog_(file, title, w, h) {
    const html = HtmlService.createHtmlOutput(dialogHtml_(file)).setWidth(w).setHeight(h).setTitle(title);
    SpreadsheetApp.getUi().showModalDialog(html, title);
  }

  // ---- context (dropdowns from live config) ----
  function getIdeaFormContext() {
    return { pillars: pillars_(), platforms: ENUMS.PLATFORM, formats: ENUMS.FORMAT, goals: ENUMS.STRATEGIC_GOAL, sources: ENUMS.IDEA_SOURCE };
  }
  function getContentFormContext() {
    return { pillars: pillars_(), platforms: ENUMS.PLATFORM, formats: ENUMS.FORMAT, objectives: ENUMS.CONTENT_OBJECTIVE, priorities: ENUMS.PRIORITY };
  }

  // ---- submit (writes via services) ----
  function submitIdea(form) {
    const res = IdeaService.createIdea({
      Created_Date: new Date(), Idea_Title: form.title, Description: form.description || '',
      Content_Pillar: form.pillar, Primary_Platform: form.platform, Suggested_Format: form.format,
      Strategic_Goal: form.goal, Effort_Score: num_(form.effort), Impact_Score: num_(form.impact),
      Confidence_Score: num_(form.confidence), Source: form.source || 'Manual', Status: 'Captured',
    });
    if (res.success) SuccessService.celebrate('FIRST_IDEA', true);
    return res;
  }

  function submitContent(form) {
    const input = {
      Title: form.title, Content_Pillar: form.pillar, Primary_Platform: form.platform, Format: form.format,
      Objective: form.objective, Priority: form.priority || 'Medium', Status: 'Backlog',
    };
    if (form.publishDate) input.Planned_Publish_Date = new Date(form.publishDate);
    const res = ContentService.createContent(input);
    if (res.success) SuccessService.celebrate('FIRST_CONTENT', true);
    return res;
  }

  // ---- AI review (staged; approval writes via services) ----
  /** @param {string} kind 'performance' | 'weekly' | 'ideas' */
  function getAiReview(kind) {
    if (kind === 'weekly') return AiService.generateWeeklyPlan();
    if (kind === 'ideas') return AiService.generateIdeas();
    return AiService.analyzePerformance();
  }

  /** Accept AI-suggested ideas (creates them via IdeaService — the approval step). */
  function acceptAiIdeas(ideas) {
    const created = [];
    (ideas || []).forEach(function (idea) {
      const r = IdeaService.createIdea({
        Created_Date: new Date(), Idea_Title: idea.title, Description: idea.rationale || idea.angle || '',
        Content_Pillar: idea.pillar || pillars_()[0] || 'Education', Primary_Platform: idea.platform || 'YouTube',
        Suggested_Format: idea.format || 'YouTube Long-Form', Strategic_Goal: idea.objective && ENUMS.STRATEGIC_GOAL.indexOf(idea.objective) !== -1 ? idea.objective : 'Authority',
        Effort_Score: 3, Impact_Score: 3, Confidence_Score: 3, Source: 'AI', Status: 'Captured',
      });
      if (r.success) created.push(r.data.idea.Idea_ID);
    });
    return ok('AI_IDEAS_ACCEPTED', created.length + ' idea(s) added.', { ideaIds: created });
  }

  // ---- helpers ----
  function pillars_() { return String(ConfigService.get('CONTENT_PILLARS', 'Education, Story, Authority')).split(',').map(function (s) { return s.trim(); }).filter(String); }
  function num_(v) { const n = Number(v); return isNaN(n) ? '' : n; }

  /** @private HTML with a data-file placeholder — kept inline so the mock needs no file system. */
  function dialogHtml_(file) {
    // In Apps Script the HTML lives in ui/<file>.html; include via HtmlService.createTemplateFromFile in production.
    try { return HtmlService.createTemplateFromFile('ui/' + file).evaluate().getContent(); }
    catch (e) { return '<p>' + file + '</p>'; }
  }

  return {
    showAddIdea: showAddIdea, showCreateContent: showCreateContent, showAiReview: showAiReview,
    getIdeaFormContext: getIdeaFormContext, getContentFormContext: getContentFormContext,
    submitIdea: submitIdea, submitContent: submitContent,
    getAiReview: getAiReview, acceptAiIdeas: acceptAiIdeas,
  };
})();

/** Global shims so google.script.run can reach the dialog server functions by name. */
function uiGetIdeaFormContext() { return UiService.getIdeaFormContext(); }
function uiSubmitIdea(form) { return UiService.submitIdea(form); }
function uiGetContentFormContext() { return UiService.getContentFormContext(); }
function uiSubmitContent(form) { return UiService.submitContent(form); }
function uiGetAiReview(kind) { return UiService.getAiReview(kind); }
function uiAcceptAiIdeas(ideas) { return UiService.acceptAiIdeas(ideas); }
