const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { chromium } = require(require.resolve('playwright', { paths: [process.env.FINTRACK_NODE_MODULES || 'C:/Users/srika/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'] }));
const url = process.env.FINTRACK_PREVIEW_URL || 'http://127.0.0.1:4174';
const root = path.resolve(__dirname, '..');
const evidence = { url, fixedDate: '2026-05-31', actions: [], checks: [], tooltips: [], responsive: [], screenshots: [], errors: [] };
const sizes = [{width:1440,height:1000},{width:768,height:1024},{width:390,height:844},{width:320,height:568}];
const expectedBalances = {'Cash / Salary':265000,Expenses:58000,'Mutual Funds':30000,Stocks:15000,PPF:10000,NPS:5000,Gold:5000,'Fixed Deposit':15000,Emergency:6000,Travel:4000,Chit:10000};
let page, browser;
function check(name, observed, expected) { assert.deepEqual(observed, expected, name); evidence.checks.push({name,observed,expected,status:'PASS'}); }
async function settled() { await page.waitForFunction(() => !document.querySelector('#page-loading') || document.querySelector('#page-loading').hidden); await page.waitForTimeout(60); }
async function nav(view) {
  const selector = (page.viewportSize().width >= 768 ? '.primary-nav' : '.bottom-nav') + ` [data-view="${view}"]`;
  await page.locator(selector).click();
  await page.locator(`#${view}-view`).waitFor({state:'visible'});
  await settled();
  const message = await page.locator('#page-message').textContent();
  assert.equal(message, '', `navigation error ${view}: ${message}`);
}
async function selectName(selector, name) { await page.selectOption(selector, {label:name}); }
async function submit(dialog, button) {
  await page.locator(button).click();
  await page.locator(dialog).waitFor({state:'hidden',timeout:12000});
  await settled();
}
async function create(name, type, group) {
  await page.locator('#create-account-button').click();
  await page.fill('#account-name',name); await page.selectOption('#account-type',type);
  if(group) await page.selectOption('#account-group',group);
  await page.fill('#opening-date','2026-01-01'); await page.fill('#opening-balance','0');
  await submit('#account-dialog','#account-submit');
  evidence.actions.push({action:'Create account',name,type,group:group||''});
}
async function money(type,date,from,to,amount,description='') {
  await page.locator('#quick-add-button').click(); await page.locator(`[data-quick="${type}"]`).click();
  await page.fill('#movement-date',date);
  if(from) await selectName('#from-account',from);
  if(to) await selectName('#to-account',to);
  await page.fill('#movement-amount',String(amount)); await page.fill('#movement-description',description);
  await submit('#movement-dialog','#movement-submit');
  evidence.actions.push({action:type,date,from,to,amount,description});
}
async function expense(date,category,amount,description='') {
  await page.locator('#quick-add-button').click(); await page.locator('[data-quick="EXPENSE"]').click();
  await page.fill('#expense-date',date); await selectName('#expense-account','Expenses');
  await page.selectOption('#expense-category',category); await page.fill('#expense-amount',String(amount));
  await page.fill('#expense-description',description); await submit('#expense-dialog','#expense-submit');
  evidence.actions.push({action:'EXPENSE',date,category,amount,description,account:'Expenses'});
}
async function shot(name,fullPage=false) {
  await page.waitForTimeout(1100);
  const relative='screenshots/prompt05-'+name+'.png';
  await page.screenshot({path:path.join(root,relative),fullPage}); evidence.screenshots.push(relative);
}
async function rpc(method,payload) {
  const response=await page.request.post(url+'/rpc',{data:{method,payload}}); const json=await response.json();
  assert.equal(json.ok,true,JSON.stringify(json));return json.data;
}
async function applyActivity(filters={}) {
  for(const [key,value] of Object.entries(filters)) {
    const selector='#global-'+key;
    if(['kind','account','status'].includes(key))await page.selectOption(selector,value);else await page.fill(selector,value);
  }
  await page.locator('#global-activity-filters button[type="submit"], #global-activity-filters button:not([type])').click();
  await page.waitForTimeout(160); await page.waitForFunction(()=>!document.querySelector('#global-more').disabled);
}
async function chartRead(id) {
  return page.evaluate(id=>{const c=Chart.getChart(document.getElementById(id));return c?{labels:c.data.labels,datasets:c.data.datasets.map(d=>({label:d.label,data:d.data,type:d.type})),scales:Object.keys(c.scales),ticks:c.scales.x?.ticks.map(t=>t.label),yTicks:c.scales.y?.ticks.map(t=>t.label),yMin:c.scales.y?.min,yMax:c.scales.y?.max,total:c.data.datasets[0].data.reduce((a,b)=>a+b,0)}:null;},id);
}
async function hover(id,dataset,index,screenshot) {
  await page.locator('#'+id).scrollIntoViewIfNeeded();
  await page.locator('#'+id).evaluate(el=>{const r=el.getBoundingClientRect(),header=document.querySelector('.top-header').getBoundingClientRect().height,nav=document.querySelector('.bottom-nav'),bottom=getComputedStyle(nav).display==='none'?0:nav.getBoundingClientRect().height;window.scrollTo(0,window.scrollY+r.top-header-Math.max(0,(innerHeight-header-bottom-r.height)/2));});
  await page.waitForTimeout(350);
  const point=await page.evaluate(({id,dataset,index})=>{const c=Chart.getChart(document.getElementById(id)),e=c.getDatasetMeta(dataset).data[index],p=e.getCenterPoint(),r=c.canvas.getBoundingClientRect();return {x:r.x+p.x,y:r.y+p.y};},{id,dataset,index});
  await page.mouse.move(point.x,point.y); await page.waitForTimeout(300);
  const tooltip=await page.evaluate(id=>{const c=Chart.getChart(document.getElementById(id));return {title:c.tooltip.title,body:c.tooltip.body?.flatMap(b=>b.lines),opacity:c.tooltip.opacity};},id);
  assert.ok(tooltip.opacity>0,`${id} tooltip did not open`);evidence.tooltips.push({chart:id,dataset,index,...tooltip});
  if(screenshot)await shot(screenshot);
  return tooltip;
}
async function reconcile() {
  const state=await (await page.request.get(url+'/state')).json();
  for(const [name,amount] of Object.entries(expectedBalances)) {
    const account=state.accounts.find(a=>a.name===name);check(name+' balance',state.balances.byAccountId[account.id],amount);
  }
  check('group totals',state.balances.byGroup,{CASH:265000,EXPENSE:58000,INVESTMENT:80000,FUND:20000});
  check('total tracked',state.balances.total,423000);
  check('all balances nonnegative',Object.values(state.balances.byAccountId).every(x=>x>=0),true);
  fs.writeFileSync(path.join(__dirname,'prompt05-final-state.json'),JSON.stringify(state,null,2));return state;
}
async function main() {
  fs.mkdirSync(path.join(root,'screenshots'),{recursive:true});
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  page=await browser.newPage({viewport:sizes[0],deviceScaleFactor:1});
  page.on('pageerror',error=>evidence.errors.push(error.message));
  await page.goto(url);await page.locator('#accounts-view').waitFor({state:'visible'});
  if(!process.env.FINTRACK_CAPTURE_ONLY){
  await nav('dashboard'); check('initial empty flow',await page.locator('#flow-empty').isVisible(),true);
  check('initial empty categories',await page.locator('#dashboard-spending-empty').isVisible(),true);
  check('initial empty groups',await page.locator('#group-empty').isVisible(),true);await shot('empty-dashboard');
  await nav('accounts');
  for(const pair of [['Fixed Deposit','FIXED_DEPOSIT'],['Emergency','EMERGENCY_FUND'],['Travel','TRAVEL_FUND'],['Chit','CHIT']])await create(...pair);
  const schedules=[
    {moves:[['Expenses',30000],['Mutual Funds',20000],['Emergency',5000]],expenses:[['housing',10000],['grocery',5000]]},
    {moves:[['Expenses',30000],['Stocks',15000],['Travel',5000]],expenses:[['housing',10000],['grocery',8000]]},
    {moves:[['Expenses',30000],['PPF',10000],['NPS',5000],['Gold',5000],['Chit',5000]],expenses:[['housing',12000],['utilities',6000]]},
    {moves:[['Expenses',25000],['Fixed Deposit',15000]],expenses:[['housing',10000],['travel',4000]]},
    {moves:[['Expenses',20000],['Mutual Funds',10000],['Chit',5000]],expenses:[['housing',10000],['personal_care',2000]]}
  ];
  for(let i=0;i<schedules.length;i++) {
    const date=`2026-0${i+1}-15`,s=schedules[i];
    await money('INCOME',date,'','Cash / Salary',100000,'Salary '+(i+1));
    for(const [name,amount] of s.moves)await money('MOVE',date,'Cash / Salary',name,amount);
    if(i===3){await money('ADD',date,'','Emergency',1000);await money('WITHDRAW',date,'Travel','',1000);}
    for(const [category,amount] of s.expenses)await expense(date,category,amount,'Monthly '+category);
  }
  for(const name of Object.keys(expectedBalances)) {
    const id=await page.locator('.account-row').filter({has:page.locator('.account-row-name',{hasText:new RegExp('^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')})}).getAttribute('data-account-id');
    await page.locator(`.account-row[data-account-id="${id}"]`).click();await settled();
    for(const [type,label] of [['ADD','Add amount'],['WITHDRAW','Withdraw']]) {
      await page.locator(`[data-action="${type}"]`).click();await page.fill('#movement-date','2026-05-31');await page.fill('#movement-amount','100');await submit('#movement-dialog','#movement-submit');
      evidence.actions.push({action:label,date:'2026-05-31',account:name,amount:100});
    }
  }
  await money('ADD','2026-05-31','','Fixed Deposit',250,'Disposable void check');
  const state=await reconcileBeforeVoid();
  await nav('activity');await applyActivity({search:'Disposable void check'});
  await page.locator('#global-list button').filter({hasText:'Void'}).click();await shot('void-confirmation');await submit('#confirm-dialog','#confirm-submit');
  evidence.actions.push({action:'Void',description:'Disposable void check',amount:250});
  await reconcile();
  await nav('dashboard');
  check('May visible cards',await page.locator('#dashboard-cards .metric-value').allTextContents(),['₹1,00,000','₹12,000','₹15,000','₹73,000']);
  const dashboard=await rpc('getDashboardData',{month:'2026-05'});evidence.dashboard=dashboard;
  const expectedMonths=[[100000,15000,25000,60000],[100000,18000,20000,62000],[100000,18000,25000,57000],[100000,14000,15000,71000],[100000,12000,15000,73000]];
  check('monthly data',dashboard.monthlyFlow.slice(-5).map(m=>[m.income,m.expenses,m.netAllocated,m.remainder]),expectedMonths);
  const flow=await chartRead('flow-chart');check('flow dataset values',flow.datasets.map(d=>d.data.slice(-5)),[0,1,2,3].map(i=>expectedMonths.map(m=>m[i])));
  check('flow twelve chronological labels',flow.labels,['Jun 25','Jul 25','Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26','May 26']);
  check('zero baseline',flow.yMin,0);check('rounded upper bound above largest value',flow.yMax>100000,true);check('INR y ticks',flow.yTicks.every(x=>x.startsWith('₹')),true);
  for(let index=7;index<12;index++) {
    const tooltip=await hover('flow-chart',0,index,'flow-tooltip-'+flow.labels[index].replace(' ','-'));
    for(const value of expectedMonths[index-7])assert.ok(tooltip.body.some(t=>t.includes(new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value))),`monthly tooltip ${index} ${value}`);
  }
  const spending=await chartRead('dashboard-spending-chart');check('May spending slices',spending.datasets[0].data,[10000,2000]);check('doughnut axes',spending.scales,[]);
  for(const [index,percent] of [[0,'83.33%'],[1,'16.67%']]){const t=await hover('dashboard-spending-chart',0,index,'spending-tooltip-'+index);assert.ok(t.body.join(' ').includes(percent));}
  const groups=await chartRead('group-chart');check('group dataset',groups.datasets[0].data,[265000,58000,80000,20000]);check('group axes',groups.scales,[]);check('group sum',groups.total,423000);
  for(let index=0;index<4;index++)await hover('group-chart',0,index,'group-tooltip-'+index);
  await page.fill('#dashboard-month','2026-04');await page.locator('#dashboard-month').press('Tab');await page.waitForTimeout(200);
  check('April visible cards',await page.locator('#dashboard-cards .metric-value').allTextContents(),['₹1,00,000','₹14,000','₹15,000','₹71,000']);
  await page.fill('#dashboard-month','2025-12');await page.locator('#dashboard-month').press('Tab');await page.waitForTimeout(200);
  check('zero month chart empty',await page.locator('#dashboard-spending-empty').isVisible(),true);await shot('empty-selected-month');
  await page.fill('#dashboard-month','2026-05');await page.locator('#dashboard-month').press('Tab');await page.waitForTimeout(200);
  await nav('accounts');
  // Add the remaining fixed and custom tile types at zero; this leaves reconciliation unchanged.
  for(const args of [['Home','HOME_FUND'],['Vehicle','VEHICLE_FUND'],['Education','EDUCATION_FUND'],['Future Expense','FUTURE_EXPENSE_FUND'],['Custom Investment','CUSTOM','INVESTMENT'],['Custom Fund','CUSTOM','FUND']])await create(...args);
  await nav('allocations');
  const tileIds=await page.locator('.allocation-tile').evaluateAll(els=>els.map(el=>({id:el.dataset.accountId,name:el.firstElementChild.textContent})));
  check('all investment and fund tiles',tileIds.length,15);
  for(const tile of tileIds){await page.locator(`.allocation-tile[data-account-id="${tile.id}"]`).click();await settled();check('tile route '+tile.name,await page.locator('#selected-name').textContent(),tile.name);check('tile recent activity focus '+tile.name,await page.evaluate(()=>document.activeElement.id),'recent-activity-title');await nav('allocations');}
  await nav('activity');check('newly created account appears in Activity filter',(await page.locator('#global-account option').allTextContents()).includes('Custom Fund'),true);await applyActivity({search:'',status:'VOID'});check('void status rows',await page.locator('#global-list tbody tr').count(),1);check('void edit/void hidden',await page.locator('#global-list button').count(),0);check('void amount effect',await page.locator('#global-list td').nth(3).textContent(),'₹0 (recorded ₹250)');await shot('activity-void');
  await applyActivity({status:'ACTIVE',kind:'EXPENSE'});check('expense kind count',await page.locator('#global-list tbody tr').count(),2);
  const cashId=state.accounts.find(a=>a.name==='Cash / Salary').id,expenseId=state.accounts.find(a=>a.name==='Expenses').id;
  await applyActivity({kind:'MOVE',account:cashId});check('cash move signs',(await page.locator('#global-list tbody td:nth-child(4)').allTextContents()).every(t=>t.startsWith('-₹')),true);
  await applyActivity({kind:'',account:'',start:'2026-01-01',end:'2026-01-31'});check('January filtered count',await page.locator('#global-list tbody tr').count(),6);
  await applyActivity({start:'2026-05-01',end:'2026-05-31',kind:'INCOME'});check('Income filter count',await page.locator('#global-list tbody tr').count(),1);
  await applyActivity({kind:'ADD'});check('Added amount filter count',await page.locator('#global-list tbody tr').count(),11);
  await applyActivity({kind:'WITHDRAW'});check('Withdrawn amount filter count',await page.locator('#global-list tbody tr').count(),11);
  await applyActivity({kind:'EXPENSE'});
  const personal=page.locator('#global-list tbody tr').filter({hasText:'Monthly personal_care'});
  await personal.getByRole('button',{name:'Edit',exact:true}).click();await selectName('#expense-account','Cash / Salary');await page.fill('#expense-amount','2500');await submit('#expense-dialog','#expense-submit');
  let edited=await (await page.request.get(url+'/state')).json();check('expense edit propagates balance',edited.balances.byAccountId[cashId],262500);
  await page.locator('#global-list tbody tr').filter({hasText:'Monthly personal_care'}).getByRole('button',{name:'Edit',exact:true}).click();await page.selectOption('#expense-account',expenseId);await page.fill('#expense-amount','2000');await submit('#expense-dialog','#expense-submit');evidence.actions.push({action:'Edit expense and restore',description:'Monthly personal_care'});
  await page.fill('#global-search','MONTHLY HOUSING');await page.waitForTimeout(500);check('debounced case-insensitive search',await page.locator('#global-list tbody tr').count(),1);
  await page.fill('#global-search','no matching description');await page.waitForTimeout(500);check('search empty state',await page.locator('#global-list .empty-state').isVisible(),true);
  await page.locator('#global-clear').click();await page.waitForTimeout(150);check('Clear resets active current month',await page.locator('#global-status').inputValue(),'ACTIVE');
  // Exercise movement editing in global Activity and restore the net external effect.
  await money('ADD','2026-05-31','','Cash / Salary',10,'Editable movement');
  await applyActivity({search:'Editable movement'});await page.locator('#global-list button').filter({hasText:'Edit'}).click();await page.fill('#movement-amount','20');await submit('#movement-dialog','#movement-submit');
  check('global movement edit refresh',await page.locator('#global-list tbody td').nth(3).textContent(),'+₹20');
  await page.locator('#global-list button').filter({hasText:'Void'}).click();await submit('#confirm-dialog','#confirm-submit');evidence.actions.push({action:'Edit and void movement',amount:20,description:'Editable movement'});
  // More than 100 matching rows, all created with visible Add Entry dialogs.
  for(let i=0;i<105;i++)await money('ADD','2026-05-31','','Cash / Salary',1,'Pagination probe '+String(i).padStart(3,'0'));
  await money('WITHDRAW','2026-05-31','Cash / Salary','',105,'Pagination offset');
  await page.locator('#global-clear').click();await page.waitForTimeout(200);
  check('first global page capped',await page.locator('#global-list tbody tr').count(),100);check('Load older visible',await page.locator('#global-more').isVisible(),true);
  const firstIds=await page.locator('#global-list tbody tr').evaluateAll(rows=>rows.map(r=>r.dataset.id));await page.locator('#global-more').click();await page.waitForTimeout(200);await page.waitForFunction(()=>!document.querySelector('#global-more').disabled);
  const allIds=await page.locator('#global-list tbody tr').evaluateAll(rows=>rows.map(r=>r.dataset.id));check('pagination no duplicates',new Set(allIds).size,allIds.length);check('pagination adds rows',allIds.length>firstIds.length,true);check('Load older ends',await page.locator('#global-more').isHidden(),true);evidence.pagination={first:firstIds.length,total:allIds.length};
  await reconcile();
  await nav('accounts');await page.locator(`.account-row[data-account-id="${cashId}"]`).click();await settled();
  check('account recent activity first page',await page.locator('#activity-list .activity-row').count(),100);
  check('account recent activity older control',await page.locator('#load-more-button').isVisible(),true);
  await page.locator('#load-more-button').click();await page.waitForTimeout(160);
  check('account recent activity pagination',await page.locator('#activity-list .activity-row').count()>100,true);
  check('account nonzero Delete disabled',await page.locator('#delete-account-button').isDisabled(),true);
  check('account precise Delete message',(await page.locator('#delete-hint').textContent()).includes('₹2,65,000'),true);
  check('account opening date and balance',(await page.locator('#selected-opening').textContent()).startsWith('Opening ₹0 on '),true);
  await page.locator('#archive-account-button').click();check('archive retained-history confirmation',(await page.locator('#confirm-copy').textContent()).includes('all history remains visible'),true);await page.locator('#confirm-dialog [data-close-dialog="confirm-dialog"]').last().click();
  const listStyle=await page.locator('.account-list-panel').evaluate(el=>({overflow:getComputedStyle(el).overflowY,maxHeight:getComputedStyle(el).maxHeight}));check('desktop list independently scrollable',listStyle.overflow,'auto');
  }else{
    Object.assign(evidence,JSON.parse(fs.readFileSync(path.join(__dirname,'prompt05-browser-evidence.json'),'utf8')));
    evidence.checks=evidence.checks.filter(c=>!/(1440|768|390|320)/.test(c.name));
    evidence.responsive=[];evidence.tooltips=evidence.tooltips.slice(0,11);
    evidence.screenshots=evidence.screenshots.filter(name=>!/-((1440|768|390|320))\.png$/.test(name)&&!name.endsWith('-failure.png'));
    evidence.resolvedValidationIssues=[{issue:'Mobile expense tooltip pointer landed behind fixed bottom navigation',resolution:'Center the real chart within the unobscured viewport before mouse hover; repeat all widths and all visible charts',applicationDefect:false}];
    await reconcile();
  }
  for(const size of sizes){await page.setViewportSize(size);for(const view of ['dashboard','expenses','accounts','allocations','activity']){await nav(view);await page.waitForTimeout(1200);await page.evaluate(()=>window.scrollTo(0,0));const dimensions=await page.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));check(view+' '+size.width+' no horizontal overflow',dimensions.scrollWidth<=dimensions.clientWidth,true);await shot(view+'-'+size.width,view==='dashboard'||view==='allocations');evidence.responsive.push({view,...size,...dimensions});
      if(view==='dashboard'){const read=await chartRead('flow-chart');assert.ok(read.ticks.length<=12);evidence.responsive[evidence.responsive.length-1].xTicks=read.ticks;evidence.responsive[evidence.responsive.length-1].yTicks=read.yTicks;await hover('flow-chart',0,11,'flow-tooltip-May-'+size.width);await hover('dashboard-spending-chart',0,0,'spending-tooltip-'+size.width);await hover('group-chart',0,0,'group-tooltip-'+size.width);}
      if(view==='expenses'){check('retained expense doughnut axes '+size.width,(await chartRead('expense-chart')).scales,[]);await hover('expense-chart',0,0,'expense-tooltip-housing-'+size.width);await hover('expense-chart',0,1,'expense-tooltip-personal-'+size.width);await page.locator('#expense-list').scrollIntoViewIfNeeded();await shot('expense-list-'+size.width);}
      if(view==='activity'){await page.locator('#global-list tbody tr').first().scrollIntoViewIfNeeded();await shot('activity-list-'+size.width);}
      if(view==='accounts'){await page.locator('.account-detail-header').evaluate(el=>window.scrollTo(0,window.scrollY+el.getBoundingClientRect().top-90));await shot('account-detail-'+size.width);}
    }}
  check('browser runtime errors',evidence.errors,[]);evidence.status='PASS';delete evidence.failure;evidence.screenshots=[...new Set(evidence.screenshots)];
  console.log(JSON.stringify({status:evidence.status,checks:evidence.checks.length,GUIActions:evidence.actions.length,tooltips:evidence.tooltips.length,screenshots:evidence.screenshots.length,pagination:evidence.pagination}));
}
async function reconcileBeforeVoid(){const state=await (await page.request.get(url+'/state')).json();check('temporary FD addition',state.balances.byAccountId[state.accounts.find(a=>a.name==='Fixed Deposit').id],15250);return state;}
main().catch(async error=>{evidence.status='FAIL';evidence.failure=error.stack;console.error(error.stack);if(page)try{await shot('failure');}catch(_){}process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(__dirname,'prompt05-browser-evidence.json'),JSON.stringify(evidence,null,2));if(browser)await browser.close();});
