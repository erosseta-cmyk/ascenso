const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8986);const Y=new Date().getFullYear();
// nuevo usuario
let {b,p,errs}=await open(8986,{email:"n@x.cl"});await p.waitForTimeout(500);
let t=await p.innerText('#main');ok('registro pide año, mes, celular, peso y talla',['Año de nacimiento','Mes','Tu celular','Peso en kg','Estatura en cm'].every(x=>t.includes(x)),t.slice(0,600));
await p.evaluate(()=>{document.querySelector('#obTerms').checked=true});await p.evaluate(()=>A.onboard());ok('sin datos no entra',await p.evaluate(()=>!S.onboard));
await p.evaluate(Y=>{$('#obY').value=String(Y-70);$('#obM').value='3';$('#obP').value='12345';},Y);await p.evaluate(()=>A.onboard());ok('celular inválido no entra',await p.evaluate(()=>!S.onboard));
await p.evaluate(()=>{$('#obP').value='9 8765 4321';$('#obW').value='300'});await p.evaluate(()=>A.onboard());ok('peso fuera de rango no entra',await p.evaluate(()=>!S.onboard));
await p.evaluate(()=>{$('#obW').value='';});await p.evaluate(()=>A.onboard());await p.waitForTimeout(400);
let r=await p.evaluate(()=>({ob:!!S.onboard,y:S.profile.birthY,age:myAge(),ar:S.profile.ageR,ct:CT,w:S.profile.weight}));ok('entra sin peso/talla (opcionales)',r.ob&&r.age>=69&&r.age<=70&&r.ar==="60-74"&&r.ct.phone==="+56987654321"&&r.w===undefined,r);
t=await p.innerText('#main');ok('después ofrece modo simple',t.includes('modo simple'));ok('sin errores',!errs.length,errs);await b.close();
// menor por año
({b,p,errs}=await open(8986,{email:"k@x.cl"}));await p.waitForTimeout(500);await p.evaluate(Y=>{$('#obY').value=String(Y-15);$('#obM').value='6';$('#obP').value='912345678';document.querySelector('#obTerms').checked=true},Y);await p.evaluate(()=>A.onboard());await p.waitForTimeout(400);
ok('menor detectado por la fecha',await p.evaluate(()=>S.minor&&S.minor.state==="pending"&&minorPending()));await b.close();
// cuenta antigua sin datos
({b,p,errs}=await open(8986,{email:"o@x.cl",state:(()=>{const s=J(F.B);delete s.profile.birthY;delete s.profile.birthM;return s})()}));await p.evaluate(()=>{view.evo=null;S.seenStage=99;render()});t=await p.innerText('#main');
ok('cuenta antigua: pide completar datos',t.includes('Completa tus datos'),t.slice(0,300));ok('no puede usar la app sin completar',await p.evaluate(()=>document.querySelector('#tabs').hidden));
await p.evaluate(Y=>{$('#pgY').value=String(Y-80);$('#pgM').value='12';$('#pgP').value='+56 9 1111 2222';$('#pgH').value='158'},Y);await p.evaluate(()=>document.querySelector('#profGate').requestSubmit());await p.waitForTimeout(500);
t=await p.innerText('#main');ok('al completar sigue a la app',!t.includes('Completa tus datos')&&await p.evaluate(()=>!document.querySelector('#tabs').hidden),t.slice(0,200));
ok('guarda edad 75+ y talla',await p.evaluate(()=>S.profile.ageR==="75+"&&S.profile.height===158&&CT.phone==="+56911112222"));
await p.evaluate(()=>{tab='ajustes';render()});t=await p.innerText('#main');ok('Ajustes: tus datos con edad',t.includes('Tus datos')&&/Edad: \d+ años/.test(t));
await p.evaluate(()=>{$('#pfW').value='64,5';document.querySelector('#datosForm').requestSubmit()});await p.waitForTimeout(400);ok('edita peso',await p.evaluate(()=>S.profile.weight===64.5));
ok('sin errores',!errs.length,errs);await b.close();
// pro
({b,p,errs}=await open(8986,{email:"kine@x.cl",state:J(F.B),pro:[{id:7,email:"o@x.cl",name:"Olga",since:"2026-10-01",stage:1,birthY:Y-80,birthM:1,weight:64.5,height:158,phone:"+56911112222",parq:Array(10).fill(false),parqKey:"x",clear:[],rx:[],sessions:[],done:{},rxDone:{},loads:{}}]}));
await p.evaluate(()=>{tab='pacientes';view.evo=null;render()});t=await p.innerText('#main');ok('pro ve edad, peso, talla y celular',/(79|80) años/.test(t)&&t.includes('64.5 kg')&&t.includes('+56911112222'),t.slice(0,500));
ok('pro no es bloqueado',!t.includes('Completa tus datos'));await b.close();srv.close()})();
