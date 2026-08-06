/**
 * LoggerService.gs — structured logging to the SYSTEM_LOG sheet and console.
 *
 * Secrets are sanitized before any write (docs 29 §7). Logging never throws:
 * a logging failure must not break the operation that triggered it.
 *
 * @see docs/17_Service_Contracts.md §16
 * @see docs/20_Error_Catalog.md
 */
const LoggerService = (function () {

  /**
   * Append a row to SYSTEM_LOG. Best-effort; swallows its own failures to console.
   * @param {string} severity One of SEVERITY.*
   * @param {string} module
   * @param {string} message
   * @param {Object} [context]
   * @private
   */
  function write(severity, module, message, context) {
    const ctx = context || {};
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss && ss.getSheetByName(SHEETS.SYSTEM_LOG);
      const detail = JSON.stringify(sanitizeForLog(ctx.detail != null ? ctx.detail : ctx));
      const logId = (typeof IdService !== 'undefined')
        ? safeNextId(ID_PREFIX.LOG)
        : ID_PREFIX.LOG + '-' + padNumber(Date.now() % 1000000, ID_PAD);
      if (sheet) {
        // Column order must match SCHEMA[SYSTEM_LOG].headers.
        sheet.appendRow([
          logId,
          ctx.correlationId || '',
          now(),
          severity,
          module || '',
          ctx.fn || '',
          ctx.userAction || '',
          ctx.recordId || '',
          truncate(message, 500),
          truncate(detail, 5000),
          false,
        ]);
      }
    } catch (e) {
      // Never let logging break the caller.
      console.error('LoggerService.write failed: ' + (e && e.message));
    }
    // Always mirror to Stackdriver console.
    const line = '[' + severity + '] ' + module + ': ' + message;
    if (severity === SEVERITY.ERROR || severity === SEVERITY.CRITICAL) console.error(line);
    else if (severity === SEVERITY.WARNING) console.warn(line);
    else console.info(line);
  }

  /** @private */
  function safeNextId(prefix) {
    try { return IdService.next(prefix); }
    catch (e) { return prefix + '-' + padNumber(Date.now() % 1000000, ID_PAD); }
  }

  /** @private */
  function truncate(s, max) {
    s = String(s == null ? '' : s);
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }

  return {
    /** @param {string} module @param {string} message @param {Object} [context] */
    info: function (module, message, context) { write(SEVERITY.INFO, module, message, context); },
    /** @param {string} module @param {string} message @param {Object} [context] */
    warn: function (module, message, context) { write(SEVERITY.WARNING, module, message, context); },
    /** @param {string} module @param {(Error|string)} error @param {Object} [context] */
    error: function (module, error, context) {
      const msg = error instanceof Error ? error.message : String(error);
      const ctx = Object.assign({ detail: error instanceof Error ? error.stack : error }, context || {});
      write(SEVERITY.ERROR, module, msg, ctx);
    },
    /** @param {string} module @param {(Error|string)} error @param {Object} [context] */
    critical: function (module, error, context) {
      const msg = error instanceof Error ? error.message : String(error);
      const ctx = Object.assign({ detail: error instanceof Error ? error.stack : error }, context || {});
      write(SEVERITY.CRITICAL, module, msg, ctx);
    },
  };
})();
