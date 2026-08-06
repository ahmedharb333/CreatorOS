/**
 * Errors.gs — typed application error + error-code catalog.
 *
 * Every user-facing failure carries a stable code, a severity, a plain-language
 * user message, a technical message, the affected record, whether it is
 * recoverable, and a suggested action (docs 20 §1).
 *
 * @see docs/20_Error_Catalog.md
 */

/** Canonical error codes (docs 20). Grouped by area for readability. */
const ERR = Object.freeze({
  // Setup
  SETUP_REQUIRED_FIELD_MISSING: 'SETUP_REQUIRED_FIELD_MISSING',
  SETUP_INVALID_TIMEZONE: 'SETUP_INVALID_TIMEZONE',
  SETUP_INVALID_CAPACITY: 'SETUP_INVALID_CAPACITY',
  SETUP_ALREADY_COMPLETE: 'SETUP_ALREADY_COMPLETE',
  // Schema
  SHEET_MISSING: 'SHEET_MISSING',
  HEADER_MISSING: 'HEADER_MISSING',
  HEADER_DUPLICATE: 'HEADER_DUPLICATE',
  CONFIG_INVALID: 'CONFIG_INVALID',
  SCHEMA_VERSION_MISMATCH: 'SCHEMA_VERSION_MISMATCH',
  // Record
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  RECORD_ID_INVALID: 'RECORD_ID_INVALID',
  RECORD_DUPLICATE: 'RECORD_DUPLICATE',
  RECORD_VALIDATION_FAILED: 'RECORD_VALIDATION_FAILED',
  RECORD_UPDATE_CONFLICT: 'RECORD_UPDATE_CONFLICT',
  // Content / workflow / task
  CONTENT_STATUS_TRANSITION_INVALID: 'CONTENT_STATUS_TRANSITION_INVALID',
  CONTENT_PUBLISH_DATE_REQUIRED: 'CONTENT_PUBLISH_DATE_REQUIRED',
  CONVERSION_NEEDS_CONFIRMATION: 'CONVERSION_NEEDS_CONFIRMATION',
  CONTENT_NOT_PAUSED: 'CONTENT_NOT_PAUSED',
  CONTENT_ALREADY_PAUSED: 'CONTENT_ALREADY_PAUSED',
  WORKFLOW_NOT_FOUND: 'WORKFLOW_NOT_FOUND',
  WORKFLOW_INVALID: 'WORKFLOW_INVALID',
  TASKS_ALREADY_EXIST: 'TASKS_ALREADY_EXIST',
  TASK_DEPENDENCY_INVALID: 'TASK_DEPENDENCY_INVALID',
  TASK_DATE_INVALID: 'TASK_DATE_INVALID',
  // Capacity / planning
  CAPACITY_NOT_CONFIGURED: 'CAPACITY_NOT_CONFIGURED',
  PLAN_OVER_CAPACITY: 'PLAN_OVER_CAPACITY',
  PLAN_NOT_APPROVED: 'PLAN_NOT_APPROVED',
  NO_AVAILABLE_SLOT: 'NO_AVAILABLE_SLOT',
  WEEK_ALREADY_APPROVED: 'WEEK_ALREADY_APPROVED',
  // Calendar
  CALENDAR_NOT_CONFIGURED: 'CALENDAR_NOT_CONFIGURED',
  CALENDAR_PERMISSION_DENIED: 'CALENDAR_PERMISSION_DENIED',
  CALENDAR_NOT_FOUND: 'CALENDAR_NOT_FOUND',
  CALENDAR_EVENT_MISSING: 'CALENDAR_EVENT_MISSING',
  CALENDAR_EVENT_DUPLICATE: 'CALENDAR_EVENT_DUPLICATE',
  CALENDAR_INVALID_TIME: 'CALENDAR_INVALID_TIME',
  CALENDAR_PARTIAL_FAILURE: 'CALENDAR_PARTIAL_FAILURE',
  CALENDAR_QUOTA_EXCEEDED: 'CALENDAR_QUOTA_EXCEEDED',
  // AI
  AI_DISABLED: 'AI_DISABLED',
  AI_KEY_NOT_CONFIGURED: 'AI_KEY_NOT_CONFIGURED',
  AI_AUTH_FAILED: 'AI_AUTH_FAILED',
  AI_RATE_LIMITED: 'AI_RATE_LIMITED',
  AI_MODEL_NOT_FOUND: 'AI_MODEL_NOT_FOUND',
  AI_INVALID_REQUEST: 'AI_INVALID_REQUEST',
  AI_RESPONSE_SCHEMA_INVALID: 'AI_RESPONSE_SCHEMA_INVALID',
  AI_PROVIDER_UNAVAILABLE: 'AI_PROVIDER_UNAVAILABLE',
  AI_NETWORK_ERROR: 'AI_NETWORK_ERROR',
  AI_UNKNOWN_ERROR: 'AI_UNKNOWN_ERROR',
  // Triggers / notifications
  TRIGGER_CREATION_FAILED: 'TRIGGER_CREATION_FAILED',
  TRIGGER_DUPLICATE: 'TRIGGER_DUPLICATE',
  TRIGGER_NOT_FOUND: 'TRIGGER_NOT_FOUND',
  EMAIL_PERMISSION_DENIED: 'EMAIL_PERMISSION_DENIED',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  // Infrastructure
  ID_COUNTER_LOCK_TIMEOUT: 'ID_COUNTER_LOCK_TIMEOUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

const SEVERITY = Object.freeze({ INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR', CRITICAL: 'CRITICAL' });

/**
 * Typed application error.
 * @extends Error
 */
class AppError extends Error {
  /**
   * @param {string} code One of ERR.*
   * @param {Object} [opts]
   * @param {string} [opts.severity] One of SEVERITY.*
   * @param {string} [opts.userMessage] Plain-language message for the user.
   * @param {string} [opts.technicalMessage] Developer/log detail.
   * @param {string} [opts.recordId] Affected record id.
   * @param {boolean} [opts.recoverable]
   * @param {string} [opts.suggestedAction]
   * @param {Object} [opts.context] Extra structured context (sanitized before logging).
   */
  constructor(code, opts) {
    const o = opts || {};
    super(o.technicalMessage || o.userMessage || code);
    this.name = 'AppError';
    this.code = code;
    this.severity = o.severity || SEVERITY.ERROR;
    this.userMessage = o.userMessage || 'CreatorOS hit a problem completing this action.';
    this.technicalMessage = o.technicalMessage || '';
    this.recordId = o.recordId || '';
    this.recoverable = o.recoverable !== false;
    this.suggestedAction = o.suggestedAction || '';
    this.context = o.context || {};
  }

  /** @returns {Object} Plain object shaped per docs 20 §1. */
  toObject() {
    return {
      code: this.code,
      severity: this.severity,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      recordId: this.recordId,
      recoverable: this.recoverable,
      suggestedAction: this.suggestedAction,
    };
  }
}

/**
 * Convenience factory.
 * @param {string} code
 * @param {Object} [opts]
 * @returns {AppError}
 */
function appError(code, opts) {
  return new AppError(code, opts);
}
