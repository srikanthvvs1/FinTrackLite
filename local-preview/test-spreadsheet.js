const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const spreadsheet = {};
let opens = 0;
const context = vm.createContext({ SpreadsheetApp: {
  getActiveSpreadsheet() { throw new Error('No active spreadsheet in web app'); },
  openById(id) {
    assert.equal(id, 'test-spreadsheet-id');
    opens++;
    return spreadsheet;
  }
} });
for (const file of ['Config.gs', 'Database.gs']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
assert.throws(() => context.getSpreadsheet_(), /Missing spreadsheet configuration/);
context.FINTRACK_LOCAL_CONFIG = { SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID' };
assert.throws(() => context.getSpreadsheet_(), /Missing spreadsheet configuration/);
context.FINTRACK_LOCAL_CONFIG = { SPREADSHEET_ID: 'test-spreadsheet-id' };
assert.equal(context.getSpreadsheet_(), spreadsheet);
assert.equal(context.getSpreadsheet_(), spreadsheet);
assert.equal(opens, 1, 'Reuse the spreadsheet during one execution');
const fixture = {};
context.FINTRACK_TEST_SPREADSHEET_ = fixture;
assert.equal(context.getSpreadsheet_(), fixture, 'Local fixtures must override the live spreadsheet');
assert.equal(opens, 1);
console.log('PASS: explicit spreadsheet ID, execution cache, and isolated test override');
