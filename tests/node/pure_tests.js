/**
 * node_pure_tests.js — executes CreatorOS pure (Spreadsheet-independent) logic to
 * produce real pass/fail evidence for Milestone 1, with minimal GAS stubs.
 *
 * Run:  node tests/node_pure_tests.js   (from the package root)
 *
 * Spreadsheet-bound suites (Schema/Repository) run inside Apps Script via
 * CreatorOS ▸ Run Tests after `clasp push`.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..', 'src');
const files = ['Errors.js', 'Common.js', 'Constants.js', 'IdService.js', 'ValidationService.js'];

const stubs = `
  var Utilities = { formatDate: function (d, tz) { if (tz === 'Not/AZone') throw new Error('bad tz'); return '2026-01-01T00:00:00'; } };
  var Session = { getScriptTimeZone: function () { return 'Etc/GMT'; } };
`;

let code = stubs + '\n';
files.forEach(function (f) { code += fs.readFileSync(path.join(ROOT, f), 'utf8') + '\n'; });

code += `
  (function () {
    var passed = 0, failed = 0, failures = [];
    function ok(name, cond, detail) { if (cond) { passed++; } else { failed++; failures.push(name + (detail ? ' — ' + detail : '')); } }

    ok('ID validate good', IdService.validate('TSK-000001', ID_PREFIX.TASK));
    ok('ID validate wrong-prefix rejected', !IdService.validate('TSK-000001', ID_PREFIX.IDEA));
    ok('ID validate malformed rejected', !IdService.validate('tsk-1'));
    ok('ID validate unknown-prefix rejected', !IdService.validate('ZZZ-000001'));

    ok('enum accepts member', ValidationService.validateValue('High', {type:'enum', values:ENUMS.PRIORITY}).valid);
    ok('enum rejects non-member', !ValidationService.validateValue('Urgent', {type:'enum', values:ENUMS.PRIORITY}).valid);

    var sp = {type:'number', integer:true, min:1, max:5};
    ok('num 3 valid', ValidationService.validateValue(3, sp).valid);
    ok('num 6 invalid', !ValidationService.validateValue(6, sp).valid);
    ok('num 0 invalid', !ValidationService.validateValue(0, sp).valid);
    ok('num 2.5 non-integer invalid', !ValidationService.validateValue(2.5, sp).valid);

    ok('url valid', ValidationService.validateValue('https://x.co/a', {type:'url'}).valid);
    ok('url invalid', !ValidationService.validateValue('nope', {type:'url'}).valid);
    ok('date valid', ValidationService.validateValue(new Date(), {type:'date'}).valid);
    ok('date invalid', !ValidationService.validateValue('yesterday', {type:'date'}).valid);

    var res = ValidationService.validateRecord(SHEETS.IDEAS, {Idea_Title:'x', Effort_Score:9, Impact_Score:5, Confidence_Score:3, Strategic_Goal:'Nope', Status:'Captured', Primary_Platform:'YouTube'});
    var fields = res.errors.map(function(e){return e.field;});
    ok('record invalid', !res.valid);
    ok('effort flagged', fields.indexOf('Effort_Score') !== -1);
    ok('goal flagged', fields.indexOf('Strategic_Goal') !== -1);

    var r2 = ValidationService.validateRecord(SHEETS.TASKS, {Scheduled_Start:new Date(2026,0,1,10), Scheduled_End:new Date(2026,0,1,9), Sequence:1, Estimated_Minutes:30, Status:'Ready', Priority:'Low', Calendar_Sync_Status:'Not Synced', Recovery_Status:'Not Required'});
    ok('end<=start rejected', !r2.valid);

    ok('7 strategic goals', ENUMS.STRATEGIC_GOAL.length === 7);
    ok('Community present', ENUMS.STRATEGIC_GOAL.indexOf('Community') !== -1);
    ok('Retention present', ENUMS.STRATEGIC_GOAL.indexOf('Retention') !== -1);

    var w = CONFIG_DEFAULTS.reduce(function(a,c){a[c.key]=c.value;return a;},{});
    var priority = 5*w.IMPACT_WEIGHT + 4*w.CONFIDENCE_WEIGHT - 2*w.EFFORT_WEIGHT;
    ok('priority math = 3.3', Math.abs(priority - 3.3) < 1e-9, 'got ' + priority);

    ok('col 1 = A', columnToLetter(1) === 'A');
    ok('col 26 = Z', columnToLetter(26) === 'Z');
    ok('col 27 = AA', columnToLetter(27) === 'AA');
    ok('padNumber 42 -> 000042', padNumber(42, 6) === '000042');

    var clean = sanitizeForLog({api_key:'sk-123', Authorization:'Bearer x', nested:{token:'t', keep:'ok'}, keep:'v'});
    ok('api_key redacted', clean.api_key === '***redacted***');
    ok('Authorization redacted', clean.Authorization === '***redacted***');
    ok('nested token redacted', clean.nested.token === '***redacted***');
    ok('non-secret preserved', clean.keep === 'v' && clean.nested.keep === 'ok');

    ok('valid tz', ValidationService.isValidTimezone('Etc/GMT'));
    ok('invalid tz', !ValidationService.isValidTimezone('Not/AZone'));

    var e = appError(ERR.RECORD_VALIDATION_FAILED, {recordId:'IDE-1'});
    ok('AppError code', e.code === 'RECORD_VALIDATION_FAILED');
    ok('AppError toObject', e.toObject().recordId === 'IDE-1');

    console.log('PURE-LOGIC RESULTS: ' + passed + ' passed, ' + failed + ' failed, total ' + (passed+failed));
    if (failed) { failures.forEach(function(f){ console.log('  FAIL: ' + f); }); process.exitCode = 1; }
  })();
`;

vm.runInThisContext(code, { filename: 'creatoros_pure_bundle.js' });
