/**
 * SchemaTests.gs — workbook structural tests (docs 21 §3).
 * Requires the workbook to have been initialized (CreatorOS ▸ Initialize / Repair).
 * @returns {Array<{name:string, fn:Function}>}
 */
function SchemaTests_() {
  return [
    {
      name: 'SCH-001 all 16 sheets exist',
      fn: function (t) {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        SHEET_ORDER.forEach(function (name) {
          t.truthy(ss.getSheetByName(name), 'sheet missing: ' + name);
        });
        t.equal(SHEET_ORDER.length, 17, 'expected 17 tabs (16 + RECOVERY_LOG)');
      },
    },
    {
      name: 'SCH-002 verify() reports valid',
      fn: function (t) {
        const res = WorkbookService.verify();
        t.truthy(res.valid, 'verify issues: ' + JSON.stringify(res.issues));
      },
    },
    {
      name: 'SCH-003 headers match schema, no duplicates',
      fn: function (t) {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        Object.keys(SCHEMA).forEach(function (name) {
          const headers = SCHEMA[name].headers || [];
          if (!headers.length) return;
          const sheet = ss.getSheetByName(name);
          const row = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
          const seen = {};
          headers.forEach(function (h, i) {
            t.equal(row[i], h, name + ' col ' + (i + 1));
            t.truthy(!seen[h], 'duplicate header ' + h + ' in ' + name);
            seen[h] = true;
          });
        });
      },
    },
    {
      name: 'SCH-004 CONFIG named ranges resolve',
      fn: function (t) {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const named = {};
        ss.getNamedRanges().forEach(function (nr) { named[nr.getName()] = true; });
        CONFIG_DEFAULTS.forEach(function (c) {
          if (c.namedRange) t.truthy(named[c.namedRange], 'named range missing: ' + c.namedRange);
        });
      },
    },
    {
      name: 'SCH-005 schema version marker set',
      fn: function (t) {
        t.equal(ConfigService.getSchemaVersion(), VERSION.SCHEMA, 'schema version marker');
      },
    },
    {
      name: 'SCH-006 protections exist on system sheets',
      fn: function (t) {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        [SHEETS.CONFIG, SHEETS.SYSTEM_LOG, SHEETS.AI_LOG, SHEETS.CHANGELOG].forEach(function (name) {
          const sheet = ss.getSheetByName(name);
          const prot = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
          t.truthy(prot.length > 0, 'no sheet protection on ' + name);
        });
      },
    },
    {
      name: 'SCH-007 default workflows loaded (8 workflows)',
      fn: function (t) {
        const repo = new WorkflowRepository();
        t.equal(repo.listWorkflowIds().length, 8, 'expected 8 workflows');
      },
    },
    {
      name: 'SCH-008 every sheet has visibility metadata; creator sheets tagged creator (D4-5)',
      fn: function (t) {
        SHEET_ORDER.forEach(function (name) {
          const v = SCHEMA[name].visibility;
          t.truthy(v === 'creator' || v === 'system', name + ' missing visibility');
        });
        CREATOR_SHEETS.forEach(function (name) { t.equal(SCHEMA[name].visibility, 'creator', name + ' should be creator'); });
        t.equal(SCHEMA[SHEETS.RECOVERY_LOG].visibility, 'system', 'RECOVERY_LOG should be system');
        t.equal(SCHEMA[SHEETS.SETUP].visibility, 'system', 'SETUP should be system');
      },
    },
  ];
}
