const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.FINTRACK_PREVIEW_PORT || 4173);
const fixedNow = '2026-05-31T12:00:00.000Z';
let uuidCounter = 0;

class FixedDate extends Date {
  constructor(value) { super(arguments.length ? value : fixedNow); }
  static now() { return new Date(fixedNow).getTime(); }
}

const context = vm.createContext({
  console,
  Date: FixedDate,
  Intl,
  setTimeout,
  clearTimeout,
  Utilities: {
    getUuid() {
      uuidCounter += 1;
      return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, '0')}`;
    },
    formatDate(value, timeZone) {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
      const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${map.year}-${map.month}-${map.day}`;
    }
  },
  LockService: { getScriptLock() { return { waitLock() {}, releaseLock() {} }; } },
  SpreadsheetApp: { getActiveSpreadsheet() { return context.FINTRACK_TEST_SPREADSHEET_; } }
});

[
  'Config.gs', 'Database.gs', 'Validation.gs', 'BalanceService.gs', 'AccountService.gs',
  'MovementService.gs', 'ExpenseService.gs', 'ReportService.gs', 'Code.gs', 'TestHarness.gs'
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file }));

context.FINTRACK_TEST_SPREADSHEET_ = new context.MemorySpreadsheet_('FinTrack Lite Validation Fixture');
context.initializeFinTrackLite();

function clientStub() {
  const methods = ['initializeFinTrackLite', 'getBootstrapData', 'getDashboardData', 'getActivityPage', 'getAccountsPageData', 'createAccount', 'updateAccount', 'archiveAccount', 'deleteAccount', 'recordIncome', 'addToAccount', 'withdrawFromAccount', 'moveBetweenAccounts', 'updateMovement', 'voidMovement', 'createExpense', 'updateExpense', 'voidExpense', 'getExpenseReport', 'runAllTests'];
  return `<script>(function(){function runner(){var success=function(){},failure=function(){};var api={withSuccessHandler:function(fn){success=fn;return api;},withFailureHandler:function(fn){failure=fn;return api;}};${methods.map((method) => `api.${method}=function(payload){fetch('/rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({method:'${method}',payload:payload})}).then(function(response){return response.json();}).then(function(result){if(result.error)throw new Error(result.error);success(result);}).catch(failure);};`).join('')}return api;}Object.defineProperty(window,'google',{value:{script:{get run(){return runner();}}}});}());</script>`;
}

function renderedHtml() {
  const styles = fs.readFileSync(path.join(root, 'Styles.html'), 'utf8');
  const client = fs.readFileSync(path.join(root, 'Client.html'), 'utf8');
  return fs.readFileSync(path.join(root, 'Index.html'), 'utf8')
    .replace("<?!= include_('Styles'); ?>", styles)
    .replace("<?!= include_('Client'); ?>", clientStub() + client).replace("<?!= include_('Chart'); ?>", fs.readFileSync(path.join(root,'Chart.html'),'utf8'))
    ;
}

function bodyJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (error) { reject(error); } });
    request.on('error', reject);
  });
}

function statePayload() {
  const accounts = context.readRows_(context.FINTRACK_CONFIG.SHEETS.ACCOUNTS).map(context.withoutRowNumber_);
  const movements = context.readRows_(context.FINTRACK_CONFIG.SHEETS.MOVEMENTS).map(context.withoutRowNumber_);
  const expenses = context.readRows_(context.FINTRACK_CONFIG.SHEETS.EXPENSES).map(context.withoutRowNumber_);
  const audit = context.readRows_(context.FINTRACK_CONFIG.SHEETS.AUDIT_LOG).map(context.withoutRowNumber_);
  return { accounts, movements, expenses, audit, balances: context.calculateBalances_(accounts, movements, expenses) };
}

const server = http.createServer(async (request, response) => {
  try {
    if(request.url==='/chart.js'){response.writeHead(200,{'Content-Type':'text/javascript'});return response.end(fs.readFileSync(path.join(root,'Chart.html'),'utf8').replace(/^<script>/,'').replace(/<\/script>\s*$/,''));}
    if (request.method === 'GET' && request.url.startsWith('/state')) return json(response, 200, statePayload());
    if (request.method === 'POST' && request.url === '/rpc') {
      const input = await bodyJson(request);
      if (typeof context[input.method] !== 'function') throw new Error('Unknown RPC method.');
      const fixture=context.FINTRACK_TEST_SPREADSHEET_; try { return json(response, 200, context[input.method](input.payload)); } finally { context.FINTRACK_TEST_SPREADSHEET_=fixture; }
    }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(renderedHtml());
  } catch (error) {
    json(response, 400, { error: error.message });
  }
});

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}

if(require.main===module) server.listen(port, '127.0.0.1', () => console.log(`FinTrack Prompt 04 preview http://127.0.0.1:${port}`));


module.exports={context,statePayload};

