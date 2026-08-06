/**
 * ConfigService.gs — configuration access layer.
 *
 * Three tiers (docs 15 §8):
 *  - Script Properties: immutable product-level (PRODUCT_VERSION, SCHEMA_VERSION).
 *  - User Properties:   per-user secrets/settings (AI key, calendar id) — never in cells.
 *  - CONFIG sheet:      visible non-secret settings (weights, thresholds), exposed via named ranges.
 *
 * @see docs/15_Engineering_Overview.md §8
 * @see docs/26_Formula_Validation_and_Formatting_Catalog.md §13
 */
const ConfigService = (function () {

  let _cache = null; // {key: {value, type, rowIndex}}

  /** @private */
  function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

  /** @private Load the CONFIG sheet into a keyed cache. */
  function loadConfig() {
    if (_cache) return _cache;
    const sheet = ss().getSheetByName(SHEETS.CONFIG);
    _cache = {};
    if (!sheet) return _cache;
    const values = sheet.getDataRange().getValues();
    // Row 0 is the header. SCHEMA[CONFIG].headers = [Config_Key, Config_Label, Config_Value, Config_Type, Named_Range, Notes]
    for (let r = 1; r < values.length; r++) {
      const key = values[r][0];
      if (key === '' || key == null) continue;
      _cache[String(key)] = { value: values[r][2], type: values[r][3], namedRange: values[r][4], rowIndex: r + 1 };
    }
    return _cache;
  }

  /** Invalidate the in-memory config cache (after writes). */
  function clearCache() { _cache = null; }

  /**
   * Read a CONFIG value by key, coerced by its declared type.
   * @param {string} key
   * @param {*} [fallback]
   * @returns {*}
   */
  function get(key, fallback) {
    const entry = loadConfig()[key];
    if (!entry) return fallback;
    if (entry.type === 'number') {
      const n = Number(entry.value);
      return isNaN(n) ? fallback : n;
    }
    if (entry.type === 'boolean') return entry.value === true || entry.value === 'TRUE';
    return entry.value;
  }

  /**
   * Write a CONFIG value by key.
   * @param {string} key
   * @param {*} value
   */
  function set(key, value) {
    const sheet = ss().getSheetByName(SHEETS.CONFIG);
    if (!sheet) throw appError(ERR.SHEET_MISSING, { technicalMessage: 'CONFIG sheet missing' });
    const entry = loadConfig()[key];
    if (!entry) throw appError(ERR.CONFIG_INVALID, { technicalMessage: 'Unknown config key: ' + key });
    sheet.getRange(entry.rowIndex, 3).setValue(value); // Config_Value column
    clearCache();
  }

  /** Priority-score weights (docs 26 §2). @returns {{impact:number, confidence:number, effort:number}} */
  function getPriorityWeights() {
    return {
      impact: get('IMPACT_WEIGHT', 0.5),
      confidence: get('CONFIDENCE_WEIGHT', 0.3),
      effort: get('EFFORT_WEIGHT', 0.2),
    };
  }

  /** Capacity thresholds (docs 16 §8). @returns {{warning:number, critical:number}} */
  function getCapacityThresholds() {
    return { warning: get('CAPACITY_WARNING', 0.85), critical: get('CAPACITY_CRITICAL', 1.2) };
  }

  // ---- Version markers (Script Properties) ----

  function getProductVersion() {
    return PropertiesService.getScriptProperties().getProperty(SCRIPT_PROP.PRODUCT_VERSION) || VERSION.PRODUCT;
  }
  function getSchemaVersion() {
    const raw = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROP.SCHEMA_VERSION);
    return raw == null ? null : parseInt(raw, 10);
  }
  function setVersionMarkers() {
    PropertiesService.getScriptProperties().setProperties({
      [SCRIPT_PROP.PRODUCT_VERSION]: VERSION.PRODUCT,
      [SCRIPT_PROP.SCHEMA_VERSION]: String(VERSION.SCHEMA),
    });
  }

  // ---- User-scoped settings (never written to cells) ----

  /** @param {string} key USER_PROP.* @param {*} [fallback] */
  function getUserProp(key, fallback) {
    const v = PropertiesService.getUserProperties().getProperty(key);
    return v == null ? (fallback == null ? null : fallback) : v;
  }
  /** @param {string} key @param {string} value */
  function setUserProp(key, value) {
    PropertiesService.getUserProperties().setProperty(key, String(value));
  }
  /** @param {string} key */
  function deleteUserProp(key) {
    PropertiesService.getUserProperties().deleteProperty(key);
  }

  return {
    clearCache: clearCache,
    get: get,
    set: set,
    getPriorityWeights: getPriorityWeights,
    getCapacityThresholds: getCapacityThresholds,
    getProductVersion: getProductVersion,
    getSchemaVersion: getSchemaVersion,
    setVersionMarkers: setVersionMarkers,
    getUserProp: getUserProp,
    setUserProp: setUserProp,
    deleteUserProp: deleteUserProp,
  };
})();
