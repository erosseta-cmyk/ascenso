// Ola 1b: desborde de Mi día con letra grande, texto del aumento de caminata y uso de la edad.
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const fs=require('fs');
const R=[];const ok2=(n,c,x)=>{R.push({n,ok:!!c});ok(n,c,x)};const OUT=process.env.OUT;if(OUT)fs.mkdirSync(OUT,{recursive:true});const MED=[];
const prep05c=()=>{view.evo=null;S.seenStage=99;const t=S.train;t.hold=null;t.parq=Array(10).fill(false);t.sessions=t.sessions.filter(x=>x.date!==today());const stg=STAGES[t.stage-1][1].map(x=>x[0]);t.sessions.unshift({id:'prev',date:addDays(today(),-1),type:'fuerza',stage:t.stage,result:'completa',borg:4,pain:3,at:Date.now()-864e5,ex:stg,exN:stg.length,xp:50});S.missions=S.missions.filter(m=>!/camin/i.test(m.name));S.missions.unshift({id:'mc',name:'Caminar 20 minutos',cat:'Cuerpo',xp:40,time:'08:00',dur:20,days:[0,1,2,3,4,5,6],created:addDays(today(),-30)});S.ui.simpleAsked=true;S.ui.waNo=true;S.ui.kineAsked=true};
(async()=>{const srv=await serve(8999);
 // ---------- 1) Desborde ----------
 const CASOS=[['Rosa 05c','B',null],['Cuenta nueva','A',null],['Rosa con pauta del kine','B',[{email:"kine@recupera.cl",since:"2026-10-01",rx:F.mineC[0].rx,rxAt:"2026-11-08",id:7,clear:[]}]]];
 for(const [nom,fx,mine] of CASOS)for(const w of [360,390])for(const big of [false,true]){const {b,p,errs}=await open(8999,{email:'x@prueba.cl',state:J(F[fx]),mine:mine||[]});await p.setViewportSize({width:w,height:800});
  const r=await p.evaluate(([big,es05])=>{if(es05)(new Function('('+es05+')()'))();view.evo=null;S.seenStage=99;S.ui.big=big;tab='dia';render();scrollTo(0,0);
   const h=document.querySelector('.hero'),hr=h.getBoundingClientRect();const fuera=[...h.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>hr.right+1||r.left<hr.left-1)}).map(e=>e.tagName+'«'+e.textContent.trim().slice(0,15)+'»');
   const h1=h.querySelector('h1');return{vis:document.documentElement.clientWidth,doc:document.documentElement.scrollWidth,fuera,h1:h1?h1.textContent:'',h1cort:h1?h1.scrollWidth>h1.clientWidth+1:false,zoom:getComputedStyle(document.body).zoom,big:document.documentElement.classList.contains('big'),mood:(h.querySelector('.mood')||{textContent:''}).textContent.trim()}},[big,fx==='B'&&!mine?prep05c.toString():null]);
  const n=`${nom} [${w}${big?' grande':''}]`;MED.push(`${n}: visible ${r.vis} · documento ${r.doc}`);
  ok2(`${n} «Mi día» cabe en el ancho (documento ${r.doc} ≤ visible ${r.vis})`,r.doc<=r.vis,r);
  ok2(`${n} la tarjeta del personaje se lee completa: «${r.h1}» y «${r.mood}»`,!r.fuera.length&&!r.h1cort,r);
  if(big)ok2(`${n} se conserva la letra grande elegida (zoom ${r.zoom})`,r.big&&String(r.zoom)==='1.2',r);
  if(OUT){await p.evaluate(()=>{const h=document.querySelector('.hero');window.scrollTo(0,Math.max(0,h.getBoundingClientRect().top+scrollY-120))});await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${fx}${mine?'rx':''}_${w}${big?'_grande':''}.png`})}
  ok2(`${n} sin errores`,!errs.length,errs);await b.close()}
 // ---------- 2) Aumento de caminata ----------
 const setUp=(hoy)=>{view.evo=null;S.seenStage=99;S.ui.simpleAsked=true;S.ui.waNo=true;S.ui.kineAsked=true;const t=S.train;t.hold=null;t.parq=Array(10).fill(false);t.senior=false;t.walkAt=0;t.plan.walk=15;const dw=new Date().getDay();if(DAYSETS[t.plan.days].d.includes(dw))t.plan.days=Object.keys(DAYSETS).find(k=>!DAYSETS[k].d.includes(dw));
  const mk=i=>({id:'w'+i,date:addDays(today(),-(i+1)),type:'caminata',stage:t.stage,result:'completa',borg:4,pain:0,at:Date.now()-(i+1)*864e5,ex:[],exN:0,xp:50});t.sessions=[0,1,2,3].map(mk);
  if(hoy)t.sessions.unshift({id:'hoy',date:today(),type:'caminata',stage:t.stage,result:'completa',borg:4,pain:0,at:Date.now()-60000,ex:[],exN:0,xp:50});tab='entreno';render()};
 for(const hoy of [false,true]){const {b,p}=await open(8999,{email:'x@prueba.cl',state:J(F.B)});
  
  const r=await p.evaluate(([fn,hoy])=>{(new Function('hoy','('+fn+')(hoy)'))(hoy);const btn=document.querySelector('[data-act=walkUp]');const txt=btn?btn.textContent:'';const s0=JSON.stringify(sessionToday()||null);btn&&btn.click();
   const toastT=document.querySelector('#toast').textContent;const ent=document.querySelector('#main').innerText;tab='dia';render();const dia=document.querySelector('#main').innerText;
   return{txt,walk:S.train.plan.walk,s0,s1:JSON.stringify(sessionToday()||null),toastT,ent:(ent.match(/Camina \d+ minutos[^.]*/)||[''])[0],sd:/Tu sesión de hoy ya está registrada/.test(ent),dia:(dia.match(/Tu plan de hoy indica caminar \d+ minutos|Próxima: [^\n]*/)||[''])[0],reofrece:walkUp()}},[setUp.toString(),hoy]);
  const n=hoy?'Aumento con la sesión de hoy registrada':'Aumento con la sesión de hoy pendiente';fs.writeFileSync(`/tmp/aumento_${hoy?'registrada':'pendiente'}.json`,JSON.stringify(r,null,1));
  if(!hoy){ok2(`${n}: el botón dice «Subir la caminata a 20 minutos desde hoy»`,r.txt==='Subir la caminata a 20 minutos desde hoy',r.txt);
   ok2(`${n}: al aceptar, la caminata de hoy pasa a 20 min (Entreno y Mi día)`,r.walk===20&&/Camina 20 minutos/.test(r.ent)&&/Tu plan de hoy indica caminar 20 minutos/.test(r.dia),r);
   ok2(`${n}: el aviso confirma «desde hoy»`,/desde hoy, tu caminata es de 20 minutos/.test(r.toastT),r.toastT)}
  else{ok2(`${n}: el botón dice «Usar 20 minutos desde la próxima caminata»`,r.txt==='Usar 20 minutos desde la próxima caminata',r.txt);
   ok2(`${n}: la sesión ya guardada no cambia`,r.s0===r.s1&&r.s0!=='null',r);
   ok2(`${n}: Mi día muestra la próxima sesión (caminata de 20 min, o fuerza si toca) y el aviso confirma la próxima caminata de 20`,(/caminata de 20 minutos/.test(r.dia)||/Próxima: mañana, fuerza/.test(r.dia))&&/próxima caminata será de 20 minutos/.test(r.toastT),r);
   ok2(`${n}: (hallazgo) Entreno describe «hoy» con la dosis nueva aunque la caminata de hoy ya se registró`,/Camina 20 minutos/.test(r.ent)&&r.sd,r)}
  ok2(`${n}: no vuelve a ofrecer otro aumento de inmediato`,r.reofrece===0,r.reofrece);await b.close()}
 // ---------- 3) Edad ----------
 {const {b,p}=await open(8999,{email:'x@prueba.cl',state:(()=>{const s=J(F.A);delete s.profile.birthY;delete s.profile.birthM;return s})()});
  const t=await p.evaluate(()=>{view.evo=null;render();return document.querySelector('#main').innerText});
  ok2('Edad: el aviso dice para qué se usa (18 años o más e imágenes), sin prometer adaptar el plan',/confirmar que tienes 18 años o más/.test(t)&&/ejercicios con personas de tu edad/.test(t)&&!/adaptamos tu plan/.test(t),t.slice(0,300));await b.close()}
 {const {b,p}=await open(8999,{email:'x@prueba.cl',state:J(F.B)});
  const r=await p.evaluate(()=>{const out={};for(const y of [1950,1998]){S.profile.birthY=y;S.profile.birthM=1;delete S.profile.age60;delete S.profile.ageR;S.train.plan=null;S.train.senior=false;tab='entreno';render();const ch=document.querySelector('#pSenior');out[y]={senior:S.train.senior,marcado:ch?ch.checked:null,joven:libYoung(),cap:seniorCap()}}
   S.profile.birthY=1950;S.profile.age60=false;out.eleccion=libYoung();return out});
  ok2('Edad: el año de nacimiento no cambia el plan (la versión adaptada no se marca sola, ni con 76 años)',r[1950].senior===false&&r[1950].marcado===false&&r[1998].marcado===false&&r[1950].cap===false,r);
  ok2('Edad: el año de nacimiento sí elige las imágenes (1950 → mayor, 1998 → joven)',r[1950].joven===false&&r[1998].joven===true,r);
  ok2('Edad: la imagen elegida expresamente se respeta',r.eleccion===true,r);await b.close()}
 {const {b,p}=await open(8999,{email:'nuevo@prueba.cl',state:null});const t=await p.evaluate(()=>{S=blank();S.profile.name='Nuevo';tab='dia';render();return document.querySelector('#main').innerText});
  ok2('Edad: la bienvenida no promete adaptar el plan por la edad',!/edad nos permite adaptar el plan/.test(t)&&/18 años o más/.test(t),t.slice(0,400));await b.close()}
 fs.writeFileSync('/tmp/t_ola1b_medidas.txt',MED.join('\n'));const f=R.filter(x=>!x.ok).length;console.log(MED.join('\n'));console.log(`\n${R.length-f}/${R.length} OK`);srv.close();process.exit(f?1:0)})();
