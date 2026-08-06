/**
 * IdService.gs — immutable, collision-safe sequential business IDs.
 *
 * IDs are `PREFIX-000000` (docs 06, ASSUMPTIONS G1). Counters live in Script
 * Properties, guarded by LockService so concurrent executions never collide.
 * IDs are never derived from row counts and deleted IDs are never reused
 * (FR-002).
 *
 * @see docs/17_Service_Contracts.md §2
 * @see docs/04_Master_PRD.md FR-002
 */
const IdService = (function () {

  const LOCK_TIMEOUT_MS = 10000;
  const KNOWN_PREFIXES = Object.keys(ID_PREFIX).map(function (k) { return ID_PREFIX[k]; });

  /** @private @returns {GoogleAppsScript.Properties.Properties} */
  function props() { return PropertiesService.getScriptProperties(); }

  /** @private @param {string} prefix @returns {string} */
  function counterKey(prefix) { return SCRIPT_PROP.ID_COUNTER_PREFIX + prefix; }

  /** @private Read the current counter (0 if unset). */
  function readCounter(prefix) {
    const raw = props().getProperty(counterKey(prefix));
    const n = raw == null ? 0 : parseInt(raw, 10);
    return isNaN(n) ? 0 : n;
  }

  /** @private @param {string} prefix @param {number} count @returns {number} new counter value */
  function bump(prefix, count) {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
      throw appError(ERR.ID_COUNTER_LOCK_TIMEOUT, {
        severity: SEVERITY.ERROR,
        userMessage: 'CreatorOS was briefly busy assigning an ID. Please retry.',
        technicalMessage: 'LockService timeout after ' + LOCK_TIMEOUT_MS + 'ms for ' + prefix,
        recoverable: true,
        suggestedAction: 'Retry the action.',
      });
    }
    try {
      const next = readCounter(prefix) + count;
      props().setProperty(counterKey(prefix), String(next));
      return next;
    } finally {
      lock.releaseLock();
    }
  }

  /** @private @param {string} prefix @param {number} n */
  function format(prefix, n) { return prefix + '-' + padNumber(n, ID_PAD); }

  return {
    /**
     * Allocate the next id for a prefix.
     * @param {string} prefix One of ID_PREFIX.*
     * @returns {string} e.g. 'TSK-000042'
     */
    next: function (prefix) {
      const end = bump(prefix, 1);
      return format(prefix, end);
    },

    /**
     * Reserve a contiguous block of ids in a single locked operation.
     * @param {string} prefix
     * @param {number} count
     * @returns {string[]}
     */
    reserve: function (prefix, count) {
      if (!count || count < 1) return [];
      const end = bump(prefix, count);
      const start = end - count + 1;
      const ids = [];
      for (let n = start; n <= end; n++) ids.push(format(prefix, n));
      return ids;
    },

    /**
     * Validate an id's shape (and optionally its prefix).
     * @param {string} id
     * @param {string} [prefix] If given, the id must use exactly this prefix.
     * @returns {boolean}
     */
    validate: function (id, prefix) {
      if (typeof id !== 'string') return false;
      const m = /^([A-Z]{3})-(\d{6,})$/.exec(id);
      if (!m) return false;
      if (prefix) return m[1] === prefix;
      return KNOWN_PREFIXES.indexOf(m[1]) !== -1;
    },

    /** @returns {number} current counter value for a prefix (diagnostics/tests). */
    peek: function (prefix) { return readCounter(prefix); },

    /**
     * Ensure a counter is at least `floor` (used on first-run/upgrade so IDs never
     * collide with pre-existing rows). Never lowers a counter.
     * @param {string} prefix
     * @param {number} floor
     */
    ensureAtLeast: function (prefix, floor) {
      const lock = LockService.getScriptLock();
      if (!lock.tryLock(LOCK_TIMEOUT_MS)) return;
      try {
        if (readCounter(prefix) < floor) props().setProperty(counterKey(prefix), String(floor));
      } finally {
        lock.releaseLock();
      }
    },
  };
})();
