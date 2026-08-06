/**
 * SetupService.gs — guided setup state, validation, persistence (FR-001).
 *
 * The SETUP sheet is the authoritative input source (approved decision, ADR-014):
 * the creator edits Setting_Value cells; this service validates, commits, and
 * mirrors the values other layers need into CONFIG named-range cells. All setup
 * logic lives here and is UI-agnostic, so a future HTML onboarding wizard can call
 * the same APIs without backend changes.
 *
 * @see docs/17_Service_Contracts.md §3
 * @see docs/04_Master_PRD.md FR-001
 */
const SetupService = (function () {

  const MODULE = 'SetupService';

  /** Settings that are always required for a complete setup (docs 16 §3). */
  const REQUIRED_KEYS = [
    'CREATOR_NAME', 'BRAND_NAME', 'TIMEZONE', 'PRIMARY_GOAL', 'PRIMARY_PLATFORM',
    'WEEKLY_AVAILABLE_HOURS', 'WORK_DAYS', 'CONTENT_PILLARS',
  ];

  /** SETUP keys mirrored into CONFIG value cells (so formulas/services read them). */
  const CONFIG_MIRROR = {
    WEEKLY_AVAILABLE_HOURS: 'WEEKLY_HOURS',
    TIMEZONE: 'TIMEZONE',
    PRIMARY_PLATFORM: 'PRIMARY_PLATFORM',
    CONTENT_PILLARS: 'CONTENT_PILLARS',
    WORK_DAYS: 'WORK_DAYS',
  };

  /** @private */
  function repo() { return new SettingsRepository(); }

  /**
   * Current setup state.
   * @returns {{settings: Object, onboardingStatus: string, complete: boolean, missing: string[]}}
   */
  function getSetupState() {
    const map = repo().getMap();
    const settings = {};
    Object.keys(map).forEach(function (k) { settings[k] = map[k].Setting_Value; });
    const validation = validateSetup();
    return {
      settings: settings,
      onboardingStatus: settings.ONBOARDING_STATUS || 'Not started',
      complete: validation.valid,
      missing: validation.missing,
    };
  }

  /**
   * Validate required fields and their values.
   * @returns {{valid: boolean, missing: string[], errors: Array<{key:string, reason:string}>}}
   */
  function validateSetup() {
    const map = repo().getMap();
    const missing = [];
    const errors = [];
    REQUIRED_KEYS.forEach(function (key) {
      const rec = map[key];
      const val = rec ? rec.Setting_Value : '';
      if (val === '' || val == null) { missing.push(key); return; }
      if (key === 'TIMEZONE' && !ValidationService.isValidTimezone(String(val))) {
        errors.push({ key: key, reason: 'not a valid timezone' });
      }
      if (key === 'WEEKLY_AVAILABLE_HOURS') {
        const n = Number(val);
        if (isNaN(n) || n <= 0 || n > 168) errors.push({ key: key, reason: 'must be > 0 and <= 168' });
      }
      if (key === 'PRIMARY_GOAL' && ENUMS.STRATEGIC_GOAL.indexOf(String(val)) === -1) {
        errors.push({ key: key, reason: 'must be one of the strategic goals' });
      }
      if (key === 'PRIMARY_PLATFORM' && ENUMS.PLATFORM.indexOf(String(val)) === -1) {
        errors.push({ key: key, reason: 'must be an enabled platform' });
      }
    });
    return { valid: missing.length === 0 && errors.length === 0, missing: missing, errors: errors };
  }

  /**
   * Persist a batch of settings (from a dialog or programmatically), then mirror to CONFIG.
   * @param {Object<string,*>} settings key -> value
   * @returns {Object} ServiceResult
   */
  function saveSettings(settings) {
    try {
      const res = repo().setValues(settings || {});
      mirrorToConfig();
      LoggerService.info(MODULE, 'Settings saved', { detail: { written: res.written, missing: res.missing } });
      if (res.missing.length) {
        return ok('SETTINGS_SAVED_PARTIAL', 'Saved, but some keys were unknown.', res, ['unknown keys: ' + res.missing.join(', ')]);
      }
      return ok('SETTINGS_SAVED', res.written.length + ' setting(s) saved.', res);
    } catch (err) {
      LoggerService.error(MODULE, err, { fn: 'saveSettings' });
      return failFromError(err);
    }
  }

  /** @private Mirror mirrored SETUP keys into their CONFIG value cells. */
  function mirrorToConfig() {
    const map = repo().getMap();
    Object.keys(CONFIG_MIRROR).forEach(function (setupKey) {
      const rec = map[setupKey];
      if (!rec || rec.Setting_Value === '' || rec.Setting_Value == null) return;
      try { ConfigService.set(CONFIG_MIRROR[setupKey], rec.Setting_Value); } catch (e) { /* config key may be absent */ }
    });
  }

  /**
   * Mark setup complete if valid. Does not touch any content/task records.
   * @returns {Object} ServiceResult
   */
  function completeSetup() {
    const validation = validateSetup();
    if (!validation.valid) throwSetupError(validation);
    mirrorToConfig();
    repo().setValue('ONBOARDING_STATUS', 'Complete');
    LoggerService.info(MODULE, 'Setup completed');
    return ok('SETUP_COMPLETE', 'Setup complete. CreatorOS can now build a plan based on your capacity.');
  }

  /** @private Throw the most specific setup error. */
  function throwSetupError(validation) {
    if (validation.missing.length) {
      throw appError(ERR.SETUP_REQUIRED_FIELD_MISSING, {
        severity: SEVERITY.WARNING,
        userMessage: 'Please complete required setup fields: ' + validation.missing.join(', ') + '.',
        technicalMessage: 'Missing: ' + validation.missing.join(', '),
        recoverable: true,
        suggestedAction: 'Fill the highlighted SETUP fields, then run Complete Setup again.',
      });
    }
    const first = validation.errors[0];
    const code = first.key === 'TIMEZONE' ? ERR.SETUP_INVALID_TIMEZONE
      : first.key === 'WEEKLY_AVAILABLE_HOURS' ? ERR.SETUP_INVALID_CAPACITY
      : ERR.RECORD_VALIDATION_FAILED;
    throw appError(code, {
      severity: SEVERITY.WARNING,
      userMessage: 'Setup value invalid: ' + first.key + ' ' + first.reason + '.',
      technicalMessage: JSON.stringify(validation.errors),
      recoverable: true,
      suggestedAction: 'Correct ' + first.key + ' in the SETUP tab and run Complete Setup again.',
    });
  }

  /**
   * Re-open setup for editing. Preserves all records (FR-001); only flips onboarding status.
   * @returns {Object} ServiceResult
   */
  function rerunSetup() {
    const status = repo().getValue('ONBOARDING_STATUS');
    repo().setValue('ONBOARDING_STATUS', 'In progress');
    LoggerService.info(MODULE, 'Setup reopened', { detail: { previousStatus: status } });
    return ok('SETUP_REOPENED', 'Setup reopened for editing. Your ideas, content, and tasks are unchanged.');
  }

  return {
    getSetupState: getSetupState,
    validateSetup: validateSetup,
    saveSettings: saveSettings,
    completeSetup: completeSetup,
    rerunSetup: rerunSetup,
    REQUIRED_KEYS: REQUIRED_KEYS,
  };
})();
