const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:1400}})).newPage();
await p.goto('file:///mnt/user-data/outputs/Ascenso_validar_buscador_v3.html');await p.waitForTimeout(400);await p.fill('#q','sutura meniscal');await p.click('#res button[data-load="sutura_meniscal|parcial"]');
await p.evaluate(()=>document.querySelector('#q').scrollIntoView());await p.screenshot({path:'v3.png'});await b.close()})();
