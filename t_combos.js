// Combinaciones de transición: cliente público v78 + servidor candidato; cliente candidato + servidor anterior (y variante solo B3).
// Los mensajes son los que push-tick (ejecutado en Deno) entregó al servicio de notificaciones falso, ya descifrados.
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const fs=require('fs');
const R=[];const ok2=(n,c,x)=>{R.push({n,ok:!!c});ok(n,c,x)};const ROWS=[];
const SRV={'candidato (v5 + push_due_v3)':'/tmp/e2e_v5.json','anterior (v4 + push_due_v2, desplegado hoy)':'/tmp/e2e_v4.json','solo B3 (v4.1 + push_due_v2)':'/tmp/e2e_v4b3.json'};
const CLI={'público v78 (main 360af17)':'/tmp/site_v78','candidato (esta revisión)':'/home/claude/ascenso'};
process.env.ALLOW_SW='1';
(async()=>{let port=9081;
 for(const [cn,root] of Object.entries(CLI))for(const [sn,file] of Object.entries(SRV)){const msgs=JSON.parse(fs.readFileSync(file,'utf8')).recv.map(x=>x.payload);
  const srv=await serve(++port,root);const {b,p}=await open(port,{email:'rosa@prueba.cl',state:J(F.B)});const ctx=p.context();await p.evaluate(()=>navigator.serviceWorker.ready);const sw=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');
  await sw.evaluate(()=>{self.__n=[];self.registration.showNotification=function(t,op){self.__n.push({t,b:op.body,tag:op.tag,d:op.data||null});return Promise.resolve()}});
  const cdp=await ctx.newCDPSession(p);let reg=null;cdp.on('ServiceWorker.workerRegistrationUpdated',e=>{for(const r of e.registrations)if(!r.isDeleted)reg=r.registrationId});await cdp.send('ServiceWorker.enable');await p.waitForTimeout(300);
  for(const m of msgs)await cdp.send('ServiceWorker.deliverPushMessage',{origin:'http://localhost:'+port,registrationId:reg,data:JSON.stringify(m)});await p.waitForTimeout(900);
  const n=await sw.evaluate(()=>self.__n);const kinds=msgs.map(m=>m.k||(m.mid?'m':/paciente/.test(m.title)?'pro':'?'));
  const gen=n.length===msgs.length&&n.every(x=>x.t==='Ascenso'&&x.b==='Tienes un recordatorio de Ascenso');
  ok2(`Cliente ${cn} + servidor ${sn}: ${n.length} avisos (${[...new Set(kinds)].join(', ')}) ${gen?'con':'SIN'} «Ascenso» / «Tienes un recordatorio de Ascenso»`,gen===(!/anterior/.test(sn)||/candidato/.test(cn)),n);
  ROWS.push({estado:`Cliente ${cn} + servidor ${sn}`,esperado:'Título «Ascenso», cuerpo «Tienes un recordatorio de Ascenso»',obtenido:gen?'Genérico en todos':[...new Set(n.map(x=>`«${x.t} / ${x.b}»`))].join(' · '),entorno:'push-tick en Deno → servicio falso → service worker real (entrega por CDP)'});
  if(/candidato/.test(cn)){const k=n.map(x=>x.d&&x.d.k);ok2(`Cliente ${cn} + servidor ${sn}: cada aviso conserva su tipo para abrir el detalle (${k.join(',')})`,k.every(Boolean)&&!k.includes('x'),n)}
  await b.close();srv.close()}
 // Abrir desde el aviso (cliente candidato): hábito, 19:00, vencimiento, alerta al kinesiólogo
 const srv=await serve(++port,'/home/claude/ascenso');
 for(const [lbl,av,o,chk] of [['hábito pendiente','m:m2',{},r=>r.tab==='dia'&&/Tomar agua/.test(r.box)],['19:00','rx',{},r=>r.tab==='dia'],['vencimiento','vence',{},r=>r.tab==='planes'],['alerta al kinesiólogo (cuenta profesional)','pro',{pro:true,email:'kine@prueba.cl'},r=>r.tab==='pacientes']]){
  for(const via of ['app abierta (mensaje del service worker)','app cerrada (se abre con ?aviso)']){
   const {b,p,errs}=await open(port,Object.assign({email:'rosa@prueba.cl',state:J(o.pro?F.A:F.B)},o));await p.waitForTimeout(400);
   if(/abierta/.test(via)){await p.evaluate(()=>{S.missions=S.missions.map(m=>m.id==='m2'?Object.assign(m,{time:'10:00'}):m)});await p.evaluate(v=>{NOTIF_PEND=v;notifOpen()},av)}
   else{await p.evaluate(()=>{S.missions=S.missions.map(m=>m.id==='m2'?Object.assign(m,{time:'10:00'}):m);save()});await p.waitForTimeout(1600);await p.goto(`http://localhost:${port}/?aviso=${encodeURIComponent(av)}`);await p.waitForTimeout(1500)}
   const r=await p.evaluate(()=>({tab,box:(document.querySelector('#alarmBox')||{}).innerText||''}));ok2(`Abrir desde el aviso · ${lbl} · ${via}`,chk(r)&&!errs.length,{r,errs});await b.close()}}
 srv.close();
 ROWS.push({estado:'Abrir desde el aviso con el cliente candidato (hábito, 19:00, vencimiento, alerta al kinesiólogo)',esperado:'Detalle según perfil y estado actual',obtenido:'Hábito → Mi día con el detalle; 19:00 → Mi día; vencimiento → Planes; alerta → Pacientes (cuenta profesional)',entorno:'App en navegador de prueba'});
 ROWS.push({estado:'Abrir desde el aviso con el cliente público v78',esperado:'Detalle según perfil y estado actual',obtenido:'v78 solo enfoca o abre Ascenso en su pantalla inicial (código de sw.js de v78); no lleva al detalle',entorno:'Revisión de código'});
 const f=R.filter(x=>!x.ok).length;console.log(`\n${R.length-f}/${R.length} OK`);fs.writeFileSync('/tmp/t_combos_tabla.json',JSON.stringify(ROWS,null,1));process.exit(f?1:0)})();
