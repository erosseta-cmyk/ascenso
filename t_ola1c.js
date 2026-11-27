// Ola 1c: Entreno con la caminata de hoy registrada tras aceptar un aumento; persistencia tras cambiar de pestaña y recargar.
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const fs=require('fs');
const R=[];const ok2=(n,c,x)=>{R.push({n,ok:!!c});ok(n,c,x)};const OUT=process.env.OUT;if(OUT)fs.mkdirSync(OUT,{recursive:true});
function setup(o){view.evo=null;S.seenStage=99;S.ui.simpleAsked=true;S.ui.waNo=true;S.ui.kineAsked=true;S.ui.simple=false;const t=S.train;t.hold=null;t.parq=Array(10).fill(false);t.senior=false;t.walkAt=0;t.plan.walk=o.walk;
 const dw=new Date().getDay(),dm=(dw+1)%7;const k=Object.keys(DAYSETS).find(k=>!DAYSETS[k].d.includes(dw)&&(o.manana==='fuerza'?DAYSETS[k].d.includes(dm):!DAYSETS[k].d.includes(dm)));let kk=k;if(!kk){DAYSETS.prueba={label:'Prueba',d:[0,1,2,3,4,5,6].filter(x=>x!==dw&&x!==dm).slice(0,3)};kk='prueba'}t.plan.days=kk;
 const mk=i=>({id:'w'+i,date:addDays(today(),-(i+2)),type:'caminata',stage:t.stage,result:'completa',borg:4,pain:0,at:Date.now()-(i+2)*864e5,ex:[],exN:0,xp:50});t.sessions=[0,1,2,3].map(mk);
 if(o.hoy==='completa')t.sessions.unshift({id:'hoy',date:today(),type:'caminata',stage:t.stage,result:o.hoy,borg:4,pain:0,at:Date.now()-60000,ex:[],exN:0,xp:o.hoy==='completa'?50:25});
 save();tab='entreno';render();return true}
(async()=>{const srv=await serve(9002);let port=9002;
 const CASOS=[];for(const [w0,w1] of [[15,20],[10,15],[25,30]])for(const hoy of [null,'completa','parcial'])CASOS.push({walk:w0,nuevo:w1,hoy,manana:'fuerza'});
 CASOS.push({walk:15,nuevo:20,hoy:'parcial',manana:'caminata'});
 for(const c of CASOS){const n=`${c.walk}→${c.nuevo} · hoy ${c.hoy?'registrada '+c.hoy:'pendiente'} · mañana ${c.manana}`;
  const {b,p,errs}=await open(port,{email:'rosa@prueba.cl',state:J(F.B)});await p.setViewportSize({width:390,height:844});
  const okSet=await p.evaluate(`(${setup.toString()})(${JSON.stringify(c)})`);if(!okSet){console.log('OMITIDO (hoy no hay combinación de días):',n);await b.close();continue}
  const pre=await p.evaluate(()=>({btn:(document.querySelector('#main [data-act=walkUp]')||{}).textContent||'',n:S.train.sessions.length,hoy:JSON.stringify(sessionToday()||null)}));
  const conHoy=c.hoy==='completa';ok2(`${n}: el botón dice ${conHoy?'«Usar '+c.nuevo+' minutos desde la próxima caminata»':'«Subir la caminata a '+c.nuevo+' minutos desde hoy»'}`,pre.btn===(conHoy?`Usar ${c.nuevo} minutos desde la próxima caminata`:`Subir la caminata a ${c.nuevo} minutos desde hoy`),pre.btn);
  if(OUT&&c.walk===15&&c.hoy==='completa'&&c.manana==='fuerza')await p.screenshot({path:`${OUT}/1_antes_de_aceptar.png`,fullPage:true});
  await p.evaluate(()=>document.querySelector('#main [data-act=walkUp]').click());await p.waitForTimeout(300);
  if(c.hoy==='parcial'){await p.evaluate(()=>{tab='entreno';view.log={borg:4,pain:1};render();const f=document.querySelector('#logForm');f.querySelector('input[value=parcial]').checked=true;f.requestSubmit()});await p.waitForTimeout(300);pre.n=await p.evaluate(()=>S.train.sessions.length);pre.hoy=await p.evaluate(()=>JSON.stringify(sessionToday()||null));
   ok2(`${n}: la caminata parcial de hoy quedó registrada después de aceptar`,/"result":"parcial"/.test(pre.hoy),pre.hoy)}
  const chk=async(et)=>p.evaluate(()=>{tab='dia';render();const dia=document.querySelector('#main').innerText;tab='entreno';render();const m=document.querySelector('#main');const ent=m.innerText;const hc=m.querySelector('.hcard');
   return{walk:S.train.plan.walk,n:S.train.sessions.length,hoy:JSON.stringify(sessionToday()||null),dia,ent,reg:(m.querySelector('#hoyRegistrada')||{innerText:''}).innerText,instr:/Hoy: caminata/.test(ent)||/Camina \d+ minutos/.test(ent),corr:!!m.querySelector('#hoyRegistrada [data-act=delToday]'),registrar:!!m.querySelector('[data-act=openLog]'),hist:hc?hc.innerText:''}});
  const sim=await p.evaluate(()=>S.train.plan.days==='prueba');if(sim)console.log('NOTA: «mañana caminata» se simuló con días de prueba; se verifica sin recargar:',n);
  for(const et of (sim?['tras cambiar de pestaña']:['tras cambiar de pestaña','tras recargar'])){
   if(et==='tras recargar'){await p.waitForTimeout(1800);await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>{view.evo=null;S.seenStage=99})}
   const r=await chk();
   ok2(`${n} ${et}: el plan queda en ${c.nuevo} minutos y el número de sesiones no cambia`,r.walk===c.nuevo&&r.n===pre.n,r);
   if(c.hoy){
    ok2(`${n} ${et}: el registro de hoy conserva su resultado`,r.hoy===pre.hoy,{antes:pre.hoy,ahora:r.hoy});
    ok2(`${n} ${et}: Entreno muestra primero «Caminata de hoy registrada · ${c.hoy==='completa'?'Completa':'Parcial'}» y «Próxima caminata: ${c.nuevo} minutos»`,r.reg.includes(`Caminata de hoy registrada · ${c.hoy==='completa'?'Completa':'Parcial'}`)&&r.reg.includes(`Próxima caminata: ${c.nuevo} minutos`)&&r.ent.indexOf('Caminata de hoy registrada')<r.ent.indexOf('Cuándo detenerte'),r.reg);
    ok2(`${n} ${et}: sin «Hoy: caminata · Camina N minutos» ni «Registrar sesión de hoy», con «Corregir el registro de hoy»`,!r.instr&&!r.registrar&&r.corr,r);
    ok2(`${n} ${et}: «Próxima caminata» correcta aunque mañana sea ${c.manana}`,c.manana==='fuerza'?(/\(el [^)]+\)/.test(r.reg)&&/Mañana toca fuerza/.test(r.reg)):/\(mañana\)/.test(r.reg),r.reg);
    ok2(`${n} ${et}: el historial muestra «${c.hoy==='completa'?'Completa':'Parcial'}» sin minutos reconstruidos`,new RegExp('Resultado: '+(c.hoy==='completa'?'Completa':'Parcial')).test(r.hist)&&!/minutos/.test(r.hist),r.hist);
   }else{
    ok2(`${n} ${et}: Mi día y Entreno muestran la misma duración (${c.nuevo} min)`,r.dia.includes(`Tu plan de hoy indica caminar ${c.nuevo} minutos`)&&r.ent.includes(`Camina ${c.nuevo} minutos`)&&!r.reg,r);}
  }
  if(OUT&&c.walk===15&&c.hoy==='completa'&&c.manana==='fuerza'){await p.evaluate(()=>{tab='entreno';render();scrollTo(0,0)});await p.screenshot({path:`${OUT}/2_despues_de_aceptar.png`,fullPage:true})}
  ok2(`${n}: sin errores`,!errs.length,errs);await b.close()}
 const f=R.filter(x=>!x.ok).length;console.log(`\n${R.length-f}/${R.length} OK`);fs.writeFileSync('/tmp/t_ola1c.json',JSON.stringify(R));srv.close();process.exit(f?1:0)})();
