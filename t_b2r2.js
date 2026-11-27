// B2 ronda 2 · app: rutina de Ascenso (nombre exacto) sin tocar rachas; avisos que no se recuperan tras una pausa; cuestionario vencido.
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const fs=require('fs');
const R=[];const ok2=(n,c,x)=>{R.push({n,ok:!!c});ok(n,c,x)};const ROWS=[];const tab=(a,b,c,d)=>ROWS.push({estado:a,esperado:b,obtenido:c,entorno:d});
const ms=h=>Date.parse(`2026-11-27T${h}:00-03:00`);
function setup(o){view.evo=null;S.seenStage=99;S.ui.simpleAsked=true;S.ui.waNo=true;S.ui.kineAsked=true;S.ui.simple=false;const t=S.train;t.parq=Array(10).fill(false);t.parqAt=o.parqAt||today();t.parqTs=String(o.parqTs||Date.now()-864e5);t.hold=null;t.senior=false;t.plan.days='mar-jue-sab';t.plan.walk=15;
 t.sessions=(o.sessions||[]).map(x=>Object.assign({type:'caminata',result:'completa',borg:4,pain:0,ex:[],exN:0,xp:50,date:today()},x));if(o.hold)t.hold=o.hold;
 S.missions=o.ms.map(([id,name,time])=>({id,name,cat:'Cuerpo',xp:20,time,dur:0,days:[0,1,2,3,4,5,6],created:'2026-01-01'}));S.done={};AL.on=true;AL.fired={};AL.snooze={};alSave();save();tab='dia';view={};render();
 window.__shows=[];const _as=alShow;window.alShow=function(t,sub,id,op){_as(t,sub,id,op);window.__shows.push(id)};Object.defineProperty(Notification,'permission',{configurable:true,get:()=>'granted'});Object.defineProperty(navigator.serviceWorker,'ready',{configurable:true,get:()=>Promise.resolve({showNotification:()=>Promise.resolve()})});return true}
const drain=()=>{for(let i=0;i<8;i++){alStop();alCheck()}alStop();const o=window.__shows.slice().sort().join(',');window.__shows.length=0;return o};
async function pg(port,at){return open(port,{email:'rosa@prueba.cl',state:J(F.B),clock:at})}
(async()=>{const port=9051;const srv=await serve(port);
 // --- Rutina: nombre exacto ---
 {const {b,p,errs}=await pg(port,'2026-11-27T10:29:30-03:00');await p.evaluate(`(${setup})(${JSON.stringify({ms:[['r1','Hacer mi rutina de Ascenso','10:30'],['r2','  hacer mi rutina de ascenso ','10:30'],['r3','Rutina de Ascenso de la tarde','10:30'],['ag','Tomar agua','10:30']],hold:{at:'2026-11-27',kind:'sintomas',sid:'s1'},sessions:[{id:'s1',alert:true,pain:1,at:ms('10:00')}]})})`);
  await p.clock.fastForward('01:00');const f=await p.evaluate(drain);const dia=await p.evaluate(()=>{tab='dia';render();const t=document.querySelector('#main').innerText;return{n:(t.match(/En pausa junto con tu plan/g)||[]).length,mp:S.missions.map(m=>m.id+':'+mPaused(m,today())).join(',')}});
  ok2('Rutina (pausa activa): el nombre del catálogo, con otras mayúsculas o espacios, se silencia; «Rutina de Ascenso de la tarde» y agua suenan',f==='ag,r3',{f});
  ok2('Rutina: Mi día la muestra en pausa con el mismo criterio que el aviso (r1 y r2 sí; r3 y agua no)',dia.mp==='r1:true,r2:true,r3:false,ag:false'&&dia.n>=2,dia);ok2('Rutina: sin errores',!errs.length,errs);await b.close()}
 // --- Rachas: f28cfb4 (antes de B2) vs bda08d4 vs esta revisión ---
 const sk={};for(const [k,site] of [['f28cfb4','/tmp/site_f28'],['bda08d4','/tmp/site_bda'],['actual','/home/claude/ascenso']]){const s2=await serve(port+1+Object.keys(sk).length,site);const pp=port+1+Object.keys(sk).length;
  const st=J(F.B);st.created='2026-11-01';st.missions=[{id:'r1',name:'Hacer mi rutina de Ascenso',cat:'Cuerpo',xp:60,time:'18:00',dur:0,days:[0,1,2,3,4,5,6],created:'2026-11-01'}];
  const D=n=>{const d=new Date(Date.parse('2026-11-27T12:00:00-03:00')-n*864e5);return d.toLocaleDateString('en-CA',{timeZone:'America/Santiago'})};st.done={};for(const n of [1,3,4,6,7,8,9,10])st.done[D(n)]={r1:1};st.pauseDays={[D(2)]:1};
  const {b,p}=await open(pp,{email:'rosa@prueba.cl',state:st,clock:'2026-11-27T12:00:00-03:00'});sk[k]=await p.evaluate(()=>streak());await b.close();s2.close()}
 ok2(`Rachas: esta revisión da la misma racha que antes de B2 (${sk.actual} = ${sk.f28cfb4}); bda08d4 la habría cambiado (${sk.bda08d4})`,sk.actual===sk.f28cfb4&&sk.bda08d4!==sk.f28cfb4,sk);
 tab('Racha con un día de pausa en que solo estaba «Hacer mi rutina de Ascenso»','Igual que antes de B2',`Antes ${sk.f28cfb4} · bda08d4 ${sk.bda08d4} · ahora ${sk.actual}`,'App en navegador de prueba');
 // --- No recuperar (app abierta) ---
 {const {b,p,errs}=await pg(port,'2026-11-27T10:29:30-03:00');await p.evaluate(`(${setup})(${JSON.stringify({ms:[['wk','Caminar 20 minutos','10:30'],['ag','Tomar agua','10:30']],hold:{at:'2026-11-27',kind:'dolor',sid:'s1'},sessions:[{id:'s1',pain:7,at:ms('10:20'),type:'fuerza'}]})})`);
  await p.clock.fastForward('01:00');const a=await p.evaluate(drain);await p.clock.fastForward('02:30');await p.evaluate(()=>{tab='entreno';render();const c=document.querySelector('#holdChk');if(c)c.checked=true;const x=document.querySelector('[data-act=holdOff]');x&&x.click()});
  const lifted=await p.evaluate(()=>!S.train.hold&&!!S.train.sessions[0].resumedAt);await p.clock.fastForward('01:00');const c=await p.evaluate(drain);
  ok2('App abierta: pausa 10:20, caminata 10:30, pausa levantada 10:33 → a las 10:30 solo agua; después no se recupera',a==='ag'&&lifted&&c==='',{a,lifted,c});
  tab('Caminata 10:30; pausa por dolor 10:20, levantada por la persona 10:33 (app abierta)','Se omite; no se recupera',`10:30: ${a}; después: ${c||'nada'}`,'App en navegador de prueba');ok2('sin errores',!errs.length,errs);await b.close()}
 for(const [res,exp,lbl] of [['10:33','','app cerrada a las 10:30 y abierta 10:34, pausa levantada 10:33 → omitida'],['10:25','wk','pausa levantada 10:25 → suena a las 10:30']]){
  const at=res==='10:33'?'2026-11-27T10:34:00-03:00':'2026-11-27T10:29:30-03:00';const {b,p}=await pg(port,at);
  await p.evaluate(`(${setup})(${JSON.stringify({ms:[['wk','Caminar 20 minutos','10:30']],sessions:[{id:'s1',pain:7,at:ms('10:20'),type:'fuerza',paused:'dolor',resumedAt:ms(res)}]})})`);if(res==='10:25')await p.clock.fastForward('01:00');
  const f=await p.evaluate(drain);ok2(`App: ${lbl}`,f===exp,f);await b.close()}
 for(const [res,exp,lbl] of [['10:42','','pospuesto a 10:40 y pausa 10:35–10:42 → omitido'],['10:38','wk','pospuesto a 10:40 y pausa 10:35–10:38 → suena']]){
  const {b,p}=await pg(port,res==='10:42'?'2026-11-27T10:43:00-03:00':'2026-11-27T10:40:30-03:00');
  await p.evaluate(`(${setup})(${JSON.stringify({ms:[['wk','Caminar 20 minutos','10:30']],sessions:[{id:'s1',pain:7,at:ms('10:35'),type:'fuerza',paused:'dolor',resumedAt:ms(res)}]})})`);
  await p.evaluate(at=>{AL.fired[today()]={wk:at-600000};AL.snooze.wk={at,d:today()};alSave()},ms('10:40'));const f=await p.evaluate(drain);const left=await p.evaluate(()=>!!AL.snooze.wk);
  ok2(`App: ${lbl}`,f===exp&&!left,{f,left});tab(`Caminata ${lbl.split('→')[0]}`,exp?'Suena':'Se omite',f?'Suena':'Omitida','App en navegador de prueba');await b.close()}
 // --- Cuestionario vencido ---
 for(const [lbl,o] of [['vencido sin otra restricción',{}],['vencido con pausa por síntomas activa',{hold:{at:'2026-11-27',kind:'sintomas',sid:'s1'},sessions:[{id:'s1',alert:true,pain:1,at:ms('09:00')}]}]]){
  const {b,p,errs}=await pg(port,'2026-11-27T10:29:30-03:00');await p.evaluate(`(${setup})(${JSON.stringify(Object.assign({ms:[['wk','Caminar 20 minutos','10:30'],['ag','Tomar agua','10:30']],parqAt:'2025-10-01',parqTs:Date.parse('2025-10-01')},o))})`);
  await p.clock.fastForward('01:00');const f=await p.evaluate(drain);
  const st=await p.evaluate(()=>{const tr=trainReady();tab='entreno';render();const ent=document.querySelector('#main').innerText;tab='dia';render();const dia=document.querySelector('#main').innerText;const wk=S.missions.find(m=>m.id==='wk');return{tr,entCuest:/cuestionario|PAR-Q|preguntas/i.test(ent),entPausa:/Plan en pausa|en pausa/i.test(ent.slice(0,600)),habPausa:mPaused(wk,today()),diaPausa:/En pausa junto con tu plan/.test(dia)}});
  ok2(`Cuestionario ${lbl}: la app pide el cuestionario para entrenar, permite marcar los hábitos y no los muestra en pausa → suenan caminata y agua`,st.tr==='parq'&&!st.habPausa&&!st.diaPausa&&f==='ag,wk',{st,f});
  tab(`Cuestionario ${lbl}`,'Aviso coherente con lo que la app permite',`App: Entreno pide el cuestionario; hábitos habilitados → suenan ${f}`,'App en navegador de prueba');ok2('sin errores',!errs.length,errs);await b.close()}
 const f=R.filter(x=>!x.ok).length;console.log(`\n${R.length-f}/${R.length} OK`);fs.writeFileSync('/tmp/t_b2r2_tabla.json',JSON.stringify(ROWS,null,1));srv.close();process.exit(f?1:0)})();
