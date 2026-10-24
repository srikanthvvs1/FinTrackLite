function getExpenseReport_(payload) {
  payload=payload||{};
  rejectUnexpectedFields_(payload,['startDate','endDate','category','nature','accountId','includeVoid'],'Expense report');
  var today=todayIso_(), filters={startDate:payload.startDate?requireIsoDateNotFuture_(payload.startDate):today.slice(0,7)+'-01',endDate:payload.endDate?requireIsoDateNotFuture_(payload.endDate):today,category:payload.category||'',nature:payload.nature||'',accountId:payload.accountId||'',includeVoid:payload.includeVoid===true};
  if(filters.startDate>filters.endDate) throw new Error('Start date cannot be after end date.');
  var categories=readRows_('ExpenseCategories').filter(function(c){return c.active;}).sort(function(a,b){return a.sortOrder-b.sortOrder;}), accounts=readRows_('Accounts'), expenses=readRows_('Expenses');
  if(filters.category && !categories.some(function(c){return c.code===filters.category;})) throw new Error('Invalid category filter.');
  if(filters.nature) requireEnum_(filters.nature,['FIXED','VARIABLE'],'Nature');
  if(filters.accountId) findAccount_(accounts,filters.accountId);
  var names={};accounts.forEach(function(a){names[a.id]=a.name;});
  var rows=expenses.filter(function(e){return e.date>=filters.startDate && e.date<=filters.endDate && (!filters.category||e.expenseCategory===filters.category) && (!filters.nature||e.expenseNature===filters.nature) && (!filters.accountId||e.accountId===filters.accountId) && (filters.includeVoid||e.status==='ACTIVE');}).map(function(e){var row=withoutRowNumber_(e);row.accountName=names[e.accountId]||'';return row;}).sort(function(a,b){return b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id);});
  var total=0,fixed=0,count=0,byCategory={};
  rows.forEach(function(e){if(e.status!=='ACTIVE')return;var cents=toCents_(e.amount);total+=cents;if(e.expenseNature==='FIXED')fixed+=cents;count++;byCategory[e.expenseCategory]=(byCategory[e.expenseCategory]||0)+cents;});
  return {filters:filters,total:fromCents_(total),fixedTotal:fromCents_(fixed),variableTotal:fromCents_(total-fixed),activeTransactionCount:count,categoryTotals:categories.map(function(c){return {code:c.code,label:c.label,total:fromCents_(byCategory[c.code]||0)};}),rows:rows,sourceAccountNames:names};
}

function reportSnapshot_() {
  return {
    accounts: readRows_('Accounts'), movements: readRows_('Movements'),
    expenses: readRows_('Expenses'), categories: readRows_('ExpenseCategories')
  };
}

function getDashboardData_(payload) {
  payload = payload || {};
  rejectUnexpectedFields_(payload, ['month'], 'Dashboard');
  var today = todayIso_(), month = payload.month === undefined ? today.slice(0, 7) : payload.month;
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Month must use YYYY-MM.');
  if (month > today.slice(0, 7)) throw new Error('Month cannot be later than today.');
  var snapshot = reportSnapshot_(), byId = {}, months = [], byMonth = {};
  snapshot.accounts.forEach(function (a) { byId[a.id] = a; });
  var year = Number(month.slice(0, 4)), monthNumber = Number(month.slice(5));
  for (var index = 11; index >= 0; index--) {
    var serial = year * 12 + monthNumber - 1 - index;
    var key = String(Math.floor(serial / 12)).padStart(4, '0') + '-' + String(serial % 12 + 1).padStart(2, '0');
    var item = { month: key, label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][serial % 12] + ' ' + key.slice(2, 4), income: 0, expenses: 0, netAllocated: 0 };
    months.push(item); byMonth[key] = item;
  }
  function allocated(id) { return byId[id] && ['INVESTMENT', 'FUND'].indexOf(byId[id].accountGroup) >= 0; }
  snapshot.movements.forEach(function (row) {
    var item = byMonth[row.date.slice(0, 7)];
    if (!item || row.status !== 'ACTIVE') return;
    if (row.movementType === 'INCOME') item.income += toCents_(row.amount);
    if (row.movementType === 'MOVE') item.netAllocated += toCents_(row.amount) * ((allocated(row.toAccountId) ? 1 : 0) - (allocated(row.fromAccountId) ? 1 : 0));
  });
  var categoryCents = {};
  snapshot.expenses.forEach(function (row) {
    if (row.status !== 'ACTIVE') return;
    var item = byMonth[row.date.slice(0, 7)];
    if (item) item.expenses += toCents_(row.amount);
    if (row.date.slice(0, 7) === month) categoryCents[row.expenseCategory] = (categoryCents[row.expenseCategory] || 0) + toCents_(row.amount);
  });
  months.forEach(function (item) {
    item.remainder = fromCents_(item.income - item.expenses - item.netAllocated);
    ['income', 'expenses', 'netAllocated'].forEach(function (key) { item[key] = fromCents_(item[key]); });
  });
  var selected = months[11], balances = calculateBalances_(snapshot.accounts, snapshot.movements, snapshot.expenses);
  return {
    month: month, today: today,
    cards: [
      { label: 'Income', value: selected.income }, { label: 'Expenses', value: selected.expenses },
      { label: 'Net allocated to investments & funds', value: selected.netAllocated },
      { label: 'Salary allocation remainder', value: selected.remainder }
    ],
    monthlyFlow: months,
    categoryTotals: snapshot.categories.sort(function (a, b) { return a.sortOrder - b.sortOrder; }).map(function (c) {
      return { code: c.code, label: c.label, total: fromCents_(categoryCents[c.code] || 0) };
    }),
    totalsByGroup: balances.byGroup, totalTrackedBalance: balances.total,
    accounts: snapshot.accounts.filter(function (a) { return !a.deletedAt; }).map(function (a) {
      var clean = withoutRowNumber_(a); clean.balance = balances.byAccountId[a.id]; return clean;
    })
  };
}

function getActivityPage_(payload) {
  payload = payload || {};
  rejectUnexpectedFields_(payload, ['startDate','endDate','kind','accountId','status','search','cursor'], 'Activity');
  var today = todayIso_(), filters = {
    startDate: payload.startDate ? requireIsoDateNotFuture_(payload.startDate) : today.slice(0, 7) + '-01',
    endDate: payload.endDate ? requireIsoDateNotFuture_(payload.endDate) : today,
    kind: payload.kind || '', accountId: payload.accountId || '',
    status: payload.status === undefined ? 'ACTIVE' : payload.status,
    search: optionalString_(payload.search, 'Description search', 240)
  };
  if (filters.startDate > filters.endDate) throw new Error('Start date cannot be after end date.');
  if (filters.kind) requireEnum_(filters.kind, ['INCOME','ADD','WITHDRAW','MOVE','EXPENSE'], 'Kind');
  requireEnum_(filters.status, ['ACTIVE','VOID','ALL'], 'Status');
  var accounts = readRows_('Accounts'), movements = readRows_('Movements'), expenses = readRows_('Expenses'), names = {};
  accounts.forEach(function (a) { names[a.id] = a.name; });
  if (filters.accountId) findAccount_(accounts, requireId_(filters.accountId));
  var rows = movements.map(function (m) {
    var row = withoutRowNumber_(m);
    row.entityType = 'MOVEMENT'; row.type = m.movementType;
    row.fromAccountName = names[m.fromAccountId] || ''; row.toAccountName = names[m.toAccountId] || '';
    row.signedAmount = m.status === 'VOID' ? 0 : m.movementType === 'MOVE' ? (filters.accountId === m.toAccountId ? Number(m.amount) : filters.accountId === m.fromAccountId ? -Number(m.amount) : 0) : (m.movementType === 'WITHDRAW' ? -Number(m.amount) : Number(m.amount));
    row.cursor = activityCursor_('MOVEMENT', m); return row;
  }).concat(expenses.map(function (e) {
    var row = withoutRowNumber_(e);
    row.entityType = 'EXPENSE'; row.type = 'EXPENSE'; row.accountName = names[e.accountId] || '';
    row.signedAmount = e.status === 'ACTIVE' ? -Number(e.amount) : 0;
    row.cursor = activityCursor_('EXPENSE', e); return row;
  })).filter(function (r) {
    return r.date >= filters.startDate && r.date <= filters.endDate && (!filters.kind || r.type === filters.kind) &&
      (!filters.accountId || r.accountId === filters.accountId || r.fromAccountId === filters.accountId || r.toAccountId === filters.accountId) &&
      (filters.status === 'ALL' || r.status === filters.status) && String(r.description || '').toLowerCase().indexOf(filters.search.toLowerCase()) >= 0;
  }).sort(function (a, b) { return b.cursor.localeCompare(a.cursor); });
  var totalCount = rows.length;
  if (payload.cursor) {
    var cursor = requireNonEmptyString_(payload.cursor, 'Cursor', 240);
    if (!/^\d{4}-\d{2}-\d{2}\|[^|]+\|(MOVEMENT|EXPENSE)\|[^|]+$/.test(cursor)) throw new Error('Invalid activity cursor.');
    rows = rows.filter(function (r) { return r.cursor.localeCompare(cursor) < 0; });
  }
  var page = rows.slice(0, FINTRACK_CONFIG.ACTIVITY_PAGE_SIZE), hasMore = rows.length > page.length;
  return { filters: filters, rows: page, totalCount: totalCount, hasMore: hasMore, nextCursor: hasMore ? page[page.length - 1].cursor : '' };
}
