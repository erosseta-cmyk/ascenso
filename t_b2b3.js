// B2/B3 · app abierta (alarma interna + notificación que genera la app) y service worker (aviso que llega con la app cerrada, simulado por CDP).
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const fs=require('fs');const OUT=process.env.OUT;if(OUT)fs.mkdirSync(OUT,{recursive:true});
const R=[];const ok2=(n,c,x)=>{R.push({n,ok:!!c});ok(n,c,x)};const ROWS=[];const tab=(estado,esperado,obtenido,entorno)=>ROWS.push({estado,esperado,obtenido,entorno});
const AT='2026-11-27T09:59:00-03:00'; // viernes
function setup(o){view.evo=null;S.seenStage=99;S.ui.simpleAsked=true;S.ui.waNo=true;S.ui.kineAsked=true;S.ui.simple=false;const t=S.train;t.parq=Array(10).fill(false);t.parqAt=today();t.hold=null;t.senior=false;t.plan.days=o.days||'mar-jue-sab';t.plan.walk=15;t.walkAt=0;
 t.sessions=(o.sessions||[]).map(x=>Object.assign({type:'caminata',result:'completa',borg:4,pain:0,at:Date.now()-864e5,ex:[],exN:0,xp:50},x));if(o.hold)t.hold=o.hold;
 S.missions=o.ms.map(([id,name,time,dur])=>({id,name,cat:'Cuerpo',xp:20,time,dur:dur||0,days:[0,1,2,3,4,5,6],created:'2026-01-01'}));S.done={};AL.on=true;AL.fired={};AL.snooze={};alSave();save();tab='dia';view={};render();
 window.__notes=[];window.__shows=[];const _as=alShow;window.alShow=function(t,sub,id,o){_as(t,sub,id,o);const el=document.querySelector('#alarmBox');window.__shows.push({id,title:t,txt:el.innerText,hecho:!!el.querySelector('[data-act=alDone]'),walk:!!el.querySelector('[data-act=alWalk]'),silent:!!(o&&o.silent)})};Object.defineProperty(Notification,'permission',{configurable:true,get:()=>'granted'});Object.defineProperty(navigator.serviceWorker,'ready',{configurable:true,get:()=>Promise.resolve({showNotification:(t,op)=>{window.__notes.push({t,b:op.body,tag:op.tag,d:op.data});return Promise.resolve()}})});return true}
function fireAll(){for(let i=0;i<8;i++){alStop();alCheck()}alStop();const o=window.__shows.slice();window.__shows.length=0;return o}
const MS4=[['wk','Caminar 20 minutos','10:00',20],['fz','Hacer mi rutina de Ascenso','10:00'],['sq','Sentadillas 10 minutos','10:00'],['ag','Tomar agua','10:00']];
async function page(port){const {b,p,errs}=await open(port,{email:'rosa@prueba.cl',state:J(F.B),clock:AT});await p.context().grantPermissions(['notifications'],{origin:'http://localhost:'+port});return{b,p,errs}}
const idsOf=a=>a.map(x=>x.id).sort().join(',');
(async()=>{const port=9023;const srv=await serve(port);
 // Fila 1 (simulada): solo fuerza en pausa
 {const {b,p,errs}=await page(port);await p.evaluate(`(${setup})(${JSON.stringify({ms:MS4})})`);await p.evaluate(()=>{window.pausedActs=()=>['fuerza']});await p.clock.fastForward('01:30');
  const f=await p.evaluate(`(${fireAll})()`);const n=await p.evaluate(()=>window.__notes);
  ok2('App abierta · Fila 1 [estado inyectado]: suenan caminata y agua; no suenan «rutina de Ascenso» ni «Sentadillas»',idsOf(f)==='ag,wk',f);
  ok2('App abierta · Fila 1: cada notificación usa «Ascenso» / «Tienes un recordatorio de Ascenso»',n.length===2&&n.every(x=>x.t==='Ascenso'&&x.b==='Tienes un recordatorio de Ascenso'),n);
  tab('Fuerza en pausa y caminata habilitada (estado inyectado: hoy la app no lo produce)','Sin aviso de fuerza; caminata con aviso',`Alarmas: ${idsOf(f)} (sin fuerza)`,'App abierta, navegador de prueba');ok2('Fila 1: sin errores',!errs.length,errs);await b.close()}
 // Fila 2 (real): plan en pausa por síntomas
 {const {b,p,errs}=await page(port);await p.evaluate(`(${setup})(${JSON.stringify({ms:[...MS4,['yo','Yoga 10 minutos','10:00']],hold:{at:'2026-11-27',kind:'sintomas',sid:'s1'},sessions:[{id:'s1',date:'2026-11-27',alert:true,pain:1,result:'parcial'}]})})`);await p.clock.fastForward('01:30');
  const f=await p.evaluate(`(${fireAll})()`);const n=await p.evaluate(()=>window.__notes);const dia=await p.evaluate(()=>{tab='dia';render();return document.querySelector('#main').innerText});
  ok2('App abierta · Fila 2: con el plan en pausa solo suena «Tomar agua»',idsOf(f)==='ag'&&n.length===1&&n[0].b==='Tienes un recordatorio de Ascenso',{f,n});
  ok2('App abierta · Fila 2: Mi día muestra los hábitos físicos «En pausa junto con tu plan», incluida la rutina de Ascenso',(dia.match(/En pausa junto con tu plan/g)||[]).length===4,dia.slice(0,1500));
  tab('Plan en pausa por síntomas: caminata, rutina, sentadillas y yoga; agua habilitada','Solo el aviso de agua',`Alarmas: ${idsOf(f)||'ninguna'}`,'App abierta, navegador de prueba');ok2('Fila 2: sin errores',!errs.length,errs);await b.close()}
 // Fila 3: mantener + meta personal
 {const {b,p,errs}=await page(port);await p.evaluate(`(${setup})(${JSON.stringify({ms:[['wk','Caminar 20 minutos','10:00',20]],sessions:[{id:'s1',date:'2026-11-26',pain:3}]})})`);await p.clock.fastForward('01:30');
  const r=await p.evaluate(()=>{const o=window.__shows[0]||{};return o});await p.waitForTimeout(50);const n=await p.evaluate(()=>window.__notes);
  if(OUT)await p.screenshot({path:OUT+'/alarma_mantener.png'});
  ok2('App abierta · Fila 3: la caminata sigue habilitada y suena',r.id==='wk',r);
  ok2('App abierta · Fila 3: la alarma distingue la meta personal del plan y no sugiere aumentar',/Tu meta personal · hoy va primero tu plan/i.test(r.txt)&&/Tu plan de hoy indica caminar 15 minutos\./.test(r.txt)&&/Tu meta personal de 20 minutos sigue guardada\./.test(r.txt)&&r.walk&&!r.hecho,r);
  ok2('App abierta · Fila 3: la notificación no lleva el nombre del hábito',n.length===1&&n[0].t==='Ascenso'&&!/Caminar|20/.test(JSON.stringify(n)),n);
  const t=await p.evaluate(()=>{document.querySelector('#alarmBox [data-act=alWalk]').click();return{tab,box:document.querySelector('#alarmBox').hidden,ent:document.querySelector('#main').innerText.includes('Camina 15 minutos')}});
  ok2('App abierta · Fila 3: «Ver mi caminata de hoy» abre Entreno con los 15 minutos del plan',t.tab==='entreno'&&t.box&&t.ent,t);
  tab('«Mantener» (último dolor 3), plan 15 min, hábito personal «Caminar 20 minutos» a las 10:00','Suena; dentro de la app se distingue de la caminata del plan','Suena con «Tu plan de hoy indica caminar 15 minutos» y «Tu meta personal de 20 minutos sigue guardada»; botón «Ver mi caminata de hoy», sin «Hecho»','App abierta, navegador de prueba');ok2('Fila 3: sin errores',!errs.length,errs);await b.close()}
 // Fila 5a: pospuesto y luego pausa
 {const {b,p,errs}=await page(port);await p.evaluate(`(${setup})(${JSON.stringify({ms:[['wk','Caminar 20 minutos','10:00',20],['ag','Tomar agua','10:00']]})})`);await p.clock.fastForward('01:30');
  await p.evaluate(()=>{for(let i=0;i<4;i++){const x=document.querySelector('#alarmBox [data-act=alSnooze]');if(x&&!document.querySelector('#alarmBox').hidden)x.click();alStop();alCheck()}const x=document.querySelector('#alarmBox [data-act=alSnooze]');if(x&&!document.querySelector('#alarmBox').hidden)x.click();window.__shows.length=0});
  const sn=await p.evaluate(()=>Object.keys(AL.snooze).sort().join(','));
  await p.evaluate(()=>{tab='entreno';view.log={borg:4,pain:7};render();const f=document.querySelector('#logForm');f.querySelector('input[value=completa]').checked=true;f.requestSubmit()});await p.waitForTimeout(200);
  const hold=await p.evaluate(()=>!!S.train.hold);await p.clock.fastForward('10:30');const f=await p.evaluate(`(${fireAll})()`);const left=await p.evaluate(()=>Object.keys(AL.snooze).join(','));
  ok2('App abierta · Fila 5a: ambos pospuestos; el plan entra en pausa (dolor 7) antes de que venzan',sn==='ag,wk'&&hold,{sn,hold});
  ok2('App abierta · Fila 5a: al vencer, la caminata se omite y el agua vuelve a sonar; no queda pendiente',idsOf(f)==='ag'&&left==='',{f,left});
  tab('Caminata y agua pospuestas 10 min; antes de que venzan, sesión con dolor 7 (pausa)','Se omite la caminata al vencer; el agua suena',`Al vencer: ${idsOf(f)||'ninguna'}`,'App abierta, navegador de prueba');ok2('Fila 5a: sin errores',!errs.length,errs);await b.close()}
 // Fila 5b: programada 10:30, pausa 10:20
 {const {b,p,errs}=await page(port);await p.evaluate(`(${setup})(${JSON.stringify({ms:[['wk','Caminar 20 minutos','10:30',20]]})})`);await p.clock.fastForward('21:00');
  await p.evaluate(()=>{tab='entreno';view.log={borg:4,pain:7};render();const f=document.querySelector('#logForm');f.querySelector('input[value=parcial]').checked=true;f.requestSubmit()});await p.waitForTimeout(200);
  const hold=await p.evaluate(()=>S.train.hold&&S.train.hold.kind);
  await p.clock.fastForward('10:00');const f=await p.evaluate(`(${fireAll})()`);
  ok2('App abierta · Fila 5b: programada 10:30 y pausa a las 10:20 → a las 10:31 no suena',f.length===0&&hold==='dolor',{f,hold});
  tab('Caminata programada 10:30; a las 10:20 sesión con dolor 7 (pausa)','Sin alarma a las 10:30',f.length?'Sonó':'Sin alarma','App abierta, navegador de prueba');ok2('Fila 5b: sin errores',!errs.length,errs);await b.close()}
 // Control: sin pausa, pospuesto vuelve a sonar
 {const {b,p}=await page(port);await p.evaluate(`(${setup})(${JSON.stringify({ms:[['wk','Caminar 20 minutos','10:00',20]]})})`);await p.clock.fastForward('01:30');await p.evaluate(()=>{document.querySelector('#alarmBox [data-act=alSnooze]').click();window.__shows.length=0});await p.clock.fastForward('10:30');const f=await p.evaluate(`(${fireAll})()`);
  ok2('Control: sin pausa, lo pospuesto vuelve a sonar a los 10 minutos',idsOf(f)==='wk',f);await b.close()}
 // B3 · abrir desde la notificación
 for(const [lbl,st,av,check] of [
  ['hábito pendiente → detalle en silencio',{ms:[['ag','Tomar agua','10:00']]},'m:ag',r=>r.tab==='dia'&&!r.hidden&&/Tu recordatorio/i.test(r.box)&&/Tomar agua/.test(r.box)&&!r.ring],
  ['hábito en pausa → aviso de pausa, sin detalle para hacerlo',{ms:[['wk','Caminar 20 minutos','10:00',20]],hold:{kind:'sintomas',sid:'s1'},sessions:[{id:'s1',date:'2026-11-27',alert:true,pain:1}]},'m:wk',r=>r.hidden&&r.toast==='Esta actividad está en pausa junto con tu plan.'],
  ['hábito ya hecho → lo informa',{ms:[['ag','Tomar agua','10:00']],done:1},'m:ag',r=>r.hidden&&r.toast==='Ya marcaste este hábito hoy.'],
  ['recordatorio de las 19:00 → Mi día',{ms:[]},'rx',r=>r.tab==='dia'],
  ['vencimiento → Planes',{ms:[]},'vence',r=>r.tab==='planes']]){
  const {b,p,errs}=await page(port);await p.evaluate(`(${setup})(${JSON.stringify(st)})`);if(st.done)await p.evaluate(()=>{S.done[today()]={ag:Date.now()};save()});await p.waitForTimeout(1600);
  await p.goto(`http://localhost:${port}/?aviso=${encodeURIComponent(av)}`);await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{const el=document.querySelector('#alarmBox');return{tab,hidden:!el||el.hidden,box:el?el.innerText:'',ring:!!alRing,toast:document.querySelector('#toast').textContent,url:location.search}});
  if(OUT&&av==='m:ag'&&!st.done)await p.screenshot({path:OUT+'/abrir_desde_aviso.png'});
  ok2(`B3 · abrir Ascenso desde el aviso (${lbl})`,check(r)&&r.url==='',r);ok2(`B3 · ${lbl}: sin errores`,!errs.length,errs);await b.close()}
 tab('Tocar el aviso de un hábito pendiente / en pausa / ya hecho','Al abrir, detalle según perfil y estado actual','Pendiente: detalle sin sonido; en pausa: «Esta actividad está en pausa junto con tu plan.»; hecho: «Ya marcaste este hábito hoy.»','App abierta, navegador de prueba');
 // Service worker real: el aviso que llega con la app cerrada (entrega simulada por CDP)
 process.env.ALLOW_SW='1';
 for(const [lbl,pl] of [['hábito, con el texto que hoy envía el servidor',{title:'Ascenso · es la hora',body:'Caminar 20 minutos',tag:'m-wk',mid:'wk'}],['alerta al kinesiólogo',{title:'Ascenso · revisa a un paciente',body:'Alguien que comparte su avance contigo registró dolor…',tag:'pro-alert'}],['19:00',{title:'Ascenso · tus ejercicios de hoy',body:'Te quedan 2 ejercicios de tu kinesiólogo por marcar hoy.',tag:'pro-alert'}],['carga nueva de push-tick v5',{title:'Ascenso',body:'Tienes un recordatorio de Ascenso',tag:'a-rx',k:'rx'}]]){
  const {b,p}=await open(port,{email:'rosa@prueba.cl',state:J(F.B)});const ctx=p.context();await p.evaluate(()=>navigator.serviceWorker.ready);const sw=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');
  await sw.evaluate(()=>{self.__n=[];self.registration.showNotification=function(t,op){self.__n.push({t,b:op.body,tag:op.tag,d:op.data});return Promise.resolve()}});
  const cdp=await ctx.newCDPSession(p);let reg=null;cdp.on('ServiceWorker.workerRegistrationUpdated',e=>{for(const r of e.registrations)if(!r.isDeleted)reg=r.registrationId});await cdp.send('ServiceWorker.enable');await p.waitForTimeout(300);
  await cdp.send('ServiceWorker.deliverPushMessage',{origin:'http://localhost:'+port,registrationId:reg,data:JSON.stringify(pl)});await p.waitForTimeout(800);
  const n=await sw.evaluate(()=>self.__n);ok2(`Service worker · ${lbl}: título «Ascenso» y cuerpo «Tienes un recordatorio de Ascenso», sin el texto recibido`,n.length===1&&n[0].t==='Ascenso'&&n[0].b==='Tienes un recordatorio de Ascenso'&&!/Caminar|dolor|ejercicios/.test(JSON.stringify(n)),n);
  if(pl.mid)ok2('Service worker: conserva «Posponer» y el identificador para abrir el detalle',n[0]&&n[0].tag==='m-wk'&&n[0].d.mid==='wk',n);
  if(pl.mid){await sw.evaluate(()=>clients.matchAll({type:'window'}).then(cs=>cs.forEach(c=>c.postMessage({t:'aviso',v:'m:m2'}))));await p.waitForTimeout(400);const r=await p.evaluate(()=>({tab,box:(document.querySelector('#alarmBox')||{}).innerText||''}));ok2('Service worker → app abierta: el mensaje del aviso abre Mi día con el detalle del hábito',r.tab==='dia'&&/Tomar agua/.test(r.box),r)}
  await b.close()}
 delete process.env.ALLOW_SW;
 tab('Aviso que llega con la app cerrada, con el texto que hoy envía el servidor («Caminar 20 minutos», dolor, 19:00)','Título «Ascenso», cuerpo «Tienes un recordatorio de Ascenso»','El service worker muestra solo el texto genérico en los 4 casos','Service worker real en navegador de prueba; entrega push simulada por CDP');
 const f=R.filter(x=>!x.ok).length;console.log(`\n${R.length-f}/${R.length} OK`);fs.writeFileSync('/tmp/t_b2b3_tabla.json',JSON.stringify(ROWS,null,1));srv.close();process.exit(f?1:0)})();
