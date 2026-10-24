function runAllTests() {
  var results = [];
  var tests = [
    ['first initialization', testFirstInitialization_],
    ['repeat initialization', testRepeatInitialization_],
    ['exact seeded rows', testExactSeededRows_],
    ['exact six-sheet count', testExactSixSheetCount_],
    ['header mismatch failure', testHeaderMismatchFailure_],
    ['every account type can be created', testEveryAccountTypeCanBeCreated_],
    ['opening balance creates no movement', testOpeningBalanceCreatesNoMovement_],
    ['income add withdraw move and expense balance math', testBalanceMath_],
    ['moves are wealth-neutral', testMoveWealthNeutral_],
    ['insufficient balance fails without write', testInsufficientBalanceFailsWithoutWrite_],
    ['inactive and deleted accounts are blocked', testInactiveAndDeletedAccountsBlocked_],
    ['account edit archive and delete rules', testAccountLifecycle_],
    ['movement edit and void recalculate', testMovementEditAndVoid_],
    ['account activity read model', testAccountActivityReadModel_],
    ['expense module', testExpenseModule_],
    ['expense validation and rejected writes', testExpenseValidation_],
    ['five-month dashboard and chart reconciliation', testFiveMonthReports_],
    ['allocation boundaries and historical balances', testAllocationBoundaries_],
    ['activity filters pagination and signed effects', testGlobalActivity_],
    ['report validation and single bulk reads', testReportContracts_]
  ];
  tests.forEach(function (test) {
    try {
      test[1]();
      results.push({ name: test[0], status: 'PASS' });
    } catch (error) {
      results.push({ name: test[0], status: 'FAIL', message: error.message });
    } finally {
      FINTRACK_TEST_SPREADSHEET_ = null;
    }
  });
  var failed = results.filter(function (result) { return result.status === 'FAIL'; });
  var summary = { passed: results.length - failed.length, failed: failed.length, total: results.length, results: results };
  if (failed.length) {
    throw new Error('FinTrack Lite tests failed: ' + JSON.stringify(summary));
  }
  return summary;
}

function testFirstInitialization_() {
  FINTRACK_TEST_SPREADSHEET_ = new MemorySpreadsheet_('Foundation Test');
  var data = initializeFinTrackLite_();
  assertEqual_(6, data.sheetNames.length, 'first initialization sheet count');
  assertEqual_(7, data.accounts.length, 'first initialization account count');
  assertEqual_(15, data.expenseCategories.length, 'first initialization category count');
  data.sheetNames.forEach(function (name) {
    assertArrayEqual_(headersFor_(name), FINTRACK_TEST_SPREADSHEET_.getSheetByName(name).values[0], name + ' headers');
    assertEqual_(1, FINTRACK_TEST_SPREADSHEET_.getSheetByName(name).frozenRows, name + ' frozen row count');
  });
}

function testRepeatInitialization_() {
  FINTRACK_TEST_SPREADSHEET_ = new MemorySpreadsheet_('Repeat Test');
  initializeFinTrackLite_();
  var before = snapshotMemorySpreadsheet_(FINTRACK_TEST_SPREADSHEET_);
  initializeFinTrackLite_();
  var after = snapshotMemorySpreadsheet_(FINTRACK_TEST_SPREADSHEET_);
  assertEqual_(before, after, 'repeat initialization must not change rows');
}

function testExactSeededRows_() {
  FINTRACK_TEST_SPREADSHEET_ = new MemorySpreadsheet_('Seed Test');
  initializeFinTrackLite_();
  var settings = readRows_(FINTRACK_CONFIG.SHEETS.SETTINGS);
  assertArrayEqual_(FINTRACK_CONFIG.SEED_SETTINGS.map(function (row) { return row.key; }), settings.map(function (row) { return row.key; }), 'setting keys');
  assertArrayEqual_(FINTRACK_CONFIG.SEED_SETTINGS.map(function (row) { return row.value; }), settings.map(function (row) { return row.value; }), 'setting values');
  settings.forEach(function (row) { assertMatches_(row.updatedAt, /^\d{4}-\d{2}-\d{2}T/, row.key + ' updatedAt'); });
  var accounts = readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS);
  assertArrayEqual_(FINTRACK_CONFIG.SEED_ACCOUNTS.map(function (row) { return row.name; }), accounts.map(function (row) { return row.name; }), 'seed account names');
  assertArrayEqual_(FINTRACK_CONFIG.SEED_ACCOUNTS.map(function (row) { return row.accountType; }), accounts.map(function (row) { return row.accountType; }), 'seed account types');
  assertArrayEqual_(FINTRACK_CONFIG.SEED_ACCOUNTS.map(function (row) { return row.accountGroup; }), accounts.map(function (row) { return row.accountGroup; }), 'seed account groups');
  accounts.forEach(function (row) {
    assertMatches_(row.id, /^[0-9a-f-]{36}$/i, row.name + ' UUID');
    assertMatches_(row.openingDate, /^\d{4}-\d{2}-\d{2}$/, row.name + ' opening date');
    assertEqual_(0, row.openingBalance, row.name + ' opening balance');
    assertEqual_(true, row.active, row.name + ' active');
    assertEqual_('', row.deletedAt, row.name + ' deletedAt');
    assertEqual_('', row.notes, row.name + ' notes');
    assertMatches_(row.createdAt, /^\d{4}-\d{2}-\d{2}T/, row.name + ' createdAt');
    assertEqual_(row.createdAt, row.updatedAt, row.name + ' timestamps');
  });
  var categories = readRows_(FINTRACK_CONFIG.SHEETS.EXPENSE_CATEGORIES);
  assertArrayEqual_(FINTRACK_CONFIG.SEED_EXPENSE_CATEGORIES.map(function (row) { return row.code; }), categories.map(function (row) { return row.code; }), 'category codes');
  assertArrayEqual_(FINTRACK_CONFIG.SEED_EXPENSE_CATEGORIES.map(function (row) { return row.label; }), categories.map(function (row) { return row.label; }), 'category labels');
  assertArrayEqual_(FINTRACK_CONFIG.SEED_EXPENSE_CATEGORIES.map(function (row) { return row.defaultNature; }), categories.map(function (row) { return row.defaultNature; }), 'category natures');
  assertArrayEqual_(categories.map(function (row, index) { return index + 1; }), categories.map(function (row) { return row.sortOrder; }), 'category sort order');
  categories.forEach(function (row) { assertEqual_(true, row.active, row.code + ' active'); });
}

function testExactSixSheetCount_() {
  FINTRACK_TEST_SPREADSHEET_ = new MemorySpreadsheet_('Count Test');
  initializeFinTrackLite_();
  assertEqual_(6, FINTRACK_TEST_SPREADSHEET_.getSheets().length, 'exact physical sheet count');
  assertArrayEqual_(sheetNames_(), FINTRACK_TEST_SPREADSHEET_.getSheets().map(function (sheet) { return sheet.getName(); }), 'exact physical sheet names');
}

function testHeaderMismatchFailure_() {
  FINTRACK_TEST_SPREADSHEET_ = new MemorySpreadsheet_('Mismatch Test');
  var sheet = FINTRACK_TEST_SPREADSHEET_.insertSheet(FINTRACK_CONFIG.SHEETS.ACCOUNTS);
  sheet.getRange(1, 1, 1, 2).setValues([['id', 'wrongHeader']]);
  var message = '';
  try {
    initializeFinTrackLite_();
  } catch (error) {
    message = error.message;
  }
  assertContains_(message, 'Header mismatch in sheet "Accounts"', 'mismatch sheet name');
  assertContains_(message, 'Expected: [id, name, accountType', 'mismatch expected headers');
  assertContains_(message, 'Actual: [id, wrongHeader]', 'mismatch actual headers');
  assertEqual_(1, FINTRACK_TEST_SPREADSHEET_.getSheets().length, 'mismatch must stop before creating sheets');
}

function testEveryAccountTypeCanBeCreated_() {
  initializeTestSpreadsheet_('Account Types Test');
  FINTRACK_CONFIG.ACCOUNT_TYPE_OPTIONS.forEach(function (option, index) {
    var payload = {
      name: 'Created ' + option.label,
      accountType: option.value,
      openingDate: '2026-01-01',
      openingBalance: index + 0.25,
      notes: 'Created by account-type test'
    };
    if (option.value === 'CUSTOM') payload.accountGroup = 'FUND';
    var created = createAccount_(payload);
    assertEqual_(option.value, created.accountType, option.label + ' type');
    assertEqual_(option.value === 'CUSTOM' ? 'FUND' : option.group, created.accountGroup, option.label + ' group');
  });
  assertEqual_(FINTRACK_CONFIG.SEED_ACCOUNTS.length + FINTRACK_CONFIG.ACCOUNT_TYPE_OPTIONS.length, readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS).length, 'all account types row count');
}

function testOpeningBalanceCreatesNoMovement_() {
  initializeTestSpreadsheet_('Opening Balance Test');
  var account = createAccount_({ name: 'Opening Bucket', accountType: 'FIXED_DEPOSIT', openingDate: '2026-01-01', openingBalance: 123.456, notes: '' });
  var movements = readRows_(FINTRACK_CONFIG.SHEETS.MOVEMENTS);
  var balances = calculateBalances_(readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS), movements, []);
  assertEqual_(0, movements.length, 'opening balance movement count');
  assertEqual_(123.46, balances.byAccountId[account.id], 'rounded opening balance');
}

function testBalanceMath_() {
  initializeTestSpreadsheet_('Balance Math Test');
  var cash = accountByNameForTest_('Cash / Salary');
  var expenseAccount = accountByNameForTest_('Expenses');
  var mutualFunds = accountByNameForTest_('Mutual Funds');
  recordIncome_(movementPayloadForTest_('2026-01-01', '', cash.id, 1000, 'Income'));
  addToAccount_(movementPayloadForTest_('2026-01-02', '', mutualFunds.id, 50, 'External add'));
  moveBetweenAccounts_(movementPayloadForTest_('2026-01-03', cash.id, expenseAccount.id, 300, 'Allocate'));
  withdrawFromAccount_(movementPayloadForTest_('2026-01-04', mutualFunds.id, '', 25, 'Withdraw'));
  appendExpenseForTest_(expenseAccount.id, '2026-01-05', 100, 'housing', 'Rent');
  var balances = currentBalancesForTest_();
  assertEqual_(700, balances.byAccountId[cash.id], 'cash balance');
  assertEqual_(200, balances.byAccountId[expenseAccount.id], 'expense account balance');
  assertEqual_(25, balances.byAccountId[mutualFunds.id], 'mutual fund balance');
  assertEqual_(925, balances.total, 'tracked total');
}

function testMoveWealthNeutral_() {
  initializeTestSpreadsheet_('Move Neutral Test');
  var cash = accountByNameForTest_('Cash / Salary');
  var gold = accountByNameForTest_('Gold');
  recordIncome_(movementPayloadForTest_('2026-01-01', '', cash.id, 500, 'Income'));
  var before = currentBalancesForTest_().total;
  moveBetweenAccounts_(movementPayloadForTest_('2026-01-02', cash.id, gold.id, 125, 'Allocate to gold'));
  var after = currentBalancesForTest_();
  assertEqual_(before, after.total, 'move total');
  assertEqual_(375, after.byAccountId[cash.id], 'move source');
  assertEqual_(125, after.byAccountId[gold.id], 'move destination');
}

function testInsufficientBalanceFailsWithoutWrite_() {
  initializeTestSpreadsheet_('Insufficient Test');
  var cash = accountByNameForTest_('Cash / Salary');
  recordIncome_(movementPayloadForTest_('2026-01-01', '', cash.id, 100, 'Income'));
  var beforeRows = readRows_(FINTRACK_CONFIG.SHEETS.MOVEMENTS).length;
  assertThrows_(function () {
    withdrawFromAccount_(movementPayloadForTest_('2026-01-02', cash.id, '', 100.01, 'Too much'));
  }, 'negative balance', 'over-withdrawal error');
  assertEqual_(beforeRows, readRows_(FINTRACK_CONFIG.SHEETS.MOVEMENTS).length, 'failed withdrawal row count');
}

function testInactiveAndDeletedAccountsBlocked_() {
  initializeTestSpreadsheet_('Blocked Account Test');
  var archived = createAccount_({ name: 'Archived Bucket', accountType: 'TRAVEL_FUND', openingDate: '2026-01-01', openingBalance: 0, notes: '' });
  archiveAccount_({ id: archived.id });
  assertThrows_(function () {
    addToAccount_(movementPayloadForTest_('2026-01-01', '', archived.id, 10, 'Blocked'));
  }, 'archived', 'archived action');
  var deleted = createAccount_({ name: 'Deleted Bucket', accountType: 'HOME_FUND', openingDate: '2026-01-01', openingBalance: 0, notes: '' });
  deleteAccount_({ id: deleted.id });
  assertThrows_(function () {
    recordIncome_(movementPayloadForTest_('2026-01-01', '', deleted.id, 10, 'Blocked'));
  }, 'deleted', 'deleted action');
}

function testAccountLifecycle_() {
  initializeTestSpreadsheet_('Account Lifecycle Test');
  var account = createAccount_({ name: 'Lifecycle Bucket', accountType: 'CASH', openingDate: '2026-01-01', openingBalance: 10, notes: '' });
  var updated = updateAccount_({ id: account.id, name: 'Renamed Bucket', notes: 'Updated' });
  assertEqual_('Renamed Bucket', updated.name, 'updated account name');
  assertThrows_(function () {
    updateAccount_({ id: account.id, name: 'Bad Change', notes: '', openingBalance: 0 });
  }, 'cannot change', 'immutable opening balance');
  assertThrows_(function () { deleteAccount_({ id: account.id }); }, 'still has', 'non-zero delete');
  withdrawFromAccount_(movementPayloadForTest_('2026-01-01', account.id, '', 10, 'Clear balance'));
  var deleted = deleteAccount_({ id: account.id });
  assertEqual_(false, deleted.active, 'deleted active flag');
  assertMatches_(deleted.deletedAt, /^\d{4}-\d{2}-\d{2}T/, 'deleted timestamp');
}

function testMovementEditAndVoid_() {
  initializeTestSpreadsheet_('Movement Edit Test');
  var cash = accountByNameForTest_('Cash / Salary');
  var expenseAccount = accountByNameForTest_('Expenses');
  var income = recordIncome_(movementPayloadForTest_('2026-01-01', '', cash.id, 1000, 'Income'));
  var moved = moveBetweenAccounts_(movementPayloadForTest_('2026-01-02', cash.id, expenseAccount.id, 300, 'Allocate'));
  assertThrows_(function () {
    updateMovement_({ id: income.id, date: '2026-01-01', amount: 200, description: 'Too small', notes: '', fromAccountId: '', toAccountId: cash.id });
  }, 'negative balance', 'edit must revalidate');
  assertThrows_(function () { voidMovement_({ id: income.id }); }, 'negative balance', 'void must revalidate');
  updateMovement_({ id: moved.id, date: '2026-01-02', amount: 250, description: 'Adjusted allocation', notes: '', fromAccountId: cash.id, toAccountId: expenseAccount.id });
  var editedBalances = currentBalancesForTest_();
  assertEqual_(750, editedBalances.byAccountId[cash.id], 'edited source balance');
  assertEqual_(250, editedBalances.byAccountId[expenseAccount.id], 'edited destination balance');
  var voided = voidMovement_({ id: moved.id });
  assertEqual_('VOID', voided.status, 'void status');
  var voidedBalances = currentBalancesForTest_();
  assertEqual_(1000, voidedBalances.byAccountId[cash.id], 'voided source balance');
  assertEqual_(0, voidedBalances.byAccountId[expenseAccount.id], 'voided destination balance');
}

function testAccountActivityReadModel_() {
  initializeTestSpreadsheet_('Activity Test');
  var cash = accountByNameForTest_('Cash / Salary');
  var expenseAccount = accountByNameForTest_('Expenses');
  recordIncome_(movementPayloadForTest_('2026-01-01', '', cash.id, 500, 'Income'));
  moveBetweenAccounts_(movementPayloadForTest_('2026-01-02', cash.id, expenseAccount.id, 200, 'Move'));
  appendExpenseForTest_(expenseAccount.id, '2026-01-03', 50, 'grocery', 'Groceries');
  var page = getAccountsPageData_({ selectedAccountId: expenseAccount.id, activityStartDate: '2026-01-01', activityEndDate: '2026-01-31', includeArchived: false });
  assertEqual_(expenseAccount.id, page.selectedAccountId, 'selected account');
  assertEqual_(150, page.selectedAccount.balance, 'selected balance');
  assertEqual_(2, page.activity.length, 'activity row count');
  assertEqual_('EXPENSE', page.activity[0].type, 'newest activity type');
  assertEqual_(-50, page.activity[0].signedAmount, 'expense signed amount');
  assertEqual_(200, page.activity[1].signedAmount, 'move signed amount');
}

function initializeTestSpreadsheet_(name) {
  FINTRACK_TEST_SPREADSHEET_ = new MemorySpreadsheet_(name);
  initializeFinTrackLite_();
}

function accountByNameForTest_(name) {
  return readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS).filter(function (account) { return account.name === name; })[0];
}

function movementPayloadForTest_(date, fromAccountId, toAccountId, amount, description) {
  return { date: date, fromAccountId: fromAccountId, toAccountId: toAccountId, amount: amount, description: description, notes: '' };
}

function appendExpenseForTest_(accountId, date, amount, category, description) {
  var now = nowIso_();
  appendRow_(FINTRACK_CONFIG.SHEETS.EXPENSES, {
    id: uuid_(), date: date, accountId: accountId, amount: amount,
    expenseCategory: category, expenseNature: category === 'housing' ? 'FIXED' : 'VARIABLE',
    description: description, notes: '', status: 'ACTIVE', createdAt: now, updatedAt: now
  });
}

function currentBalancesForTest_() {
  return calculateBalances_(readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS), readRows_(FINTRACK_CONFIG.SHEETS.MOVEMENTS), readRows_(FINTRACK_CONFIG.SHEETS.EXPENSES));
}

function assertEqual_(expected, actual, label) {
  if (expected !== actual) throw new Error(label + ': expected ' + expected + ', received ' + actual);
}

function assertArrayEqual_(expected, actual, label) {
  assertEqual_(JSON.stringify(expected), JSON.stringify(actual), label);
}

function assertContains_(actual, expectedPart, label) {
  if (String(actual).indexOf(expectedPart) < 0) throw new Error(label + ': expected "' + expectedPart + '" in "' + actual + '"');
}

function assertMatches_(actual, pattern, label) {
  if (!pattern.test(String(actual))) throw new Error(label + ': value "' + actual + '" did not match ' + pattern);
}

function assertThrows_(callback, expectedPart, label) {
  var message = '';
  try { callback(); } catch (error) { message = error.message; }
  assertContains_(message, expectedPart, label);
}

function snapshotMemorySpreadsheet_(spreadsheet) {
  return JSON.stringify(spreadsheet.getSheets().map(function (sheet) { return { name: sheet.getName(), values: sheet.values, frozenRows: sheet.frozenRows }; }));
}

function MemorySpreadsheet_(name) {
  this.name = name;
  this.sheets = [];
}
MemorySpreadsheet_.prototype.getName = function () { return this.name; };
MemorySpreadsheet_.prototype.getSpreadsheetTimeZone = function () { return 'Asia/Kolkata'; };
MemorySpreadsheet_.prototype.getSheets = function () { return this.sheets.slice(); };
MemorySpreadsheet_.prototype.getSheetByName = function (name) {
  return this.sheets.filter(function (sheet) { return sheet.name === name; })[0] || null;
};
MemorySpreadsheet_.prototype.insertSheet = function (name) {
  var sheet = new MemorySheet_(name);
  this.sheets.push(sheet);
  return sheet;
};

function MemorySheet_(name) {
  this.name = name;
  this.values = [];
  this.frozenRows = 0;
}
MemorySheet_.prototype.getName = function () { return this.name; };
MemorySheet_.prototype.getLastRow = function () { return this.values.length; };
MemorySheet_.prototype.getLastColumn = function () {
  return this.values.reduce(function (maximum, row) { return Math.max(maximum, row.length); }, 0);
};
MemorySheet_.prototype.setFrozenRows = function (count) { this.frozenRows = count; };
MemorySheet_.prototype.getRange = function (row, column, rowCount, columnCount) {
  return new MemoryRange_(this, row, column, rowCount, columnCount);
};

function MemoryRange_(sheet, row, column, rowCount, columnCount) {
  this.sheet = sheet;
  this.row = row;
  this.column = column;
  this.rowCount = rowCount;
  this.columnCount = columnCount;
}
MemoryRange_.prototype.getValues = function () {
  var output = [];
  for (var r = 0; r < this.rowCount; r += 1) {
    var source = this.sheet.values[this.row - 1 + r] || [];
    var values = [];
    for (var c = 0; c < this.columnCount; c += 1) values.push(source[this.column - 1 + c] === undefined ? '' : source[this.column - 1 + c]);
    output.push(values);
  }
  return output;
};
MemoryRange_.prototype.setValues = function (values) {
  for (var r = 0; r < this.rowCount; r += 1) {
    var targetRow = this.row - 1 + r;
    while (this.sheet.values.length <= targetRow) this.sheet.values.push([]);
    for (var c = 0; c < this.columnCount; c += 1) this.sheet.values[targetRow][this.column - 1 + c] = values[r][c];
  }
  return this;
};
function testExpenseModule_() {
  FINTRACK_TEST_SPREADSHEET_=new MemorySpreadsheet_('Expense test');initializeFinTrackLite_();
  var accounts=readRows_('Accounts'),cash=accounts[0],source=accounts[1];
  assertEqual_(source.id,defaultExpenseSource_(accounts).id,'default source');source.active=false;assertEqual_(cash.id,defaultExpenseSource_(accounts).id,'fallback source');source.active=true;
  addToAccount_({date:todayIso_(),toAccountId:source.id,amount:10000});addToAccount_({date:todayIso_(),toAccountId:cash.id,amount:1000});
  var movementCount=readRows_('Movements').length;
  FINTRACK_CONFIG.SEED_EXPENSE_CATEGORIES.forEach(function(c,i){['FIXED','VARIABLE'].forEach(function(n){createExpense_({date:todayIso_(),accountId:source.id,amount:10,expenseCategory:c.code,expenseNature:n});});});
  assertEqual_(movementCount,readRows_('Movements').length,'no expense movements');
  var report=getExpenseReport_({});assertEqual_(300,report.total,'total');assertEqual_(150,report.fixedTotal,'fixed');assertEqual_(30,report.activeTransactionCount,'count');assertEqual_(15,report.categoryTotals.length,'all categories');
  assertEqual_(20,getExpenseReport_({category:'housing'}).total,'category filter');assertEqual_(150,getExpenseReport_({nature:'FIXED'}).total,'nature filter');assertEqual_(0,getExpenseReport_({accountId:cash.id}).total,'account filter');
  var row=report.rows[0],p={id:row.id,date:row.date,accountId:cash.id,amount:100,expenseCategory:'housing',expenseNature:'FIXED'};updateExpense_(p);assertEqual_(900,currentBalancesForTest_().byAccountId[cash.id],'edited source');assertEqual_(9710,currentBalancesForTest_().byAccountId[source.id],'old source restored');
  voidExpense_({id:row.id});assertEqual_(1000,currentBalancesForTest_().byAccountId[cash.id],'void restores');assertEqual_(29,getExpenseReport_({}).rows.length,'void hidden');assertEqual_(30,getExpenseReport_({includeVoid:true}).rows.length,'void retained');
  var before=snapshotMemorySpreadsheet_(FINTRACK_TEST_SPREADSHEET_);
  p.id=undefined;delete p.id;p.amount=100000;assertThrows_(function(){createExpense_(p);},'negative','insufficient');assertEqual_(before,snapshotMemorySpreadsheet_(FINTRACK_TEST_SPREADSHEET_),'no failed write');
  p.amount=1;p.accountId=accounts[2].id;assertThrows_(function(){createExpense_(p);},'CASH or EXPENSE','investment rejected');
  moveBetweenAccounts_({date:todayIso_(),fromAccountId:cash.id,toAccountId:accounts[2].id,amount:100});assertEqual_(290,getExpenseReport_({}).total,'investment move not spending');
  assertEqual_(0,getExpenseReport_({category:'other',nature:'FIXED',accountId:cash.id}).total,'combined filter zeros');
  assertThrows_(function(){getExpenseReport_({startDate:todayIso_(),endDate:'2026-01-01'});},'Start date','date range');
}

function testExpenseValidation_() {
  FINTRACK_TEST_SPREADSHEET_=new MemorySpreadsheet_('Expense validation');initializeFinTrackLite_();
  var a=readRows_('Accounts'), date=todayIso_();addToAccount_({date:date,toAccountId:a[0].id,amount:100});
  var base={date:date,accountId:a[0].id,amount:10,expenseCategory:'food',expenseNature:'VARIABLE'};
  function rejected(field,value,message){var p=Object.assign({},base);p[field]=value;var before=snapshotMemorySpreadsheet_(FINTRACK_TEST_SPREADSHEET_);assertThrows_(function(){createExpense_(p);},message,'reject '+field);assertEqual_(before,snapshotMemorySpreadsheet_(FINTRACK_TEST_SPREADSHEET_),'rejection atomic '+field);}
  rejected('date','2026-02-30','YYYY-MM-DD');rejected('date','2099-01-01','later than today');rejected('date','','required');rejected('expenseCategory','bogus','category');rejected('expenseNature','bogus','Nature');rejected('amount',0,'greater than 0');rejected('amount',0.001,'at least 0.01');rejected('description',new Array(242).join('x'),'240');rejected('notes',new Array(1002).join('x'),'1000');
  var e=createExpense_(base);var before=snapshotMemorySpreadsheet_(FINTRACK_TEST_SPREADSHEET_);assertThrows_(function(){updateExpense_(Object.assign({},base,{id:e.id,amount:200}));},'negative','edit overdraw');assertEqual_(before,snapshotMemorySpreadsheet_(FINTRACK_TEST_SPREADSHEET_),'edit rejection atomic');
  var noData=getExpenseReport_({startDate:'2026-01-01',endDate:'2026-01-02'});assertEqual_(0,noData.total,'date excludes');assertEqual_(15,noData.categoryTotals.length,'empty categories zero filled');
  archiveAccount_({id:a[0].id});rejected('accountId',a[0].id,'archived');
  voidExpense_({id:e.id});assertThrows_(function(){voidExpense_({id:e.id});},'active expense','double void');assertThrows_(function(){updateExpense_(Object.assign({},base,{id:e.id}));},'active expense','edit void');
  assertEqual_(2,readRows_('AuditLog').filter(function(r){return r.entityType==='EXPENSE';}).length,'only create and void success audits');
}


function fiveMonthScenarioForTest_() {
  initializeTestSpreadsheet_('Prompt 04 five months');
  [['Fixed Deposit','FIXED_DEPOSIT'],['Emergency','EMERGENCY_FUND'],['Travel','TRAVEL_FUND'],['Chit','CHIT']].forEach(function(pair){createAccount_({name:pair[0],accountType:pair[1],openingDate:'2026-01-01',openingBalance:0});});
  var byName={};readRows_('Accounts').forEach(function(a){byName[a.name]=a;});
  function movement(type,date,from,to,amount,description){return createMovement_(type,{date:date,fromAccountId:from?byName[from].id:'',toAccountId:to?byName[to].id:'',amount:amount,description:description||''});}
  var schedules=[
    {moves:[['Expenses',30000],['Mutual Funds',20000],['Emergency',5000]],expenses:[['housing',10000],['grocery',5000]]},
    {moves:[['Expenses',30000],['Stocks',15000],['Travel',5000]],expenses:[['housing',10000],['grocery',8000]]},
    {moves:[['Expenses',30000],['PPF',10000],['NPS',5000],['Gold',5000],['Chit',5000]],expenses:[['housing',12000],['utilities',6000]]},
    {moves:[['Expenses',25000],['Fixed Deposit',15000]],expenses:[['housing',10000],['travel',4000]]},
    {moves:[['Expenses',20000],['Mutual Funds',10000],['Chit',5000]],expenses:[['housing',10000],['personal_care',2000]]}
  ];
  schedules.forEach(function(schedule,i){var date='2026-0'+(i+1)+'-15';movement('INCOME',date,'','Cash / Salary',60000,'Salary first');movement('INCOME',date,'','Cash / Salary',40000,'Salary second');schedule.moves.forEach(function(pair){movement('MOVE',date,'Cash / Salary',pair[0],pair[1]);});schedule.expenses.forEach(function(pair){createExpense_({date:date,accountId:byName.Expenses.id,amount:pair[1],expenseCategory:pair[0],expenseNature:pair[0]==='housing'?'FIXED':'VARIABLE',description:'Monthly '+pair[0]});});if(i===3){movement('ADD',date,'','Emergency',1000);movement('WITHDRAW',date,'Travel','',1000);}});
  Object.keys(byName).forEach(function(name){movement('ADD','2026-05-31','',name,100);movement('WITHDRAW','2026-05-31',name,'',100);});
  var disposable=movement('ADD','2026-05-31','','Fixed Deposit',250,'Disposable void check');voidMovement_({id:disposable.id});
  return byName;
}

function testFiveMonthReports_() {
  var accounts=fiveMonthScenarioForTest_();
  var expected={'Cash / Salary':265000,Expenses:58000,'Mutual Funds':30000,Stocks:15000,PPF:10000,NPS:5000,Gold:5000,'Fixed Deposit':15000,Emergency:6000,Travel:4000,Chit:10000};
  var balances=currentBalancesForTest_();Object.keys(expected).forEach(function(name){assertEqual_(expected[name],balances.byAccountId[accounts[name].id],name+' reconciled');});
  var dashboard=getDashboardData_({month:'2026-05'});
  assertArrayEqual_([100000,12000,15000,73000],dashboard.cards.map(function(c){return c.value;}),'May cards');
  assertArrayEqual_(['Income','Expenses','Net allocated to investments & funds','Salary allocation remainder'],dashboard.cards.map(function(c){return c.label;}),'card labels');
  assertEqual_(12,dashboard.monthlyFlow.length,'12 calendar months');assertEqual_('2025-06',dashboard.monthlyFlow[0].month,'window begins June');
  var monthly=[[100000,15000,25000,60000],[100000,18000,20000,62000],[100000,18000,25000,57000],[100000,14000,15000,71000],[100000,12000,15000,73000]];
  dashboard.monthlyFlow.slice(7).forEach(function(row,i){assertArrayEqual_(monthly[i],[row.income,row.expenses,row.netAllocated,row.remainder],row.month+' chart values');});
  dashboard.monthlyFlow.slice(0,7).forEach(function(row){assertArrayEqual_([0,0,0,0],[row.income,row.expenses,row.netAllocated,row.remainder],'zero month');});
  assertArrayEqual_([265000,58000,80000,20000],['CASH','EXPENSE','INVESTMENT','FUND'].map(function(g){return dashboard.totalsByGroup[g];}),'group chart totals');assertEqual_(423000,dashboard.totalTrackedBalance,'total tracked');
  assertArrayEqual_([10000,2000],dashboard.categoryTotals.filter(function(c){return c.total;}).map(function(c){return c.total;}),'May category chart');
  assertEqual_(77000,getExpenseReport_({startDate:'2026-01-01',endDate:'2026-05-31'}).total,'retained expense report');
  assertEqual_(11,dashboard.accounts.length,'one balance per account');
  assertEqual_(false,/Net Worth|Current Value|NAV|Unrealized|Cost Basis|Holdings|Portfolio/i.test(JSON.stringify(dashboard)),'no forbidden chart labels');
}

function testAllocationBoundaries_() {
  initializeTestSpreadsheet_('Allocation boundaries');
  var cash=accountByNameForTest_('Cash / Salary'),mf=accountByNameForTest_('Mutual Funds'),gold=accountByNameForTest_('Gold');
  var fund=createAccount_({name:'Opening fund',accountType:'CHIT',openingDate:'2026-01-01',openingBalance:500});
  recordIncome_({date:'2026-05-01',toAccountId:cash.id,amount:1000});
  moveBetweenAccounts_({date:'2026-05-02',fromAccountId:cash.id,toAccountId:mf.id,amount:400});
  moveBetweenAccounts_({date:'2026-05-03',fromAccountId:mf.id,toAccountId:fund.id,amount:100});
  moveBetweenAccounts_({date:'2026-05-04',fromAccountId:fund.id,toAccountId:cash.id,amount:150});
  addToAccount_({date:'2026-05-05',toAccountId:gold.id,amount:20});withdrawFromAccount_({date:'2026-05-05',fromAccountId:gold.id,amount:20});
  archiveAccount_({id:mf.id});deleteAccount_({id:gold.id});
  var dashboard=getDashboardData_({month:'2026-05'});assertEqual_(250,dashboard.cards[2].value,'internal moves cancel and outward moves subtract');assertEqual_(750,dashboard.cards[3].value,'external add/withdraw excluded');assertEqual_(1500,dashboard.totalTrackedBalance,'opening included only in balances');
  assertEqual_(true,dashboard.accounts.some(function(a){return a.id===mf.id;}),'archived retained');assertEqual_(false,dashboard.accounts.some(function(a){return a.id===gold.id;}),'deleted hidden');
  var april=getDashboardData_({month:'2026-04'});assertArrayEqual_([0,0,0,0],april.cards.map(function(c){return c.value;}),'opening not monthly income');assertEqual_(1500,april.totalTrackedBalance,'balances current regardless of month');
  moveBetweenAccounts_({date:'2026-05-06',fromAccountId:fund.id,toAccountId:cash.id,amount:100});
  assertEqual_(150,getDashboardData_({month:'2026-05'}).cards[2].value,'live report after write');
}

function testGlobalActivity_() {
  var accounts=fiveMonthScenarioForTest_(), all=getActivityPage_({startDate:'2026-01-01',endDate:'2026-05-31',status:'ALL'});
  assertEqual_(61,all.totalCount,'combined rows including void');
  var voids=getActivityPage_({status:'VOID'});assertEqual_(1,voids.rows.length,'void filter');assertEqual_(0,voids.rows[0].signedAmount,'void zero effect');assertEqual_(250,Number(voids.rows[0].amount),'void original amount');
  var search=getActivityPage_({status:'ALL',search:'DISPOSABLE'});assertEqual_(1,search.rows.length,'case-insensitive description search');
  assertEqual_(0,getActivityPage_({search:'unmatched'}).rows.length,'empty search');
  var expense=getActivityPage_({kind:'EXPENSE'});assertEqual_(2,expense.rows.length,'May expenses');assertEqual_(true,expense.rows.every(function(r){return r.signedAmount<0&&r.expenseCategory;}),'expenses include edit fields');
  var selected=getActivityPage_({kind:'MOVE',accountId:accounts['Mutual Funds'].id});assertEqual_(10000,selected.rows[0].signedAmount,'selected move-in positive');
  var cash=getActivityPage_({kind:'MOVE',accountId:accounts['Cash / Salary'].id});assertEqual_(true,cash.rows.every(function(r){return r.signedAmount<0;}),'selected move-out negative');
  var transfers=getActivityPage_({kind:'MOVE'});assertEqual_(true,transfers.rows.every(function(r){return r.signedAmount===0;}),'global moves net zero');
  for(var i=0;i<115;i++)addToAccount_({date:'2026-05-31',toAccountId:accounts['Cash / Salary'].id,amount:1,description:'Pagination '+i});
  var first=getActivityPage_({kind:'ADD'}),second=getActivityPage_({kind:'ADD',cursor:first.nextCursor});assertEqual_(100,first.rows.length,'page capped at 100');assertEqual_(true,first.hasMore,'has older');assertEqual_(false,second.hasMore,'last page');assertEqual_(126,first.rows.length+second.rows.length,'no pagination skips');
  var rows=first.rows.concat(second.rows),ids={};rows.forEach(function(r,index){assertEqual_(false,!!ids[r.id],'no duplicate ID');ids[r.id]=true;if(index)assertEqual_(true,rows[index-1].cursor.localeCompare(r.cursor)>0,'stable newest-first tie order');});
}

function testReportContracts_() {
  initializeTestSpreadsheet_('Report contracts');
  [['month','2026-13'],['month','2026-5'],['month','2099-01']].forEach(function(pair){var p={};p[pair[0]]=pair[1];assertThrows_(function(){getDashboardData_(p);},'Month','invalid month');});
  assertThrows_(function(){getDashboardData_({balance:1});},'cannot change','unknown dashboard field');
  [{kind:'BOGUS'},{status:'BOGUS'},{cursor:'broken'},{startDate:'2026-05-10',endDate:'2026-05-01'},{accountId:'missing'}].forEach(function(p){var threw=false;try{getActivityPage_(p);}catch(e){threw=true;}assertEqual_(true,threw,'invalid activity request');});
  assertEqual_(todayIso_().slice(0,7),getDashboardData_().month,'default current month');assertEqual_('ACTIVE',getActivityPage_().filters.status,'default active');
  var original=readRows_,counts={};
  try{readRows_=function(name){counts[name]=(counts[name]||0)+1;return original(name);};getDashboardData_({month:'2026-05'});['Accounts','Movements','Expenses','ExpenseCategories'].forEach(function(name){assertEqual_(1,counts[name],name+' read once');});counts={};getActivityPage_();['Accounts','Movements','Expenses'].forEach(function(name){assertEqual_(1,counts[name],name+' activity read once');});}finally{readRows_=original;}
}
