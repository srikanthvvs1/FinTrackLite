var FINTRACK_TEST_SPREADSHEET_ = null;
var FINTRACK_SPREADSHEET_ = null;

function getSpreadsheet_() {
  if (FINTRACK_TEST_SPREADSHEET_) return FINTRACK_TEST_SPREADSHEET_;
  if (!FINTRACK_SPREADSHEET_) {
    FINTRACK_SPREADSHEET_ = SpreadsheetApp.openById(FINTRACK_CONFIG.SPREADSHEET_ID);
  }
  return FINTRACK_SPREADSHEET_;
}

function initializeFinTrackLite_() {
  var spreadsheet = getSpreadsheet_();
  var names = sheetNames_();

  names.forEach(function (sheetName) {
    var existingSheet = spreadsheet.getSheetByName(sheetName);
    if (existingSheet) validateSheetHeaders_(existingSheet, sheetName);
  });

  names.forEach(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) return;
    sheet = spreadsheet.insertSheet(sheetName);
    var headers = headersFor_(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  });

  seedSettings_();
  seedAccounts_();
  seedExpenseCategories_();

  return getBootstrapData_();
}

function validateSheetHeaders_(sheet, sheetName) {
  var expected = headersFor_(sheetName);
  var lastColumn = sheet.getLastColumn();
  var actual = lastColumn > 0 ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  var exact = expected.length === actual.length && expected.every(function (value, index) {
    return String(actual[index]) === value;
  });
  if (!exact) {
    throw new Error('Header mismatch in sheet "' + sheetName + '". Expected: [' + expected.join(', ') + ']. Actual: [' + actual.join(', ') + '].');
  }
}

function getSheet_(sheetName) {
  headersFor_(sheetName);
  var sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Missing FinTrack Lite sheet: ' + sheetName + '. Run initialization and retry.');
  }
  validateSheetHeaders_(sheet, sheetName);
  return sheet;
}

function getHeaderIndex_(sheetName) {
  return headersFor_(sheetName).reduce(function (index, header, position) {
    index[header] = position;
    return index;
  }, {});
}

function readRows_(sheetName) {
  var sheet = getSheet_(sheetName);
  var headers = headersFor_(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues().map(function (values, rowOffset) {
    var row = { _rowNumber: rowOffset + 2 };
    headers.forEach(function (header, column) {
      row[header] = normalizeSheetValue_(values[column]);
    });
    return row;
  });
}

function appendRow_(sheetName, row) {
  return appendRows_(sheetName, [row]);
}

function appendRows_(sheetName, rows) {
  if (!rows.length) {
    return [];
  }
  var sheet = getSheet_(sheetName);
  var headers = headersFor_(sheetName);
  var values = rows.map(function (row) {
    return headers.map(function (header) {
      return Object.prototype.hasOwnProperty.call(row, header) ? row[header] : '';
    });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
  return rows;
}

function updateRowById_(sheetName, id, updates) {
  var headers = headersFor_(sheetName);
  var idColumn = headers.indexOf('id');
  if (idColumn < 0) {
    throw new Error('Sheet "' + sheetName + '" does not have an id column.');
  }
  var rows = readRows_(sheetName);
  var match = rows.filter(function (row) { return row.id === id; })[0];
  if (!match) {
    throw new Error('Row not found in ' + sheetName + ': ' + id);
  }
  Object.keys(updates).forEach(function (key) {
    if (headers.indexOf(key) < 0 || key === 'id') {
      throw new Error('Cannot update field "' + key + '" in ' + sheetName + '.');
    }
    match[key] = updates[key];
  });
  var values = headers.map(function (header) { return match[header]; });
  getSheet_(sheetName).getRange(match._rowNumber, 1, 1, headers.length).setValues([values]);
  delete match._rowNumber;
  return match;
}

function normalizeSheetValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, getSpreadsheet_().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  }
  return value;
}

function seedSettings_() {
  var existing = readRows_(FINTRACK_CONFIG.SHEETS.SETTINGS);
  var keys = existing.reduce(function (set, row) {
    set[String(row.key)] = true;
    return set;
  }, {});
  var now = nowIso_();
  var missing = FINTRACK_CONFIG.SEED_SETTINGS.filter(function (setting) {
    return !keys[setting.key];
  }).map(function (setting) {
    return { key: setting.key, value: setting.value, updatedAt: now };
  });
  appendRows_(FINTRACK_CONFIG.SHEETS.SETTINGS, missing);
}

function seedAccounts_() {
  var existing = readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS);
  var names = existing.reduce(function (set, row) {
    set[String(row.name).trim().toLowerCase()] = true;
    return set;
  }, {});
  var now = nowIso_();
  var today = todayIso_();
  var missing = FINTRACK_CONFIG.SEED_ACCOUNTS.filter(function (account) {
    return !names[account.name.toLowerCase()];
  }).map(function (account) {
    return {
      id: uuid_(), name: account.name, accountType: account.accountType,
      accountGroup: account.accountGroup, openingDate: today, openingBalance: 0,
      active: true, deletedAt: '', notes: '', createdAt: now, updatedAt: now
    };
  });
  appendRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS, missing);
}

function seedExpenseCategories_() {
  var existing = readRows_(FINTRACK_CONFIG.SHEETS.EXPENSE_CATEGORIES);
  var codes = existing.reduce(function (set, row) {
    set[String(row.code)] = true;
    return set;
  }, {});
  var missing = FINTRACK_CONFIG.SEED_EXPENSE_CATEGORIES.filter(function (category) {
    return !codes[category.code];
  }).map(function (category, index) {
    return {
      code: category.code, label: category.label, defaultNature: category.defaultNature,
      sortOrder: index + 1, active: true
    };
  });
  appendRows_(FINTRACK_CONFIG.SHEETS.EXPENSE_CATEGORIES, missing);
}

function getBootstrapData_() {
  var spreadsheet = getSpreadsheet_();
  sheetNames_().forEach(function (sheetName) { getSheet_(sheetName); });
  return {
    appName: FINTRACK_CONFIG.APP_NAME,
    schemaVersion: FINTRACK_CONFIG.SCHEMA_VERSION,
    spreadsheetName: spreadsheet.getName(),
    sheetNames: sheetNames_(),
    accounts: readRows_(FINTRACK_CONFIG.SHEETS.ACCOUNTS).map(withoutRowNumber_),
    expenseCategories: readRows_(FINTRACK_CONFIG.SHEETS.EXPENSE_CATEGORIES).map(withoutRowNumber_)
  };
}

function withoutRowNumber_(row) {
  var copy = {};
  Object.keys(row).forEach(function (key) {
    if (key !== '_rowNumber') copy[key] = row[key];
  });
  return copy;
}

function nowIso_() {
  return new Date().toISOString();
}

function todayIso_() {
  return Utilities.formatDate(new Date(), getSpreadsheet_().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
}

function uuid_() {
  return Utilities.getUuid();
}

function appendAudit_(action, entityType, entityId, details) {
  appendRow_(FINTRACK_CONFIG.SHEETS.AUDIT_LOG, {
    id: uuid_(),
    occurredAt: nowIso_(),
    action: action,
    entityType: entityType,
    entityId: entityId,
    details: JSON.stringify(details || {})
  });
}
