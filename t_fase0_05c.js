// Fase 0 (solo lectura del producto): recorrido 05c y estados vecinos en la copia v79, con servidor simulado y datos ficticios.
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8988);const st=J(F.B);let {b,p,errs}=await open(8988,{email:'rosa@prueba.cl',state:st,clock:'2026-11-26T12:00:00-03:00'})/* fecha fija (jueves): el caso se escribió para un día de caminata */;
 const ev=f=>p.evaluate(f);const W=ms=>p.waitForTimeout(ms||300);
 // Estado 05c: ayer fuerza con dolor 3; caminata indicada 15; hábito «Caminar 20 minutos» con duración 20 y hora 08:00
 await ev(()=>{view.evo=null;S.seenStage=99;const t=S.train;t.hold=null;t.parq=Array(10).fill(false);t.sessions=t.sessions.filter(x=>x.date!==today());SH.mine=[];S.ui=S.ui||{};S.ui.simple=false;
  t.sessions.unshift({id:'d3',date:addDays(today(),-1),type:'fuerza',stage:t.stage,result:'completa',borg:4,pain:3,at:Date.now()-864e5,ex:['a','b','c','d'],exN:4});
  S.missions=S.missions.filter(m=>!/camin/i.test(m.name));S.missions.push({id:'mc',name:'Caminar 20 minutos',cat:'Cuerpo',xp:40,time:'08:00',dur:20,days:[0,1,2,3,4,5,6],created:addDays(today(),-30)});tab='dia';render()});
 let r=await ev(()=>({walk:S.train.plan.walk,prog:progression().state,tt:todayTrain(),note:walkNote(S.missions.find(m=>m.id==='mc')),hasTimer:!!document.querySelector('[data-act=startTimer][data-id=mc]'),todo:(document.querySelector('#hoyCaminata [data-act=tab]')||document.querySelector('button.todo')||{}).dataset,keep:!!document.querySelector('#walkKeep')}));
 console.log('05c',JSON.stringify(r));
 ok('R1 dosis clínica = plan.walk; estado de progresión «hold» por dolor 3 del último registro',r.prog==='hold'&&r.walk>0,r);
 ok('R2 en 05c el hábito no muestra «Temporizador» (walkNote lo oculta)',!r.hasTimer&&!!r.note,r);
 ok('R3 el botón principal «Hoy toca» solo cambia a la pestaña Entreno (no inicia nada)',r.todo&&r.todo.act==='tab'&&r.todo.k==='entreno',r);
 // ¿Existe un temporizador de la caminata clínica?
 r=await ev(()=>{tab='entreno';render();const m=document.querySelector('#main').innerHTML;return{timerEnEntreno:/startTimer|timerToggle/.test(m),registrar:!!document.querySelector('[data-act=openLog]')||/Registrar sesión de hoy/.test(document.querySelector('#main').innerText)}});
 ok('R4 Entreno no tiene temporizador para la caminata indicada; ofrece «Registrar sesión de hoy»',!r.timerEnEntreno&&r.registrar,r);
 // Caso fuera de pausa: el temporizador del hábito usa la duración del hábito, no la dosis clínica
 await ev(()=>{S.train.sessions[0].pain=1;tab='dia';render()});
 r=await ev(()=>{const b=document.querySelector('[data-act=startTimer][data-id=mc]');if(!b)return{b:false};b.click();return{b:true,dur:S.timer&&S.timer.dur,walk:S.train.plan.walk}});
 ok('R5 sin pausa, «Temporizador» del hábito arranca con 20 min (meta personal), no con los 15 indicados',r.b&&r.dur===20&&r.walk!==20,r);
 // Rosa camina 8 minutos y deja el reloj corriendo hasta cero
 r=await ev(()=>{S.timer.since=Date.now()-20*6e4-1000;render();tickTimer();const t=S.timer;return{rang:t.rang,acc:t.acc,done:!!(S.done[today()]||{}).mc,ses:S.train.sessions.filter(s=>s.date===today()).length,note:(document.querySelector('#tNote')||{}).textContent,guardadoEnEstado:'timer' in JSON.parse(JSON.stringify(S))}});
 ok('R6 al llegar a cero: suena, pide confirmar; no marca el hábito ni crea sesión clínica',r.rang&&!r.done&&r.ses===0,r);
 ok('R7 lo único que queda es S.timer {dur, acc=20 min, rang} en el estado sincronizado; no distingue 8 de 20 minutos caminados',r.acc===20*6e4&&r.guardadoEnEstado,r);
 await ev(()=>{A.timerStop()});
 // Modo simple del mismo perfil
 await ev(()=>{S.train.sessions[0].pain=3});r=await ev(()=>{S.ui.simple=true;view.ssub=null;tab='dia';render();const t=document.querySelector('#main').innerText;S.ui.simple=false;render();return{plan:/caminata de \d+ minutos|ya está registrada|Tu plan de hoy indica caminar \d+ minutos/.test(t),keep:/mantén tu caminata|Tu plan de hoy indica caminar/.test(t),hab:/Caminar 20 minutos/.test(t),t:t.slice(0,600)}});
 ok('R12 modo simple del mismo perfil: plan del día, «mantén tu caminata» y el hábito aparte',r.plan&&r.keep&&r.hab,r);
 // Registro de la sesión clínica de hoy (caminata): solo «Completa» o «Parcial»
 await ev(()=>{S.train.sessions[0].pain=3;tab='entreno';view.log={};render()});
 r=await ev(()=>({opciones:[...document.querySelectorAll('#logForm input[name=res]')].map(x=>x.value),omitida:/Hoy no pude|omit/i.test(document.querySelector('#logForm').innerText)}));
 ok('R8 el registro ofrece solo «Completa» y «Parcial» (no existe «Hoy no pude»)',r.opciones.join()==='completa,parcial'&&!r.omitida,r);
 await ev(()=>{const f=document.querySelector('#logForm');f.querySelector('input[value=parcial]').checked=true;view.log.borg=3;view.log.pain=2;f.requestSubmit()});await W();
 await ev(()=>{view.log={result:'completa',borg:3,pain:2};render();const f=document.querySelector('#logForm');if(f){f.querySelector('input[value=completa]').checked=true;f.requestSubmit()}});await W();
 r=await ev(()=>{const h=S.train.sessions.filter(s=>s.date===today());return{n:h.length,s:h[0]&&{type:h[0].type,result:h[0].result,xp:h[0].xp,pain:h[0].pain},habito:!!(S.done[today()]||{}).mc,txt:document.querySelector('#main').innerText.slice(0,400)}});
 ok('R9 «Parcial» queda como caminata parcial con 25 XP; un segundo guardado no duplica',r.n===1&&r.s.result==='parcial'&&r.s.xp===25,r);
 ok('R10 registrar la caminata clínica no marca el hábito «Caminar 20 minutos» (no hay doble acreditación)',!r.habito,r);
 r=await ev(()=>{tab='dia';render();return{invita:!!document.querySelector('button.todo[data-k=entreno]:not(#todoDone)'),hecho:!!document.querySelector('#todoDone'),txt:(document.querySelector('#todoDone')||{}).innerText}});
 ok('R11 con la sesión registrada, Mi día muestra «Tu sesión de hoy ya está registrada» y no invita a repetirla',!r.invita&&r.hecho,r);
 // Alarma de un hábito en pausa (pausa por dolor 6)
 await ev(()=>{const t=S.train;t.sessions=t.sessions.filter(s=>s.date!==today());const s={id:'p6',date:today(),type:'caminata',stage:t.stage,result:'parcial',borg:5,pain:6,at:Date.now(),xp:25};t.sessions.unshift(s);t.hold={at:today(),kind:'dolor',sid:'p6'};render()});
 r=await ev(()=>{const m=S.missions.find(x=>x.id==='mc');const pausada=mPaused(m,today());AL.on=true;alCur=null;AL.fired={};const d=new Date();m.time=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');alCheck();const box=document.querySelector('#alarmBox');const vis=box&&!box.hidden;const t=vis?box.innerText:'';alStop&&alStop();m.time='08:00';return{pausada,vis,t}});
 ok('R13 (corregido en B2) la alarma ya no suena para un hábito físico en pausa',r.pausada&&!r.vis,r);
 console.log('errores',JSON.stringify(errs));await b.close();srv.close();process.exit(0)})();
