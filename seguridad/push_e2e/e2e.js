// Recorrido completo de push-tick con Deno: base local (PGlite) con el SQL preparado, imitación local de la API REST de Supabase,
// destinatarios ficticios y un servicio de notificaciones falso (HTTPS local) que descifra cada mensaje recibido.
// Uso: node e2e.js <carpeta de la función> <v3|v2> <salida.json>
const http=require('http'),https=require('https'),fs=require('fs'),crypto=require('crypto'),{spawn}=require('child_process');
const rq=require('module').createRequire('/home/claude/sectest/x.js');const {PGlite}=rq('@electric-sql/pglite');const {pgcrypto}=rq('@electric-sql/pglite/contrib/pgcrypto');const ece=rq('http_ece');
const [FN,MODE,OUTF]=process.argv.slice(2);const DENO='/tmp/denoi/node_modules/.bin/deno';
const SQL=['/home/claude/sectest/sql/base.sql','/home/claude/sectest/sql/push_prod.sql'].concat(MODE==='v3'?['/home/claude/ascenso/supabase/sql/b2b3_avisos_PENDIENTE.sql']:[]);
let FAKE_NOW=null;const RECV=[];const LOG=[];
(async()=>{const db=new PGlite({extensions:{pgcrypto}});for(const f of SQL)await db.exec(fs.readFileSync(f,'utf8'));
 await db.query("insert into public.push_config(key,value) values('cron_secret','secreto-de-prueba')");
 // --- REST local (lo que usa push-tick) ---
 const q=u=>{const x=new URL(u,'http://x');const f={};for(const [k,v] of x.searchParams)if(/^(eq|neq)\./.test(v))f[k]=v.slice(3);return{path:x.pathname,f,sel:x.searchParams.get('select')}};
 const rest=http.createServer(async(req,res)=>{let b='';req.on('data',c=>b+=c);await new Promise(r=>req.on('end',r));const {path,f}=q(req.url);const send=(st,o,h={})=>{res.writeHead(st,Object.assign({'content-type':'application/json'},h));res.end(o===undefined?'':JSON.stringify(o))};
  try{LOG.push(req.method+' '+path);
   if(path==='/rest/v1/push_config'&&req.method==='GET')return send(200,(await db.query('select key,value from public.push_config')).rows);
   if(path==='/rest/v1/push_config'&&req.method==='POST'){for(const r of JSON.parse(b||'[]'))await db.query('insert into public.push_config(key,value) values($1,$2) on conflict (key) do update set value=excluded.value',[r.key,r.value]);return send(201,[])}
   if(path.startsWith('/rest/v1/rpc/')){const fn=path.split('/').pop();if(!/^push_due_v[23]$/.test(fn))return send(404,{message:'fn'});const args=JSON.parse(b||'{}');
    const rows=fn==='push_due_v3'?(await db.query('select * from public.push_due_v3($1::timestamptz)',[FAKE_NOW||new Date().toISOString()])).rows:(await db.query('select * from public.push_due_v2()')).rows;return send(200,rows)}
   if(path==='/rest/v1/push_subs'&&req.method==='DELETE'){await db.query('delete from public.push_subs where endpoint=$1',[f.endpoint]);return send(204)}
   if(path==='/rest/v1/push_subs'&&req.method==='GET'){const r=(await db.query('select user_id from public.push_subs where endpoint=$1 and enabled',[f.endpoint])).rows;return /object/.test(req.headers.accept||'')?(r.length?send(200,r[0]):send(406,{code:'PGRST116'})):send(200,r)}
   if(path==='/rest/v1/push_snooze'&&(req.method==='HEAD'||req.method==='GET')){const n=(await db.query('select count(*)::int n from public.push_snooze where user_id=$1 and sent=$2',[f.user_id,f.sent==='true'])).rows[0].n;res.writeHead(200,{'content-type':'application/json','content-range':'*/'+n});return res.end(req.method==='HEAD'?'':'[]')}
   if(path==='/rest/v1/push_snooze'&&req.method==='POST'){const r=JSON.parse(b);for(const x of [].concat(r))await db.query('insert into public.push_snooze(user_id,mission_id,fire_at) values($1,$2,$3)',[x.user_id,x.mission_id,x.fire_at]);return send(201,[])}
   send(404,{message:'no route '+req.method+' '+path})}catch(e){send(500,{message:e.message})}}).listen(54321);
 // --- servicio de notificaciones falso (HTTPS) ---
 const SUBS={};const push=https.createServer({key:fs.readFileSync(__dirname+'/fake.key'),cert:fs.readFileSync(__dirname+'/fake.crt')},(req,res)=>{const ch=[];req.on('data',c=>ch.push(c));req.on('end',()=>{const id=req.url.split('/').pop(),s=SUBS[id];let payload=null,err=null;
   try{payload=JSON.parse(ece.decrypt(Buffer.concat(ch),{version:'aes128gcm',privateKey:s.ecdh,authSecret:s.auth}).toString('utf8'))}catch(e){err=String(e.message)}
   RECV.push({at:FAKE_NOW,to:s&&s.name,payload,err,headers:{auth:/^vapid t=.+, k=.+/.test(req.headers.authorization||''),enc:req.headers['content-encoding'],ttl:req.headers.ttl,urgency:req.headers.urgency}});res.writeHead(201);res.end()})}).listen(8443);
 // --- destinatarios ficticios ---
 async function user(name,data,o={}){const id=(await db.query("select gen_random_uuid() id")).rows[0].id;await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())",[id,(o.email||name.toLowerCase())+'@prueba.cl']);
  await db.query("insert into public.memberships(user_id,trial_start) values($1,coalesce($2::timestamptz,now()))",[id,o.trial||null]);await db.query("insert into public.app_state(user_id,data) values($1,$2)",[id,JSON.stringify(data)]);
  const ecdh=crypto.createECDH('prime256v1');ecdh.generateKeys();const auth=crypto.randomBytes(16);const sid=crypto.randomBytes(6).toString('hex');SUBS[sid]={name,ecdh,auth};
  await db.query("insert into public.push_subs(endpoint,user_id,p256dh,auth) values($1,$2,$3,$4)",['https://localhost:8443/push/'+sid,id,ecdh.getPublicKey().toString('base64url'),auth.toString('base64url')]);return id}
 const ALL=[0,1,2,3,4,5,6];const mis=(id,name,time)=>({id,name,time,days:ALL,created:'2026-01-01',cat:'Cuerpo',xp:20});
 const base=(missions,tr={})=>({onboard:{health:true},missions,done:{},train:Object.assign({parq:Array(10).fill(false),parqAt:'2026-11-01',parqTs:'1730000000000',plan:{days:'lun-mie-vie',walk:15},stage:2,sessions:[],hold:null},tr)});
 // Hora: en v3 la fija la prueba (se pasa como p_now); en v2 la función usa la hora real, así que los hábitos se programan a la hora real de Chile.
 const real=new Date().toLocaleTimeString('en-GB',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit'});const HM=MODE==='v3'?'10:30':real;const today=MODE==='v3'?'2026-11-27':new Date().toLocaleDateString('en-CA',{timeZone:'America/Santiago'});
 const rosa=await user('Rosa',base([mis('wk','Caminar 20 minutos',HM),mis('ag','Tomar agua',HM)],{sessions:[{id:'s7',date:today,type:'fuerza',pain:6,at:Date.now()-3600e3,result:'parcial'}]}));
 const pausa=await user('Paciente en pausa',base([mis('wk','Caminar 20 minutos',HM),mis('ag','Tomar agua',HM)],{hold:{at:today,kind:'sintomas',sid:'s1'},sessions:[{id:'s1',date:today,alert:true,pain:1,at:Date.parse(today+'T08:00:00-03:00')}]}));
 const kine=await user('Kine',base([]),{email:'kine'});await db.query("insert into public.pro_emails(email) values('kine@prueba.cl')");await db.query("insert into public.shares(patient_id,pro_email,rx) values($1,'kine@prueba.cl',$2)",[rosa,JSON.stringify([{ex:'a',dose:'10'},{name:'Elongar',dose:'3x30 s',days:[]}])]);
 if(MODE==='v3')await user('Vence',base([]),{trial:'2026-10-29 12:00:00-03'});
 // --- push-tick en Deno ---
 const env=Object.assign({},process.env,{SUPABASE_URL:'http://localhost:54321',SUPABASE_SERVICE_ROLE_KEY:'clave-ficticia',DENO_CERT:__dirname+'/cas.pem',DENO_DIR:'/tmp/denocache',NO_PROXY:'localhost,127.0.0.1',no_proxy:'localhost,127.0.0.1',NODE_EXTRA_CA_CERTS:__dirname+'/fake.crt'});
 const dn=spawn(DENO,['run','--allow-net','--allow-env','--allow-read','--allow-sys',FN+'/index.ts'],{cwd:FN,env});let dout='';dn.stdout.on('data',c=>dout+=c);dn.stderr.on('data',c=>dout+=c);
 for(let i=0;i<60&&!/Listening/.test(dout);i++)await new Promise(r=>setTimeout(r,500));
 const tick=async(at)=>{FAKE_NOW=at;const r=await fetch('http://localhost:8000/',{method:'POST',headers:{'content-type':'application/json','x-cron-secret':'secreto-de-prueba'},body:'{}'});return{status:r.status,body:await r.json()}};
 const T=MODE==='v3'?['2026-11-27T10:30:10-03:00','2026-11-27T10:30:40-03:00','2026-11-27T10:31:05-03:00','2026-11-27T19:00:05-03:00','2026-11-27T19:00:50-03:00']:[null,null,null];
 const ticks=[];for(const at of T){const before=RECV.length;const r=await tick(at);await new Promise(z=>setTimeout(z,300));ticks.push({at:at||'hora real',resp:r.body,recibidos:RECV.slice(before).map(x=>({to:x.to,k:x.payload&&x.payload.k,tag:x.payload&&x.payload.tag}))})}
 const unauth=await fetch('http://localhost:8000/',{method:'POST',headers:{'content-type':'application/json','x-cron-secret':'otro'},body:'{}'}).then(r=>r.status);
 const sn=await fetch('http://localhost:8000/',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'snooze',endpoint:(await db.query("select endpoint from public.push_subs limit 1")).rows[0].endpoint,mission_id:'wk'})}).then(r=>r.json());
 const keys=(await db.query("select count(*)::int n from public.push_config where key in ('vapid_public','vapid_private')")).rows[0].n;const plog=(await db.query("select mission_id,count(*)::int n from public.push_log group by 1 order by 1")).rows;
 dn.kill();rest.close();push.close();
 fs.writeFileSync(OUTF,JSON.stringify({fn:FN,mode:MODE,deno:dout.split('\n').filter(l=>/Listening|error|Error/i.test(l)).slice(0,5),ticks,recv:RECV,unauth,snooze:sn,vapidKeys:keys,push_log:plog,rest:[...new Set(LOG)]},null,1));console.log('ok');process.exit(0)})().catch(e=>{console.error('ERR',e.stack||e.message);process.exit(2)});
