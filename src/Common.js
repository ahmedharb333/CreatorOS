/**
 * Common.gs — service-result envelope, secret sanitization, and small utilities.
 *
 * @see docs/15_Engineering_Overview.md §7 (standard service result)
 */

/**
 * Build a success ServiceResult.
 * @param {string} code Stable outcome code (e.g. 'TASKS_CREATED').
 * @param {string} message Human-readable message.
 * @param {Object} [data]
 * @param {string[]} [warnings]
 * @returns {Object}
 */
function ok(code, message, data, warnings) {
  return { success: true, code: code, message: message || '', data: data || {}, warnings: warnings || [], errors: [] };
}

/**
 * Build a failure ServiceResult.
 * @param {string} code
 * @param {string} message
 * @param {Object} [data]
 * @param {Array<Object>} [errors] Per-record error objects.
 * @returns {Object}
 */
function fail(code, message, data, errors) {
  return { success: false, code: code, message: message || '', data: data || {}, warnings: [], errors: errors || [] };
}

/**
 * Wrap an AppError (or generic Error) into a failure ServiceResult.
 * @param {Error} err
 * @returns {Object}
 */
function failFromError(err) {
  if (err instanceof AppError) {
    return { success: false, code: err.code, message: err.userMessage, data: {}, warnings: [], errors: [err.toObject()] };
  }
  return { success: false, code: ERR.INTERNAL_ERROR, message: 'Unexpected internal error.', data: {}, warnings: [], errors: [{ code: ERR.INTERNAL_ERROR, technicalMessage: String(err && err.stack || err) }] };
}

/** Keys whose values must be masked before logging (docs 29 §7). */
const SENSITIVE_KEYS = ['apikey', 'api_key', 'authorization', 'auth', 'key', 'secret', 'token', 'password'];

/**
 * Recursively mask sensitive values in a context object for safe logging.
 * @param {*} value
 * @returns {*}
 */
function sanitizeForLog(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(function (k) {
      const lower = String(k).toLowerCase();
      const masked = SENSITIVE_KEYS.some(function (s) { return lower.indexOf(s) !== -1; });
      out[k] = masked ? '***redacted***' : sanitizeForLog(value[k]);
    });
    return out;
  }
  return value;
}

/**
 * Left-pad a number with zeros to width.
 * @param {number} n
 * @param {number} width
 * @returns {string}
 */
function padNumber(n, width) {
  let s = String(Math.trunc(n));
  while (s.length < width) s = '0' + s;
  return s;
}

/**
 * Convert a 1-based column number to its A1 letter(s).
 * @param {number} col 1-based
 * @returns {string}
 */
function columnToLetter(col) {
  let s = '';
  let n = col;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** @returns {Date} current instant (indirection eases testing). */
function now() { return new Date(); }

/**
 * Format a Date as ISO in the workbook timezone.
 * @param {Date} d
 * @param {string} [tz]
 * @returns {string}
 */
function toIso(d, tz) {
  if (!(d instanceof Date)) return '';
  const zone = tz || (typeof Session !== 'undefined' ? Session.getScriptTimeZone() : 'Etc/GMT');
  return Utilities.formatDate(d, zone, "yyyy-MM-dd'T'HH:mm:ss");
}
