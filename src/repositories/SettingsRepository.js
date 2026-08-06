/**
 * SettingsRepository.gs — key/value access for the SETUP sheet.
 *
 * SETUP is a settings table (Setting_Key → Setting_Value + metadata), not an
 * entity store, so this repository adds key-based read/write on top of the
 * header-mapped base. It remains pure data access — no validation or business
 * rules (those live in SetupService).
 */
class SettingsRepository extends BaseRepository {
  constructor() { super(SHEETS.SETUP); }

  /** @returns {Object<string,Object>} key -> full setting record (incl. `_row`). */
  getMap() {
    const map = {};
    this.getAll().forEach(function (rec) { if (rec.Setting_Key) map[rec.Setting_Key] = rec; });
    return map;
  }

  /**
   * @param {string} key
   * @returns {*} the Setting_Value, or null if the key is absent.
   */
  getValue(key) {
    const rec = this.find({ Setting_Key: key })[0];
    return rec ? rec.Setting_Value : null;
  }

  /**
   * Write a setting value and stamp Last_Updated. Does not create new keys.
   * @param {string} key
   * @param {*} value
   * @returns {boolean} true if the key existed and was written.
   */
  setValue(key, value) {
    const rec = this.find({ Setting_Key: key })[0];
    if (!rec) return false;
    const sheet = this._sheet();
    const headers = this._headers();
    sheet.getRange(rec._row, headers['Setting_Value'] + 1).setValue(value == null ? '' : value);
    if (headers['Last_Updated'] != null) sheet.getRange(rec._row, headers['Last_Updated'] + 1).setValue(now());
    return true;
  }

  /**
   * Write many settings at once.
   * @param {Object<string,*>} values key -> value
   * @returns {{written: string[], missing: string[]}}
   */
  setValues(values) {
    const written = [], missing = [];
    const self = this;
    Object.keys(values).forEach(function (k) {
      if (self.setValue(k, values[k])) written.push(k); else missing.push(k);
    });
    return { written: written, missing: missing };
  }
}
