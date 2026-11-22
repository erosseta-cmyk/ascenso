const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:400,height:850},offline:true});const p=await c.newPage();
await p.goto('file:///mnt/user-data/outputs/Ascenso_validar_buscador.html');await p.waitForTimeout(500);
await p.fill('#firma','Prueba');
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#save')]);const path=await dl.path();
const fs=require('fs');const s=fs.readFileSync(path,'utf8');console.log('size',s.length,'markers',(s.match(/\/\*S\*\//g)||[]).length);
const i=s.indexOf('/*S*/');console.log(s.slice(i,i+200));
const p2=await (await b.newContext({offline:true})).newPage();const e=[];p2.on('pageerror',x=>e.push(x.message));p2.on('console',m=>e.push('c:'+m.text()));
await p2.goto('file://'+path);await p2.waitForTimeout(800);console.log(e, await p2.evaluate(()=>document.body?document.body.innerHTML.slice(0,200):'nobody'));await b.close()})();
