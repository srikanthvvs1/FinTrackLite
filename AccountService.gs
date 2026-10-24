function deriveAccountGroup_(accountType, requestedGroup) {
  var option = accountTypeOption_(requireEnum_(accountType, FINTRACK_CONFIG.ACCOUNT_TYPES, 'Account type'));
  if (accountType === 'CUSTOM') {
    return requireEnum_(requestedGroup, ['INVESTMENT', 'FUND'], 'Account group');
  }
  return option.group;
}

function requireUniqueAccountName_(name, accounts, excludedId) {
  var normalized = name.toLowerCase();
  var duplicate = accounts.some(function (account) {
    return !account.deletedAt && account.id !== excludedId && String(account.name).trim().toLowerCase() === normalized;
  });
  if (duplicate) throw new Error('An account named "' + name + '" already exists.');
}

function findAccount_(accounts, id) {
  var account = accounts.filter(function (row) { return row.id === id; })[0];
  if (!account) throw new Error('Account not found.');
  return account;
}

function requireActionableAccount_(accounts, id, label) {
  var account = findAccount_(accounts, requireId_(id, label || 'Account ID'));
  if (account.deletedAt) throw new Error(account.name + ' has been deleted and cannot be used for a new action.');
  if (!account.active) throw new Error(account.name + ' is archived and cannot be used for a new action.');
  return account;
}

function createAccount_(payload) {
  rejectUnexpectedFields_(payload, ['name', 'accountType', 'accountGroup', 'openingDate', 'openingBalance', 'notes'], 'Create account');
  var accounts = readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS);
  var name = requireNonEmptyString_(payload.name, 'Name', 80);
  requireUniqueAccountName_(name, accounts, '');
  var accountType = requireEnum_(payload.accountType, FINTRACK_CONFIG.ACCOUNT_TYPES, 'Account type');
  var accountGroup = deriveAccountGroup_(accountType, payload.accountGroup);
  var now = nowIso_();
  var account = {
    id: uuid_(), name: name, accountType: accountType, accountGroup: accountGroup,
    openingDate: requireIsoDateNotFuture_(payload.openingDate),
    openingBalance: requireNonNegativeAmount_(payload.openingBalance, 'Opening balance'),
    active: true, deletedAt: '', notes: optionalString_(payload.notes, 'Notes', 1000),
    createdAt: now, updatedAt: now
  };
  appendRow_(FINTRACK_CONFIG.SHEETS.ACCOUNTS, account);
  appendAudit_(FINTRACK_CONFIG.AUDIT_ACTIONS.ACCOUNT_CREATED, FINTRACK_CONFIG.ENTITY_TYPES.ACCOUNT, account.id, { name: account.name });
  return withoutRowNumber_(account);
}

function updateAccount_(payload) {
  rejectUnexpectedFields_(payload, ['id', 'name', 'notes'], 'Update account');
  var accounts = readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS);
  var account = findAccount_(accounts, requireId_(payload.id, 'Account ID'));
  if (account.deletedAt) throw new Error('Deleted accounts cannot be edited.');
  var name = requireNonEmptyString_(payload.name, 'Name', 80);
  requireUniqueAccountName_(name, accounts, account.id);
  var updated = updateRowById_(FINTRACK_CONFIG.SHEETS.ACCOUNTS, account.id, {
    name: name, notes: optionalString_(payload.notes, 'Notes', 1000), updatedAt: nowIso_()
  });
  appendAudit_(FINTRACK_CONFIG.AUDIT_ACTIONS.ACCOUNT_UPDATED, FINTRACK_CONFIG.ENTITY_TYPES.ACCOUNT, account.id, { name: updated.name });
  return updated;
}

function archiveAccount_(payload) {
  rejectUnexpectedFields_(payload, ['id'], 'Archive account');
  var accounts = readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS);
  var account = findAccount_(accounts, requireId_(payload.id, 'Account ID'));
  if (account.deletedAt) throw new Error('Deleted accounts cannot be archived.');
  if (!account.active) throw new Error(account.name + ' is already archived.');
  var updated = updateRowById_(FINTRACK_CONFIG.SHEETS.ACCOUNTS, account.id, { active: false, updatedAt: nowIso_() });
  appendAudit_(FINTRACK_CONFIG.AUDIT_ACTIONS.ACCOUNT_ARCHIVED, FINTRACK_CONFIG.ENTITY_TYPES.ACCOUNT, account.id, { name: account.name });
  return updated;
}

function deleteAccount_(payload) {
  rejectUnexpectedFields_(payload, ['id'], 'Delete account');
  var accounts = readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS);
  var account = findAccount_(accounts, requireId_(payload.id, 'Account ID'));
  if (account.deletedAt) throw new Error(account.name + ' is already deleted.');
  var balances = calculateBalances_(accounts, readRows_(FINTRACK_CONFIG.SHEETS.MOVEMENTS), readRows_(FINTRACK_CONFIG.SHEETS.EXPENSES));
  var balance = balances.byAccountId[account.id];
  if (toCents_(balance) !== 0) {
    throw new Error('Delete account is available only at ' + formatInr_(0) + '. ' + account.name + ' still has ' + formatInr_(balance) + '.');
  }
  var timestamp = nowIso_();
  var updated = updateRowById_(FINTRACK_CONFIG.SHEETS.ACCOUNTS, account.id, { active: false, deletedAt: timestamp, updatedAt: timestamp });
  appendAudit_(FINTRACK_CONFIG.AUDIT_ACTIONS.ACCOUNT_DELETED, FINTRACK_CONFIG.ENTITY_TYPES.ACCOUNT, account.id, { name: account.name });
  return updated;
}

function getAccountsPageData_(payload) {
  payload = payload || {};
  var accounts = readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS);
  var movements = readRows_(FINTRACK_CONFIG.SHEETS.MOVEMENTS);
  var expenses = readRows_(FINTRACK_CONFIG.SHEETS.EXPENSES);
  var balances = calculateBalances_(accounts, movements, expenses);
  var includeArchived = payload.includeArchived === true;
  var visibleAccounts = accounts.filter(function (account) {
    return !account.deletedAt && (includeArchived || account.active || account.id === payload.selectedAccountId);
  }).map(function (account) {
    var clean = withoutRowNumber_(account);
    clean.balance = balances.byAccountId[account.id];
    return clean;
  });
  var selected = visibleAccounts.filter(function (account) { return account.id === payload.selectedAccountId; })[0] || visibleAccounts[0] || null;
  var monthStart = todayIso_().slice(0, 7) + '-01';
  var startDate = payload.activityStartDate ? requireIsoDateNotFuture_(payload.activityStartDate) : monthStart;
  var endDate = payload.activityEndDate ? requireIsoDateNotFuture_(payload.activityEndDate) : todayIso_();
  if (startDate > endDate) throw new Error('Activity start date cannot be after the end date.');
  var activity = selected ? buildAccountActivity_(selected, accounts, movements, expenses, startDate, endDate) : [];
  var offset = 0;
  if (payload.activityCursor) {
    var cursorIndex = activity.map(function (row) { return row.cursor; }).indexOf(payload.activityCursor);
    offset = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }
  var page = activity.slice(offset, offset + FINTRACK_CONFIG.ACTIVITY_PAGE_SIZE);
  var hasMore = offset + page.length < activity.length;
  return {
    accounts: visibleAccounts,
    selectedAccountId: selected ? selected.id : '',
    selectedAccount: selected,
    activityStartDate: startDate,
    activityEndDate: endDate,
    activity: page,
    hasMore: hasMore,
    nextCursor: hasMore && page.length ? page[page.length - 1].cursor : '',
    totalsByGroup: balances.byGroup,
    totalTrackedBalance: balances.total,
    accountTypes: FINTRACK_CONFIG.ACCOUNT_TYPE_OPTIONS.map(function (option) { return { value: option.value, label: option.label }; }),
    today: todayIso_()
  };
}

function buildAccountActivity_(selected, accounts, movements, expenses, startDate, endDate) {
  var nameById = accounts.reduce(function (map, account) { map[account.id] = account.name; return map; }, {});
  var rows = [];
  movements.forEach(function (movement) {
    if (movement.date < startDate || movement.date > endDate) return;
    if (movement.fromAccountId !== selected.id && movement.toAccountId !== selected.id) return;
    var effect = 0;
    if (movement.status === 'ACTIVE') {
      if (movement.toAccountId === selected.id) effect += Number(movement.amount);
      if (movement.fromAccountId === selected.id) effect -= Number(movement.amount);
    }
    var counterpartId = movement.fromAccountId === selected.id ? movement.toAccountId : movement.fromAccountId;
    rows.push({
      id: movement.id, entityType: 'MOVEMENT', type: movement.movementType, date: movement.date,
      description: movement.description, notes: movement.notes, amount: Number(movement.amount), signedAmount: effect,
      status: movement.status, createdAt: movement.createdAt, counterpartAccountName: counterpartId ? nameById[counterpartId] || '' : '',
      fromAccountId: movement.fromAccountId, toAccountId: movement.toAccountId,
      cursor: activityCursor_('MOVEMENT', movement)
    });
  });
  expenses.forEach(function (expense) {
    if (expense.accountId !== selected.id || expense.date < startDate || expense.date > endDate) return;
    rows.push({
      id: expense.id, entityType: 'EXPENSE', type: 'EXPENSE', date: expense.date,
      description: expense.description, notes: expense.notes, amount: Number(expense.amount),
      signedAmount: expense.status === 'ACTIVE' ? -Number(expense.amount) : 0,
      status: expense.status, createdAt: expense.createdAt, counterpartAccountName: expense.expenseCategory,
      cursor: activityCursor_('EXPENSE', expense)
    });
  });
  return rows.sort(function (a, b) {
    return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
  });
}

function activityCursor_(entityType, row) {
  return [row.date, row.createdAt, entityType, row.id].join('|');
}
