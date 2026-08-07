/**
 * WorkspaceService.gs — Creator Mode vs Advanced Workspace (ADR-019, CX-3).
 *
 * Hides/shows sheets by their `visibility` metadata — never by hardcoded names.
 * New installs default to Creator Mode: only HOME, TODAY, IDEAS, CONTENT, DASHBOARD
 * are visible; everything else is system infrastructure, hidden. "Enable Advanced
 * Workspace" reveals system sheets for power users. This is the only new backend piece,
 * and it exists purely to support the UX.
 */
const WorkspaceService = (function () {

  const MODULE = 'WorkspaceService';

  /** @returns {boolean} */
  function isAdvanced() { return ConfigService.getUserProp(USER_PROP.ADVANCED_WORKSPACE) === 'true'; }

  /** @private apply the current mode's visibility to every sheet (metadata-driven). */
  function applyVisibility(advanced) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    SHEET_ORDER.forEach(function (name) {
      const sheet = ss.getSheetByName(name);
      if (!sheet) return;
      const isSystem = (SCHEMA[name] && SCHEMA[name].visibility) === 'system';
      try {
        if (isSystem && !advanced) sheet.hideSheet();
        else sheet.showSheet();
      } catch (e) { /* can't hide the last visible/active sheet — creator sheets stay visible */ }
    });
  }

  /** Switch to Creator Mode (system sheets hidden). @returns {Object} ServiceResult */
  function enterCreatorMode() {
    ConfigService.setUserProp(USER_PROP.ADVANCED_WORKSPACE, 'false');
    applyVisibility(false);
    LoggerService.info(MODULE, 'Entered Creator Mode');
    return ok('CREATOR_MODE', 'Creator Mode — showing only what helps you publish.', { advanced: false });
  }

  /** Reveal system sheets for power users. @returns {Object} ServiceResult */
  function enterAdvancedWorkspace() {
    ConfigService.setUserProp(USER_PROP.ADVANCED_WORKSPACE, 'true');
    applyVisibility(true);
    LoggerService.info(MODULE, 'Entered Advanced Workspace');
    return ok('ADVANCED_WORKSPACE', 'Advanced Workspace — all system sheets are visible.', { advanced: true });
  }

  /** Re-apply the stored mode (used on open). */
  function applyCurrent() { applyVisibility(isAdvanced()); }

  /** @returns {{creatorSheets:string[], systemSheets:string[]}} for diagnostics/tests. */
  function classify() {
    const creator = [], system = [];
    SHEET_ORDER.forEach(function (name) {
      if ((SCHEMA[name] && SCHEMA[name].visibility) === 'creator') creator.push(name); else system.push(name);
    });
    return { creatorSheets: creator, systemSheets: system };
  }

  return {
    isAdvanced: isAdvanced,
    enterCreatorMode: enterCreatorMode,
    enterAdvancedWorkspace: enterAdvancedWorkspace,
    applyCurrent: applyCurrent,
    classify: classify,
  };
})();
