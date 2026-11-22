const {serve,open,ok}=require('./lib');const F=require('./fixtures');const L=require('./lib');
(async()=>{const port=8912;const srv=await serve(port);
for(const [k,email,st,mine] of [["A","a@x.cl",F.A],["B","b@x.cl",F.B],["C","c@x.cl",F.C,F.mineC]]){
 const {b,p,errs}=await open(port,{email,state:st,mine});
 const tabs=await p.evaluate(()=>tabsList().map(x=>x[0]));
 for(const t of tabs){await p.evaluate(t=>{view={};tab=t;render()},t);await p.waitForTimeout(150)}
 await p.evaluate(()=>{window.print=()=>{}});
 if(k==="C"){await p.evaluate(()=>{tab='dia';view={};render()});await p.click('#main [data-act=myReport]');await p.waitForTimeout(300);ok('C informe',(await p.evaluate(()=>document.getElementById('printArea').innerText)).includes('Informe kinésico'))}
 ok(k+' recorre '+tabs.length+' pestañas sin errores',!errs.length,errs);await b.close()}
// vista del kinesiólogo
const pt={id:7,name:"Luis",email:"c@x.cl",rx:F.mineC[0].rx,rxDone:F.C.rxDone,loads:F.C.loads,sessions:F.B.train.sessions,done:{},stage:2,lvl:1,since:"2026-10-20"};
const {b,p,errs}=await open(port,{email:"kine@x.cl",state:F.B,pro:[pt]});
const tabs=await p.evaluate(()=>tabsList().map(x=>x[0]));ok('kine tiene Pacientes',tabs.includes('pacientes'),tabs);
await p.evaluate(()=>{tab='pacientes';render()});await p.waitForTimeout(400);const t=await p.innerText('#main');ok('kine ve paciente',t.includes('Luis'),t.slice(0,300));
await p.evaluate(()=>{window.print=()=>{}});const pb=await p.$('#main [data-act=ptPrint]');if(pb){await p.evaluate(()=>{view.evo=null;render();tab='pacientes';render();document.querySelector('#main [data-act=ptPrint]').click()});await p.waitForTimeout(300);const r=await p.evaluate(()=>document.getElementById('printArea').innerText);ok('kine informe dice escalón',r.includes('escalón 1')||r.includes('Etapa 2'),r.slice(0,500))}else ok('kine botón informe',false,t.slice(0,600));
for(const tb of tabs){await p.evaluate(t=>{view={};tab=t;render()},tb);await p.waitForTimeout(150)}
ok('kine sin errores',!errs.length,errs);await b.close();
console.log('FALLAS',L.fails);srv.close()})();
