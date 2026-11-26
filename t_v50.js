const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const Y=new Date().getFullYear();
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
(async()=>{const srv=await serve(8997);
// F02
let {b,p,errs}=await open(8997,{email:"a@x.cl",state:J(F.B),ct:{phone:"+56911110000",wa_ok:true}});
await p.evaluate(async()=>{view.evo=null;await A.logout()});await p.waitForTimeout(500);ok('F02 celular borrado de memoria al cerrar sesión',await p.evaluate(()=>CT===null));
await p.evaluate(()=>{document.querySelector('#auEmail').value='b@x.cl';document.querySelector('#auPass').value='12345678';document.querySelector('#authForm').requestSubmit()});await p.waitForTimeout(1200);
ok('F02 el siguiente usuario no ve el celular anterior',!(await p.evaluate(()=>document.querySelector('#main').innerHTML)).includes('11110000'));await b.close();
// F03
const s3=J(F.B);delete s3.profile.birthY;delete s3.profile.birthM;s3.ui={simple:true};
({b,p,errs}=await open(8997,{email:"m@x.cl",state:s3}));await p.evaluate(()=>{view.evo=null;render()});
await p.evaluate(Y=>{$('#pgY').value=String(Y-15);$('#pgM').value='6';$('#pgP').value='912345678';(document.querySelector('input[name=pgPB][value=yo]')||{}).checked=true;document.querySelector('#profGate').requestSubmit()},Y);await p.waitForTimeout(500);
let r=await p.evaluate(()=>({gate:!!document.querySelector('#profGate'),minor:S.minor,health:S.onboard.health,txt:document.querySelector('#main').innerText.slice(0,160)}));
ok('F03 pasa a la autorización del adulto',!r.gate&&r.minor&&r.minor.state==="pending"&&r.health===false&&minorTxt(r.txt),r);function minorTxt(t){return /apoderad|adulto|madre|padre|tutor/i.test(t)}
ok('F03 sin errores',!errs.length,errs);await b.close();
// Edad mínima
({b,p,errs}=await open(8997,{email:"n@x.cl"}));await p.waitForTimeout(400);
for(const [age,exp] of [[6,false],[13,false],[15,true]]){await p.evaluate(([Y,age])=>{$('#obY').value=String(Y-age);$('#obM').value='1';$('#obP').value='912345678';(document.querySelector('input[name=obPB][value=yo]')||{}).checked=true;document.querySelector('#obTerms').checked=true},[Y,age]);await p.evaluate(()=>A.onboard());await p.waitForTimeout(350);ok('edad '+age+(exp?' entra (con autorización pendiente)':' no puede registrarse'),(await p.evaluate(()=>!!S.onboard))===exp)}
ok('15 años queda pendiente del adulto',await p.evaluate(()=>minorPending()));await b.close();
// F08 paso extra
const se=J(F.B);se.ui={simple:true,simpleAsked:1,big:true};const d=new Date(),dd=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');se.dayFb={[dd]:{pain:8,at:Date.now()}};
({b,p,errs}=await open(8997,{email:"e@x.cl",state:se,mine:[{email:"kine@x.cl",since:"2026-10-01",rx:[{ex:"fz_silla",name:"",dose:"2×8",note:""}],rxAt:"2026-11-08",id:7,clear:[]}]}));await p.evaluate(()=>{view.evo=null;render()});
let t=await p.innerText('#main');ok('F08 con dolor 8 no hay botón Empezar',!/Empezar mis ejercicios/.test(t)&&t.includes('Hablé con mi kinesiólogo y quiero seguir'),t.slice(0,500));
await p.evaluate(()=>document.querySelector('.srow[data-act=sxGo]').click());ok('F08 tocar el ejercicio no lo abre',await p.evaluate(()=>!view.sx));
await p.evaluate(()=>document.querySelector('[data-act=sxPainNote]').click());await p.waitForTimeout(400);ok('F08 avisa al kinesiólogo',(await p.evaluate(()=>JSON.parse(localStorage.getItem('stub.mynotes.e@x.cl')||'[]'))).length===1);
await p.evaluate(()=>document.querySelector('[data-act=sxPainGo]').click());t=await p.innerText('#main');ok('F08 tras el paso extra puede seguir y queda registrado',/Empezar mis ejercicios/.test(t)&&await p.evaluate(()=>S.dayFb[today()].go===true));
await p.evaluate(()=>document.querySelector('[data-act=sxScale][data-k=pain][data-v="9"]').click());ok('F08 si vuelve a marcar dolor alto, se pide de nuevo',await p.evaluate(()=>painStop()));
ok('F08 sin errores',!errs.length,errs);await b.close();
// pro ve la decisión
({b,p,errs}=await open(8997,{email:"kine@x.cl",state:J(F.B),pro:[{id:7,email:"e@x.cl",name:"E",since:"2026-10-01",stage:1,parq:Array(10).fill(false),parqKey:"x",clear:[],rx:[{ex:"fz_silla",name:"",dose:"2×8",note:""}],rxVersions:1,sessions:[],done:{},rxDone:{},rxFb:{},dayFb:{[dd]:{pain:8,go:true}},loads:{}}]}));
await p.evaluate(()=>{tab='pacientes';view.evo=null;render()});t=await p.innerText('#main');ok('el kine ve que decidió seguir',t.includes('dolor 8/10')&&t.includes('decidió seguir'),t.slice(0,400));await b.close();srv.close();
// Candado (CSP) con el supabase.js real
const root=process.env.SITE;const s2=http.createServer((q,res)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/index.html';const f=path.join(root,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'Content-Type':u.endsWith('.js')?'text/javascript':u.endsWith('.html')?'text/html':'application/octet-stream'});res.end(fs.readFileSync(f))}).listen(8998);
const br=await chromium.launch();const pg=await br.newPage();const viol=[];pg.on('console',m=>{if(/Content Security Policy|Refused/i.test(m.text()))viol.push(m.text().slice(0,160))});pg.on('pageerror',e=>viol.push('ERR '+e.message.slice(0,120)));
await pg.goto('http://localhost:8998/');await pg.waitForTimeout(2500);
r=await pg.evaluate(()=>({auth:!!document.querySelector('#authForm'),sb:typeof sb!=='undefined'&&!!sb.auth}));ok('candado: la app real arranca (pantalla de entrada, cliente Supabase vivo)',r.auth&&r.sb,r);
const own=viol.filter(v=>!/supabase\.co|ERR_|net::/.test(v));ok('candado: sin bloqueos al código propio',own.length===0,own);
await pg.evaluate(()=>{const d=document.createElement('div');d.innerHTML='<img src=x onerror="window.__xss=1">';document.body.appendChild(d);const s=document.createElement('script');s.textContent='window.__xss2=1';document.body.appendChild(s)});await pg.waitForTimeout(500);
ok('candado: bloquea código inyectado',await pg.evaluate(()=>!window.__xss&&!window.__xss2));await br.close();s2.close()})();
