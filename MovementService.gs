function recordIncome_(payload) {
  return createMovement_('INCOME', payload);
}

function addToAccount_(payload) {
  return createMovement_('ADD', payload);
}

function withdrawFromAccount_(payload) {
  return createMovement_('WITHDRAW', payload);
}

function moveBetweenAccounts_(payload) {
  return createMovement_('MOVE', payload);
}

function createMovement_(movementType, payload) {
  rejectUnexpectedFields_(payload, ['date', 'fromAccountId', 'toAccountId', 'amount', 'description', 'notes'], movementType);
  requireEnum_(movementType, FINTRACK_CONFIG.MOVEMENT_TYPES, 'Movement type');
  var accounts = readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS);
  var movements = readRows_(FINTRACK_CONFIG.SHEETS.MOVEMENTS);
  var expenses = readRows_(FINTRACK_CONFIG.SHEETS.EXPENSES);
  var fromId = '';
  var toId = '';
  if (movementType === 'INCOME' || movementType === 'ADD') {
    toId = requireActionableAccount_(accounts, payload.toAccountId, 'Destination account ID').id;
  } else if (movementType === 'WITHDRAW') {
    fromId = requireActionableAccount_(accounts, payload.fromAccountId, 'Source account ID').id;
  } else {
    fromId = requireActionableAccount_(accounts, payload.fromAccountId, 'Source account ID').id;
    toId = requireActionableAccount_(accounts, payload.toAccountId, 'Destination account ID').id;
    if (fromId === toId) throw new Error('Move requires two different accounts.');
  }
  var now = nowIso_();
  var movement = {
    id: uuid_(), date: requireIsoDateNotFuture_(payload.date), movementType: movementType,
    fromAccountId: fromId, toAccountId: toId, amount: requirePositiveAmount_(payload.amount),
    description: optionalString_(payload.description, 'Description', 240),
    notes: optionalString_(payload.notes, 'Notes', 1000), status: 'ACTIVE', createdAt: now, updatedAt: now
  };
  validateNoNegativeBalances_(accounts, movements.concat([movement]), expenses);
  appendRow_(FINTRACK_CONFIG.SHEETS.MOVEMENTS, movement);
  appendAudit_(FINTRACK_CONFIG.AUDIT_ACTIONS.MOVEMENT_CREATED, FINTRACK_CONFIG.ENTITY_TYPES.MOVEMENT, movement.id, { movementType: movementType });
  return withoutRowNumber_(movement);
}

function updateMovement_(payload) {
  rejectUnexpectedFields_(payload, ['id', 'date', 'amount', 'description', 'notes', 'fromAccountId', 'toAccountId'], 'Update movement');
  var accounts = readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS);
  var movements = readRows_(FINTRACK_CONFIG.SHEETS.MOVEMENTS);
  var expenses = readRows_(FINTRACK_CONFIG.SHEETS.EXPENSES);
  var existing = movements.filter(function (movement) { return movement.id === requireId_(payload.id, 'Movement ID'); })[0];
  if (!existing) throw new Error('Movement not found.');
  if (existing.status !== 'ACTIVE') throw new Error('Only an active movement can be edited.');
  var type = existing.movementType;
  var fromId = '';
  var toId = '';
  if (type === 'INCOME' || type === 'ADD') {
    toId = requireActionableAccount_(accounts, payload.toAccountId, 'Destination account ID').id;
  } else if (type === 'WITHDRAW') {
    fromId = requireActionableAccount_(accounts, payload.fromAccountId, 'Source account ID').id;
  } else {
    fromId = requireActionableAccount_(accounts, payload.fromAccountId, 'Source account ID').id;
    toId = requireActionableAccount_(accounts, payload.toAccountId, 'Destination account ID').id;
    if (fromId === toId) throw new Error('Move requires two different accounts.');
  }
  var replacement = {
    id: existing.id, date: requireIsoDateNotFuture_(payload.date), movementType: type,
    fromAccountId: fromId, toAccountId: toId, amount: requirePositiveAmount_(payload.amount),
    description: optionalString_(payload.description, 'Description', 240),
    notes: optionalString_(payload.notes, 'Notes', 1000), status: existing.status,
    createdAt: existing.createdAt, updatedAt: nowIso_()
  };
  var candidates = movements.filter(function (movement) { return movement.id !== existing.id; }).concat([replacement]);
  validateNoNegativeBalances_(accounts, candidates, expenses);
  var updated = updateRowById_(FINTRACK_CONFIG.SHEETS.MOVEMENTS, existing.id, {
    date: replacement.date, fromAccountId: replacement.fromAccountId, toAccountId: replacement.toAccountId,
    amount: replacement.amount, description: replacement.description, notes: replacement.notes, updatedAt: replacement.updatedAt
  });
  appendAudit_(FINTRACK_CONFIG.AUDIT_ACTIONS.MOVEMENT_UPDATED, FINTRACK_CONFIG.ENTITY_TYPES.MOVEMENT, existing.id, { movementType: type });
  return updated;
}

function voidMovement_(payload) {
  rejectUnexpectedFields_(payload, ['id'], 'Void movement');
  var accounts = readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS);
  var movements = readRows_(FINTRACK_CONFIG.SHEETS.MOVEMENTS);
  var expenses = readRows_(FINTRACK_CONFIG.SHEETS.EXPENSES);
  var id = requireId_(payload.id, 'Movement ID');
  var existing = movements.filter(function (movement) { return movement.id === id; })[0];
  if (!existing) throw new Error('Movement not found.');
  if (existing.status !== 'ACTIVE') throw new Error('Movement is already void.');
  var candidates = movements.map(function (movement) {
    if (movement.id !== id) return movement;
    var copy = withoutRowNumber_(movement);
    copy.status = 'VOID';
    return copy;
  });
  validateNoNegativeBalances_(accounts, candidates, expenses);
  var updated = updateRowById_(FINTRACK_CONFIG.SHEETS.MOVEMENTS, id, { status: 'VOID' });
  appendAudit_(FINTRACK_CONFIG.AUDIT_ACTIONS.MOVEMENT_VOIDED, FINTRACK_CONFIG.ENTITY_TYPES.MOVEMENT, id, { movementType: existing.movementType });
  return updated;
}
