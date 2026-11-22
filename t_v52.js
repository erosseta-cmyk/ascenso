const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8998);
// 1. Usuario antiguo sin compartir: ve la tarjeta una vez
let {b,p,errs}=await open(8998,{email:"rosa@x.cl",state:J(F.B)});await p.evaluate(()=>{view.evo=null;S.seenStage=99;S.ui.simpleAsked=1;tab='dia';render()});
let t=await p.innerText('#main');ok('cuenta antigua ve la tarjeta del kinesiólogo',t.includes('Klgo. Esteban Rosset haga el seguimiento'),t.slice(0,300));
ok('la casilla NO viene marcada',await p.evaluate(()=>!$('#kOk').checked));
await p.evaluate(()=>document.querySelector('[data-act=kineYes]').click());await p.waitForTimeout(300);ok('sin marcar la casilla no comparte',await p.evaluate(()=>!(JSON.parse(localStorage.getItem('stub.mine.rosa@x.cl')||'[]').length)));
await p.evaluate(()=>{$('#kOk').checked=true;document.querySelector('[data-act=kineYes]').click()});await p.waitForTimeout(700);
ok('con la casilla comparte con kinerecupera',await p.evaluate(()=>JSON.parse(localStorage.getItem('stub.mine.rosa@x.cl')||'[]').some(x=>x.email==='kinerecupera@gmail.com')));
t=await p.innerText('#main');ok('la tarjeta desaparece tras compartir',!t.includes('haga el seguimiento'));ok('sin errores 1',!errs.length,errs);await b.close();
// 2. "No, gracias" la oculta para siempre
({b,p,errs}=await open(8998,{email:"luis@x.cl",state:J(F.B)}));await p.evaluate(()=>{view.evo=null;S.seenStage=99;S.ui.simpleAsked=1;tab='dia';render()});
await p.evaluate(()=>document.querySelector('[data-act=kineNo]').click());await p.waitForTimeout(300);t=await p.innerText('#main');ok('«No, gracias» la oculta',!t.includes('haga el seguimiento')&&await p.evaluate(()=>S.ui.kineAsked===1));
await p.evaluate(async()=>{await loadShares();render()});t=await p.innerText('#main');ok('no vuelve a aparecer',!t.includes('haga el seguimiento'));await b.close();
// 3. Link de invitación: reaparece aunque la hubiera descartado, y limpia la URL
const s3=J(F.B);s3.ui.kineAsked=1;
({b,p,errs}=await open(8998,{email:"luis@x.cl",state:s3,path:'?k=recupera'}));await p.evaluate(()=>{view.evo=null;S.seenStage=99;S.ui.simpleAsked=1;tab='dia';render()});
t=await p.innerText('#main');ok('con ?k=recupera la tarjeta aparece igual',t.includes('haga el seguimiento'));ok('la URL queda limpia',await p.evaluate(()=>!location.search.includes('k=')));
ok('el correo no va en la URL',await p.evaluate(()=>!location.href.includes('@')));await b.close();
// 4. Modo simple también la muestra
const s4=J(F.B);s4.ui.simple=true;s4.ui.simpleAsked=1;
({b,p,errs}=await open(8998,{email:"ana@x.cl",state:s4}));await p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='dia';render()});t=await p.innerText('#main');ok('modo simple muestra la tarjeta',t.includes('haga el seguimiento'));ok('sin errores 4',!errs.length,errs);await b.close();
// 5. Quien ya comparte con él no la ve
({b,p,errs}=await open(8998,{email:"eva@x.cl",state:J(F.B),mine:[{email:"kinerecupera@gmail.com",since:new Date().toISOString()}]}));await p.evaluate(()=>{view.evo=null;S.seenStage=99;S.ui.simpleAsked=1;tab='dia';render()});t=await p.innerText('#main');ok('quien ya comparte no la ve',!t.includes('haga el seguimiento'));await b.close();
// 6. El kinesiólogo no la ve
({b,p,errs}=await open(8998,{email:"kine@x.cl",state:J(F.B)}));await p.evaluate(()=>{view.evo=null;S.seenStage=99;S.ui.simpleAsked=1;tab='dia';render()});t=await p.innerText('#main');ok('el profesional no la ve',!t.includes('haga el seguimiento'));await b.close();
// 7. Sin consentimiento de salud no aparece
const s7=J(F.B);s7.onboard.health=false;
({b,p,errs}=await open(8998,{email:"sin@x.cl",state:s7}));await p.evaluate(()=>{view.evo=null;S.seenStage=99;S.ui.simpleAsked=1;tab='dia';render()});t=await p.innerText('#main');ok('sin autorización de salud no aparece',!t.includes('haga el seguimiento'));await b.close();
srv.close()})();
