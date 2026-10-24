function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('FinTrack')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function initializeFinTrackLite() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = initializeFinTrackLite_();
    return { ok: true, data: data };
  } catch (error) {
    throw publicError_(error);
  } finally {
    lock.releaseLock();
  }
}

function getBootstrapData() {
  try {
    return { ok: true, data: getBootstrapData_() };
  } catch (error) {
    throw publicError_(error);
  }
}

function getAccountsPageData(payload) {
  return readApi_(function () { return getAccountsPageData_(payload); });
}

function getDashboardData(payload) {
  return readApi_(function () { return getDashboardData_(payload); });
}

function getActivityPage(payload) {
  return readApi_(function () { return getActivityPage_(payload); });
}

function createAccount(payload) {
  return mutationApi_(function () { return createAccount_(payload || {}); });
}

function updateAccount(payload) {
  return mutationApi_(function () { return updateAccount_(payload || {}); });
}

function archiveAccount(payload) {
  return mutationApi_(function () { return archiveAccount_(payload || {}); });
}

function deleteAccount(payload) {
  return mutationApi_(function () { return deleteAccount_(payload || {}); });
}

function recordIncome(payload) {
  return mutationApi_(function () { return recordIncome_(payload || {}); });
}

function addToAccount(payload) {
  return mutationApi_(function () { return addToAccount_(payload || {}); });
}

function withdrawFromAccount(payload) {
  return mutationApi_(function () { return withdrawFromAccount_(payload || {}); });
}

function moveBetweenAccounts(payload) {
  return mutationApi_(function () { return moveBetweenAccounts_(payload || {}); });
}

function updateMovement(payload) {
  return mutationApi_(function () { return updateMovement_(payload || {}); });
}

function voidMovement(payload) {
  return mutationApi_(function () { return voidMovement_(payload || {}); });
}

function readApi_(callback) {
  try {
    return { ok: true, data: callback() };
  } catch (error) {
    throw publicError_(error);
  }
}

function mutationApi_(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return { ok: true, data: callback() };
  } catch (error) {
    throw publicError_(error);
  } finally {
    lock.releaseLock();
  }
}
function createExpense(payload) { return mutationApi_(function(){return createExpense_(payload||{});}); }
function updateExpense(payload) { return mutationApi_(function(){return updateExpense_(payload||{});}); }
function voidExpense(payload) { return mutationApi_(function(){return voidExpense_(payload||{});}); }
function getExpenseReport(payload) { return readApi_(function(){return getExpenseReport_(payload);}); }
