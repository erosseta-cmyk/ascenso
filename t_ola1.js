// Ola 1 (A1–A7, B1) en la copia de ensayo: casos de aceptación con perfiles ficticios y servidor simulado.
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const fs=require('fs');
const R=[],PRE=[];const ok2=(n,c,x)=>{R.push({n,ok:!!c});ok(n,c,x)};
const prep=(c)=>{view.evo=null;S.seenStage=99;S.ui=S.ui||{};S.ui.big=!!c.big;S.ui.simple=false;const t=S.train;
 if(c.q){S.ui.simpleAsked=false;S.ui.waNo=false;S.ui.ageNo=false;S.ui.kineAsked=!c.kine;CT={phone:null,wa_ok:false}}else{S.ui.simpleAsked=true;S.ui.waNo=true;S.ui.kineAsked=true;CT={phone:'+56911112222',wa_ok:true}}
 if(c.noYear){delete S.profile.birthY;delete S.profile.birthM;delete S.profile.ageR;delete S.profile.age60}
 if(c.q&&!c.noYear){delete S.profile.ageR;delete S.profile.age60}
 if(t&&t.plan){t.hold=null;t.parq=Array(10).fill(false);if(c.walk)t.plan.walk=c.walk;t.sessions=t.sessions.filter(x=>x.date!==today()&&x.id!=='prev');const dw=new Date().getDay();
  if(c.dayType==='caminata'&&DAYSETS[t.plan.days].d.includes(dw))t.plan.days=Object.keys(DAYSETS).find(k=>!DAYSETS[k].d.includes(dw));
  if(c.dayType==='fuerza'&&!DAYSETS[t.plan.days].d.includes(dw))t.plan.days=Object.keys(DAYSETS).find(k=>DAYSETS[k].d.includes(dw));
  const stg=STAGES[t.stage-1][1].map(x=>x[0]);
  if(c.pain!=null)t.sessions.unshift({id:'prev',date:addDays(today(),-1),type:'fuerza',stage:t.stage,result:'completa',borg:4,pain:c.pain,at:Date.now()-864e5,ex:stg,exN:stg.length,xp:50});
  if(c.hoy){const s={id:'hoy',date:today(),type:todayTrain(),stage:t.stage,result:c.pain>=6?'parcial':'completa',borg:5,pain:c.pain,at:Date.now(),xp:c.pain>=6?25:50,ex:[],exN:0};t.sessions.unshift(s);if(c.pain>=6){t.hold={at:today(),kind:'dolor',sid:'hoy'};s.paused='dolor'}}
  if(c.dur){S.missions=S.missions.filter(m=>!/camin/i.test(m.name));S.missions.unshift({id:'mc',name:'Caminar '+c.dur+' minutos',cat:'Cuerpo',xp:40,time:'08:00',dur:c.dur,days:[0,1,2,3,4,5,6],created:addDays(today(),-30)})}}
 tab='dia';render();scrollTo(0,0)};
const first=()=>{const m=document.querySelector('#main');const e=m.firstElementChild;return e?{id:e.id,cls:e.className,tag:e.tagName,txt:e.textContent.slice(0,140),top:e.getBoundingClientRect().top}:null};
(async()=>{const srv=await serve(8990);
 async function run(name,base,c,mine,fn){for(const w of [360,390])for(const big of [false,true]){const {b,p,errs}=await open(8990,{email:'rosa@prueba.cl',state:J(F[base]),mine:mine||[]});await p.setViewportSize({width:w,height:800});
   const s0=await p.evaluate(()=>JSON.stringify(S));
   await p.evaluate(prep,Object.assign({},c,{big}));await p.waitForTimeout(200);
   await fn(p,`${name} [${w}${big?' grande':''}]`,w,big);
   {const sw=await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);if(sw[0]>sw[1]+1)PRE.push(`${name} [${w}${big?' grande':''}] ancho ${sw[0]} en ${sw[1]} px`);}
   ok2(`${name} [${w}${big?' grande':''}] sin errores`,!errs.length,errs);await b.close()}}
 // 1-2) 05c 15/20 y 10/30 en «mantener»
 for(const [walk,dur] of [[15,20],[10,30]]){
  await run(`05c ${walk}/${dur}`,'B',{walk,dur,pain:3,q:true,dayType:'caminata'},null,async(p,n)=>{
   const r=await p.evaluate(()=>{const f=(()=>{const m=document.querySelector('#main');const e=m.firstElementChild;return{id:e.id,top:e.getBoundingClientRect().top}})();const m=document.querySelector('#main'),hc=m.querySelector('#hoyCaminata'),t=m.innerText;
    const btn=hc&&hc.querySelector('[data-act=tab][data-k=entreno]');const row=[...m.querySelectorAll('.mission')].find(x=>/Caminar/.test(x.textContent));
    return{first:f,hc:hc?hc.innerText:'',btn:btn?btn.textContent:'',walkMentions:(t.match(new RegExp('\\b'+S.train.plan.walk+' minutos','g'))||[]).length,porAhora:/Por ahora, mantén/.test(t),row:row?row.innerText:'',timer:!!m.querySelector('[data-act=startTimer]'),pend:!!m.querySelector('#pendientes'),pendOpen:!!(m.querySelector('#pendientes')||{}).open,pendTxt:(m.querySelector('#pendientes')||{textContent:''}).textContent,simpleBtn:!!m.querySelector('[data-act=simpleOn]'),inViewport:f.top<500}});
   ok2(`${n} A1 lo primero es la tarjeta de la caminata, visible sin desplazarse`,r.first.id==='hoyCaminata'&&r.inViewport,r.first);
   ok2(`${n} A2 «Tu plan de hoy indica caminar ${walk} minutos»`,r.hc.includes(`Tu plan de hoy indica caminar ${walk} minutos`),r.hc);
   ok2(`${n} A2 «Tu meta personal de ${dur} minutos sigue guardada»`,r.hc.includes(`Tu meta personal de ${dur} minutos sigue guardada`),r.hc);
   ok2(`${n} A2 botón «Ver mi caminata de hoy» que abre Entreno`,/Ver mi caminata de hoy/.test(r.btn),r.btn);
   ok2(`${n} A2 los ${walk} minutos se dicen una sola vez en Mi día`,r.walkMentions===1&&!r.porAhora,r);
   ok2(`${n} A2 el hábito no repite minutos y conserva su meta (${dur} min)`,/Hoy va primero la caminata de tu plan/.test(r.row)&&new RegExp(dur+' min').test(r.row)&&!new RegExp('indicada hoy').test(r.row),r.row);
   ok2(`${n} d: temporizador del hábito con su comportamiento vigente (oculto en «mantener»)`,!r.timer,r);
   ok2(`${n} A3 preferencias en «Pendientes de tu cuenta», cerrado`,r.pend&&!r.pendOpen&&/modo simple/.test(r.pendTxt)&&/WhatsApp/.test(r.pendTxt),r.pendTxt.slice(0,200));
   ok2(`${n} A3 «Modo simple» a mano fuera del grupo`,r.simpleBtn,r);
   ok2(`${n} B1 con año de nacimiento no pregunta la edad`,!/rango de edad/.test(r.pendTxt),r.pendTxt.slice(0,200));
   await p.evaluate(()=>document.querySelector('#hoyCaminata [data-act=tab]').click());await p.waitForTimeout(150);
   const e=await p.evaluate(()=>({tab,tc:!!document.querySelector('#main [data-act=openLog]')||!!document.querySelector('#logForm'),walkKeep:(document.querySelector('#walkKeep')||{textContent:''}).textContent,hoyIdx:[...document.querySelectorAll('#main h3')].findIndex(h=>/^Hoy:/.test(h.textContent)),order:[...document.querySelector('#main').children].map(x=>x.id||x.className.split(' ')[0]||x.tagName).join(',')}));
   ok2(`${n} el botón abre Entreno, con «Registrar sesión de hoy» y el aviso de mantener`,e.tab==='entreno'&&e.tc&&/mantén tu caminata de/.test(e.walkKeep),e);
   const sm=await p.evaluate(()=>{S.ui.simple=true;view.ssub=null;tab='dia';render();const t=document.querySelector('#main').innerText;S.ui.simple=false;render();return t});
   ok2(`${n} modo simple: dosis vigente y meta como etiqueta secundaria`,sm.includes(`Tu plan de hoy indica caminar ${walk} minutos`)&&sm.includes(`Tu meta personal de ${dur} minutos sigue guardada`)&&/Tu meta personal · hoy va primero tu plan/.test(sm)&&/Ver mi caminata de hoy/.test(sm),sm.slice(0,500));
  });}
 // Temporizador sin «mantener»: comportamiento vigente (meta personal)
 await run('Sin mantener 15/20','B',{walk:15,dur:20,pain:0,q:false,dayType:'caminata'},null,async(p,n)=>{
  const r=await p.evaluate(()=>{const b=document.querySelector('[data-act=startTimer][data-id=mc]');if(!b)return{b:false};b.click();const d=S.timer&&S.timer.dur;A.timerStop();return{b:true,d,meta:!!document.querySelector('#metaGuardada')}});
  ok2(`${n} d: el temporizador del hábito sigue disponible y parte con 20 min`,r.b&&r.d===20,r);
  ok2(`${n} sin «mantener» no se agrega la línea de meta guardada`,!r.meta,r);});
 // 3) Pausa real
 await run('Pausa real (dolor 6)','B',{walk:15,dur:20,pain:6,hoy:true,q:false,dayType:'caminata'},null,async(p,n)=>{
  const r=await p.evaluate(()=>{const m=document.querySelector('#main'),e=m.firstElementChild;const row=[...m.querySelectorAll('.mission')].find(x=>/Caminar/.test(x.textContent));return{first:e.className+' '+e.textContent.slice(0,80),row:row?row.innerText:'',hc:!!m.querySelector('#hoyCaminata')}});
  ok2(`${n} A1 lo primero es la pausa y qué hacer`,/todo/.test(r.first)&&/(pausa|Pausa|PAUSA|dolor)/.test(r.first)&&!r.hc,r);
  ok2(`${n} el hábito físico queda en pausa sin puntos ni racha`,/En pausa junto con tu plan/.test(r.row),r.row);});
 // 4) Sesión ya registrada
 await run('Sesión ya registrada','B',{walk:15,dur:20,pain:1,hoy:true,q:false,dayType:'caminata'},null,async(p,n)=>{
  let r=await p.evaluate(()=>{const e=document.querySelector('#main').firstElementChild;return{id:e.id,hc:!!document.querySelector('#hoyCaminata')}});
  ok2(`${n} A1 lo primero es «Tu sesión de hoy ya está registrada»`,r.id==='todoDone'&&!r.hc,r);
  r=await p.evaluate(()=>{tab='entreno';render();const m=document.querySelector('#main');return{sd:!!m.querySelector('#sdTop')||!!m.querySelector('#hoyRegistrada'),reg:!!m.querySelector('[data-act=openLog]'),corr:!!m.querySelector('[data-act=delToday]'),instr:/Camina \d+ minutos/.test(m.innerText)}});
  ok2(`${n} A4 Entreno muestra el resultado, sin invitar a registrar de nuevo, con corrección`,r.sd&&!r.reg&&r.corr,r);});
 // 5) Progresión disponible: hoy antes del aumento
 await run('Progresión disponible','B',{walk:15,dur:20,q:false,dayType:'caminata'},null,async(p,n)=>{
  const r=await p.evaluate(()=>{const t=S.train;t.walkAt=0;const mk=i=>({id:'w'+i,date:addDays(today(),-(i+1)),type:'caminata',stage:t.stage,result:'completa',borg:4,pain:0,at:Date.now()-(i+1)*864e5,ex:[],exN:0,xp:50});t.sessions=[0,1,2,3].map(mk);tab='entreno';render();const m=document.querySelector('#main'),kids=[...m.querySelectorAll('h3,#progSec,#planAjustes,#reglasAvance')];const hoy=[...m.querySelectorAll('h3')].find(h=>/^Hoy:/.test(h.textContent)),pg=m.querySelector('#progSec'),stop=[...m.querySelectorAll('h3')].find(h=>/Cuándo detenerte/.test(h.textContent));const pos=e=>e?e.getBoundingClientRect().top+scrollY:-1;
   return{hoy:pos(hoy),prog:pos(pg),stop:pos(stop),stopVisible:!!stop&&!stop.closest('details'),aj:!!m.querySelector('details#planAjustes [data-act=resetPlan]'),dosis:/Camina \d+ minutos/.test(m.innerText),oferta:pg?pg.innerText.slice(0,120):''}});
  ok2(`${n} A4 la sesión de hoy va antes del aumento disponible`,r.hoy>0&&r.prog>r.hoy,r);
  ok2(`${n} A4 dosis vigente y aumento separados («Aumento disponible · opcional»)`,r.dosis&&/Aumento disponible/i.test(r.oferta),r.oferta);
  ok2(`${n} A4 «Cuándo detenerte» visible y ajustes agrupados`,r.stopVisible&&r.aj,r);});
 // 6) Cuenta existente con pauta del kine
 await run('Cuenta existente con pauta','B',{walk:15,dur:20,pain:1,q:false},[{email:"kine@recupera.cl",since:"2026-10-01",rx:F.mineC[0].rx,rxAt:"2026-11-08",id:7,clear:[]}],async(p,n)=>{
  const r=await p.evaluate(()=>{const m=document.querySelector('#main'),e=m.firstElementChild;return{first:e.textContent.slice(0,120),cnt:/\d+ de \d+ ejercicios hechos hoy/.test(m.innerText)}});
  ok2(`${n} A1 lo primero es lo indicado por el kinesiólogo, con «N de M ejercicios hechos hoy»`,/Indicado por tu kinesiólogo/i.test(r.first)&&r.cnt,r);
  const sm=await p.evaluate(()=>{S.ui.simple=true;tab='dia';render();const t=document.querySelector('#main').innerText;S.ui.simple=false;render();return t});
  ok2(`${n} f: modo simple dice «ejercicios hechos hoy» y explica los XP aparte`,/\d+ de \d+ ejercicios hechos hoy/.test(sm)&&/Los ejercicios de tu kinesiólogo se cuentan aparte/.test(sm),sm.slice(0,300));});
 // 7) Cuenta nueva y consentimiento del kine antes de las preferencias
 await run('Cuenta nueva','A',{q:true,kine:true},null,async(p,n)=>{
  const r=await p.evaluate(()=>{SH.ok=true;render();const m=document.querySelector('#main'),e=m.firstElementChild,ids=[...m.children].map(x=>x.id);return{first:e.textContent.slice(0,80),kine:ids.indexOf('kineCard'),pend:ids.indexOf('pendientes'),young:libYoung()}});
  ok2(`${n} A1 lo primero es activar el plan`,/Actívalo|plan/i.test(r.first),r);
  ok2(`${n} a: el consentimiento para compartir con el kine va antes de las preferencias`,r.kine>=0&&r.pend>r.kine,r);
  ok2(`${n} B1 ilustraciones según el año (1990: persona joven)`,r.young===true,r);});
 // 8) Sin año válido: se conserva la opción de elegir
 await run('Sin año de nacimiento','A',{q:true,noYear:true},null,async(p,n)=>{
  const r=await p.evaluate(()=>({t:document.querySelector('#main').innerText.slice(0,200)}));
  ok2(`${n} sin año: se pide el año como siempre (sin cambios)`,/Ingresa tu año y mes de nacimiento/.test(r.t),r.t);});/* texto de edad actualizado en Ola 1d */
 await run('Año no válido (1890)','A',{q:true},null,async(p,n)=>{
  const r=await p.evaluate(()=>{S.profile.birthY=1890;S.profile.birthM=1;delete S.profile.ageR;delete S.profile.age60;render();return{t:(document.querySelector('#pendientes')||{textContent:''}).textContent,k:ageKnown()}});
  ok2(`${n} B1 con un año no válido se conserva la opción de elegir la edad`,r.k===null&&/rango de edad/.test(r.t),r);});
 // B1: preferencia expresa respetada
 {const {b,p}=await open(8990,{email:'rosa@prueba.cl',state:J(F.B)});const r=await p.evaluate(()=>{const a=libYoung();S.profile.age60=false;const b2=libYoung();delete S.profile.age60;delete S.profile.ageR;const c=libYoung();return{a,b2,c,edad:ageKnown()}});
  ok2('B1 Rosa (68): mayor por defecto; si eligió otra imagen, se respeta',r.a===false&&r.b2===true&&r.c===false,r);await b.close()}
 // A5 historial, A6 aviso flotante, A7 alarma
 for(const w of [360,390])for(const big of [false,true]){const {b,p}=await open(8990,{email:'rosa@prueba.cl',state:J(F.B)});await p.setViewportSize({width:w,height:800});
  const r=await p.evaluate(big=>{S.ui.big=big;view.evo=null;S.seenStage=99;tab='entreno';render();const hc=document.querySelector('.hcards'),ht=document.querySelector('.htable');const card=hc&&hc.querySelector('.hcard');
   const out={cards:hc&&getComputedStyle(hc).display!=='none',table:ht&&getComputedStyle(ht).display!=='none',campos:card?card.innerText:''};
   tab='dia';render();const btn=document.querySelector('#main .check')||document.querySelector('#main button');btn.scrollIntoView({block:'end'});toast('PIN guardado');const t=document.querySelector('#toast').getBoundingClientRect(),bb=btn.getBoundingClientRect(),tabs=document.querySelector('#tabs').getBoundingClientRect();
   out.choque=!(t.bottom<=bb.top||t.top>=bb.bottom||t.right<=bb.left||t.left>=bb.right);out.bajoPestanas=t.top>=tabs.bottom-1;out.pe=getComputedStyle(document.querySelector('#toast')).pointerEvents;
   tab='ajustes';render();out.alarma=(([...document.querySelectorAll('#main .card')].find(c=>/Avisos de tus misiones/.test(c.innerText))||{innerText:''}).innerText);return out},big);
  const n=`[${w}${big?' grande':''}]`;
  ok2(`${n} A5 historial en tarjetas por fecha, con todos los campos`,r.cards&&!r.table&&/Resultado:/.test(r.campos)&&/Esfuerzo \d+ · Dolor \d+/.test(r.campos),r);
  ok2(`${n} A6 el aviso flotante queda bajo las pestañas, no tapa el botón y no bloquea toques`,!r.choque&&r.bajoPestanas&&r.pe==='none',r);
  ok2(`${n} A7 la alarma dice qué pasa con Ascenso abierto y cerrado`,/Con Ascenso abierto/.test(r.alarma)&&/Con Ascenso cerrado/.test(r.alarma)&&/Notificaciones del teléfono/.test(r.alarma),r.alarma.slice(0,300));await b.close()}
 {const {b,p}=await open(8990,{email:'rosa@prueba.cl',state:J(F.B)});await p.setViewportSize({width:1000,height:800});const r=await p.evaluate(()=>{tab='entreno';render();return getComputedStyle(document.querySelector('.htable')).display!=='none'});ok2('[1000] A5 en pantalla ancha se mantiene la tabla',r,r);await b.close()}
 // Retrocompatibilidad: ver todas las pestañas no cambia los datos guardados
 {const {b,p}=await open(8990,{email:'rosa@prueba.cl',state:J(F.B)});const r=await p.evaluate(()=>{const strip=o=>{const c=JSON.parse(JSON.stringify(o));delete c.updatedAt;delete c.pauseDays;delete c.seenStage;if(c.ui){delete c.ui.simple;delete c.ui.big}return JSON.stringify(c)};view.evo=null;const a=strip(S);for(const t of ['dia','misiones','entreno','evolucion','progreso','bitacora','ajustes']){tab=t;render()}S.ui.simple=true;tab='dia';render();S.ui.simple=false;render();return a===strip(S)});ok2('Cuenta existente: recorrer todas las vistas no modifica sus datos',r,r);await b.close()}
 fs.writeFileSync('/tmp/t_ola1.json',JSON.stringify(R));const f=R.filter(x=>!x.ok).length;console.log(`\n${R.length-f}/${R.length} OK`);console.log('Desbordes horizontales (revisar si son previos):\n'+PRE.join('\n'));fs.writeFileSync('/tmp/t_ola1_pre.json',JSON.stringify(PRE));srv.close();process.exit(f?1:0)})();
