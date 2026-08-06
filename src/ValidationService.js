/**
 * ValidationService.gs — value- and record-level validation.
 *
 * Drives both the in-sheet data validations (built by WorkbookService) and the
 * write-time checks performed by repositories, from the single SCHEMA definition.
 *
 * @see docs/26_Formula_Validation_and_Formatting_Catalog.md
 * @see docs/16_Workbook_Schema.md
 */
const ValidationService = (function () {

  /**
   * Validate one value against a validation spec.
   * @param {*} value
   * @param {Object} spec A SCHEMA validation entry ({type, ...}).
   * @returns {{valid: boolean, reason?: string}}
   */
  function validateValue(value, spec) {
    if (!spec) return { valid: true };
    const empty = value === '' || value == null;

    switch (spec.type) {
      case 'enum':
        if (empty) return { valid: true }; // required-ness handled separately
        return spec.values.indexOf(value) !== -1
          ? { valid: true }
          : { valid: false, reason: 'must be one of: ' + spec.values.join(', ') };

      case 'number': {
        if (empty) return { valid: true };
        const n = Number(value);
        if (isNaN(n)) return { valid: false, reason: 'must be a number' };
        if (spec.integer && !Number.isInteger(n)) return { valid: false, reason: 'must be a whole number' };
        if (spec.min != null && n < spec.min) return { valid: false, reason: 'must be >= ' + spec.min };
        if (spec.max != null && n > spec.max) return { valid: false, reason: 'must be <= ' + spec.max };
        return { valid: true };
      }

      case 'boolean':
        if (empty) return { valid: true };
        return (value === true || value === false || value === 'TRUE' || value === 'FALSE')
          ? { valid: true } : { valid: false, reason: 'must be TRUE or FALSE' };

      case 'date':
      case 'datetime':
        if (empty) return { valid: true };
        return (value instanceof Date && !isNaN(value.getTime()))
          ? { valid: true } : { valid: false, reason: 'must be a valid date' };

      case 'url':
        if (empty) return { valid: true };
        return /^https?:\/\/\S+$/i.test(String(value))
          ? { valid: true } : { valid: false, reason: 'must be a valid URL' };

      case 'id':
        if (empty) return { valid: true };
        return IdService.validate(String(value), spec.prefix)
          ? { valid: true } : { valid: false, reason: 'must be a valid ' + (spec.prefix || '') + ' id' };

      case 'json': {
        if (empty) return { valid: true };
        let arr;
        try { arr = JSON.parse(value); } catch (e) { return { valid: false, reason: 'must be valid JSON' }; }
        if (!Array.isArray(arr)) return { valid: false, reason: 'must be a JSON array' };
        if (spec.itemType === 'id') {
          for (let i = 0; i < arr.length; i++) {
            if (!IdService.validate(String(arr[i]), spec.prefix)) return { valid: false, reason: 'contains an invalid ' + (spec.prefix || '') + ' id' };
          }
        }
        return { valid: true };
      }

      default:
        return { valid: true };
    }
  }

  /**
   * Validate a record object against a sheet's schema.
   * @param {string} sheetName
   * @param {Object} record header -> value
   * @returns {{valid: boolean, errors: Array<{field: string, reason: string}>}}
   */
  function validateRecord(sheetName, record) {
    const schema = SCHEMA[sheetName];
    const errors = [];
    if (!schema) return { valid: true, errors: errors };
    const validations = schema.validations || {};
    Object.keys(validations).forEach(function (field) {
      const res = validateValue(record[field], validations[field]);
      if (!res.valid) errors.push({ field: field, reason: res.reason });
    });
    // Cross-field date rules (docs 26 §10).
    if (record.Scheduled_Start instanceof Date && record.Scheduled_End instanceof Date) {
      if (record.Scheduled_End <= record.Scheduled_Start) {
        errors.push({ field: 'Scheduled_End', reason: 'must be after Scheduled_Start' });
      }
    }
    if (sheetName === SHEETS.CONTENT && record.Source_Content_ID && record.Content_ID) {
      if (record.Source_Content_ID === record.Content_ID) {
        errors.push({ field: 'Source_Content_ID', reason: 'cannot equal Content_ID' });
      }
    }
    return { valid: errors.length === 0, errors: errors };
  }

  /**
   * Is the timezone a resolvable IANA/GMT zone?
   * @param {string} tz
   * @returns {boolean}
   */
  function isValidTimezone(tz) {
    if (!tz) return false;
    try {
      Utilities.formatDate(new Date(), tz, 'yyyy');
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    validateValue: validateValue,
    validateRecord: validateRecord,
    isValidTimezone: isValidTimezone,
  };
})();
