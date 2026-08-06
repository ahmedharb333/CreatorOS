/**
 * ValidationTests.gs — pure value/record validation tests (docs 21 §5, §6).
 * These require no Spreadsheet API and are deterministic.
 * @returns {Array<{name:string, fn:Function}>}
 */
function ValidationTests_() {
  return [
    {
      name: 'VAL-001 enum accepts members, rejects non-members',
      fn: function (t) {
        const spec = { type: 'enum', values: ENUMS.PRIORITY };
        t.truthy(ValidationService.validateValue('High', spec).valid, 'High valid');
        t.truthy(!ValidationService.validateValue('Urgent', spec).valid, 'Urgent invalid');
        t.truthy(ValidationService.validateValue('', spec).valid, 'empty allowed at value level');
      },
    },
    {
      name: 'VAL-002 integer range rejects out-of-range and non-integer',
      fn: function (t) {
        const spec = { type: 'number', integer: true, min: 1, max: 5 };
        t.truthy(ValidationService.validateValue(3, spec).valid, '3 valid');
        t.truthy(!ValidationService.validateValue(6, spec).valid, '6 invalid');
        t.truthy(!ValidationService.validateValue(0, spec).valid, '0 invalid');
        t.truthy(!ValidationService.validateValue(2.5, spec).valid, '2.5 invalid');
      },
    },
    {
      name: 'VAL-003 url and date specs',
      fn: function (t) {
        t.truthy(ValidationService.validateValue('https://x.co/a', { type: 'url' }).valid, 'url valid');
        t.truthy(!ValidationService.validateValue('not-a-url', { type: 'url' }).valid, 'url invalid');
        t.truthy(ValidationService.validateValue(new Date(), { type: 'date' }).valid, 'date valid');
        t.truthy(!ValidationService.validateValue('yesterday', { type: 'date' }).valid, 'date invalid');
      },
    },
    {
      name: 'VAL-004 validateRecord flags bad idea scores',
      fn: function (t) {
        const bad = { Idea_Title: 'x', Effort_Score: 9, Impact_Score: 5, Confidence_Score: 3, Strategic_Goal: 'Nope', Status: 'Captured', Primary_Platform: 'YouTube' };
        const res = ValidationService.validateRecord(SHEETS.IDEAS, bad);
        t.truthy(!res.valid, 'should be invalid');
        const fields = res.errors.map(function (e) { return e.field; });
        t.truthy(fields.indexOf('Effort_Score') !== -1, 'effort flagged');
        t.truthy(fields.indexOf('Strategic_Goal') !== -1, 'goal flagged');
      },
    },
    {
      name: 'VAL-005 strategic goal uses approved 7 values',
      fn: function (t) {
        t.equal(ENUMS.STRATEGIC_GOAL.length, 7, 'expected 7 goals');
        ['Community', 'Retention'].forEach(function (g) {
          t.truthy(ENUMS.STRATEGIC_GOAL.indexOf(g) !== -1, g + ' present');
        });
      },
    },
    {
      name: 'VAL-006 scheduled end must be after start',
      fn: function (t) {
        const start = new Date(2026, 0, 1, 10, 0);
        const end = new Date(2026, 0, 1, 9, 0);
        const res = ValidationService.validateRecord(SHEETS.TASKS, { Scheduled_Start: start, Scheduled_End: end, Sequence: 1, Estimated_Minutes: 30, Status: 'Ready', Priority: 'Low', Calendar_Sync_Status: 'Not Synced', Recovery_Status: 'Not Required' });
        t.truthy(!res.valid, 'should reject end<=start');
      },
    },
  ];
}
