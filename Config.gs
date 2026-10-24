var FINTRACK_CONFIG = Object.freeze({
  APP_NAME: 'FinTrack',
  SCHEMA_VERSION: '1',
  SHEETS: Object.freeze({
    SETTINGS: 'Settings',
    ACCOUNTS: 'Accounts',
    MOVEMENTS: 'Movements',
    EXPENSES: 'Expenses',
    EXPENSE_CATEGORIES: 'ExpenseCategories',
    AUDIT_LOG: 'AuditLog'
  }),
  HEADERS: Object.freeze({
    Settings: Object.freeze(['key', 'value', 'updatedAt']),
    Accounts: Object.freeze(['id', 'name', 'accountType', 'accountGroup', 'openingDate', 'openingBalance', 'active', 'deletedAt', 'notes', 'createdAt', 'updatedAt']),
    Movements: Object.freeze(['id', 'date', 'movementType', 'fromAccountId', 'toAccountId', 'amount', 'description', 'notes', 'status', 'createdAt', 'updatedAt']),
    Expenses: Object.freeze(['id', 'date', 'accountId', 'amount', 'expenseCategory', 'expenseNature', 'description', 'notes', 'status', 'createdAt', 'updatedAt']),
    ExpenseCategories: Object.freeze(['code', 'label', 'defaultNature', 'sortOrder', 'active']),
    AuditLog: Object.freeze(['id', 'occurredAt', 'action', 'entityType', 'entityId', 'details'])
  }),
  STATUS_VALUES: Object.freeze(['ACTIVE', 'VOID']),
  ACCOUNT_TYPES: Object.freeze(['CASH', 'EXPENSE', 'MUTUAL_FUND', 'STOCK', 'PPF', 'NPS', 'GOLD', 'FIXED_DEPOSIT', 'EMERGENCY_FUND', 'TRAVEL_FUND', 'CHIT', 'HOME_FUND', 'VEHICLE_FUND', 'EDUCATION_FUND', 'FUTURE_EXPENSE_FUND', 'CUSTOM']),
  ACCOUNT_GROUPS: Object.freeze(['CASH', 'EXPENSE', 'INVESTMENT', 'FUND']),
  MOVEMENT_TYPES: Object.freeze(['INCOME', 'ADD', 'WITHDRAW', 'MOVE']),
  EXPENSE_NATURES: Object.freeze(['FIXED', 'VARIABLE']),
  ACCOUNT_TYPE_OPTIONS: Object.freeze([
    Object.freeze({ value: 'CASH', label: 'Cash / Savings', group: 'CASH' }),
    Object.freeze({ value: 'EXPENSE', label: 'Expense account', group: 'EXPENSE' }),
    Object.freeze({ value: 'MUTUAL_FUND', label: 'Mutual Funds', group: 'INVESTMENT' }),
    Object.freeze({ value: 'STOCK', label: 'Stocks', group: 'INVESTMENT' }),
    Object.freeze({ value: 'PPF', label: 'PPF', group: 'INVESTMENT' }),
    Object.freeze({ value: 'NPS', label: 'NPS', group: 'INVESTMENT' }),
    Object.freeze({ value: 'GOLD', label: 'Gold', group: 'INVESTMENT' }),
    Object.freeze({ value: 'FIXED_DEPOSIT', label: 'Fixed Deposit', group: 'INVESTMENT' }),
    Object.freeze({ value: 'EMERGENCY_FUND', label: 'Emergency Fund', group: 'FUND' }),
    Object.freeze({ value: 'TRAVEL_FUND', label: 'Travel Fund', group: 'FUND' }),
    Object.freeze({ value: 'CHIT', label: 'Chit', group: 'FUND' }),
    Object.freeze({ value: 'HOME_FUND', label: 'Home Fund', group: 'FUND' }),
    Object.freeze({ value: 'VEHICLE_FUND', label: 'Vehicle Fund', group: 'FUND' }),
    Object.freeze({ value: 'EDUCATION_FUND', label: 'Education Fund', group: 'FUND' }),
    Object.freeze({ value: 'FUTURE_EXPENSE_FUND', label: 'Future Expense Fund', group: 'FUND' }),
    Object.freeze({ value: 'CUSTOM', label: 'Custom Fund/Investment', group: '' })
  ]),
  AUDIT_ACTIONS: Object.freeze({
    ACCOUNT_CREATED: 'ACCOUNT_CREATED',
    ACCOUNT_UPDATED: 'ACCOUNT_UPDATED',
    ACCOUNT_ARCHIVED: 'ACCOUNT_ARCHIVED',
    ACCOUNT_DELETED: 'ACCOUNT_DELETED',
    MOVEMENT_CREATED: 'MOVEMENT_CREATED',
    MOVEMENT_UPDATED: 'MOVEMENT_UPDATED',
    MOVEMENT_VOIDED: 'MOVEMENT_VOIDED'
  }),
  ENTITY_TYPES: Object.freeze({ ACCOUNT: 'ACCOUNT', MOVEMENT: 'MOVEMENT' }),
  ACTIVITY_PAGE_SIZE: 100,
  SEED_SETTINGS: Object.freeze([
    Object.freeze({ key: 'schemaVersion', value: '1' }),
    Object.freeze({ key: 'currency', value: 'INR' }),
    Object.freeze({ key: 'locale', value: 'en-IN' })
  ]),
  SEED_ACCOUNTS: Object.freeze([
    Object.freeze({ name: 'Cash / Salary', accountType: 'CASH', accountGroup: 'CASH' }),
    Object.freeze({ name: 'Expenses', accountType: 'EXPENSE', accountGroup: 'EXPENSE' }),
    Object.freeze({ name: 'Mutual Funds', accountType: 'MUTUAL_FUND', accountGroup: 'INVESTMENT' }),
    Object.freeze({ name: 'Stocks', accountType: 'STOCK', accountGroup: 'INVESTMENT' }),
    Object.freeze({ name: 'PPF', accountType: 'PPF', accountGroup: 'INVESTMENT' }),
    Object.freeze({ name: 'NPS', accountType: 'NPS', accountGroup: 'INVESTMENT' }),
    Object.freeze({ name: 'Gold', accountType: 'GOLD', accountGroup: 'INVESTMENT' })
  ]),
  SEED_EXPENSE_CATEGORIES: Object.freeze([
    Object.freeze({ code: 'food', label: 'Food & Takeaway', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'grocery', label: 'Grocery', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'vegetables_fruits', label: 'Vegetables & Fruits', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'travel', label: 'Travel', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'commute', label: 'Commute', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'housing', label: 'Housing', defaultNature: 'FIXED' }),
    Object.freeze({ code: 'parents_fund', label: 'Parents Fund', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'health', label: 'Health', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'personal_care', label: 'Personal Care', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'subscriptions', label: 'Subscriptions & Software', defaultNature: 'FIXED' }),
    Object.freeze({ code: 'entertainment', label: 'Entertainment', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'utilities', label: 'Utilities', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'shopping', label: 'Shopping', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'wife_expenses', label: 'Wife Expenses', defaultNature: 'VARIABLE' }),
    Object.freeze({ code: 'other', label: 'Other', defaultNature: 'VARIABLE' })
  ])
});

function sheetNames_() {
  return Object.keys(FINTRACK_CONFIG.HEADERS);
}

function headersFor_(sheetName) {
  var headers = FINTRACK_CONFIG.HEADERS[sheetName];
  if (!headers) {
    throw new Error('Unknown FinTrack Lite sheet: ' + sheetName);
  }
  return headers.slice();
}

function accountTypeOption_(accountType) {
  return FINTRACK_CONFIG.ACCOUNT_TYPE_OPTIONS.filter(function (option) {
    return option.value === accountType;
  })[0] || null;
}
