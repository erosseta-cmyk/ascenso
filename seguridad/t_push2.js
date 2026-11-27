// B2 (ronda 2) · servidor: no recuperar avisos cuya hora pasó en pausa, «posponer», sin duplicados, rutina de Ascenso, cuestionario vencido.
const {PGlite}=require('@electric-sql/pglite');const {pgcrypto}=require('@electric-sql/pglite/contrib/pgcrypto');const fs=require('fs');
const SQL=['sql/base.sql','sql/push_prod.sql','/home/claude/ascenso/supabase/sql/b2b3_avisos_PENDIENTE.sql'].map(f=>fs.readFileSync(f.startsWith('/')?f:__dirname+'/'+f,'utf8'));
const R=[];const ok=(n,c,x)=>{R.push({n,ok:!!c});console.log((c?'OK  ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x).slice(0,500)))};const ROWS=[];const tab=(a,b,c,d)=>ROWS.push({estado:a,esperado:b,obtenido:c,entorno:d});
async function mk(){const db=new PGlite({extensions:{pgcrypto}});for(const s of SQL)await db.exec(s);return db}
let N=0;async function user(db,data,o={}){const id=(await db.query("select gen_random_uuid() id")).rows[0].id;await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())",[id,'p'+(++N)+'@prueba.cl']);
 await db.query("insert into public.memberships(user_id,trial_start) values($1,now())",[id]);await db.query("insert into public.app_state(user_id,data) values($1,$2)",[id,JSON.stringify(data)]);
 await db.query("insert into public.push_subs(endpoint,user_id,p256dh,auth) values($1,$2,$3,$4)",['https://push.prueba/'+N,id,'p'.repeat(40),'a'.repeat(16)]);return id}
const ALL=[0,1,2,3,4,5,6];const mis=(id,name,time)=>({id,name,time,days:ALL,created:'2026-01-01',cat:'Cuerpo',xp:20});
const ms=h=>Date.parse(`2026-11-27T${h}:00-03:00`);const T=h=>`2026-11-27 ${h}:00-03`;
function base(missions,tr={}){return{onboard:{health:true},missions,done:{},train:Object.assign({parq:Array(10).fill(false),parqAt:'2026-11-01',parqTs:'1730000000000',plan:{days:'lun-mie-vie',walk:15},stage:2,sessions:[],hold:null},tr)}}
async function due(db,at){return (await db.query("select mission_id,kind,title,body from public.push_due_v3($1::timestamptz)",[at])).rows}
const ids=rs=>rs.filter(r=>r.kind==='m').map(r=>r.mission_id).sort().join(',');
async function share(db,u){return (await db.query("insert into public.shares(patient_id,pro_email) values($1,'kine@prueba.cl') returning id",[u])).rows[0].id}
async function clr(db,u,kind,key,at){const sh=await share(db,u);await db.query("insert into public.pro_clearances(share_id,patient_id,pro_email,kind,parq_key,created_at) values($1,$2,'kine@prueba.cl',$3,$4,$5::timestamptz)",[sh,u,kind,key,at])}
const HOLD=(h)=>({hold:{at:'2026-11-27',kind:'sintomas',sid:'s1'},sessions:[{id:'s1',date:'2026-11-27',type:'caminata',alert:true,pain:1,at:ms(h)}]});
(async()=>{
 // No recuperar: pausa 10:20–10:33 (levantada por el kinesiólogo), caminata 10:30
 {const db=await mk();const u=await user(db,base([mis('wk','Caminar 20 minutos','10:30'),mis('ag','Tomar agua','10:30')],HOLD('10:20')));
  const a=await due(db,T('10:30'));await clr(db,u,'hold','s1',T('10:33'));const b=await due(db,T('10:34'));const c=await due(db,T('10:35'));
  ok('Pausa 10:20–10:33, caminata 10:30: a las 10:30 solo agua; tras levantarse (10:34 y 10:35) la caminata no se recupera',ids(a)==='ag'&&ids(b)===''&&ids(c)==='',{a,b,c});
  tab('Caminata 10:30; pausa por síntomas 10:20, levantada por el kinesiólogo 10:33','Se omite; no se recupera; sigue la próxima ocurrencia',`10:30: ${ids(a)}; 10:34: ${ids(b)||'nada'}`,'Servidor simulado (PGlite)')}
 {const db=await mk();const u=await user(db,base([mis('wk','Caminar 20 minutos','10:30')],HOLD('10:20')));await clr(db,u,'hold','s1',T('10:33'));const b=await due(db,T('10:34'));
  ok('Mismo caso sin evaluación a las 10:30 (primera a las 10:34, ya levantada): igual se omite, por la hora de la autorización',ids(b)==='',b)}
 {const db=await mk();const u=await user(db,base([mis('wk','Caminar 20 minutos','10:30')],HOLD('10:20')));await clr(db,u,'hold','s1',T('10:25'));const b=await due(db,T('10:30'));
  ok('Pausa levantada a las 10:25 (antes de la hora): la caminata sale a las 10:30',ids(b)==='wk',b);tab('Caminata 10:30; pausa 10:20 levantada 10:25','Sale a su hora',`10:30: ${ids(b)}`,'Servidor simulado (PGlite)')}
 for(const [res,exp,lbl] of [['10:33','','levantada en la app a las 10:33 → primera evaluación 10:34: omitida'],['10:25','wk','levantada en la app a las 10:25 → sale a las 10:30']]){
  const d=base([mis('wk','Caminar 20 minutos','10:30')],{sessions:[{id:'s1',date:'2026-11-27',type:'fuerza',pain:7,at:ms('10:20'),paused:'dolor',resumedAt:ms(res)}]});const db=await mk();await user(db,d);
  const b=await due(db,T(res==='10:33'?'10:34':'10:30'));ok(`Pausa ${lbl}`,ids(b)===exp,b)}
 // Posponer: vence 10:40 dentro de una pausa 10:35–10:42 → omitido; pausa 10:35–10:38 → sale
 for(const [res,at,exp,lbl] of [['10:42','10:43','','pausa 10:35–10:42: el pospuesto que vence 10:40 se omite (evaluado 10:43)'],['10:38','10:41','wk','pausa 10:35–10:38: el pospuesto que vence 10:40 sale']]){
  const d=base([mis('wk','Caminar 20 minutos','10:30')],{sessions:[{id:'s1',date:'2026-11-27',type:'fuerza',pain:7,at:ms('10:35'),paused:'dolor',resumedAt:ms(res)}]});d.done={};const db=await mk();const u=await user(db,d);
  await db.query("insert into public.push_log(user_id,mission_id,day) values($1,'wk','2026-11-27')",[u]);await db.query("insert into public.push_snooze(user_id,mission_id,fire_at) values($1,'wk',$2::timestamptz)",[u,T('10:40')]);
  const b=await due(db,T(at));const sn=(await db.query("select sent from public.push_snooze")).rows[0].sent;ok(`Posponer · ${lbl}`,ids(b)===exp&&sn===true,{b,sn});
  tab(`Caminata pospuesta hasta 10:40; ${lbl.split(':')[0]}`,exp?'Sale':'Se omite',ids(b)?'Sale':'Omitida','Servidor simulado (PGlite)')}
 // Sin duplicados: dos ciclos seguidos
 {const db=await mk();await user(db,base([mis('wk','Caminar 20 minutos','10:30')]));const a=await due(db,T('10:30'));const b=await due(db,T('10:31'));const c=await due(db,T('10:39'));
  ok('Sin duplicados: 10:30 envía; 10:31 y 10:39 no repiten',ids(a)==='wk'&&ids(b)===''&&ids(c)==='',{a,b,c})}
 // Rutina de Ascenso: nombre exacto vs parecido
 {const db=await mk();await user(db,base([mis('r1','Hacer mi rutina de Ascenso','10:30'),mis('r2','  hacer mi rutina de ascenso ','10:30'),mis('r3','Rutina de Ascenso de la tarde','10:30'),mis('ag','Tomar agua','10:30')],HOLD('10:00')));
  const r=await due(db,T('10:30'));const k=(await db.query("select app.push_kind('Hacer mi rutina de Ascenso') a, app.push_kind('Rutina de Ascenso de la tarde') b")).rows[0];
  ok('Rutina: el nombre exacto del catálogo (también con otras mayúsculas o espacios) se silencia en pausa; un nombre distinto no',ids(r)==='ag,r3'&&k.a==='fuerza'&&k.b==='otro',{r,k})}
 // Cuestionario vencido
 const OLD='2025-10-01';const RX=[{ex:'a',dose:'10'}];
 for(const [lbl,tr,exp] of [['vencido sin otra restricción',{parqAt:OLD,parqTs:String(Date.parse(OLD))},'ag,wk'],['vencido con pausa por síntomas activa',Object.assign({parqAt:OLD,parqTs:String(Date.parse(OLD))},HOLD('09:00')),'ag,wk']]){
  const db=await mk();const u=await user(db,base([mis('wk','Caminar 20 minutos','10:30'),mis('ag','Tomar agua','10:30')],tr));await db.query("insert into public.shares(patient_id,pro_email,rx) values($1,'kine@prueba.cl',$2)",[u,JSON.stringify(RX)]);
  const r=await due(db,T('10:30'));const x=(await due(db,T('19:00'))).filter(z=>z.kind==='rx').length;const pk=(await db.query("select app.push_paused_kinds($1,data,'2026-11-27') k from public.app_state",[u])).rows[0].k;
  ok(`Cuestionario ${lbl}: el servidor replica la app (sin pausa: ${JSON.stringify(pk)}) → avisa caminata, agua y 19:00`,ids(r)===exp&&x===1,{r,x,pk});
  tab(`Cuestionario ${lbl}`,'Lo que la app permite en ese instante',`Avisos: ${ids(r)} + 19:00`,'Servidor simulado (PGlite)')}
 const f=R.filter(x=>!x.ok).length;console.log(`\n${R.length-f}/${R.length} OK`);fs.writeFileSync('/tmp/t_push2_tabla.json',JSON.stringify(ROWS,null,1));process.exit(f?1:0)})().catch(e=>{console.error('ERR',e.message,e.position);process.exit(2)});
