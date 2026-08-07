/**
 * Menu.gs — custom menu construction.
 *
 * Milestone 1 exposes only the capabilities that exist (workbook init, workflow
 * load, tests, about). Domain actions (Setup, Ideas, Content, Calendar, AI…) are
 * added in later milestones — no dead menu items.
 *
 * @see docs/04_Master_PRD.md §9
 */
function buildMenu_() {
  const ui = SpreadsheetApp.getUi();
  // Creator-first: everyday actions up top; advanced tools in SHORT grouped submenus.
  // (Google Sheets submenus do not scroll, so no single submenu may overflow the screen.)
  ui.createMenu('CreatorOS')
    .addItem('Home', 'menuOpenHome')
    .addItem('Today', 'menuOpenToday')
    .addSeparator()
    .addItem('Add Idea', 'menuAddIdea')
    .addItem('Create Content', 'menuCreateContent')
    .addItem('Build Weekly Plan', 'menuBuildWeeklyPlan')
    .addItem('Refresh Dashboard', 'menuRefreshDashboard')
    .addItem('AI Review', 'menuAiReview')
    .addSeparator()
    .addItem('Try Sample Workspace', 'menuLoadSample')
    .addSeparator()
    .addSubMenu(ui.createMenu('Setup & Recovery')
      .addItem('Complete Setup', 'menuCompleteSetup')
      .addItem('Reopen Setup', 'menuReopenSetup')
      .addItem('Run Recovery', 'menuRunRecovery')
      .addItem('Suggest Repurposing', 'menuSuggestRepurposing')
      .addItem('Record Performance', 'menuRecordPerformance'))
    .addSubMenu(ui.createMenu('Calendar')
      .addItem('Connect Calendar', 'menuConnectCalendar')
      .addItem('Push to Calendar', 'menuPushCalendar')
      .addItem('Sync Calendar', 'menuSyncCalendar')
      .addItem('Recreate Missing Events', 'menuRecreateMissing'))
    .addSubMenu(ui.createMenu('AI')
      .addItem('Set Up Provider', 'menuAiSetup')
      .addItem('Test Connection', 'menuAiTest')
      .addItem('Weekly Plan', 'menuAiWeeklyPlan')
      .addItem('Explain Execution Score', 'menuAiExplainScore')
      .addItem('Disable AI', 'menuAiDisable'))
    .addSubMenu(ui.createMenu('Workspace')
      .addItem('Creator Mode (simple)', 'menuCreatorMode')
      .addItem('Enable Advanced Workspace', 'menuAdvancedWorkspace')
      .addItem('Start Empty Workspace', 'menuStartEmpty')
      .addItem('Initialize / Repair Workbook', 'menuInitializeWorkbook'))
    .addSubMenu(ui.createMenu('System')
      .addItem('Verify Schema', 'menuVerifySchema')
      .addItem('Run Tests', 'menuRunTests')
      .addItem('Load Default Workflows', 'menuLoadWorkflows')
      .addItem('About CreatorOS', 'menuAbout'))
    .addToUi();
}

/** Menu: open the Add Idea dialog. */
function menuAddIdea() { UiService.showAddIdea(); }
/** Menu: open the Create Content dialog. */
function menuCreateContent() { UiService.showCreateContent(); }
/** Menu: open the AI Review dialog. */
function menuAiReview() { UiService.showAiReview(); }
/** Menu: load the sample workspace, then refocus HOME. */
function menuLoadSample() {
  const r = SampleDataService.loadSampleWorkspace();
  toast_(r.message, 'CreatorOS');
  menuOpenHome();
}
/** Menu: start an empty workspace (clears sample/demo data). */
function menuStartEmpty() {
  const ui = SpreadsheetApp.getUi();
  const ok = ui.alert('Start Empty Workspace', 'This clears all ideas, content, tasks, plans, and performance data. Continue?', ui.ButtonSet.OK_CANCEL);
  if (ok !== ui.Button.OK) return;
  toast_(SampleDataService.startEmptyWorkspace().message, 'CreatorOS');
  menuOpenHome();
}
/** Menu: switch to Creator Mode (hide system sheets). */
function menuCreatorMode() { toast_(WorkspaceService.enterCreatorMode().message, 'CreatorOS'); }
/** Menu: enable Advanced Workspace (reveal system sheets). */
function menuAdvancedWorkspace() { toast_(WorkspaceService.enterAdvancedWorkspace().message, 'CreatorOS'); }

/** Menu: refresh + focus HOME. */
function menuOpenHome() {
  try { HomeService.render(); } catch (e) { /* home renders best-effort */ }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HOME);
  if (sheet) SpreadsheetApp.setActiveSheet(sheet);
}

/** Menu: (re)build the workbook and seed defaults. */
function menuInitializeWorkbook() {
  const result = initializeWorkbook();
  toast_(result.success ? 'Workbook ready.' : ('Init issue: ' + result.message), result.success ? 'CreatorOS' : 'CreatorOS — check logs');
}

/** Menu: validate + complete setup from the SETUP tab (sheet-driven, ADR-014). */
function menuCompleteSetup() {
  const result = SetupService.completeSetup();
  if (result.success) {
    toast_(result.message, 'CreatorOS');
  } else {
    SpreadsheetApp.getUi().alert('Setup incomplete', result.message + (result.errors && result.errors[0] ? '\n\n' + (result.errors[0].suggestedAction || '') : ''), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/** Menu: reopen setup for editing without touching records. */
function menuReopenSetup() {
  const result = SetupService.rerunSetup();
  toast_(result.message, 'CreatorOS');
}

/** Menu: build the weekly plan for the current week. */
function menuBuildWeeklyPlan() {
  const result = PlanningService.buildWeeklyPlan(new Date());
  toast_(result.message, 'CreatorOS');
}

/** Menu: render + focus the Today view. */
function menuOpenToday() {
  PlanningService.renderTodayView(new Date());
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.TODAY);
  if (sheet) SpreadsheetApp.setActiveSheet(sheet);
}

/** Menu: connect a Google Calendar (adds the calendar scope on authorization). */
function menuConnectCalendar() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt('Connect Calendar', 'Enter your Google Calendar ID (e.g. you@gmail.com or a shared calendar id):', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  const result = CalendarService.testConnection(resp.getResponseText().trim());
  ui.alert('CreatorOS', result.message, ui.ButtonSet.OK);
}

/** Menu: push eligible, approved-week tasks to Calendar (explicit action). */
function menuPushCalendar() {
  toast_(CalendarService.pushTasks(eligibleTaskIds_()).message, 'CreatorOS');
}

/** Menu: reconcile linked/changed tasks with Calendar (explicit action). */
function menuSyncCalendar() {
  toast_(CalendarService.syncTasks(linkedTaskIds_()).message, 'CreatorOS');
}

/** Menu: recreate events for tasks flagged Missing (explicit recovery). */
function menuRecreateMissing() {
  const missing = new TaskRepository().getAll().filter(function (t) { return t.Calendar_Sync_Status === 'Missing'; });
  let n = 0;
  missing.forEach(function (t) { if (CalendarService.recreateMissingEvent(t.Task_ID).success) n++; });
  toast_(n + ' event(s) recreated.', 'CreatorOS');
}

/** @private Open tasks with a scheduled start not already Synced. */
function eligibleTaskIds_() {
  return new TaskRepository().getAll().filter(function (t) {
    return ['Not Started', 'Ready', 'In Progress', 'Blocked'].indexOf(t.Status) !== -1 && t.Scheduled_Start && t.Calendar_Sync_Status !== 'Synced';
  }).map(function (t) { return t.Task_ID; });
}

/** @private Tasks that have a linked event or a pending change. */
function linkedTaskIds_() {
  return new TaskRepository().getAll().filter(function (t) { return t.Calendar_Event_ID || t.Calendar_Sync_Status === 'Changed'; }).map(function (t) { return t.Task_ID; });
}

/** Menu: scan for overdue work and show recovery recommendations. */
function menuRunRecovery() {
  const cases = RecoveryService.scan();
  const ui = SpreadsheetApp.getUi();
  if (!cases.length) { ui.alert('CreatorOS', 'Nothing overdue. You are on track.', ui.ButtonSet.OK); return; }
  const lines = cases.slice(0, 20).map(function (c) {
    return '• ' + c.taskName + ' (' + c.priority + ', ' + c.daysOverdue + 'd overdue) → ' + c.recommendedAction;
  }).join('\n');
  ui.alert('Recovery — ' + cases.length + ' overdue task(s)', lines + '\n\nApply an action from the recovery flow; the calendar is marked "Changed" and you run Sync Calendar to apply.', ui.ButtonSet.OK);
}

/** Menu: rule-based repurposing suggestions for a content item. */
function menuSuggestRepurposing() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt('Suggest Repurposing', 'Enter the Content ID to repurpose (e.g. CNT-000001):', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  toast_(RepurposingService.suggestRuleBased(resp.getResponseText().trim()).message, 'CreatorOS');
}

/** Menu: record a performance measurement for a published content item. */
function menuRecordPerformance() {
  const ui = SpreadsheetApp.getUi();
  const idResp = ui.prompt('Record Performance', 'Enter the published Content ID (e.g. CNT-000001):', ui.ButtonSet.OK_CANCEL);
  if (idResp.getSelectedButton() !== ui.Button.OK) return;
  const viewsResp = ui.prompt('Record Performance', 'Views (leave blank to skip):', ui.ButtonSet.OK_CANCEL);
  if (viewsResp.getSelectedButton() !== ui.Button.OK) return;
  const metrics = {};
  const v = viewsResp.getResponseText().trim();
  if (v) metrics.Views = Number(v);
  toast_(PerformanceService.recordPerformance(idResp.getResponseText().trim(), metrics).message, 'CreatorOS');
}

/** Menu: recompute + render the Dashboard. */
function menuRefreshDashboard() {
  const result = DashboardService.refresh();
  toast_(result.message, 'CreatorOS');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.DASHBOARD);
  if (sheet) SpreadsheetApp.setActiveSheet(sheet);
}

/**
 * Menu: set up the optional, customer-funded AI provider. The API key is entered in a
 * dialog and stored in User Properties — never in a cell (docs 29). Sending data to the
 * chosen provider incurs the customer's own charges.
 */
function menuAiSetup() {
  const ui = SpreadsheetApp.getUi();
  const disc = ui.alert('Enable AI (optional)',
    'CreatorOS will send selected creator data (KPIs, tasks, content) to the AI provider you choose to generate recommendations. Your API account will be charged per that provider\'s terms. CreatorOS does not store your API key centrally. Continue?',
    ui.ButtonSet.OK_CANCEL);
  if (disc !== ui.Button.OK) return;
  const p = ui.prompt('AI Provider', 'Provider (Anthropic, OpenAI, Gemini, or OpenRouter):', ui.ButtonSet.OK_CANCEL);
  if (p.getSelectedButton() !== ui.Button.OK) return;
  const k = ui.prompt('AI API Key', 'Paste your API key (stored securely, never shown in the sheet):', ui.ButtonSet.OK_CANCEL);
  if (k.getSelectedButton() !== ui.Button.OK) return;
  const m = ui.prompt('AI Model (optional)', 'Custom model id, or leave blank for the default:', ui.ButtonSet.OK_CANCEL);
  const setRes = AiService.setProvider(p.getResponseText().trim(), k.getResponseText().trim(), m.getResponseText().trim());
  if (!setRes.success) { ui.alert('CreatorOS', setRes.message, ui.ButtonSet.OK); return; }
  const test = AiService.testProvider();
  ui.alert('CreatorOS', test.message, ui.ButtonSet.OK);
}

/** Menu: test the AI connection. */
function menuAiTest() {
  const r = AiService.testProvider();
  SpreadsheetApp.getUi().alert('CreatorOS', r.message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Menu: AI weekly plan (falls back to rule-based when AI is off). */
function menuAiWeeklyPlan() {
  const r = AiService.generateWeeklyPlan();
  const summary = r.data && r.data.plan ? (r.data.plan.summary || r.data.note || '') : '';
  SpreadsheetApp.getUi().alert('Weekly Plan (' + (r.data ? r.data.source : '') + ')', (r.message + '\n\n' + summary).trim(), SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Menu: "Your Execution Score is X% — here's why." */
function menuAiExplainScore() {
  const r = AiService.analyzePerformance();
  const a = r.data && r.data.analysis ? r.data.analysis : {};
  const body = [a.headline || '', ''].concat(a.observations || []).concat(['', 'Recommendations:']).concat(a.recommendations || []).join('\n');
  SpreadsheetApp.getUi().alert('Execution Score — why', body, SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Menu: disable AI (core features continue rule-based). */
function menuAiDisable() {
  toast_(AiService.disableAi().message, 'CreatorOS');
}

/** Menu: load the default workflow library. */
function menuLoadWorkflows() {
  const result = WorkflowSeed.load(false);
  toast_(result.message, 'CreatorOS');
}

/** Menu: verify schema and report. */
function menuVerifySchema() {
  const res = WorkbookService.verify();
  if (res.valid) {
    SpreadsheetApp.getUi().alert('Schema OK', 'All 16 sheets, headers, named ranges and schema version are valid.', SpreadsheetApp.getUi().ButtonSet.OK);
  } else {
    const lines = res.issues.map(function (i) { return '• ' + (i.sheet ? i.sheet + ': ' : '') + i.code + ' — ' + i.detail; }).join('\n');
    SpreadsheetApp.getUi().alert('Schema issues', lines, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/** Menu: run the test suite and show a summary. */
function menuRunTests() {
  const summary = TestRunner.runAll();
  SpreadsheetApp.getUi().alert('CreatorOS Tests', summary.text, SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Menu: about dialog. */
function menuAbout() {
  SpreadsheetApp.getUi().alert(
    'CreatorOS ' + VERSION.PRODUCT,
    'Plan. Execute. Publish. Grow.\n\nSchema version: ' + VERSION.SCHEMA + '\nMilestone 1 — workbook, IDs, repositories, workflows.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/** @private */
function toast_(message, title) {
  try { SpreadsheetApp.getActiveSpreadsheet().toast(message, title || 'CreatorOS', 6); } catch (e) { /* headless */ }
}
