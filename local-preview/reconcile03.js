const fs=require('fs'),assert=require('assert/strict');
(async()=>{const s=await fetch('http://127.0.0.1:4173/state').then(r=>r.json());
const expected={'Cash / Salary':265000,Expenses:58000,'Mutual Funds':30000,Stocks:15000,PPF:10000,NPS:5000,Gold:5000,'Fixed Deposit':15000,Emergency:6000,Travel:4000,Chit:10000};
const accounts=s.accounts.map(a=>({account:a.name,expected:expected[a.name],observed:s.balances.byAccountId[a.id],status:s.balances.byAccountId[a.id]===expected[a.name]?'PASS':'FAIL'}));accounts.forEach(a=>assert.equal(a.observed,a.expected));assert.equal(s.balances.total,423000);
assert.deepEqual(s.balances.byGroup,{CASH:265000,EXPENSE:58000,INVESTMENT:80000,FUND:20000});
const active=s.expenses.filter(e=>e.status==='ACTIVE');assert.equal(active.length,10);assert.equal(active.reduce((t,e)=>t+e.amount,0),77000);
s.accounts.forEach(a=>{for(const type of ['ADD','WITHDRAW'])assert(s.movements.some(m=>m.movementType===type&&m.amount===100&&(m.toAccountId||m.fromAccountId)===a.id));});
assert(s.movements.some(m=>m.amount===250&&m.status==='VOID'));
const months=[];for(const [m,total] of [['01',15000],['02',18000],['03',18000],['04',14000],['05',12000]]){const report=await fetch('http://127.0.0.1:4173/rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({method:'getExpenseReport',payload:{startDate:`2026-${m}-01`,endDate:`2026-${m}-${m==='02'?'28':m==='04'?'30':'31'}`}})}).then(r=>r.json());assert.equal(report.data.total,total);months.push({month:m,expected:total,observed:report.data.total,status:'PASS'});}
const result={status:'PASS',accounts,groups:s.balances.byGroup,total:s.balances.total,totalExpenses:77000,months,activeExpenses:active.length,voidExpenses:s.expenses.filter(e=>e.status==='VOID').length,movementCount:s.movements.length,auditRows:s.audit.length};
fs.writeFileSync('local-preview/prompt03-final-state.json',JSON.stringify(s,null,2));fs.writeFileSync('local-preview/prompt03-reconciliation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
