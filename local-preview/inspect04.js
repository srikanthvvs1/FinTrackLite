// Read-only browser checks against an already populated Prompt 04 fixture.
const fs=require('fs');
const assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.FINTRACK_NODE_MODULES||'C:/Users/srika/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const url=process.env.FINTRACK_PREVIEW_URL||'http://127.0.0.1:4176';
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),observations={};
    await page.goto(url);await page.locator('#accounts-view').waitFor({state:'visible'});
    await page.locator('.primary-nav [data-view="activity"]').click();await page.waitForFunction(()=>!document.querySelector('#global-more').disabled);
    const requests=[];page.on('request',r=>{if(r.url().endsWith('/rpc')&&r.postDataJSON()?.method==='getActivityPage')requests.push(Date.now());});
    const start=Date.now();await page.fill('#global-search','Monthly housing');await page.waitForTimeout(150);
    assert.equal(requests.length,0,'No request before debounce interval');await page.waitForTimeout(300);
    assert.equal(requests.length,1,'One request after typing settles');assert.equal(await page.locator('#global-list tbody tr').count(),1);
    observations.descriptionDebounce={requests:requests.length,elapsedMs:requests[0]-start,minimumMs:300,status:'PASS'};
    await page.locator('.primary-nav [data-view="accounts"]').click();await page.waitForFunction(()=>document.querySelector('#page-loading').hidden);
    const cash=page.locator('.account-row').filter({has:page.locator('.account-row-name',{hasText:'Cash / Salary'})});
    await page.evaluate(()=>window.scrollTo(0,250));const before=await page.evaluate(()=>window.scrollY);await cash.click();await page.waitForTimeout(150);const after=await page.evaluate(()=>window.scrollY);
    observations.accountSelection={beforeScrollY:before,afterScrollY:after,status:Math.abs(before-after)<2?'PASS':'FAIL'};
    assert.ok(Math.abs(before-after)<2,'Selecting a desktop account must not jump the page');
    observations.tileRoutes=[];
    for(const width of [1440,768,390,320]){
      await page.setViewportSize({width,height:width===320?568:1000});
      const nav=width>=768?'.primary-nav':'.bottom-nav';
      await page.locator(nav+' [data-view="allocations"]').click();await page.waitForFunction(()=>document.querySelector('#page-loading').hidden);
      const tiles=await page.locator('.allocation-tile').evaluateAll(els=>els.map(el=>({id:el.dataset.accountId,name:el.firstElementChild.textContent})));
      for(const tile of tiles){
        await page.locator(`.allocation-tile[data-account-id="${tile.id}"]`).click();await page.waitForFunction(()=>document.querySelector('#page-loading').hidden);await page.waitForTimeout(50);
        assert.equal(await page.locator('#selected-name').textContent(),tile.name);
        const position=await page.locator('#recent-activity-title').evaluate(el=>({top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,focused:document.activeElement===el,header:document.querySelector('.top-header').getBoundingClientRect().bottom,height:innerHeight,bottomNav:getComputedStyle(document.querySelector('.bottom-nav')).display==='none'?0:document.querySelector('.bottom-nav').getBoundingClientRect().height}));
        assert.ok(position.focused&&position.top>=position.header&&position.bottom<=position.height-position.bottomNav,'Tile route must visibly focus Recent activity at '+width+': '+tile.name);
        observations.tileRoutes.push({width,name:tile.name,visibleFocus:true,status:'PASS'});
        await page.locator(nav+' [data-view="allocations"]').click();await page.waitForFunction(()=>document.querySelector('#page-loading').hidden);
      }
    }
    observations.status='PASS';fs.writeFileSync('local-preview/prompt04-interaction-evidence.json',JSON.stringify(observations,null,2));console.log(JSON.stringify({descriptionDebounce:observations.descriptionDebounce,accountSelection:observations.accountSelection,tileRoutes:observations.tileRoutes.length,status:observations.status}));
  }finally{await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
