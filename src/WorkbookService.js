/**
 * WorkbookService.gs — builds and verifies the CreatorOS workbook.
 *
 * Creates every tab from SCHEMA with headers, data validations, protected ranges,
 * named ranges, header formatting and frozen rows. Fully idempotent: re-running
 * never deletes user data (FR-001, NFR-008) — sheets/headers are created only when
 * missing, and seed data is written only when a table is empty.
 *
 * Protection uses warning-only guards so a copied workbook can never lock its owner
 * out while still flagging accidental edits to IDs, formulas, logs and config
 * (docs 16 §13; see ASSUMPTIONS E1).
 *
 * @see docs/16_Workbook_Schema.md
 * @see docs/22_Installation_Upgrade_Release.md §2
 */
const WorkbookService = (function () {

  const MODULE = 'WorkbookService';
  const MAX_VALIDATION_ROWS = 2000;

  /** @private */
  function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

  /**
   * Build (or repair) the entire workbook. Idempotent.
   * @returns {Object} ServiceResult
   */
  function build() {
    const spreadsheet = ss();
    const created = [];
    SHEET_ORDER.forEach(function (name, index) {
      const schema = SCHEMA[name];
      let sheet = spreadsheet.getSheetByName(name);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(name, index);
        created.push(name);
      }
      spreadsheet.setActiveSheet(sheet);
      spreadsheet.moveActiveSheet(index + 1);
      if (schema.headers && schema.headers.length) ensureHeaders(sheet, schema);
      applyFrozenRows(sheet, schema);
      applyValidations(sheet, schema);
      applyProtection(sheet, schema);
    });

    seedConfig();
    seedNamedRanges();
    seedSetup();
    seedChangelog();
    buildHomePanel();

    ConfigService.setVersionMarkers();
    LoggerService.info(MODULE, 'Workbook build complete', { detail: { created: created } });
    return ok('WORKBOOK_BUILT', 'Workbook is ready.', { createdSheets: created });
  }

  /** @private Write header row if absent or different, without touching data rows. */
  function ensureHeaders(sheet, schema) {
    const headers = schema.headers;
    const width = headers.length;
    const current = sheet.getRange(1, 1, 1, Math.max(width, sheet.getLastColumn() || width)).getValues()[0];
    let matches = true;
    for (let c = 0; c < width; c++) {
      if (current[c] !== headers[c]) { matches = false; break; }
    }
    if (!matches) {
      sheet.getRange(1, 1, 1, width).setValues([headers]);
    }
    // Header styling.
    const headerRange = sheet.getRange(1, 1, 1, width);
    headerRange.setBackground(COLORS.HEADER_BG).setFontColor(COLORS.HEADER_FG).setFontWeight('bold');
    // Tint formula columns so they read as calculated (docs 25 §2).
    const formulaCols = schema.formulaColumns || {};
    headers.forEach(function (h, i) {
      if (formulaCols[h]) sheet.getRange(2, i + 1, MAX_VALIDATION_ROWS, 1).setBackground(COLORS.FORMULA_BG);
    });
  }

  /** @private */
  function applyFrozenRows(sheet, schema) {
    const rows = schema.frozenRows || 0;
    if (sheet.getFrozenRows() !== rows) sheet.setFrozenRows(rows);
  }

  /** @private Apply data validations declared in SCHEMA to each column. */
  function applyValidations(sheet, schema) {
    const validations = schema.validations;
    if (!validations) return;
    const headers = schema.headers;
    Object.keys(validations).forEach(function (field) {
      const colIndex = headers.indexOf(field);
      if (colIndex === -1) return;
      const rule = buildRule(validations[field]);
      if (!rule) return;
      sheet.getRange(2, colIndex + 1, MAX_VALIDATION_ROWS, 1).setDataValidation(rule);
    });
  }

  /** @private Translate a SCHEMA validation spec into a Sheets DataValidation rule. */
  function buildRule(spec) {
    const b = SpreadsheetApp.newDataValidation().setAllowInvalid(true); // soft guard; hard checks at write time
    switch (spec.type) {
      case 'enum': return b.requireValueInList(spec.values, true).build();
      case 'number':
        if (spec.min != null && spec.max != null) return b.requireNumberBetween(spec.min, spec.max).build();
        if (spec.min != null) return b.requireNumberGreaterThanOrEqualTo(spec.min).build();
        if (spec.max != null) return b.requireNumberLessThanOrEqualTo(spec.max).build();
        return null;
      case 'boolean': return b.requireCheckbox().build();
      case 'date':
      case 'datetime': return b.requireDate().build();
      case 'url': return b.requireTextIsUrl().build();
      default: return null;
    }
  }

  /** @private Guard IDs/formulas (tables) or the whole sheet (logs/config/views). */
  function applyProtection(sheet, schema) {
    // Clear our previously-created protections to stay idempotent.
    sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) {
      if (p.getDescription() && p.getDescription().indexOf('CreatorOS') === 0) p.remove();
    });
    sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) {
      if (p.getDescription() && p.getDescription().indexOf('CreatorOS') === 0) p.remove();
    });

    if (schema.protect === 'all') {
      const p = sheet.protect().setDescription('CreatorOS: system sheet').setWarningOnly(true);
      return;
    }
    if (schema.protect === 'headers') {
      const headers = schema.headers || [];
      const width = headers.length;
      if (width) {
        sheet.getRange(1, 1, 1, width).protect().setDescription('CreatorOS: header row').setWarningOnly(true);
      }
      // Protect ID column + formula columns down the sheet.
      const guarded = [];
      if (schema.idColumn) guarded.push(schema.idColumn);
      Object.keys(schema.formulaColumns || {}).forEach(function (h) { guarded.push(h); });
      (schema.timestamps ? [schema.timestamps.created, schema.timestamps.updated] : []).forEach(function (h) { guarded.push(h); });
      guarded.forEach(function (h) {
        const idx = headers.indexOf(h);
        if (idx === -1) return;
        sheet.getRange(2, idx + 1, MAX_VALIDATION_ROWS, 1).protect()
          .setDescription('CreatorOS: computed/immutable column ' + h).setWarningOnly(true);
      });
    }
  }

  /** @private Seed CONFIG defaults only when the sheet has no data rows. */
  function seedConfig() {
    const sheet = ss().getSheetByName(SHEETS.CONFIG);
    if (sheet.getLastRow() > 1) return;
    const rows = CONFIG_DEFAULTS.map(function (c) {
      return [c.key, c.label, c.value, c.type, c.namedRange || '', ''];
    });
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    ConfigService.clearCache();
  }

  /** @private Create/repair named ranges pointing at each CONFIG value cell (docs 26 §13). */
  function seedNamedRanges() {
    const spreadsheet = ss();
    const sheet = spreadsheet.getSheetByName(SHEETS.CONFIG);
    const keys = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
    const byName = {};
    spreadsheet.getNamedRanges().forEach(function (nr) { byName[nr.getName()] = nr; });
    CONFIG_DEFAULTS.forEach(function (c) {
      if (!c.namedRange) return;
      // find row of this key
      let rowIndex = -1;
      for (let r = 0; r < keys.length; r++) { if (keys[r][0] === c.key) { rowIndex = r + 2; break; } }
      if (rowIndex === -1) return;
      const valueCell = sheet.getRange(rowIndex, 3); // Config_Value
      if (byName[c.namedRange]) {
        byName[c.namedRange].setRange(valueCell);
      } else {
        spreadsheet.setNamedRange(c.namedRange, valueCell);
      }
    });
  }

  /** @private Seed the SETUP setting rows only when empty. */
  function seedSetup() {
    const sheet = ss().getSheetByName(SHEETS.SETUP);
    if (sheet.getLastRow() > 1) return;
    // [Setting_Key, Setting_Label, Setting_Value, Setting_Type, Required, Validation_Rule, Setup_Section, Last_Updated]
    const S = ENUMS.SETUP_SECTION;
    const rows = [
      ['CREATOR_NAME', 'Creator name', '', 'text', true, '', 'Profile', ''],
      ['BRAND_NAME', 'Brand name', '', 'text', true, '', 'Profile', ''],
      ['TIMEZONE', 'Timezone', 'Etc/GMT', 'text', true, 'timezone', 'Profile', ''],
      ['PRIMARY_GOAL', 'Primary goal', '', 'list', true, 'strategic_goal', 'Profile', ''],
      ['PRIMARY_PLATFORM', 'Primary platform', 'YouTube', 'list', true, 'platform', 'Platforms', ''],
      ['SECONDARY_PLATFORMS', 'Secondary platforms', '', 'text', false, '', 'Platforms', ''],
      ['WEEKLY_AVAILABLE_HOURS', 'Weekly available hours', '10', 'number', true, 'hours', 'Capacity', ''],
      ['WORK_DAYS', 'Work days', 'Mon, Tue, Wed, Thu, Fri', 'text', true, '', 'Capacity', ''],
      ['PREFERRED_WORK_BLOCKS', 'Preferred work blocks', '', 'text', false, '', 'Capacity', ''],
      ['PUBLISHING_FREQUENCY', 'Publishing frequency by platform', '', 'text', false, '', 'Platforms', ''],
      ['NEWSLETTER_FREQUENCY', 'Newsletter frequency', '', 'text', false, '', 'Platforms', ''],
      ['CONTENT_PILLARS', 'Content pillars', 'Education, Story, Authority', 'text', true, '', 'Profile', ''],
      ['DEFAULT_REMINDER_TIME', 'Default reminder time', '', 'text', false, '', 'Calendar', ''],
      ['CALENDAR_ID_STATUS', 'Calendar connection', 'Not configured', 'text', false, '', 'Calendar', ''],
      ['AI_ENABLED', 'AI enabled', 'FALSE', 'boolean', false, '', 'AI', ''],
      ['AI_PROVIDER', 'AI provider', '', 'list', false, 'ai_provider', 'AI', ''],
      ['AI_MODEL', 'AI model', '', 'text', false, '', 'AI', ''],
      ['AI_KEY_STATUS', 'AI key status', 'Not configured', 'text', false, '', 'AI', ''],
      ['ONBOARDING_STATUS', 'Onboarding status', 'Not started', 'text', true, '', 'Profile', ''],
    ];
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  /** @private Seed the in-workbook CHANGELOG with the current version once. */
  function seedChangelog() {
    const sheet = ss().getSheetByName(SHEETS.CHANGELOG);
    if (sheet.getLastRow() > 1) return;
    sheet.getRange(2, 1, 1, 5).setValues([[
      VERSION.PRODUCT,
      Utilities.formatDate(now(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      'Milestone 1 — workbook schema, IDs, repositories, workflow library.',
      'Initial schema (SCHEMA_VERSION ' + VERSION.SCHEMA + ').',
      'None — first install.',
    ]]);
  }

  /** @private Minimal HOME panel (full console is Milestone 2). */
  function buildHomePanel() {
    const sheet = ss().getSheetByName(SHEETS.HOME);
    sheet.getRange('A1').setValue('CreatorOS').setFontSize(28).setFontWeight('bold').setFontColor(COLORS.BRAND);
    sheet.getRange('A2').setValue('Plan. Execute. Publish. Grow.').setFontSize(12).setFontColor(COLORS.MUTED);
    sheet.getRange('A4').setValue('Version ' + VERSION.PRODUCT + '  ·  Schema ' + VERSION.SCHEMA);
    sheet.getRange('A6').setValue('Use the CreatorOS menu to run Setup, add ideas, and build your first plan.');
    sheet.setColumnWidth(1, 620);
  }

  /**
   * Verify the workbook against SCHEMA. Read-only.
   * @returns {{valid: boolean, issues: Array<{code: string, sheet?: string, detail: string}>}}
   */
  function verify() {
    const spreadsheet = ss();
    const issues = [];
    SHEET_ORDER.forEach(function (name) {
      const schema = SCHEMA[name];
      const sheet = spreadsheet.getSheetByName(name);
      if (!sheet) { issues.push({ code: ERR.SHEET_MISSING, sheet: name, detail: 'sheet missing' }); return; }
      const headers = schema.headers || [];
      if (!headers.length) return;
      const row = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      const seen = {};
      headers.forEach(function (h, i) {
        if (row[i] !== h) issues.push({ code: ERR.HEADER_MISSING, sheet: name, detail: 'expected "' + h + '" at col ' + (i + 1) + ', found "' + row[i] + '"' });
        if (seen[row[i]]) issues.push({ code: ERR.HEADER_DUPLICATE, sheet: name, detail: 'duplicate header "' + row[i] + '"' });
        seen[row[i]] = true;
      });
    });
    // Named ranges resolve.
    const named = {};
    spreadsheet.getNamedRanges().forEach(function (nr) { named[nr.getName()] = true; });
    CONFIG_DEFAULTS.forEach(function (c) {
      if (c.namedRange && !named[c.namedRange]) issues.push({ code: ERR.CONFIG_INVALID, detail: 'named range missing: ' + c.namedRange });
    });
    // Schema version.
    if (ConfigService.getSchemaVersion() !== VERSION.SCHEMA) {
      issues.push({ code: ERR.SCHEMA_VERSION_MISMATCH, detail: 'workbook schema ' + ConfigService.getSchemaVersion() + ' != code ' + VERSION.SCHEMA });
    }
    return { valid: issues.length === 0, issues: issues };
  }

  return { build: build, verify: verify };
})();
