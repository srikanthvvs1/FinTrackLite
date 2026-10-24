function calculateBalances_(accounts, movements, expenses) {
  var centsByAccountId = {};
  var groupByAccountId = {};
  var deletedByAccountId = {};

  accounts.forEach(function (account) {
    centsByAccountId[account.id] = toCents_(account.openingBalance);
    groupByAccountId[account.id] = account.accountGroup;
    deletedByAccountId[account.id] = Boolean(account.deletedAt);
  });

  movements.forEach(function (movement) {
    if (movement.status !== 'ACTIVE') return;
    var cents = toCents_(movement.amount);
    if ((movement.movementType === 'INCOME' || movement.movementType === 'ADD') && hasOwn_(centsByAccountId, movement.toAccountId)) {
      centsByAccountId[movement.toAccountId] += cents;
    } else if (movement.movementType === 'WITHDRAW' && hasOwn_(centsByAccountId, movement.fromAccountId)) {
      centsByAccountId[movement.fromAccountId] -= cents;
    } else if (movement.movementType === 'MOVE') {
      if (hasOwn_(centsByAccountId, movement.fromAccountId)) centsByAccountId[movement.fromAccountId] -= cents;
      if (hasOwn_(centsByAccountId, movement.toAccountId)) centsByAccountId[movement.toAccountId] += cents;
    }
  });

  expenses.forEach(function (expense) {
    if (expense.status === 'ACTIVE' && hasOwn_(centsByAccountId, expense.accountId)) {
      centsByAccountId[expense.accountId] -= toCents_(expense.amount);
    }
  });

  var byAccountId = {};
  var byGroupCents = { CASH: 0, EXPENSE: 0, INVESTMENT: 0, FUND: 0 };
  Object.keys(centsByAccountId).forEach(function (accountId) {
    byAccountId[accountId] = fromCents_(centsByAccountId[accountId]);
    if (!deletedByAccountId[accountId]) {
      byGroupCents[groupByAccountId[accountId]] += centsByAccountId[accountId];
    }
  });

  var byGroup = {};
  Object.keys(byGroupCents).forEach(function (group) { byGroup[group] = fromCents_(byGroupCents[group]); });
  var total = Object.keys(byGroupCents).reduce(function (sum, group) { return sum + byGroupCents[group]; }, 0);
  return { byAccountId: byAccountId, byGroup: byGroup, total: fromCents_(total) };
}

function validateNoNegativeBalances_(accounts, movements, expenses) {
  var balances = calculateBalances_(accounts, movements, expenses);
  accounts.forEach(function (account) {
    if (balances.byAccountId[account.id] < 0) {
      throw new Error(account.name + ' would have a negative balance of ' + formatInr_(balances.byAccountId[account.id]) + '.');
    }
  });
  return balances;
}

function toCents_(amount) {
  return Math.round(Number(amount || 0) * 100);
}

function fromCents_(cents) {
  return Math.round(cents) / 100;
}

function hasOwn_(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function formatInr_(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount);
}
