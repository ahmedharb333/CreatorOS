/**
 * mock_gas.js — an in-memory mock of the Google Apps Script + Sheets runtime,
 * sufficient to execute the CreatorOS product code and its Spreadsheet-bound test
 * suites in Node. Installs globals on `globalThis` when required.
 *
 * SCOPE / HONESTY: this reproduces the Sheets/Properties/Lock semantics the code
 * relies on (header-mapped ranges, batch read/write, per-cell formula evaluation
 * for the priority formula, named ranges, protections, Script/User properties,
 * LockService). It is NOT the real Google Sheets engine — the on-Google run via
 * `clasp push` + CreatorOS ▸ Run Tests remains the final acceptance surface.
 */
'use strict';

function colLetterToIndex(letters) {
  let n = 0;
  for (let i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64);
  return n; // 1-based
}
function indexToColLetter(col) {
  let s = '', n = col;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// ---------- Protection ----------
class MockProtection {
  constructor(type, sheet, range) { this.type = type; this.sheet = sheet; this.range = range; this.desc = ''; this.warningOnly = false; }
  setDescription(d) { this.desc = d; return this; }
  setWarningOnly(b) { this.warningOnly = b; return this; }
  getDescription() { return this.desc; }
  getRange() { return this.range; }
  remove() { const a = this.sheet._protections; const i = a.indexOf(this); if (i >= 0) a.splice(i, 1); }
}

// ---------- Range ----------
class MockRange {
  constructor(sheet, row, col, numRows, numCols) {
    this.sheet = sheet; this.row = row; this.col = col; this.numRows = numRows; this.numCols = numCols;
  }
  getValues() {
    const out = [];
    for (let r = 0; r < this.numRows; r++) {
      const rowArr = [];
      for (let c = 0; c < this.numCols; c++) rowArr.push(this.sheet._evaluated(this.row + r, this.col + c));
      out.push(rowArr);
    }
    return out;
  }
  getValue() { return this.sheet._evaluated(this.row, this.col); }
  setValues(vals) {
    for (let r = 0; r < vals.length; r++)
      for (let c = 0; c < vals[r].length; c++) this.sheet._set(this.row + r, this.col + c, vals[r][c], null);
    return this;
  }
  setValue(v) { this.sheet._set(this.row, this.col, v, null); return this; }
  setFormula(f) { this.sheet._set(this.row, this.col, '', f); return this; }
  setDataValidation() { return this; }
  setDataValidations() { return this; }
  setBackground() { return this; }
  setFontColor() { return this; }
  setFontWeight() { return this; }
  setFontSize() { return this; }
  setNumberFormat() { return this; }
  clearDataValidations() { return this; }
  protect() { const p = new MockProtection('RANGE', this.sheet, this); this.sheet._protections.push(p); return p; }
}

// ---------- Sheet ----------
class MockSheet {
  constructor(name, ss) { this.name = name; this._ss = ss; this.cells = []; this._protections = []; this._frozen = 0; }
  getName() { return this.name; }
  _ensure(r, c) {
    while (this.cells.length < r) this.cells.push([]);
    const row = this.cells[r - 1];
    while (row.length < c) row.push({ v: '', f: null });
  }
  _set(r, c, v, f) { this._ensure(r, c); this.cells[r - 1][c - 1] = { v: v, f: f }; }
  _rawCell(r, c) { const row = this.cells[r - 1]; if (!row) return null; return row[c - 1] || null; }
  _raw(r, c) { const cell = this._rawCell(r, c); return cell ? cell.v : ''; }
  _evaluated(r, c) {
    const cell = this._rawCell(r, c);
    if (!cell) return '';
    if (cell.f) return evalFormula(this, cell.f);
    return cell.v;
  }
  getLastRow() {
    for (let r = this.cells.length; r >= 1; r--) {
      const row = this.cells[r - 1] || [];
      for (let c = 0; c < row.length; c++) { const cell = row[c]; if (cell && (cell.f || (cell.v !== '' && cell.v != null))) return r; }
    }
    return 0;
  }
  getLastColumn() {
    let max = 0;
    for (let r = 0; r < this.cells.length; r++) {
      const row = this.cells[r] || [];
      for (let c = row.length; c >= 1; c--) { const cell = row[c - 1]; if (cell && (cell.f || (cell.v !== '' && cell.v != null))) { if (c > max) max = c; break; } }
    }
    return max;
  }
  getRange(a, b, c, d) {
    if (typeof a === 'string') return this._rangeFromA1(a);
    return new MockRange(this, a, b, c == null ? 1 : c, d == null ? 1 : d);
  }
  _rangeFromA1(a1) {
    const parts = a1.split(':');
    const p = /^\$?([A-Z]+)\$?(\d+)$/.exec(parts[0]);
    const row = parseInt(p[2], 10), col = colLetterToIndex(p[1]);
    if (parts.length === 1) return new MockRange(this, row, col, 1, 1);
    const q = /^\$?([A-Z]+)\$?(\d+)$/.exec(parts[1]);
    const row2 = parseInt(q[2], 10), col2 = colLetterToIndex(q[1]);
    return new MockRange(this, row, col, row2 - row + 1, col2 - col + 1);
  }
  getDataRange() { return new MockRange(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); }
  appendRow(arr) { const r = this.getLastRow() + 1; for (let c = 0; c < arr.length; c++) this._set(r, c + 1, arr[c], null); }
  deleteRow(n) { if (n >= 1 && n <= this.cells.length) this.cells.splice(n - 1, 1); }
  setFrozenRows(n) { this._frozen = n; }
  getFrozenRows() { return this._frozen; }
  setColumnWidth() { return this; }
  protect() { const p = new MockProtection('SHEET', this, null); this._protections.push(p); return p; }
  getProtections(type) { return this._protections.filter(function (p) { return p.type === type; }); }
}

// ---------- Formula evaluation (supports the priority formula: IF/OR, refs, named ranges) ----------
function evalFormula(sheet, formula) {
  let body = String(formula).slice(1);            // drop leading '='
  body = body.replace(/=""/g, '==""');            // Excel equality -> JS
  // named ranges -> literal value
  sheet._ss.getNamedRanges().forEach(function (nr) {
    const re = new RegExp('\\b' + nr.getName() + '\\b', 'g');
    const val = nr.getRange().getValue();
    body = body.replace(re, JSON.stringify(val));
  });
  // A1 cell refs -> literal value
  body = body.replace(/\$?([A-Z]+)\$?(\d+)/g, function (m, colL, rowS) {
    const v = sheet._raw(parseInt(rowS, 10), colLetterToIndex(colL));
    if (v === '' || v == null) return '""';
    return typeof v === 'number' ? String(v) : JSON.stringify(v);
  });
  body = body.replace(/\bOR\s*\(/g, '__or(').replace(/\bIF\s*\(/g, '__if(');
  try {
    // eslint-disable-next-line no-new-func
    return Function('__or', '__if', 'return (' + body + ');')(
      function () { return Array.prototype.slice.call(arguments).some(function (x) { return !!x; }); },
      function (c, a, b) { return c ? a : b; }
    );
  } catch (e) { return '#ERR:' + e.message; }
}

// ---------- Named range ----------
class MockNamedRange {
  constructor(name, range) { this.name = name; this.range = range; }
  getName() { return this.name; }
  setRange(r) { this.range = r; return this; }
  getRange() { return this.range; }
}

// ---------- Spreadsheet ----------
class MockSpreadsheet {
  constructor() { this.sheets = []; this.byName = {}; this.named = []; this._active = null; }
  getSheetByName(n) { return this.byName[n] || null; }
  getSheets() { return this.sheets; }
  insertSheet(name, index) {
    const s = new MockSheet(name, this);
    if (index == null || index >= this.sheets.length) this.sheets.push(s); else this.sheets.splice(index, 0, s);
    this.byName[name] = s; return s;
  }
  setActiveSheet(s) { this._active = s; return s; }
  moveActiveSheet(pos) {
    if (!this._active) return;
    const i = this.sheets.indexOf(this._active);
    if (i >= 0) this.sheets.splice(i, 1);
    this.sheets.splice(Math.max(0, pos - 1), 0, this._active);
  }
  getNamedRanges() { return this.named; }
  setNamedRange(name, range) {
    const existing = this.named.find(function (nr) { return nr.getName() === name; });
    if (existing) existing.setRange(range); else this.named.push(new MockNamedRange(name, range));
  }
  toast() {}
  getId() { return 'mock-spreadsheet-id'; }
  getUrl() { return 'https://docs.google.com/spreadsheets/d/mock'; }
}

// ---------- Data validation builder ----------
function newDataValidationBuilder() {
  const b = {};
  ['requireValueInList', 'requireNumberBetween', 'requireNumberGreaterThanOrEqualTo',
    'requireNumberLessThanOrEqualTo', 'requireCheckbox', 'requireDate', 'requireTextIsUrl',
    'setAllowInvalid'].forEach(function (m) { b[m] = function () { return b; }; });
  b.build = function () { return { rule: true }; };
  return b;
}

// ---------- Properties ----------
class MockProps {
  constructor() { this.store = {}; }
  getProperty(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; }
  setProperty(k, v) { this.store[k] = String(v); return this; }
  setProperties(obj) { const self = this; Object.keys(obj).forEach(function (k) { self.store[k] = String(obj[k]); }); return this; }
  deleteProperty(k) { delete this.store[k]; return this; }
  getProperties() { return Object.assign({}, this.store); }
}

// ---------- Utilities ----------
function formatDate(date, tz, fmt) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = function (n) { return (n < 10 ? '0' : '') + n; };
  return String(fmt)
    .replace(/yyyy/g, d.getUTCFullYear())
    .replace(/MM/g, pad(d.getUTCMonth() + 1))
    .replace(/dd/g, pad(d.getUTCDate()))
    .replace(/HH/g, pad(d.getUTCHours()))
    .replace(/mm/g, pad(d.getUTCMinutes()))
    .replace(/ss/g, pad(d.getUTCSeconds()))
    .replace(/'T'/g, 'T');
}

// ---------- Calendar mock ----------
let _evtSeq = 0;
class MockEvent {
  constructor(cal, title, start, end, opts) {
    this.cal = cal; this.id = 'evt-' + (++_evtSeq); this.title = title;
    this.start = start; this.end = end; this.description = (opts && opts.description) || ''; this.deleted = false;
    this.attendees = []; // never touched by CalendarService — used to prove O-1
  }
  getId() { return this.id; }
  getTitle() { return this.title; }
  getStartTime() { return this.start; }
  getEndTime() { return this.end; }
  getDescription() { return this.description; }
  setTitle(t) { this.title = t; return this; }
  setTime(s, e) { this.start = s; this.end = e; return this; }
  setDescription(d) { this.description = d; return this; }
  deleteEvent() { this.deleted = true; }
}
class MockCalendar {
  constructor(id, name) { this.id = id; this.name = name || id; this.events = []; }
  getId() { return this.id; }
  getName() { return this.name; }
  createEvent(title, start, end, opts) { const e = new MockEvent(this, title, start, end, opts); this.events.push(e); return e; }
  getEventById(id) { const e = this.events.find(function (x) { return x.id === id && !x.deleted; }); return e || null; }
  getEvents(from, to) {
    return this.events.filter(function (e) {
      return !e.deleted && e.end.getTime() > from.getTime() && e.start.getTime() < to.getTime();
    });
  }
}
const _calendars = {};
globalThis.CalendarApp = {
  getCalendarById: function (id) { return _calendars[id] || null; },
  getDefaultCalendar: function () { if (!_calendars['default']) _calendars['default'] = new MockCalendar('default', 'Default'); return _calendars['default']; },
};

// ---------- Install globals ----------
const _ss = new MockSpreadsheet();
globalThis.SpreadsheetApp = {
  getActiveSpreadsheet: function () { return _ss; },
  getActive: function () { return _ss; },
  newDataValidation: newDataValidationBuilder,
  ProtectionType: { RANGE: 'RANGE', SHEET: 'SHEET' },
  flush: function () {},
  getUi: function () {
    const menu = { addItem: function () { return menu; }, addSeparator: function () { return menu; }, addToUi: function () {}, addSubMenu: function () { return menu; } };
    return { createMenu: function () { return menu; }, alert: function () {}, ButtonSet: { OK: 'OK' } };
  },
};
globalThis.PropertiesService = { _script: new MockProps(), _user: new MockProps(),
  getScriptProperties: function () { return this._script; }, getUserProperties: function () { return this._user; } };
globalThis.LockService = { getScriptLock: function () { return { tryLock: function () { return true; }, releaseLock: function () {}, waitLock: function () {} }; } };
globalThis.Utilities = { formatDate: formatDate, sleep: function () {}, getUuid: function () { return 'mock-uuid-' + Math.random().toString(36).slice(2); } };
globalThis.Session = { getScriptTimeZone: function () { return 'Etc/GMT'; } };

module.exports = {
  spreadsheet: _ss,
  registerCalendar: function (id, name) { _calendars[id] = new MockCalendar(id, name); return _calendars[id]; },
  getCalendar: function (id) { return _calendars[id] || null; },
};
