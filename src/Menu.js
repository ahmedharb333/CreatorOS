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
