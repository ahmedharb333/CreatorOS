/**
 * SampleDataService.gs — flagship "Try Sample Workspace" (CX-4).
 *
 * Loads one fictional creator's fully-realized workspace so a brand-new customer
 * understands CreatorOS within five minutes without entering any data: realistic
 * publishing schedule, published + in-production content, completed and upcoming tasks,
 * a recovery example (an overdue task), an approved + auto-allocated (calendar-ready)
 * weekly plan, performance data, a repurposing suggestion, and a populated dashboard.
 * AI recommendations work immediately (rule-based, or via the customer's key).
 *
 * Everything is written through the real services/repositories, so the sample is always
 * schema-valid. `startEmptyWorkspace()` clears it for a clean start.
 */
const SampleDataService = (function () {

  const MODULE = 'SampleDataService';
  const DAY = 86400000;
  const DATA_SHEETS = [SHEETS.IDEAS, SHEETS.CONTENT, SHEETS.TASKS, SHEETS.WEEKLY_PLAN, SHEETS.REPURPOSING, SHEETS.PERFORMANCE, SHEETS.RECOVERY_LOG, SHEETS.AI_LOG];

  /** Load the sample workspace (resets first for idempotency). @returns {Object} ServiceResult */
  function loadSampleWorkspace() {
    try {
      clearData();
      seedSetup();

      // Ideas.
      const ideaRepo = new IdeaRepository();
      ideaRepo.create({ Created_Date: daysFromNow(-12), Idea_Title: 'Why most creators quit at month 3', Content_Pillar: 'Story', Primary_Platform: 'YouTube', Suggested_Format: 'YouTube Long-Form', Strategic_Goal: 'Authority', Effort_Score: 4, Impact_Score: 5, Confidence_Score: 4, Status: 'Approved', Source: 'Research' });
      ideaRepo.create({ Created_Date: daysFromNow(-6), Idea_Title: '3 editing mistakes that kill retention', Content_Pillar: 'Education', Primary_Platform: 'YouTube', Suggested_Format: 'YouTube Short', Strategic_Goal: 'Engagement', Effort_Score: 2, Impact_Score: 4, Confidence_Score: 4, Status: 'Reviewed', Source: 'Audience' });
      ideaRepo.create({ Created_Date: daysFromNow(-2), Idea_Title: 'Weekly creator digest', Content_Pillar: 'Authority', Primary_Platform: 'Newsletter', Suggested_Format: 'Newsletter', Strategic_Goal: 'Retention', Effort_Score: 3, Impact_Score: 3, Confidence_Score: 3, Status: 'Captured', Source: 'Manual' });

      // Published content (5 days ago) with all tasks completed on time.
      const published = makeContent('The 30-day publishing system', 'Authority', 'YouTube', 'YouTube Long-Form', 'Educate', 'High', {
        Status: 'Published', Planned_Publish_Date: daysFromNow(-5), Actual_Publish_Date: daysFromNow(-5), Published_URL: 'https://example.com/watch',
      });
      generateAndComplete(published, daysFromNow(-5), 'allOnTime');

      // In-production content (publishes in 3 days): mostly done, ONE overdue (recovery example), rest upcoming.
      const inProd = makeContent('Why most creators quit at month 3', 'Story', 'YouTube', 'YouTube Long-Form', 'Reach', 'High', {
        Status: 'In Production', Planned_Publish_Date: daysFromNow(3),
      });
      generateAndComplete(inProd, daysFromNow(3), 'mixed');

      // A third, upcoming backlog item (no tasks yet) so "Create Content"/planning feels alive.
      makeContent('3 editing mistakes that kill retention', 'Education', 'YouTube', 'YouTube Short', 'Engage', 'Medium', { Status: 'Approved', Planned_Publish_Date: daysFromNow(9) });

      // Weekly plan: build, approve, auto-allocate (calendar-ready).
      PlanningService.buildWeeklyPlan(now());
      const wk = new WeeklyPlanRepository().getByWeekStart(PlanningService.weekBounds(now()).start);
      if (wk) PlanningService.approveWeeklyPlan(wk.Week_ID);
      PlanningService.autoAllocate(now());

      // Performance on the published item.
      PerformanceService.recordPerformance(published, { Platform: 'YouTube', Measurement_Date: daysFromNow(-4), Views: 5200, Impressions: 14000, Reach: 9000, Likes: 430, Comments: 58, Shares: 41, Watch_Time_Minutes: 3100 }, { force: false });

      // Repurposing suggestions on the published item.
      RepurposingService.suggestRuleBased(published);

      // Refresh creator-facing views.
      DashboardService.refresh();
      PlanningService.renderTodayView(now());
      HomeService.render();

      LoggerService.info(MODULE, 'Sample workspace loaded');
      SuccessService.celebrate('SAMPLE_LOADED', true);
      return ok('SAMPLE_LOADED', 'Sample workspace ready — explore HOME, Today, and the Dashboard. Reset any time with "Start Empty Workspace".', { creator: 'Alex Rivera' });
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'loadSampleWorkspace' });
      return failFromError(err);
    }
  }

  /** Clear all workspace data for a clean start. @returns {Object} ServiceResult */
  function startEmptyWorkspace() {
    try {
      clearData();
      resetSetupValues();
      HomeService.render();
      return ok('EMPTY_WORKSPACE', 'Started an empty workspace. Complete Setup to begin.', {});
    } catch (err) { return failFromError(err); }
  }

  // ---- helpers ----

  /** @private create a content item, then set final fields directly (sample seeding). */
  function makeContent(title, pillar, platform, format, objective, priority, extra) {
    const res = ContentService.createContent({ Title: title, Content_Pillar: pillar, Primary_Platform: platform, Format: format, Objective: objective, Priority: priority, Status: 'Backlog' });
    const id = res.data.content.Content_ID;
    if (extra) new ContentRepository().updateById(id, extra);
    return id;
  }

  /** @private generate tasks from the matching workflow and complete/leave them for a realistic mix. */
  function generateAndComplete(contentId, publishDate, mode) {
    const wf = new WorkflowRepository().findByPlatformFormat(
      new ContentRepository().getById(contentId).Primary_Platform,
      new ContentRepository().getById(contentId).Format);
    if (!wf) return;
    TaskService.generateTasks(contentId, wf.workflowId, TaskService.MODES.CREATE_ONLY);
    const repo = new TaskRepository();
    const tasks = repo.getByContent(contentId);
    const nowMs = now().getTime();
    const past = tasks.filter(function (t) { return t.Due_Date instanceof Date && t.Due_Date.getTime() < nowMs; })
      .sort(function (a, b) { return a.Due_Date.getTime() - b.Due_Date.getTime(); });

    if (mode === 'allOnTime') {
      past.forEach(function (t) { completeOnTime(repo, t); });
    } else { // mixed: complete all past except the latest one, which stays overdue (recovery example)
      past.forEach(function (t, i) {
        if (i < past.length - 1) completeOnTime(repo, t);
        else repo.updateById(t.Task_ID, { Recovery_Status: 'Required' }); // overdue, open
      });
    }
  }

  /** @private mark a task completed on time (Completed_At just before its due date). */
  function completeOnTime(repo, t) {
    const due = t.Due_Date instanceof Date ? t.Due_Date : new Date(t.Due_Date);
    repo.updateById(t.Task_ID, { Status: 'Completed', Completed_At: new Date(due.getTime() - 3600000) });
  }

  /** @private */
  function seedSetup() {
    SetupService.saveSettings({
      CREATOR_NAME: 'Alex Rivera', BRAND_NAME: 'Alex Rivera Studio', TIMEZONE: 'Etc/GMT', PRIMARY_GOAL: 'Authority',
      PRIMARY_PLATFORM: 'YouTube', WEEKLY_AVAILABLE_HOURS: 10, WORK_DAYS: 'Mon, Tue, Wed, Thu, Fri', CONTENT_PILLARS: 'Education, Story, Authority',
    });
    SetupService.completeSetup();
  }

  /** @private */
  function resetSetupValues() {
    const repo = new SettingsRepository();
    ['CREATOR_NAME', 'BRAND_NAME', 'PRIMARY_GOAL', 'SECONDARY_PLATFORMS'].forEach(function (k) { repo.setValue(k, ''); });
    repo.setValue('ONBOARDING_STATUS', 'Not started');
  }

  /** @private delete data rows from transactional sheets (keeps WORKFLOWS/CONFIG/SETUP/CHANGELOG). */
  function clearData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    DATA_SHEETS.forEach(function (name) {
      const sheet = ss.getSheetByName(name);
      if (!sheet) return;
      const last = sheet.getLastRow();
      for (let r = last; r >= 2; r--) sheet.deleteRow(r);
    });
  }

  /** @private */
  function daysFromNow(d) { return new Date(now().getTime() + d * DAY); }

  return { loadSampleWorkspace: loadSampleWorkspace, startEmptyWorkspace: startEmptyWorkspace };
})();
