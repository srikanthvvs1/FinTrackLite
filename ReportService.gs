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
