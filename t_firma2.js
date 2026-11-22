const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:400,height:850},offline:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///mnt/user-data/outputs/Ascenso_firma_fichas.html');await p.waitForTimeout(1500);
const r=await p.$$eval('.imgs img',a=>({n:a.length,broken:a.filter(i=>i.complete&&i.naturalWidth===0).length}));
await p.click('#allok');await p.check('input[name="d_ab_crunch"][value="no"]');await p.fill('textarea[data-id="ab_crunch"]','rehacer');await p.click('#cp');await p.waitForTimeout(300);
console.log(r,await p.textContent('#cpo').then(t=>t.slice(0,200)),errs);
await p.evaluate(()=>scrollTo(0,0));await p.evaluate(()=>document.querySelector('.card').scrollIntoView());await p.screenshot({path:'/tmp/f2.png'});await b.close()})();
