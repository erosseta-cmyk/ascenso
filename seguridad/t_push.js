// B2/B3 · servidor (proceso que genera los avisos con la app cerrada), probado en PGlite con fechas de ensayo.
// Carga: esquema base + copia de push_due/push_due_v2 desplegadas + supabase/sql/b2b3_avisos_PENDIENTE.sql (no aplicado en Supabase).
const {PGlite}=require('@electric-sql/pglite');const {pgcrypto}=require('@electric-sql/pglite/contrib/pgcrypto');const fs=require('fs');
const SQL=['sql/base.sql','sql/push_prod.sql','/home/claude/ascenso/supabase/sql/b2b3_avisos_PENDIENTE.sql'].map(f=>fs.readFileSync(f.startsWith('/')?f:__dirname+'/'+f,'utf8'));
const R=[];const ok=(n,c,x)=>{R.push({n,ok:!!c,x});console.log((c?'OK  ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x).slice(0,400)))};
const ROWS=[];const tab=(estado,esperado,obtenido,entorno)=>ROWS.push({estado,esperado,obtenido,entorno});
async function mk(inject){const db=new PGlite({extensions:{pgcrypto}});for(const s of SQL)await db.exec(s);
 if(inject){await db.exec(`alter function app.push_paused_kinds(uuid,jsonb,text) rename to push_paused_kinds_real;
  create function app.push_paused_kinds(p_uid uuid,p_data jsonb,p_day text) returns text[] language sql stable set search_path to '' as $$
   select case when p_data ? '__pk' then array(select jsonb_array_elements_text(p_data->'__pk')) else app.push_paused_kinds_real(p_uid,p_data,p_day) end $$;`)}return db}
let N=0;const U={};
async function user(db,name,data,o={}){const id=(await db.query("select gen_random_uuid() id")).rows[0].id;U[id]=name;
 await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())",[id,(o.email||name.toLowerCase().replace(/\W+/g,''))+'@prueba.cl']);
 await db.query("insert into public.memberships(user_id,trial_start) values($1,coalesce($2::timestamptz,now()))",[id,o.trial||null]);
 await db.query("insert into public.app_state(user_id,data) values($1,$2)",[id,JSON.stringify(data)]);
 await db.query("insert into public.push_subs(endpoint,user_id,p256dh,auth) values($1,$2,$3,$4)",['https://push.prueba/'+(++N),id,'p'.repeat(40),'a'.repeat(16)]);return id}
const ALL=[0,1,2,3,4,5,6];const mis=(id,name,time)=>({id,name,time,days:ALL,created:'2026-01-01',cat:'Cuerpo',xp:20});
function base(missions,tr={}){return{onboard:{health:true,version:'2026-11-09-v4'},missions,done:{},train:Object.assign({parq:Array(10).fill(false),parqAt:'2026-11-01',parqTs:'1730000000000',plan:{days:'lun-mie-vie',walk:15},stage:2,lvl:0,sessions:[],hold:null},tr)}}
const M4=()=>[mis('wk','Caminar 20 minutos','10:00'),mis('fz','Hacer mi rutina de Ascenso','10:00'),mis('sq','Sentadillas 10 minutos','10:00'),mis('yo','Yoga 10 minutos','10:00'),mis('ag','Tomar agua','10:00')];
const T=h=>`2026-11-27 ${h}:00-03`; // viernes 27-11-2026, hora de Chile
async function due(db,at){return (await db.query("select user_id,mission_id,kind,title,body from public.push_due_v3($1::timestamptz)",[at])).rows.map(r=>({...r,who:U[r.user_id]}))}
const ids=rs=>rs.filter(r=>r.kind==='m').map(r=>r.mission_id).sort().join(',');
const gen=rs=>rs.every(r=>r.title==='Ascenso'&&r.body==='Tienes un recordatorio de Ascenso');
(async()=>{
 // ---- Fila 1 (simulada): fuerza en pausa y caminata habilitada ----
 {const db=await mk(true);const d=base(M4());d.__pk=['fuerza'];await user(db,'Rosa',d);const r=await due(db,T('10:02'));
  ok('Fila 1 [estado inyectado]: se omiten los avisos de fuerza; caminata, yoga y agua conservan el suyo',ids(r)==='ag,wk,yo'&&gen(r),r);
  tab('Fuerza en pausa y caminata habilitada (estado inyectado: hoy la app no lo produce)','Sin aviso de fuerza; caminata con aviso',`Avisos: ${ids(r)} (sin «rutina de Ascenso» ni «Sentadillas»)`,'Servidor simulado (PGlite)')}
 // ---- Fila 2: plan en pausa por síntomas (real) ----
 {const db=await mk();await user(db,'Rosa',base(M4(),{hold:{at:'2026-11-27',kind:'sintomas',sid:'s1'},sessions:[{id:'s1',date:'2026-11-27',type:'caminata',pain:2,alert:true,result:'parcial'}]}));const r=await due(db,T('10:02'));
  ok('Fila 2: caminata y hábitos físicos en pausa → solo «Tomar agua» recibe aviso',ids(r)==='ag'&&gen(r),r);
  tab('Plan en pausa por síntomas: caminata, rutina, sentadillas y yoga en pausa; agua habilitada','Solo el aviso de agua',`Avisos: ${ids(r)||'ninguno'}`,'Servidor simulado (PGlite)')}
 {const db=await mk();const u=await user(db,'Rosa',base(M4(),{hold:{at:'2026-11-27',kind:'sintomas',sid:'s1'},sessions:[{id:'s1',date:'2026-11-27',type:'caminata',pain:2,alert:true}]}));
  const sh=(await db.query("insert into public.shares(patient_id,pro_email) values($1,'kine@prueba.cl') returning id",[u])).rows[0].id;await db.query("insert into public.pro_clearances(share_id,patient_id,pro_email,kind,parq_key) values($1,$2,'kine@prueba.cl','hold','s1')",[sh,u]);
  const r=await due(db,T('10:02'));ok('Fila 2b: el kinesiólogo levantó la pausa (aún sin abrir la app) → vuelven todos los avisos',ids(r)==='ag,fz,sq,wk,yo',r)}
 for(const [pain,exp,lbl] of [[6,'ag','dolor 6 → pausa'],[4,'ag,fz,sq,wk,yo','dolor corregido a 4 → la app levanta la pausa sola']]){const db=await mk();await user(db,'Rosa',base(M4(),{hold:{at:'2026-11-27',kind:'dolor',sid:'s1'},sessions:[{id:'s1',date:'2026-11-27',type:'fuerza',pain}]}));const r=await due(db,T('10:02'));ok(`Fila 2c: ${lbl}`,ids(r)===exp,r)}
 for(const [clr,exp,lbl] of [[null,'ag','cuestionario con alertas sin autorización → pausa'],['1730000000000','ag,fz,sq,wk,yo','autorizado por el kinesiólogo para ese cuestionario'],['999','ag','autorización de otro cuestionario → sigue en pausa']]){const db=await mk();const p=Array(10).fill(false);p[3]=true;const u=await user(db,'Rosa',base(M4(),{parq:p}));
  if(clr){const sh=(await db.query("insert into public.shares(patient_id,pro_email) values($1,'kine@prueba.cl') returning id",[u])).rows[0].id;await db.query("insert into public.pro_clearances(share_id,patient_id,pro_email,kind,parq_key) values($1,$2,'kine@prueba.cl','parq',$3)",[sh,u,clr])}
  const r=await due(db,T('10:02'));ok(`Fila 2d: ${lbl}`,ids(r)===exp,r)}
 // ---- Fila 3: mantener ----
 {const db=await mk();await user(db,'Rosa',base([mis('wk','Caminar 20 minutos','10:00')],{sessions:[{id:'s1',date:'2026-11-26',type:'caminata',pain:3,result:'completa'}]}));const r=await due(db,T('10:02'));
  ok('Fila 3: «mantener» no es pausa → la caminata conserva su aviso, con texto genérico',ids(r)==='wk'&&gen(r),r);
  tab('«Mantener» (último dolor 3): caminata habilitada; meta personal 20 min, plan 15 min','Aviso de la caminata; sin detalle fuera de la app',`Aviso «${r[0]&&r[0].title} / ${r[0]&&r[0].body}»`,'Servidor simulado (PGlite)')}
 // ---- Fila 4: 19:00 ----
 const RX=[{ex:'a',dose:'10'},{ex:'b',dose:'10',days:[1]},{name:'Elongar isquiotibiales',dose:'3x30 s',days:[]}];
 for(const [lbl,done,tr,at,exp] of [['1 pendiente habilitado (A hecho, B no toca hoy, C sin días = todos)',{a:1},{},'19:00',1],['todos hechos',{a:1,'c:Elongar isquiotibiales':1},{},'19:00',0],['plan en pausa con pendientes',{},{hold:{kind:'sintomas',sid:'s1'},sessions:[{id:'s1',alert:true,pain:1,date:'2026-11-27'}]},'19:00',0],['18:59, antes de la hora',{},{},'18:59',0]]){
  const db=await mk();const d=base([],tr);d.rxDone={'2026-11-27':done};const u=await user(db,'Rosa',d);await db.query("insert into public.shares(patient_id,pro_email,rx) values($1,'kine@prueba.cl',$2)",[u,JSON.stringify(RX)]);
  const r=(await due(db,T(at))).filter(x=>x.kind==='rx');ok(`Fila 4 (19:00): ${lbl} → ${exp?'se envía':'no se envía'}`,r.length===exp&&gen(r),r);
  tab(`Recordatorio 19:00: ${lbl}`,exp?'1 aviso genérico':'Sin envío',r.length?`1 aviso «${r[0].body}»`:'Sin envío','Servidor simulado (PGlite)')}
 {const db=await mk();const q=(await db.query(`select (not ('{"days":[]}'::jsonb ? 'days') or jsonb_typeof('[]'::jsonb) <> 'array' or '[]'::jsonb @> to_jsonb(5)) as v2,
   (not (jsonb_typeof('[]'::jsonb) = 'array' and jsonb_array_length('[]'::jsonb) between 1 and 6) or '[]'::jsonb @> to_jsonb(5)) as v3`)).rows[0];
  ok('Fila 4 (antes): con la condición de push_due_v2, un ejercicio con lista de días vacía no se cuenta; la app y push_due_v3 lo cuentan todos los días',q.v2===false&&q.v3===true,q)}
 // ---- Fila 5: pausa después de programar o posponer ----
 {const db=await mk();const u=await user(db,'Rosa',base([mis('wk','Caminar 20 minutos','10:00'),mis('ag','Tomar agua','10:00')]));
  await db.query("insert into public.push_snooze(user_id,mission_id,fire_at) values($1,'wk',$2::timestamptz - interval '1 minute'),($1,'ag',$2::timestamptz - interval '1 minute')",[u,T('10:20')]);
  await db.query("update public.app_state set data = jsonb_set(jsonb_set(data,'{train,hold}','{\"kind\":\"dolor\",\"sid\":\"s9\"}'),'{train,sessions}','[{\"id\":\"s9\",\"pain\":7,\"date\":\"2026-11-27\"}]') where user_id=$1",[u]);
  const r=await due(db,T('10:20'));const sn=(await db.query("select mission_id,sent from public.push_snooze order by mission_id")).rows;
  ok('Fila 5a: pospuesto y luego en pausa → al vencer se omite la caminata; el agua sí suena; el pospuesto queda consumido',ids(r)==='ag'&&sn.every(x=>x.sent),{r,sn});
  tab('Caminata pospuesta 10 min; en ese lapso el plan entra en pausa (dolor 7)','Se omite al vencer el «posponer»',`Avisos al vencer: ${ids(r)||'ninguno'} (caminata omitida)`,'Servidor simulado (PGlite)')}
 {const db=await mk();const u=await user(db,'Rosa',base([mis('wk','Caminar 20 minutos','10:30')]));
  await db.query("update public.app_state set data = jsonb_set(jsonb_set(data,'{train,hold}','{\"kind\":\"sintomas\",\"sid\":\"s9\"}'),'{train,sessions}','[{\"id\":\"s9\",\"alert\":true,\"pain\":1,\"date\":\"2026-11-27\"}]') where user_id=$1",[u]);
  const r=await due(db,T('10:30'));const lg=(await db.query("select count(*)::int n from public.push_log")).rows[0].n;ok('Fila 5b: programada 10:30, pausa a las 10:20 → a las 10:30 no se envía ni se registra como enviada',ids(r)===''&&lg===0,{r,lg});
  tab('Caminata programada 10:30; pausa por síntomas a las 10:20','Sin aviso a las 10:30',`Avisos: ${ids(r)||'ninguno'}`,'Servidor simulado (PGlite)')}
 {const db=await mk();const d=base([mis('wk','Caminar 20 minutos','10:00')]);d.done={'2026-11-27':{wk:1}};const u=await user(db,'Rosa',d);await db.query("insert into public.push_snooze(user_id,mission_id,fire_at) values($1,'wk',$2::timestamptz - interval '1 minute')",[u,T('10:20')]);
  const r=await due(db,T('10:20'));ok('Fila 5c: pospuesto pero ya marcado como hecho → no se envía',ids(r)==='',r)}
 // ---- B3: todos los tipos de aviso ----
 {const db=await mk();const u=await user(db,'Rosa',base([mis('wk','Caminar 20 minutos','10:00')],{sessions:[{id:'s7',date:'2026-11-27',type:'fuerza',pain:6}]}));
  const k=await user(db,'Kine',base([]),{email:'kine'});await db.query("insert into public.pro_emails(email) values('kine@prueba.cl')");await db.query("insert into public.shares(patient_id,pro_email) values($1,'kine@prueba.cl')",[u]);
  const v=await user(db,'Vence',base([]),{trial:'2026-10-29 12:00:00-03'});
  const r=await due(db,T('10:02'));const kinds=r.map(x=>x.who+':'+x.kind).sort().join(',');
  ok('B3: hábito, alerta al kinesiólogo y vencimiento salen con título «Ascenso» y cuerpo genérico',gen(r)&&/Kine:pro/.test(kinds)&&/Vence:vence/.test(kinds),{kinds,r});
  ok('B3: ningún campo enviado contiene el nombre del hábito, dolor ni datos del paciente',!JSON.stringify(r.map(x=>[x.title,x.body])).match(/Caminar|dolor|paciente|vence|\d\d\/\d\d/i),r);
  tab('Hábito «Caminar 20 minutos», alerta de dolor al kinesiólogo y vencimiento del plan','Título «Ascenso», cuerpo «Tienes un recordatorio de Ascenso»',r.map(x=>`${x.kind}: «${x.title}» / «${x.body}»`).join(' · '),'Servidor simulado (PGlite)')}
 // ---- Antes (push_due_v2 desplegada, reloj real) ----
 {const db=await mk();const lt=(await db.query("select to_char(now() at time zone 'America/Santiago','HH24:MI') t")).rows[0].t;
  await user(db,'Rosa',base([mis('wk','Caminar 20 minutos',lt),mis('ag','Tomar agua',lt)],{hold:{kind:'sintomas',sid:'s1'},sessions:[{id:'s1',alert:true,pain:1}]}));
  const v2=(await db.query("select mission_id,title,body from public.push_due_v2()")).rows;
  ok('Antes (push_due_v2): con el plan en pausa igual avisa la caminata y muestra el nombre del hábito',v2.some(x=>x.mission_id==='wk'&&x.body==='Caminar 20 minutos'&&x.title==='Ascenso · es la hora'),v2);
  tab('ANTES (versión desplegada): plan en pausa, caminata y agua a la misma hora','—',v2.map(x=>`«${x.title} / ${x.body}»`).join(' · '),'Servidor simulado con la función desplegada')}
 const f=R.filter(x=>!x.ok).length;console.log(`\n${R.length-f}/${R.length} OK`);fs.writeFileSync('/tmp/t_push_tabla.json',JSON.stringify(ROWS,null,1));process.exit(f?1:0)})().catch(e=>{console.error('ERR',e.message,e.position);process.exit(2)});
