/**
 * Main.gs — lifecycle entry points.
 *
 * `onOpen` builds the menu and performs a light first-run check. Heavy work
 * (building sheets) is never done silently on open without the schema being
 * absent — we avoid surprising writes and never create triggers without consent
 * (docs 22 §2).
 *
 * @see docs/22_Installation_Upgrade_Release.md
 */

/**
 * Simple trigger: runs on spreadsheet open.
 * @param {GoogleAppsScript.Events.SheetsOnOpen} e
 */
function onOpen(e) {
  buildMenu_();
  try {
    // First-run: if the core sheets are absent, offer nothing destructive — just a hint.
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName(SHEETS.CONFIG) || ConfigService.getSchemaVersion() == null) {
      toast_('Run CreatorOS ▸ Initialize / Repair Workbook to set up.', 'Welcome to CreatorOS');
    }
  } catch (err) {
    console.error('onOpen check failed: ' + (err && err.message));
  }
}

/**
 * Build/repair the workbook, seed workflows, align ID counters, set version markers.
 * Safe to run repeatedly (idempotent, data-preserving).
 * @returns {Object} ServiceResult
 */
function initializeWorkbook() {
  const lock = LockService.getScriptLock();
  const gotLock = lock.tryLock(20000);
  try {
    const build = WorkbookService.build();
    WorkflowSeed.load(false);
    alignIdCounters_();
    const verify = WorkbookService.verify();
    if (!verify.valid) {
      LoggerService.warn('Main', 'Post-init verification found issues', { detail: verify.issues });
      return fail('WORKBOOK_VERIFY_FAILED', 'Workbook built but verification found ' + verify.issues.length + ' issue(s).', { issues: verify.issues });
    }
    return ok('WORKBOOK_READY', 'CreatorOS workbook initialized.', { createdSheets: build.data.createdSheets });
  } catch (err) {
    LoggerService.critical('Main', err, { fn: 'initializeWorkbook' });
    return failFromError(err);
  } finally {
    if (gotLock) lock.releaseLock();
  }
}

/**
 * Ensure each ID counter is at least the highest suffix already present in its
 * table, so seeded/imported rows never collide with freshly minted IDs (FR-002).
 * @private
 */
function alignIdCounters_() {
  const pairs = [
    [new IdeaRepository(), ID_PREFIX.IDEA],
    [new ContentRepository(), ID_PREFIX.CONTENT],
    [new TaskRepository(), ID_PREFIX.TASK],
    [new WorkflowRepository(), ID_PREFIX.WORKFLOW_STEP],
    [new PerformanceRepository(), ID_PREFIX.PERFORMANCE],
    [new RepurposingRepository(), ID_PREFIX.REPURPOSE],
    [new WeeklyPlanRepository(), ID_PREFIX.WEEK],
  ];
  pairs.forEach(function (p) {
    try { IdService.ensureAtLeast(p[1], p[0].maxIdSuffix()); } catch (e) { /* sheet may be absent mid-build */ }
  });
}
