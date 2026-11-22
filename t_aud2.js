const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const Y=new Date().getFullYear();
(async()=>{const srv=await serve(8994);
// A. Teléfono compartido
let {b,p,errs}=await open(8994,{email:"a@x.cl",state:J(F.B),ct:{phone:"+56911110000",wa_ok:true},mine:[{email:"kine@x.cl",since:"2026-10-01",rx:[{ex:"fz_silla",name:"",dose:"2×8",note:"privada de A"}],rxAt:"2026-11-08",id:7,clear:[]}]});
await p.evaluate(()=>{view.evo=null;S.seenStage=99;render()});
await p.evaluate(async()=>{await A.logout()});await p.waitForTimeout(600);
let r=await p.evaluate(()=>({ls:Object.keys(localStorage).filter(k=>!k.startsWith('stub.')),ct:CT,mine:SH.mine.length,name:S.profile&&S.profile.name}));
console.log('  tras cerrar sesión:',JSON.stringify(r));
ok('A1 al cerrar sesión se borra la copia local',r.ls.filter(k=>/ascenso|state|rev|dirty/i.test(k)).length===0,r.ls);
ok('A2 al cerrar sesión se limpia el celular en memoria (CT)',!r.ct||!r.ct.phone,r.ct);
ok('A3 al cerrar sesión se limpia la pauta en memoria',r.mine===0);
await p.evaluate(()=>{document.querySelector('#auEmail').value='b@x.cl';document.querySelector('#auPass').value='12345678';document.querySelector('#authForm').requestSubmit()});await p.waitForTimeout(1200);
const t=await p.innerText('#main');const html=await p.evaluate(()=>document.querySelector('#main').innerHTML);
ok('A4 el siguiente usuario no ve datos del anterior',!html.includes('privada de A')&&!html.includes('1111 0000')&&!html.includes('911110000'),t.slice(0,200));
await b.close();
// B. Cuenta adulta existente que declara fecha de menor
const sb_=J(F.B);delete sb_.profile.birthY;delete sb_.profile.birthM;
({b,p,errs}=await open(8994,{email:"m@x.cl",state:sb_}));await p.evaluate(()=>{view.evo=null;render()});
await p.evaluate(Y=>{$('#pgY').value=String(Y-15);$('#pgM').value='6';$('#pgP').value='912345678';document.querySelector('#profGate').requestSubmit()},Y);await p.waitForTimeout(500);
r=await p.evaluate(()=>({gate:!!document.querySelector('#profGate'),minor:S.minor||null,tabs:!document.querySelector('#tabs').hidden}));
ok('B cuenta existente con fecha de menor: tiene salida (no queda bloqueada)',!r.gate||r.minor,r);await b.close();
// C. Transición a mayoría de edad
const sc=J(F.B);sc.profile.birthY=Y-18;sc.profile.birthM=1;sc.minor={state:"parent",by:"Mamá Prueba",rel:"madre",at:Date.now()-4e10};
({b,p,errs}=await open(8994,{email:"t@x.cl",state:sc}));await p.evaluate(()=>{view.evo=null;render()});
r=await p.evaluate(()=>({age:myAge(),minor:!!S.minor}));ok('C al cumplir 18 deja de tratarse como menor',r.age>=18&&!r.minor,r);await b.close();
// D. Edad mínima
({b,p,errs}=await open(8994,{email:"n@x.cl"}));await p.waitForTimeout(400);
await p.evaluate(Y=>{$('#obY').value=String(Y-6);$('#obM').value='1';$('#obP').value='912345678';document.querySelector('#obTerms').checked=true},Y);await p.evaluate(()=>A.onboard());await p.waitForTimeout(400);
r=await p.evaluate(()=>({ob:!!S.onboard,age:myAge(),minor:S.minor}));ok('D existe una edad mínima o contenido por tramo de edad',!r.ob,r);await b.close();
// E. Dolor alto del día en modo simple
const se=J(F.B);se.ui={simple:true,simpleAsked:1,big:true};const d=new Date(),dd=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');se.dayFb={[dd]:{pain:8,at:Date.now()}};
({b,p,errs}=await open(8994,{email:"e@x.cl",state:se,mine:[{email:"kine@x.cl",since:"2026-10-01",rx:[{ex:"fz_silla",name:"",dose:"2×8",note:""}],rxAt:"2026-11-08",id:7,clear:[]}]}));await p.evaluate(()=>{view.evo=null;render()});
r=await p.evaluate(()=>({warn:document.querySelector('#main').innerText.includes('no sigas con ejercicios hoy'),start:!!document.querySelector('.simple [data-act=sxGo]'),hold:S.train.hold}));
ok('E con dolor 8/10 hoy, la app impide o frena empezar ejercicios (no solo avisa)',r.warn&&!r.start,r);await b.close();
srv.close()})();
