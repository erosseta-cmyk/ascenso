const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,offline:true})).newPage();
await p.goto('file:///mnt/user-data/outputs/Ascenso_validar_buscador.html');await p.waitForTimeout(500);
await p.fill('#q','cervicobraquialgia');await p.waitForTimeout(100);await p.screenshot({path:'s1.png'});
await p.fill('#q','');await p.click('details.dx[data-id="cervicobraquialgia"]>summary');await p.evaluate(()=>document.querySelector('details.dx[data-id="cervicobraquialgia"]').scrollIntoView());await p.screenshot({path:'s2.png'});await b.close()})();
