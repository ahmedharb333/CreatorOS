/**
 * CreatorExperienceTests.gs — Creator Experience milestone.
 * Covers Workspace (Creator Mode / visibility), Onboarding, HOME model, UI dialog server
 * functions, Empty State Library, and the flagship Sample Workspace.
 *
 * SAFETY: the sample-workspace test is DESTRUCTIVE (it clears the workspace). It only runs
 * when the workbook has no user data, so running Run Tests on a real workbook never wipes it.
 */
function CreatorExperienceTests_() {
  return [
    {
      name: 'CX-WS-001 classify: exactly the 5 creator sheets are creator-visible',
      fn: function (t) {
        const c = WorkspaceService.classify();
        t.equal(c.creatorSheets.length, 5, 'expected 5 creator sheets');
        ['HOME', 'TODAY', 'IDEAS', 'CONTENT', 'DASHBOARD'].forEach(function (n) {
          t.truthy(c.creatorSheets.indexOf(n) !== -1, n + ' should be creator');
        });
        t.truthy(c.systemSheets.indexOf('SETUP') !== -1 && c.systemSheets.indexOf('RECOVERY_LOG') !== -1, 'system sheets misclassified');
      },
    },
    {
      name: 'CX-WS-002 Creator Mode hides system sheets; Advanced reveals them',
      fn: function (t) {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        try {
          WorkspaceService.enterCreatorMode();
          t.truthy(ss.getSheetByName(SHEETS.SETUP).isSheetHidden(), 'SETUP should be hidden in Creator Mode');
          t.truthy(!ss.getSheetByName(SHEETS.HOME).isSheetHidden(), 'HOME must stay visible');
          WorkspaceService.enterAdvancedWorkspace();
          t.truthy(!ss.getSheetByName(SHEETS.SETUP).isSheetHidden(), 'SETUP should be visible in Advanced');
        } finally { WorkspaceService.enterCreatorMode(); }
      },
    },
    {
      name: 'CX-ONB-001 onboarding state has steps + progress',
      fn: function (t) {
        const s = OnboardingService.getState();
        t.truthy(Array.isArray(s.steps) && s.steps.length >= 4, 'steps missing');
        t.truthy(typeof s.progressPercent === 'number', 'progressPercent missing');
        t.truthy('complete' in s, 'complete flag missing');
      },
    },
    {
      name: 'CX-HOME-001 HOME model leads with Execution Score + supporting KPIs',
      fn: function (t) {
        const m = HomeService.getModel();
        t.equal(m.hero.metric, 'Execution Score', 'hero must be Execution Score');
        t.truthy(/%$/.test(m.hero.value), 'hero value should be a percentage');
        t.equal(m.supporting.length, 4, 'expected 4 supporting KPIs');
      },
    },
    {
      name: 'CX-EMPTY-001 Empty State Library + success moments are complete',
      fn: function (t) {
        ['HOME', 'IDEAS', 'CONTENT', 'TODAY', 'DASHBOARD'].forEach(function (k) {
          t.truthy(EMPTY_STATES[k] && EMPTY_STATES[k].title && EMPTY_STATES[k].action, k + ' empty state incomplete');
        });
        ['WEEKLY_PLAN', 'CALENDAR_SYNCED', 'EXECUTION_SCORE_UP', 'FIRST_CONTENT'].forEach(function (k) {
          t.truthy(SUCCESS_MOMENTS[k], k + ' success moment missing');
        });
      },
    },
    {
      name: 'CX-UI-001 Add Idea dialog context + submit create an idea',
      fn: function (t) {
        const ctx = UiService.getIdeaFormContext();
        t.truthy(ctx.platforms.length && ctx.goals.length === 7, 'context dropdowns wrong');
        const res = UiService.submitIdea({ title: 'Dialog Idea', pillar: 'Education', platform: 'YouTube', format: 'YouTube Long-Form', goal: 'Authority', effort: 2, impact: 4, confidence: 3 });
        t.truthy(res.success, 'submit failed: ' + res.message);
        new IdeaRepository().deleteById(res.data.idea.Idea_ID);
      },
    },
    {
      name: 'CX-UI-002 Create Content dialog submit creates content',
      fn: function (t) {
        const res = UiService.submitContent({ title: 'Dialog Content', pillar: 'Education', platform: 'YouTube', format: 'YouTube Long-Form', objective: 'Reach', priority: 'High' });
        t.truthy(res.success, 'submit failed: ' + res.message);
        new ContentRepository().deleteById(res.data.content.Content_ID);
      },
    },
    {
      name: 'CX-UI-003 AI Review accept creates ideas via IdeaService (approval)',
      fn: function (t) {
        const res = UiService.acceptAiIdeas([{ title: 'AI Idea A', platform: 'YouTube', format: 'YouTube Short' }, { title: 'AI Idea B' }]);
        t.truthy(res.success && res.data.ideaIds.length === 2, 'should create 2 ideas');
        res.data.ideaIds.forEach(function (id) { new IdeaRepository().deleteById(id); });
      },
    },
    {
      name: 'CX-SAMPLE-001 (guarded) sample workspace populates, then starts empty',
      fn: function (t) {
        if (hasUserData_()) { t.truthy(true, 'skipped to protect existing workbook data'); return; }
        const res = SampleDataService.loadSampleWorkspace();
        t.truthy(res.success, 'load failed: ' + res.message);
        const k = AnalyticsService.getKpis();
        t.truthy(k.executionScore > 0, 'Execution Score should be > 0');
        t.truthy(k.overdueCount >= 1, 'should have a recovery example (overdue task)');
        t.truthy(k.contentPublished >= 1, 'should have published content');
        t.truthy(new ContentRepository().getAll().length >= 3, 'expected several content items');
        t.truthy(new WeeklyPlanRepository().getAll().some(function (w) { return w.Status === 'Approved'; }), 'approved week expected');
        t.truthy(new RepurposingRepository().getAll().length >= 1, 'repurposing suggestion expected');
        const dash = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.DASHBOARD);
        t.truthy(dash.getLastRow() > 1, 'dashboard should be populated');
        // Now clear.
        SampleDataService.startEmptyWorkspace();
        t.equal(new ContentRepository().getAll().length, 0, 'startEmpty should clear content');
        t.equal(new TaskRepository().getAll().length, 0, 'startEmpty should clear tasks');
      },
    },
  ];
}

/** @private true if the workbook already holds creator data (protects real workbooks). */
function hasUserData_() {
  return new IdeaRepository().getAll().length > 0 || new ContentRepository().getAll().length > 0 || new TaskRepository().getAll().length > 0;
}
