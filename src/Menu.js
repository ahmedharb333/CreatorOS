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
  ui.createMenu('CreatorOS')
    .addItem('Open Home', 'menuOpenHome')
    .addSeparator()
    .addItem('Initialize / Repair Workbook', 'menuInitializeWorkbook')
    .addItem('Load Default Workflows', 'menuLoadWorkflows')
    .addItem('Verify Schema', 'menuVerifySchema')
    .addSeparator()
    .addItem('Complete Setup', 'menuCompleteSetup')
    .addItem('Reopen Setup', 'menuReopenSetup')
    .addSeparator()
    .addItem('Build Weekly Plan', 'menuBuildWeeklyPlan')
    .addItem('Open Today', 'menuOpenToday')
    .addSeparator()
    .addItem('Connect Calendar', 'menuConnectCalendar')
    .addItem('Push to Calendar', 'menuPushCalendar')
    .addItem('Sync Calendar', 'menuSyncCalendar')
    .addItem('Recreate Missing Events', 'menuRecreateMissing')
    .addSeparator()
    .addItem('Run Tests', 'menuRunTests')
    .addSeparator()
    .addItem('About CreatorOS', 'menuAbout')
    .addToUi();
}

/** Menu: focus HOME. */
function menuOpenHome() {
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
