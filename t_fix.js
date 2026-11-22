const {serve,open,ok}=require('./lib');const F=require('./fixtures');
const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const port=8941;const srv=await serve(port);
const D=J(F.B);D.train.parq[1]=true;D.train.cleared="2026-10-20";D.train.clearedBy="Dr. Autodeclarado";
const share=(clear)=>[{email:"kine@recupera.cl",since:"2026-10-01",rx:F.mineC[0].rx,rxAt:"2026-11-01",id:7,clear}];
// H1 sin autorización del profesional
let {b,p,errs}=await open(port,{email:"d@x.cl",state:D,mine:share([])});
let r=await p.evaluate(()=>({ready:trainReady(),self:S.train.clearedSelf,cl:S.train.cleared}));
ok('H1 autodeclaración ya no habilita el plan',r.ready==="paused",r);ok('H1 autodeclaración se conserva como registro',r.self&&r.self.by==="Dr. Autodeclarado",r);
await p.evaluate(()=>{tab='entreno';render()});await p.waitForTimeout(300);let t=await p.innerText('#main');
ok('H1 paciente ve "Pídele a tu kinesiólogo"',t.includes('Pídele a tu kinesiólogo'),t.slice(0,500));ok('H1 sin campo para autodeclararse',!(await p.$('#clearBy'))&&!(await p.$('#clearChk')));
ok('H1 sin errores',!errs.length,errs);await b.close();
// H1 con autorización del profesional (clave = parqAt)
({b,p,errs}=await open(port,{email:"d@x.cl",state:D,mine:share([{kind:"parq",key:D.train.parqAt,at:"2026-11-08T12:00:00Z",note:"Evaluado en visita",by:"kine@recupera.cl"}])}));
r=await p.evaluate(()=>({ready:trainReady(),cl:S.train.cleared,by:S.train.clearedBy}));ok('H1 autorización del profesional habilita',r.ready!=="paused"&&r.cl==="2026-11-08"&&r.by==="kine@recupera.cl",r);
// re-responder PAR-Q invalida la autorización
await p.evaluate(()=>{S.train.parqTs=String(Date.now());});r=await p.evaluate(()=>trainReady());ok('H1 nuevo cuestionario invalida autorización',r==="paused",r);
await b.close();
// senior cap
const Sx=J(F.B);Sx.train.senior=true;Sx.train.stage=3;Sx.train.seniorOk={by:"yo",at:"2026-10-01"};
({b,p,errs}=await open(port,{email:"s@x.cl",state:Sx,mine:share([])}));r=await p.evaluate(()=>({cap:seniorCap(),ok:S.train.seniorOk}));ok('H1 tope adaptado no se autodesbloquea',r.cap===true&&r.ok===null,r);await b.close();
({b,p,errs}=await open(port,{email:"s@x.cl",state:Sx,mine:share([{kind:"senior",key:null,at:"2026-11-08T12:00:00Z",note:"Técnica revisada",by:"kine@recupera.cl"}])}));r=await p.evaluate(()=>seniorCap());ok('H1 tope adaptado lo desbloquea el profesional',r===false,r);await b.close();
// H4 pausa
const Hh=J(F.B);Hh.train.hold={at:"2026-11-07",kind:"dolor",sid:"x"};
({b,p,errs}=await open(port,{email:"h@x.cl",state:Hh,mine:share([])}));await p.evaluate(()=>{tab='entreno';render()});await p.waitForTimeout(300);t=await p.innerText('#main');ok('H4 paciente sabe que su kine ve la pausa',t.includes('Tu kinesiólogo ve este aviso'),t.slice(0,400));await b.close();
// B1 y M4
const two=[...share([]),{email:"otro@kine.cl",since:"2026-10-02",rx:[{ex:"fz_silla",name:"",dose:"2×8",note:""}],rxAt:"2026-11-02",id:8,clear:[]}];
({b,p,errs}=await open(port,{email:"c@x.cl",state:F.C,mine:two}));t=await p.innerText('#main');
ok('M4 aviso de varias pautas',t.includes('indicaciones de 2 profesionales'),t.slice(0,600));ok('M4 cada ejercicio dice quién lo indicó',t.includes('otro@kine.cl'));
const k=await p.evaluate(()=>{const it=rxAll().find(it=>!rxIsDone(rxKey(it)));const k=rxKey(it);A.rxTick({dataset:{k}});return k});
await p.evaluate(k=>A.rxTick({dataset:{k}}),k);ok('B1 un toque no desmarca',await p.evaluate(k=>rxIsDone(k),k));
await p.evaluate(k=>A.rxTick({dataset:{k}}),k);ok('B1 segundo toque desmarca',!(await p.evaluate(k=>rxIsDone(k),k)));
// letra grande
await p.evaluate(()=>{tab='ajustes';render()});await p.evaluate(s=>document.querySelector(s).click(),'[data-act=bigTxt][data-v="1"]');ok('M6 letra grande',await p.evaluate(()=>document.documentElement.classList.contains('big')&&S.ui.big===true));
await p.screenshot({path:'shots/fix_letra.png'});
// política
await p.evaluate(()=>{});ok('M8 política nombra la ficha',await p.evaluate(()=>/Ficha clínica de tu profesional/.test(document.documentElement.innerHTML)));
ok('B/M sin errores',!errs.length,errs);await b.close();
// Profesional
const pts=[{id:7,email:"d@x.cl",name:"Paciente D",since:"2026-10-01",stage:2,parq:D.train.parq,parqAt:D.train.parqAt,parqKey:D.train.parqAt,clear:[],hold:null,rx:[{ex:"fz_silla",name:"",dose:"2×8",note:""}],rxVersions:1,sessions:[],done:{},rxDone:{},loads:{}},
           {id:9,email:"h@x.cl",name:"Paciente H",since:"2026-10-01",stage:1,parq:Array(10).fill(false),parqKey:"x",clear:[],hold:{at:"2026-11-07",kind:"dolor"},rx:[],rxVersions:0,sessions:[],done:{},rxDone:{},loads:{}}];
({b,p,errs}=await open(port,{email:"kine@x.cl",state:F.B,pro:pts}));
await p.evaluate(()=>{tab='pacientes';render()});await p.waitForTimeout(400);t=await p.innerText('#main');
ok('H4 panel avisa pausa',t.includes('plan en pausa por dolor'),t.slice(0,700));
ok('H4 paciente en pausa primero',t.indexOf('Paciente H')<t.indexOf('Paciente D'));
ok('H1 panel avisa autorización pendiente',t.includes('espera tu autorización'));
await p.evaluate(()=>{document.querySelector('#clr_parq_7').value='Evaluado en visita del 08/11'});await p.evaluate(s=>document.querySelector(s).click(),'[data-act=ptClr][data-k=parq]');await p.waitForTimeout(500);
t=await p.innerText('#main');ok('H1 profesional registra autorización',t.includes('Autorizaste su plan de fuerza'),t.slice(0,900));
// H3
await p.evaluate(s=>document.querySelector(s).click(),'[data-act=rxOpen][data-id="7"]');await p.waitForTimeout(300);
await p.evaluate(()=>{SH.rxDraft[0].dose="";});const nCalls=await p.evaluate(()=>(JSON.parse(localStorage.getItem('stub.hist.7')||'[]')).length);
await p.evaluate(s=>document.querySelector(s).click(),'[data-act=rxSave]');await p.waitForTimeout(400);ok('H3 sin dosis no se guarda',await p.evaluate(()=>(JSON.parse(localStorage.getItem('stub.hist.7')||'[]')).length)===nCalls);
await p.evaluate(()=>{SH.rxDraft[0].dose="3×10";});await p.evaluate(s=>document.querySelector(s).click(),'[data-act=rxSave]');await p.waitForTimeout(500);
await p.evaluate(()=>{SH.rxFor=7;SH.rxDraft=[{ex:"fz_silla",name:"",dose:"3×12",note:""}];render()});await p.evaluate(s=>document.querySelector(s).click(),'[data-act=rxSave]');await p.waitForTimeout(500);
await p.evaluate(s=>document.querySelector(s).click(),'[data-act=rxHist][data-id="7"]');await p.waitForTimeout(400);t=await p.innerText('#main');
ok('H2 profesional ve versiones del plan',/vigente/.test(t)&&t.includes('3×12')&&t.includes('3×10'),t.slice(0,1200));
await p.screenshot({path:'shots/fix_pro.png',fullPage:true});
ok('pro sin errores',!errs.length,errs);await b.close();srv.close();})();
