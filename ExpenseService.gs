function createExpense_(payload) { return saveExpense_(payload, false); }
function updateExpense_(payload) { return saveExpense_(payload, true); }
function expenseSources_(accounts) {
  return accounts.filter(function(a){return a.active && !a.deletedAt && ['CASH','EXPENSE'].indexOf(a.accountType)>=0;});
}
function defaultExpenseSource_(accounts) {
  var eligible=expenseSources_(accounts);
  return eligible.filter(function(a){return a.name==='Expenses';})[0] || eligible[0] || null;
}
function saveExpense_(payload, editing) {
  rejectUnexpectedFields_(payload, (editing?['id']:[]).concat(['date','accountId','amount','expenseCategory','expenseNature','description','notes']), 'Expense');
  var accounts=readRows_('Accounts'), movements=readRows_('Movements'), expenses=readRows_('Expenses'), categories=readRows_('ExpenseCategories');
  var existing=editing?expenses.filter(function(e){return e.id===requireId_(payload.id);})[0]:null;
  if(editing && (!existing || existing.status!=='ACTIVE')) throw new Error('Only an active expense can be edited.');
  var account=requireActionableAccount_(accounts,payload.accountId,'Source account ID');
  if(['CASH','EXPENSE'].indexOf(account.accountType)<0) throw new Error('Expenses require a CASH or EXPENSE account.');
  if(!categories.some(function(c){return c.active && c.code===payload.expenseCategory && FINTRACK_CONFIG.SEED_EXPENSE_CATEGORIES.some(function(s){return s.code===c.code;});})) throw new Error('Select an active expense category.');
  var now=nowIso_(), row={id:existing?existing.id:uuid_(),date:requireIsoDateNotFuture_(payload.date),accountId:account.id,amount:requirePositiveAmount_(payload.amount),expenseCategory:payload.expenseCategory,expenseNature:requireEnum_(payload.expenseNature,['FIXED','VARIABLE'],'Nature'),description:optionalString_(payload.description,'Description',240),notes:optionalString_(payload.notes,'Notes',1000),status:'ACTIVE',createdAt:existing?existing.createdAt:now,updatedAt:now};
  if(row.amount<=0) throw new Error('Amount must round to at least 0.01.');
  validateNoNegativeBalances_(accounts,movements,expenses.filter(function(e){return e.id!==row.id;}).concat([row]));
  if(existing){var updates=withoutRowNumber_(row);delete updates.id;updateRowById_('Expenses',row.id,updates);}else appendRow_('Expenses',row);
  appendAudit_(editing?'EXPENSE_UPDATED':'EXPENSE_CREATED','EXPENSE',row.id,{});
  return row;
}
function voidExpense_(payload) {
  rejectUnexpectedFields_(payload,['id'],'Void expense');
  var id=requireId_(payload.id), accounts=readRows_('Accounts'), movements=readRows_('Movements'), expenses=readRows_('Expenses');
  var existing=expenses.filter(function(e){return e.id===id;})[0];
  if(!existing || existing.status!=='ACTIVE') throw new Error('Only an active expense can be voided.');
  validateNoNegativeBalances_(accounts,movements,expenses.filter(function(e){return e.id!==id;}));
  var row=updateRowById_('Expenses',id,{status:'VOID'});
  appendAudit_('EXPENSE_VOIDED','EXPENSE',id,{});return row;
}
