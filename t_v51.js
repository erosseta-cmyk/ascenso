const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const Y=new Date().getFullYear();
(async()=>{const srv=await serve(8999);
// Adulto crea el código
let {b,p,errs}=await open(8999,{email:"ana@x.cl",state:J(F.B)});await p.evaluate(()=>{view.evo=null;S.seenStage=99;S.ui.simpleAsked=1;tab='ajustes';render()});
let t=await p.innerText('#main');ok('adulto ve «Autorizar a un menor de edad»',t.includes('Autorizar a un menor de edad'));
await p.evaluate(()=>{$('#maName').value='Ana';$('#maRel').value='Madre';$('#maOk').checked=true;document.querySelector('#maForm').requestSubmit()});await p.waitForTimeout(300);ok('exige nombre y apellido',!(await p.evaluate(()=>JSON.parse(localStorage.getItem('stub.ma')||'[]').length)));
await p.evaluate(()=>{$('#maName').value='Ana Prueba';$('#maRel').value='Madre';$('#maOk').checked=true;document.querySelector('#maForm').requestSubmit()});await p.waitForTimeout(700);
const code=await p.evaluate(()=>JSON.parse(localStorage.getItem('stub.ma'))[0].code);t=await p.innerText('#main');ok('muestra el código de 8 números',t.replace(/\s/g,'').includes(code),t.slice(0,300));
// v49: el formulario de nombre vuelve a funcionar
await p.evaluate(()=>{$('#pName').value='Rosa Nueva';[...document.querySelectorAll('#profForm')].forEach(f=>{if(f.querySelector('#pName'))f.requestSubmit()})});await p.waitForTimeout(300);ok('«Guardar perfil» guarda el nombre',await p.evaluate(()=>S.profile.name==='Rosa Nueva'));
ok('un solo formulario por id',await p.evaluate(()=>document.querySelectorAll('#profForm').length===1&&document.querySelectorAll('#datosForm').length===1));
await p.evaluate(()=>{$('#pfW').value='70';document.querySelector('#datosForm').requestSubmit()});await p.waitForTimeout(400);ok('«Guardar mis datos» sigue funcionando',await p.evaluate(()=>S.profile.weight===70));
const ma=await p.evaluate(()=>localStorage.getItem('stub.ma'));ok('adulto sin errores',!errs.length,errs);await b.close();
// Menor usa el código
({b,p,errs}=await open(8999,{email:"nico@x.cl"}));await p.waitForTimeout(400);await p.evaluate(ma=>localStorage.setItem('stub.ma',ma),ma);
await p.evaluate(Y=>{$('#obY').value=String(Y-15);$('#obM').value='1';$('#obP').value='912345678';document.querySelector('#obTerms').checked=true},Y);await p.evaluate(()=>A.onboard());await p.waitForTimeout(500);
t=await p.innerText('#main');ok('menor ve la pantalla del código, sin formulario para el adulto',t.includes('Código de autorización')&&!(await p.$('#mpName')),t.slice(0,200));
ok('antes de autorizar no hay consentimiento de salud',await p.evaluate(()=>S.onboard.health===false&&S.minor.state==="pending"));
await p.evaluate(()=>{$('#mpCode').value='99999999';document.querySelector('#minorForm').requestSubmit()});await p.waitForTimeout(400);ok('código inventado no sirve',await p.evaluate(()=>minorPending()));
await p.evaluate(c=>{$('#mpCode').value=c.slice(0,4)+' '+c.slice(4);document.querySelector('#minorForm').requestSubmit()},code);await p.waitForTimeout(600);
let r=await p.evaluate(()=>({m:S.minor,h:S.onboard.health,pend:minorPending()}));ok('código correcto autoriza y registra quién',r.m.state==="parent"&&r.m.by==="Ana Prueba"&&r.m.rel==="Madre"&&r.m.src==="code"&&r.h===true&&!r.pend,r);
// el adulto retira → al volver a cargar, el menor queda pendiente
await p.evaluate(()=>{const a=JSON.parse(localStorage.getItem('stub.ma'));a[0].revoked=new Date().toISOString();localStorage.setItem('stub.ma',JSON.stringify(a))});await p.evaluate(async()=>{await loadShares();render()});
ok('si el adulto retira, la cuenta vuelve a pedir autorización',await p.evaluate(()=>minorPending()&&S.onboard.health===false));ok('menor sin errores',!errs.length,errs);await b.close();
// Cumple 18
const s18=J(F.B);s18.profile.birthY=Y-18;s18.profile.birthM=1;s18.minor={state:"parent",by:"Ana Prueba",rel:"Madre",at:Date.now()-4e10,src:"code"};
({b,p,errs}=await open(8999,{email:"t@x.cl",state:s18}));await p.evaluate(()=>{view.evo=null;render()});t=await p.innerText('#main');ok('al cumplir 18 aparece «Desde ahora decides tú»',t.includes('Desde ahora decides tú'),t.slice(0,150));
await p.evaluate(()=>document.querySelector('[data-act=nowAdult][data-v="1"]').click());await p.waitForTimeout(500);ok('pasa a cuenta adulta',await p.evaluate(()=>!S.minor&&S.onboard.health===true&&S.profile.ageR==="18-29"));ok('18 sin errores',!errs.length,errs);await b.close();
// un menor no ve la tarjeta de adulto
const sm=J(F.B);sm.profile.birthY=Y-16;sm.profile.birthM=1;sm.minor={state:"parent",by:"Ana Prueba",rel:"Madre",at:Date.now(),src:"code"};
({b,p,errs}=await open(8999,{email:"nico@x.cl",state:sm}));await p.evaluate(ma=>{const a=JSON.parse(ma);a[0].minor='nico@x.cl';a[0].used=new Date().toISOString();localStorage.setItem('stub.ma',JSON.stringify(a))},ma);await p.evaluate(async()=>{await loadShares();view.evo=null;tab='ajustes';render()});
t=await p.innerText('#main');ok('un menor no puede crear códigos',!t.includes('Autorizar a un menor de edad'));await b.close();srv.close()})();
