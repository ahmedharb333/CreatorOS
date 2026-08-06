/**
 * run_gas_suites.js — executes the Spreadsheet-bound CreatorOS suites against the
 * Node mock of Apps Script (mock_gas.js). Builds the workbook, seeds workflows,
 * then runs the same TestRunner suites that run in Apps Script, and prints results
 * (including Markdown for TEST_RESULTS.md).
 *
 * Run:  node tests/node/run_gas_suites.js
 */
'use strict';
require('./mock_gas'); // installs GAS globals

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(__dirname, '..', '..', 'src');
const TESTS = path.join(__dirname, '..');

// Load order matters for class `extends` (BaseRepository before its subclasses).
const srcFiles = [
  'Common.js', 'Errors.js', 'Constants.js', 'LoggerService.js', 'IdService.js',
  'ValidationService.js', 'ConfigService.js',
  'repositories/BaseRepository.js', 'repositories/IdeaRepository.js', 'repositories/ContentRepository.js',
  'repositories/TaskRepository.js', 'repositories/WorkflowRepository.js', 'repositories/PerformanceRepository.js',
  'repositories/RepurposingRepository.js', 'repositories/WeeklyPlanRepository.js', 'repositories/SettingsRepository.js',
  'services/SetupService.js', 'services/IdeaService.js', 'services/ContentService.js',
  'services/WorkflowService.js', 'services/TaskService.js', 'services/CapacityService.js', 'services/PlanningService.js',
  'WorkbookService.js', 'WorkflowSeed.js', 'Menu.js', 'Main.js',
].map(function (f) { return path.join(SRC, f); });

const testFiles = [
  'TestRunner.js', 'SchemaTests.js', 'IdTests.js', 'ValidationTests.js', 'RepositoryTests.js', 'DomainTests.js', 'PlanningTests.js',
].map(function (f) { return path.join(TESTS, f); });

let code = '';
srcFiles.concat(testFiles).forEach(function (f) { code += fs.readFileSync(f, 'utf8') + '\n'; });

code += `
  var __out = { ok: false };
  try {
    var initRes = initializeWorkbook();
    __out.init = initRes;
    __out.result = TestRunner.runAll();
    __out.ok = true;
  } catch (e) {
    __out.error = (e && e.stack) ? e.stack : String(e);
  }
  __EXPORT(__out);
`;

let captured = null;
globalThis.__EXPORT = function (o) { captured = o; };
vm.runInThisContext(code, { filename: 'creatoros_gas_bundle.js' });

if (!captured || !captured.ok) {
  console.log('HARNESS ERROR:\n' + (captured && captured.error ? captured.error : 'unknown'));
  process.exitCode = 1;
} else {
  const r = captured.result;
  console.log('INIT: ' + captured.init.code + ' — ' + captured.init.message);
  console.log(r.text);
  console.log('\n----- MARKDOWN (for TEST_RESULTS.md) -----\n');
  console.log(r.markdown);
  if (r.failed > 0) process.exitCode = 1;
}
