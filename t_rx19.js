// 19:00 · coincidencia entre «Mi día» (pantalla) y el servidor preparado (app.push_rx_pending / push_due_v3), con los mismos datos ficticios.
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const fs=require('fs');
const rq=require('module').createRequire('/home/claude/sectest/x.js');const {PGlite}=rq('@electric-sql/pglite');const {pgcrypto}=rq('@electric-sql/pglite/contrib/pgcrypto');
const SQL=['/home/claude/sectest/sql/base.sql','/home/claude/sectest/sql/push_prod.sql','/home/claude/ascenso/supabase/sql/b2b3_avisos_PENDIENTE.sql'].map(f=>fs.readFileSync(f,'utf8'));
const R=[];const ok2=(n,c,x)=>{R.push({n,ok:!!c});ok(n,c,x)};const ROWS=[];
const AT='2026-11-27T19:00:20-03:00',DAY='2026-11-27'; // viernes (5)
const it=(o)=>o;
const CASES=[
 ['A sin días, B viernes hecho, C solo lunes, D lista vacía, E los 7 días',[[it({ex:'tob_bombeo',dose:'10'}),it({ex:'otr_cuad',dose:'10',days:[5]}),it({ex:'x_lunes',dose:'10',days:[1]}),it({ex:'x_vacio',dose:'10',days:[]}),it({name:'Elongar isquiotibiales',dose:'3x30 s',days:[0,1,2,3,4,5,6]})]],{otr_cuad:1},{}],
 ['todos los que tocan hoy ya marcados',[[it({ex:'tob_bombeo',dose:'10'}),it({ex:'x_lunes',dose:'10',days:[1]})]],{tob_bombeo:1},{}],
 ['ninguno toca hoy',[[it({ex:'x_lunes',dose:'10',days:[1]}),it({ex:'x_mar',dose:'10',days:[2]})]],{},{}],
 ['pauta en pausa (síntomas) con pendientes',[[it({ex:'tob_bombeo',dose:'10'})]],{},{hold:1}],
 ['dos kinesiólogos con el mismo ejercicio',[[it({ex:'tob_bombeo',dose:'10'})],[it({ex:'tob_bombeo',dose:'12'}),it({name:'Caminar en el pasillo',dose:'5 min'})]],{},{}],
 ['sin consentimiento de salud',[[it({ex:'tob_bombeo',dose:'10'})]],{},{noHealth:1}]];
(async()=>{const port=9041;const srv=await serve(port);
 for(const [lbl,shares,done,o] of CASES){
  // --- app ---
  const st=J(F.B);st.rxDone={[DAY]:Object.fromEntries(Object.keys(done).map(k=>[k,Date.parse(AT)-3600e3]))};if(o.noHealth)st.onboard.health=false;
  if(o.hold){st.train.hold={at:DAY,kind:'sintomas',sid:'h1'};st.train.sessions=[{id:'h1',date:DAY,type:'caminata',alert:true,pain:1,result:'parcial',at:Date.parse(AT)-7200e3}];st.train.parq=Array(10).fill(false);st.train.parqAt=DAY}
  const mine=shares.map((rx,i)=>({email:'kine'+i+'@prueba.cl',since:'2026-11-01',rx,rxAt:'2026-11-20',id:i+1,clear:[]}));
  const {b,p,errs}=await open(port,{email:'rosa@prueba.cl',state:st,mine,clock:AT});await p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='dia';render()});await p.waitForTimeout(300);
  const ui=await p.evaluate(()=>{const t=document.querySelector('#main').innerText;let m=t.match(/(\d+) de (\d+) ejercicios hechos hoy/);if(m)return{pend:+m[2]-+m[1],txt:m[0]};if(/Hiciste todo lo de hoy/.test(t))return{pend:0,txt:'✓ Hiciste todo lo de hoy'};if(/Hoy no te tocan ejercicios/.test(t))return{pend:0,txt:'Hoy no te tocan ejercicios'};if(/Pauta en pausa/.test(t))return{pend:0,txt:'Pauta en pausa'};return{pend:0,txt:'(sin tarjeta de ejercicios)'}});await b.close();
  // --- servidor ---
  const db=new PGlite({extensions:{pgcrypto}});for(const s of SQL)await db.exec(s);const id=(await db.query("select gen_random_uuid() id")).rows[0].id;
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'rosa@prueba.cl',now())",[id]);await db.query("insert into public.memberships(user_id,trial_start) values($1,now())",[id]);
  await db.query("insert into public.app_state(user_id,data) values($1,$2)",[id,JSON.stringify(st)]);await db.query("insert into public.push_subs(endpoint,user_id,p256dh,auth) values('https://push.prueba/1',$1,'p','a')",[id]);
  for(const m of mine)await db.query("insert into public.shares(patient_id,pro_email,rx) values($1,$2,$3)",[id,m.email,JSON.stringify(m.rx)]);
  const sv=(await db.query("select app.push_rx_pending($1,data,$2::timestamptz) n from public.app_state",[id,AT])).rows[0].n;const sent=(await db.query("select kind from public.push_due_v3($1::timestamptz)",[AT])).rows.filter(r=>r.kind==='rx').length;
  ok2(`19:00 · ${lbl}: pantalla «${ui.txt}» (${ui.pend} pendientes) = servidor ${sv}; ${sv?'se envía 1 aviso':'no se envía'}`,ui.pend===sv&&sent===(sv>0?1:0)&&!errs.length,{ui,sv,sent,errs});
  ROWS.push({estado:`19:00 · ${lbl}`,esperado:'Pantalla y servidor coinciden; 0 → sin envío',obtenido:`Pantalla: ${ui.txt} (${ui.pend}) · servidor: ${sv} · envío: ${sent}`,entorno:'App en navegador de prueba + servidor simulado (PGlite)'})}
 const f=R.filter(x=>!x.ok).length;console.log(`\n${R.length-f}/${R.length} OK`);fs.writeFileSync('/tmp/t_rx19_tabla.json',JSON.stringify(ROWS,null,1));srv.close();process.exit(f?1:0)})();
