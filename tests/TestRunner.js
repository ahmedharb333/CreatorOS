/**
 * TestRunner.gs — lightweight GAS-native test harness (ASSUMPTIONS D3).
 *
 * Registers suites, runs them inside Apps Script, records pass/fail per case to
 * the console and SYSTEM_LOG, and returns a Markdown-ready summary. No external
 * dependencies. Run via CreatorOS ▸ Run Tests, or call `TestRunner.runAll()`.
 *
 * @see docs/21_Test_Specification.md
 */
const TestRunner = (function () {

  const MODULE = 'TestRunner';

  /** Assertion helpers passed to each case as `t`. */
  const t = {
    assert: function (cond, msg) { if (!cond) throw new Error('Assertion failed: ' + (msg || '')); },
    equal: function (actual, expected, msg) {
      if (actual !== expected) throw new Error((msg || 'equal') + ' — expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    },
    approx: function (actual, expected, epsilon, msg) {
      if (Math.abs(Number(actual) - Number(expected)) > (epsilon || 0.001)) {
        throw new Error((msg || 'approx') + ' — expected ~' + expected + ', got ' + actual);
      }
    },
    truthy: function (v, msg) { if (!v) throw new Error((msg || 'truthy') + ' — value was ' + JSON.stringify(v)); },
    throwsCode: function (fn, code, msg) {
      try { fn(); } catch (e) {
        if (code && e.code !== code) throw new Error((msg || 'throwsCode') + ' — expected ' + code + ', got ' + e.code + ' (' + e.message + ')');
        return;
      }
      throw new Error((msg || 'throwsCode') + ' — expected a throw, none occurred');
    },
  };

  /** Suite providers, each returns [{name, fn}]. Registered here in run order. */
  function suites() {
    return [
      { suite: 'Schema', cases: SchemaTests_() },
      { suite: 'IdService', cases: IdTests_() },
      { suite: 'Validation', cases: ValidationTests_() },
      { suite: 'Repository', cases: RepositoryTests_() },
      { suite: 'Domain', cases: (typeof DomainTests_ === 'function') ? DomainTests_() : [] },
      { suite: 'Planning', cases: (typeof PlanningTests_ === 'function') ? PlanningTests_() : [] },
      { suite: 'Calendar', cases: (typeof CalendarTests_ === 'function') ? CalendarTests_() : [] },
    ];
  }

  /**
   * Run every suite.
   * @returns {{passed:number, failed:number, total:number, results:Array, text:string, markdown:string}}
   */
  function runAll() {
    const results = [];
    let passed = 0, failed = 0;
    suites().forEach(function (group) {
      group.cases.forEach(function (c) {
        const rec = { suite: group.suite, name: c.name, pass: true, error: '' };
        try {
          c.fn(t);
          passed++;
        } catch (e) {
          rec.pass = false;
          rec.error = e && e.message ? e.message : String(e);
          failed++;
        }
        results.push(rec);
      });
    });
    const total = passed + failed;
    const text = summarizeText(results, passed, failed, total);
    const markdown = summarizeMarkdown(results, passed, failed, total);
    LoggerService.info(MODULE, 'Test run complete: ' + passed + '/' + total + ' passed', { detail: { passed: passed, failed: failed } });
    return { passed: passed, failed: failed, total: total, results: results, text: text, markdown: markdown };
  }

  /** @private */
  function summarizeText(results, passed, failed, total) {
    let s = 'CreatorOS Milestone 1 tests\n' + passed + ' / ' + total + ' passed, ' + failed + ' failed.\n';
    if (failed) {
      s += '\nFailures:\n';
      results.filter(function (r) { return !r.pass; }).forEach(function (r) {
        s += '• [' + r.suite + '] ' + r.name + ': ' + r.error + '\n';
      });
    } else {
      s += '\nAll green.';
    }
    return s;
  }

  /** @private Produce Markdown for TEST_RESULTS.md. */
  function summarizeMarkdown(results, passed, failed, total) {
    const rows = results.map(function (r) {
      return '| ' + r.suite + ' | ' + r.name + ' | ' + (r.pass ? 'PASS' : 'FAIL') + ' | ' + (r.error || '') + ' |';
    }).join('\n');
    return '## Executed run\n\n' + passed + ' / ' + total + ' passed, ' + failed + ' failed.\n\n' +
      '| Suite | Case | Result | Detail |\n|---|---|---|---|\n' + rows + '\n';
  }

  /** Test-only: delete a record row by id (keeps the workbook clean after mutating tests). */
  function _deleteById(sheetName, idHeader, id) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return;
    const last = sheet.getLastRow();
    if (last < 2) return;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idCol = headers.indexOf(idHeader);
    if (idCol === -1) return;
    const ids = sheet.getRange(2, idCol + 1, last - 1, 1).getValues();
    for (let r = ids.length - 1; r >= 0; r--) {
      if (ids[r][0] === id) { sheet.deleteRow(r + 2); return; }
    }
  }

  return { runAll: runAll, _deleteById: _deleteById, _t: t };
})();

/** Convenience wrapper so the function is directly runnable from the editor/clasp. */
function runAllTests() { return TestRunner.runAll(); }
