const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8971);
// ===== 1. Paciente con PAR-Q marcado y sin autorización: mensajes claros =====
const st=J(F.B);st.train.parq=Array(10).fill(false);st.train.parq[1]=true;st.train.parqAt=new Date().toISOString().slice(0,10);st.train.parqTs=Date.now();st.train.hold=null;
let {b,p,errs}=await open(8971,{email:"ana@x.cl",state:st,mine:[{email:'kine@x.cl',since:new Date().toISOString(),rx:[],clear:[]}]});
let r=await p.evaluate(()=>{S.ui=S.ui||{};view.evo=null;S.seenStage=99;tab='dia';render();return{tr:trainReady(),txt:document.querySelector('#main').innerText}});
ok('estado: pausado por PAR-Q',r.tr==='paused',r.tr);
ok('inicio NO dice «Actívalo en 2 minutos»',!/Actívalo en 2 minutos/.test(r.txt),r.txt.slice(0,600));
ok('inicio dice que espera autorización del kine',/Espera la autorización de tu kinesiólogo/.test(r.txt),r.txt.slice(0,600));
ok('inicio explica que no se registra',/no se registra hasta que te autorice/.test(r.txt));
r=await p.evaluate(()=>{tab='entreno';render();return document.querySelector('#main').innerText});
ok('Entreno explica que el plan está detenido',/Mientras tanto, tu plan está detenido/.test(r),r.slice(0,800));
ok('Entreno dice que el kine puede anotar caminata informada',/caminata informada/.test(r));
ok('Entreno no muestra botón de registrar sesión',!/Registrar sesión de hoy/.test(r));
// modo simple
r=await p.evaluate(()=>{try{return vSimple()}catch(e){return 'ERR '+e.message}});
ok('modo simple muestra el motivo de la pausa',/Espera la autorización/.test(r)&&!/Toca para ver qué hacer\.<\/p>/.test(r),r.slice(0,300));
// con plan normal (sin PAR-Q) sigue igual
r=await p.evaluate(()=>{S.train.parq=Array(10).fill(false);tab='dia';render();return{tr:trainReady(),txt:document.querySelector('#main').innerText}});
ok('sin PAR-Q positivo el inicio muestra «Hoy toca»',r.tr==='ok'&&/Hoy toca/i.test(r.txt),r);
// sin plan → Actívalo
r=await p.evaluate(()=>{const pl=S.train.plan;S.train.plan=null;tab='dia';render();const t=document.querySelector('#main').innerText;S.train.plan=pl;return t});
ok('sin plan creado sigue «Actívalo en 2 minutos»',/Actívalo en 2 minutos/.test(r));
// confirmación de alerta (existente desde v58)
await p.evaluate(()=>{const t=S.train;t.sessions=t.sessions.filter(x=>x.date!==today());t.hold=null;view.log={};tab='entreno';render()});
await p.evaluate(async()=>{const c=(s,v)=>document.querySelector(`[data-act=scale][data-s=${s}][data-v="${v}"]`).click();c('borg',3);await new Promise(r=>setTimeout(r,50));c('pain',1);await new Promise(r=>setTimeout(r,50));const f=document.querySelector('#logForm');(f.querySelector('input[name=res][value=completa]')||f.querySelector('input[name=res]')).checked=true;f.querySelectorAll('.logEx').forEach(x=>x.checked=true);document.querySelector('#logAlert').checked=true;f.requestSubmit()});await p.waitForTimeout(300);
r=await p.evaluate(()=>({box:!!document.querySelector('#sxBox'),hold:S.train.hold,n:S.train.sessions.filter(x=>x.date===today()).length}));
ok('alerta: primero pide confirmar el síntoma, no guarda ni pausa',r.box&&!r.hold&&r.n===0,r);
await p.evaluate(()=>document.querySelector('[data-act=sxNo]').click());await p.waitForTimeout(200);
r=await p.evaluate(()=>({alert:document.querySelector('#logAlert')&&document.querySelector('#logAlert').checked,hold:S.train.hold}));
ok('«me equivoqué» desmarca la alerta sin pausar',!r.alert&&!r.hold,r);
ok('sin errores paciente',!errs.length,errs);await b.close();

// ===== 2. Kine: caminatas informadas =====
const d=k=>{const x=new Date();x.setDate(x.getDate()-k);return x.toLocaleDateString("sv-SE",{timeZone:"America/Santiago"})};
const pt={id:9,email:'tenchi@x.cl',name:'Paciente T',since:new Date().toISOString(),stage:2,parq:Array(10).fill(false),hold:null,rx:[],sessions:[{id:'s1',date:d(1),type:'caminata',result:'completa',borg:3,pain:0},{id:'s2',date:d(2),type:'fuerza',result:'completa',borg:4,pain:0,ex:['a'],exN:4}],done:{},dayFb:{},rxFb:{},rxDone:{},loads:{},clear:[],reported:[]};
({b,p,errs}=await open(8971,{email:"kine@x.cl",state:J(F.B),pro:[pt]}));
await p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='pacientes';render()});await p.waitForTimeout(500);
await p.evaluate(()=>document.querySelector('[data-act=ptOpen]').click());await p.waitForTimeout(400);
r=await p.evaluate(()=>document.querySelector('#main').innerText);
ok('ficha abierta muestra sección de caminatas informadas',/Caminatas informadas por el paciente \(0\)/.test(r),r.slice(-900));
ok('explica que no cuenta para subir minutos',/No cuenta para subir minutos ni etapas/.test(await p.evaluate(()=>document.querySelector('#main').textContent)));
// sin nota
await p.evaluate(d=>{document.querySelector('#rpD_9').value=d;document.querySelector('#rpN_9').value='';document.querySelector('[data-act=ptRep][data-id="9"]:not([data-off])').click()},d(3));await p.waitForTimeout(300);
r=await p.evaluate(()=>({t:(document.querySelector('#toast')||{}).textContent,last:localStorage.getItem('stub.lastrep')}));
ok('sin nota no registra',!r.last&&/al menos 5/.test(r.t),r);
// día que ya tiene caminata registrada
await p.evaluate(d=>{document.querySelector('#rpD_9').value=d;document.querySelector('#rpN_9').value='caminó 20 min';document.querySelector('[data-act=ptRep][data-id="9"]:not([data-off])').click()},d(1));await p.waitForTimeout(300);
r=await p.evaluate(()=>({t:(document.querySelector('#toast')||{}).textContent,last:localStorage.getItem('stub.lastrep')}));
ok('día con caminata ya registrada se rechaza',!r.last&&/ya tiene una caminata/.test(r.t),r);
// fuera de 30 días
await p.evaluate(d=>{document.querySelector('#rpD_9').value=d;document.querySelector('#rpN_9').value='caminó 20 min';document.querySelector('[data-act=ptRep][data-id="9"]:not([data-off])').click()},d(40));await p.waitForTimeout(300);
r=await p.evaluate(()=>({t:(document.querySelector('#toast')||{}).textContent,last:localStorage.getItem('stub.lastrep')}));
ok('fuera de 30 días se rechaza',!r.last&&/30 días/.test(r.t),r);
// válido
await p.evaluate(d=>{document.querySelector('#rpD_9').value=d;document.querySelector('#rpN_9').value='caminó 20 min, sin molestias';document.querySelector('[data-act=ptRep][data-id="9"]:not([data-off])').click()},d(3));await p.waitForTimeout(500);
r=await p.evaluate(()=>({last:JSON.parse(localStorage.getItem('stub.lastrep')||'null'),txt:document.querySelector('#main').innerText,rep:(SH.pro[0]||{}).reported}));
ok('registra con día y nota',r.last&&r.last.p_day&&r.last.p_note==='caminó 20 min, sin molestias'&&r.last.p_on===true,r.last);
ok('se ve como «Informada» con autor',/Informada/.test(r.txt)&&/registrada por kine@x\.cl/.test(r.txt),r.txt.slice(-900));
ok('contador de 14 días muestra la caminata informada aparte',/\+ 1 caminata informada/.test(r.txt));
ok('no se mezcla con las sesiones del paciente',(await p.evaluate(()=>SH.pro[0].sessions.length))===2);
// XSS en nota
await p.evaluate(d=>{document.querySelector('#rpD_9').value=d;document.querySelector('#rpN_9').value='<img src=x onerror=window.__x=1>';document.querySelector('[data-act=ptRep][data-id="9"]:not([data-off])').click()},d(4));await p.waitForTimeout(500);
r=await p.evaluate(()=>({x:window.__x,img:!!document.querySelector('#main img[src=x]')}));
ok('la nota se escapa (sin inyección)',!r.x&&!r.img,r);
// informe PDF incluye
r=await p.evaluate(()=>ptKineReport(SH.pro[0]));
ok('informe kinésico lista la caminata informada',/Caminata informada al kinesiólogo, no registrada en la app/.test(r));
// retirar
await p.evaluate(()=>document.querySelector('[data-act=ptRep][data-off="1"]').click());await p.waitForTimeout(500);
r=await p.evaluate(()=>({last:JSON.parse(localStorage.getItem('stub.lastrep')||'null'),n:(SH.pro[0].reported||[]).length}));
ok('retirar envía p_on=false y la quita',r.last.p_on===false&&r.n===1,r);

// ===== 3. Firmas ligadas al contenido =====
r=await p.evaluate(async()=>{const id='mmss_brazos',o={};o.item=revItem(id);o.before=!!revOk(id);
 document.querySelector('#main');await sb.rpc('admin_review',{p_item:revItem(id),p_ok:true,p_reviewer:'Klgo. Prueba'});await loadReviews();o.signed=!!revOk(id);
 const old=LIB[id].care;LIB[id].care=old+' (cambio)';o.afterEdit=!!revOk(id);o.stale=revStale(id);LIB[id].care=old;o.back=!!revOk(id);
 const s0=LIBSEQ[id].s[0][1];LIBSEQ[id].s[0][1]=s0+'.';o.seqEdit=!!revOk(id);LIBSEQ[id].s[0][1]=s0;
 IMGREV[id]='v99';o.imgEdit=!!revOk(id);IMGREV[id]='v70';
 // legado: EX firmados por id siguen válidos si no cambiaron
 await sb.rpc('admin_review',{p_item:'silla',p_ok:true,p_reviewer:'Klgo. Antiguo'});await loadReviews();o.exLegacy=!!revOk('silla');
 const h=EX.silla.care;EX.silla.care=h+' x';o.exChanged=!!revOk('silla');o.exStale=revStale('silla');EX.silla.care=h;
 // LIB con firma antigua por id (antes del corte) no vale
 await sb.rpc('admin_review',{p_item:'tob_banda',p_ok:true,p_reviewer:'Klgo. Antiguo'});await loadReviews();o.libLegacy=!!revOk('tob_banda');
 o.len=Math.max(...Object.keys(LIB).concat(Object.keys(EX)).map(k=>revItem(k).length));o.fmt=Object.keys(LIB).every(k=>/^[a-z0-9_]{1,40}$/.test(revItem(k)));return o});
ok('ficha sin firma no vale',!r.before);ok('firma con versión vale',r.signed,r);
ok('si cambia el texto la firma deja de valer',!r.afterEdit&&r.stale,r);ok('si vuelve el texto, vuelve a valer',r.back);
ok('si cambia la leyenda de la secuencia, deja de valer',!r.seqEdit);ok('si se rehacen las imágenes (IMGREV), deja de valer',!r.imgEdit);
ok('ejercicios del plan firmados antes siguen válidos si no cambiaron',r.exLegacy);ok('… y caen si cambian',!r.exChanged&&r.exStale);
ok('firma antigua sin versión de biblioteca no vale',!r.libLegacy);
ok('ítem de firma cumple el formato del servidor (≤40, a-z0-9_)',r.len<=40&&r.fmt,r);
// firmar desde la UI usa el ítem con versión
await p.evaluate(()=>{localStorage.removeItem('stub.rv');REVW={};tab='ajustes';render()});
r=await p.evaluate(async()=>{const id='ab_crunch';const host=document.createElement('div');host.innerHTML=exAdmin(id);document.body.appendChild(host);host.querySelector('#rvBy_'+id).value='Klgo. Esteban Rosset';await A.rvSet(host.querySelector('[data-act=rvSet]'));const rv=JSON.parse(localStorage.getItem('stub.rv')||'{}');host.remove();return{keys:Object.keys(rv),item:revItem(id),ok:!!revOk(id)}});
ok('botón «Validar» firma la versión actual',r.keys.includes(r.item)&&r.ok,r);
r=await p.evaluate(async()=>{const id='ab_crunch';const host=document.createElement('div');host.innerHTML=exAdmin(id);document.body.appendChild(host);await A.rvSet(host.querySelector('[data-act=rvSet]'));host.remove();return{ok:!!revOk(id),keys:Object.keys(JSON.parse(localStorage.getItem('stub.rv')||'{}'))}});
ok('«Quitar validación» la retira',!r.ok&&!r.keys.length,r);
r=await p.evaluate(()=>{const v=['planes','ajustes','evolucion','progreso','entreno','pacientes'];for(const t of v){tab=t;render();const m=document.querySelector('#main').textContent.match(/Revisión de biblioteca \((\d+) pendientes de (\d+)\)/);if(m)return [t,m[1],m[2]]}return null});
ok('panel de biblioteca cuenta pendientes',!!r,r);
ok('sin errores kine',!errs.length,errs);await b.close();
srv.close();process.exit(require('./lib').fails?1:0)})();
