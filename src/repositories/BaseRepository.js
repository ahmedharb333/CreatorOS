/**
 * BaseRepository.gs — header-mapped data access for one sheet.
 *
 * Repositories are the ONLY layer that touches sheet cells (docs 09, 15 §4).
 * They map columns by header name (never fixed indexes, NFR-005), assign
 * immutable IDs, stamp timestamps, honour formula-owned columns, and batch reads
 * and writes. They apply structural validation but no domain decisions (docs 17 §1).
 *
 * @see docs/17_Service_Contracts.md §1
 */
class BaseRepository {
  /**
   * @param {string} sheetName A SHEETS.* value with a SCHEMA entry of kind 'table'.
   */
  constructor(sheetName) {
    this.sheetName = sheetName;
    this.schema = SCHEMA[sheetName];
    if (!this.schema) throw appError(ERR.CONFIG_INVALID, { technicalMessage: 'No schema for ' + sheetName });
    this._headerMap = null;
  }

  /** @protected @returns {GoogleAppsScript.Spreadsheet.Sheet} */
  _sheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName);
    if (!sheet) throw appError(ERR.SHEET_MISSING, { technicalMessage: this.sheetName + ' sheet missing', recordId: this.sheetName });
    return sheet;
  }

  /** @protected Build/return header→0-based-index map, validating against SCHEMA. */
  _headers() {
    if (this._headerMap) return this._headerMap;
    const sheet = this._sheet();
    const width = this.schema.headers.length;
    const row = sheet.getRange(1, 1, 1, width).getValues()[0];
    const map = {};
    row.forEach(function (h, i) { map[h] = i; });
    this.schema.headers.forEach(function (h) {
      if (map[h] == null) throw appError(ERR.HEADER_MISSING, { technicalMessage: 'Header "' + h + '" missing in ' + sheet.getName() });
    });
    this._headerMap = map;
    return map;
  }

  /** @protected @returns {number} column count */
  _width() { return this.schema.headers.length; }

  /** @protected Convert a sheet row array into a record object (+ hidden _row). */
  _rowToRecord(rowValues, rowNumber) {
    const rec = {};
    this.schema.headers.forEach(function (h, i) { rec[h] = rowValues[i]; });
    Object.defineProperty(rec, '_row', { value: rowNumber, enumerable: false });
    return rec;
  }

  /** @returns {Object[]} all records (excludes blank trailing rows). */
  getAll() {
    const sheet = this._sheet();
    const last = sheet.getLastRow();
    if (last < 2) return [];
    const values = sheet.getRange(2, 1, last - 1, this._width()).getValues();
    const idCol = this.schema.idColumn ? this._headers()[this.schema.idColumn] : 0;
    const out = [];
    for (let r = 0; r < values.length; r++) {
      // Skip fully-blank rows (id empty).
      if (this.schema.idColumn && (values[r][idCol] === '' || values[r][idCol] == null)) continue;
      out.push(this._rowToRecord(values[r], r + 2));
    }
    return out;
  }

  /**
   * @param {string} id
   * @returns {Object|null}
   */
  getById(id) {
    if (!id) return null;
    const idHeader = this.schema.idColumn;
    if (!idHeader) return null;
    const sheet = this._sheet();
    const last = sheet.getLastRow();
    if (last < 2) return null;
    const idColIndex = this._headers()[idHeader];
    const ids = sheet.getRange(2, idColIndex + 1, last - 1, 1).getValues();
    for (let r = 0; r < ids.length; r++) {
      if (ids[r][0] === id) {
        const rowValues = sheet.getRange(r + 2, 1, 1, this._width()).getValues()[0];
        return this._rowToRecord(rowValues, r + 2);
      }
    }
    return null;
  }

  /**
   * @param {Object} criteria header→exact-value predicates (AND).
   * @returns {Object[]}
   */
  find(criteria) {
    const keys = Object.keys(criteria || {});
    return this.getAll().filter(function (rec) {
      return keys.every(function (k) { return rec[k] === criteria[k]; });
    });
  }

  /**
   * Create one record.
   * @param {Object} record
   * @returns {Object} the stored record (with assigned id/timestamps)
   */
  create(record) { return this.createMany([record])[0]; }

  /**
   * Create many records in a single batched write.
   * @param {Object[]} records
   * @returns {Object[]} stored records
   */
  createMany(records) {
    if (!records || !records.length) return [];
    const sheet = this._sheet();
    const headers = this.schema.headers;
    const width = this._width();
    const idHeader = this.schema.idColumn;
    const ids = idHeader ? IdService.reserve(this.schema.idPrefix, records.length) : [];
    const ts = now();
    const formulaCols = this.schema.formulaColumns || {};
    const startRow = sheet.getLastRow() + 1 < 2 ? 2 : sheet.getLastRow() + 1;

    const rowArrays = [];
    const stored = [];
    const self = this;
    records.forEach(function (input, i) {
      const rec = Object.assign({}, input);
      if (idHeader) rec[idHeader] = ids[i];
      if (self.schema.timestamps) {
        rec[self.schema.timestamps.created] = ts;
        rec[self.schema.timestamps.updated] = ts;
      }
      const check = ValidationService.validateRecord(self.sheetName, rec);
      if (!check.valid) {
        throw appError(ERR.RECORD_VALIDATION_FAILED, {
          severity: SEVERITY.ERROR,
          userMessage: 'This record could not be saved because some fields are invalid.',
          technicalMessage: self.sheetName + ' validation: ' + JSON.stringify(check.errors),
          recordId: rec[idHeader] || '',
          recoverable: true,
          suggestedAction: check.errors.map(function (e) { return e.field + ' ' + e.reason; }).join('; '),
        });
      }
      const arr = headers.map(function (h) {
        if (formulaCols[h]) return ''; // formula set after write
        return rec[h] == null ? '' : rec[h];
      });
      rowArrays.push(arr);
      stored.push(rec);
    });

    sheet.getRange(startRow, 1, rowArrays.length, width).setValues(rowArrays);

    // Apply formula-owned columns per row (D1).
    Object.keys(formulaCols).forEach(function (h) {
      const colIndex = headers.indexOf(h);
      for (let i = 0; i < stored.length; i++) {
        const rowNumber = startRow + i;
        const formula = self.formulaFor(h, rowNumber, stored[i]);
        if (formula) sheet.getRange(rowNumber, colIndex + 1).setFormula(formula);
      }
    });

    this._headerMap = null;
    return stored;
  }

  /**
   * Patch a record by id. Skips id, created-timestamp and formula columns.
   * @param {string} id
   * @param {Object} patch
   * @returns {Object} updated record
   */
  updateById(id, patch) {
    const existing = this.getById(id);
    if (!existing) {
      throw appError(ERR.RECORD_NOT_FOUND, { userMessage: 'That record no longer exists.', technicalMessage: id + ' not found in ' + this.sheetName, recordId: id });
    }
    const merged = Object.assign({}, existing, patch);
    // Protect immutable/computed fields.
    if (this.schema.idColumn) merged[this.schema.idColumn] = existing[this.schema.idColumn];
    if (this.schema.timestamps) {
      merged[this.schema.timestamps.created] = existing[this.schema.timestamps.created];
      merged[this.schema.timestamps.updated] = now();
    }
    Object.keys(this.schema.formulaColumns || {}).forEach(function (h) { merged[h] = existing[h]; });

    const check = ValidationService.validateRecord(this.sheetName, merged);
    if (!check.valid) {
      throw appError(ERR.RECORD_VALIDATION_FAILED, {
        userMessage: 'Your changes could not be saved because some fields are invalid.',
        technicalMessage: this.sheetName + ' validation: ' + JSON.stringify(check.errors),
        recordId: id,
        suggestedAction: check.errors.map(function (e) { return e.field + ' ' + e.reason; }).join('; '),
      });
    }
    const sheet = this._sheet();
    const headers = this.schema.headers;
    const formulaCols = this.schema.formulaColumns || {};
    const rowArray = headers.map(function (h) {
      if (formulaCols[h]) return existing[h]; // leave computed value; formula stays in cell
      return merged[h] == null ? '' : merged[h];
    });
    // Write non-formula cells only, preserving formula cells.
    headers.forEach(function (h, i) {
      if (formulaCols[h]) return;
      sheet.getRange(existing._row, i + 1).setValue(rowArray[i]);
    });
    return this.getById(id);
  }

  /**
   * Apply many patches. Each patch must include the id column.
   * @param {Object[]} patches
   * @returns {Object[]}
   */
  updateMany(patches) {
    const idHeader = this.schema.idColumn;
    const self = this;
    return (patches || []).map(function (p) {
      const id = p[idHeader];
      return self.updateById(id, p);
    });
  }

  /**
   * Formula string for a formula-owned column. Overridden by subclasses.
   * @param {string} header
   * @param {number} rowNumber 1-based sheet row
   * @param {Object} record
   * @returns {string|null}
   */
  formulaFor(header, rowNumber, record) { return null; }

  /** @returns {number} highest numeric id suffix present (for counter floor on first run). */
  maxIdSuffix() {
    const idHeader = this.schema.idColumn;
    if (!idHeader) return 0;
    let max = 0;
    this.getAll().forEach(function (rec) {
      const m = /-(\d+)$/.exec(String(rec[idHeader] || ''));
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return max;
  }
}
