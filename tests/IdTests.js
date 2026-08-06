/**
 * IdTests.gs — immutable ID service tests (docs 21 §4, FR-002).
 * @returns {Array<{name:string, fn:Function}>}
 */
function IdTests_() {
  return [
    {
      name: 'ID-001 next() returns PREFIX-000000 format',
      fn: function (t) {
        const id = IdService.next(ID_PREFIX.TASK);
        t.truthy(/^TSK-\d{6}$/.test(id), 'bad format: ' + id);
      },
    },
    {
      name: 'ID-002 sequential ids are unique and increasing',
      fn: function (t) {
        const a = IdService.next(ID_PREFIX.IDEA);
        const b = IdService.next(ID_PREFIX.IDEA);
        t.truthy(a !== b, 'ids not unique');
        const na = parseInt(a.split('-')[1], 10);
        const nb = parseInt(b.split('-')[1], 10);
        t.equal(nb, na + 1, 'not strictly sequential');
      },
    },
    {
      name: 'ID-003 reserve() returns a contiguous block',
      fn: function (t) {
        const ids = IdService.reserve(ID_PREFIX.CONTENT, 3);
        t.equal(ids.length, 3, 'expected 3 ids');
        const nums = ids.map(function (x) { return parseInt(x.split('-')[1], 10); });
        t.equal(nums[1], nums[0] + 1, 'not contiguous');
        t.equal(nums[2], nums[1] + 1, 'not contiguous');
      },
    },
    {
      name: 'ID-004 validate() enforces shape and prefix',
      fn: function (t) {
        t.truthy(IdService.validate('TSK-000001', ID_PREFIX.TASK), 'should accept valid');
        t.truthy(!IdService.validate('TSK-000001', ID_PREFIX.IDEA), 'should reject wrong prefix');
        t.truthy(!IdService.validate('tsk-1'), 'should reject malformed');
        t.truthy(!IdService.validate('ZZZ-000001'), 'should reject unknown prefix');
      },
    },
    {
      name: 'ID-005 ensureAtLeast never lowers a counter',
      fn: function (t) {
        const before = IdService.peek(ID_PREFIX.WEEK);
        IdService.ensureAtLeast(ID_PREFIX.WEEK, before - 5);
        t.equal(IdService.peek(ID_PREFIX.WEEK), before, 'counter was lowered');
      },
    },
  ];
}
