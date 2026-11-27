// Botón de aumento de fuerza: texto según el día y el registro, y cambio concreto por ejercicio antes de confirmar.
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const fs=require('fs');const OUT=process.env.OUT;if(OUT)fs.mkdirSync(OUT,{recursive:true});
const R=[];const ok2=(n,c,x)=>{R.push({n,ok:!!c});ok(n,c,x)};
const src=fs.readFileSync(__dirname+'/t_ola1d.js','utf8');const setupF=src.match(/function setupF[\s\S]*?return true\}/)[0];
(async()=>{const port=9071;const srv=await serve(port);
 for(const [lbl,clock,cfg,btnExp,toastRe,big] of [
  ['jueves (toca fuerza), sin registrar','2026-11-26T12:00:00-03:00',{lvl:1,hoy:null},'Aplicar aumento desde hoy',/^Listo: desde hoy, tu sesión de fuerza tiene 2 repeticiones más por serie y 5 segundos más en los ejercicios por tiempo\.$/,0],
  ['jueves, fuerza ya registrada','2026-11-26T12:00:00-03:00',{lvl:1,hoy:'completa'},'Aplicar aumento desde mi próxima sesión de fuerza',/^Listo: tu próxima sesión de fuerza tendrá 2 repeticiones más por serie y 5 segundos más en los ejercicios por tiempo\.$/,1],
  ['viernes (toca caminata), sin registrar','2026-11-27T12:00:00-03:00',{lvl:1,hoy:null},'Aplicar aumento desde mi próxima sesión de fuerza',/^Listo: tu próxima sesión de fuerza tendrá/,0]]){
  const {b,p,errs}=await open(port,{email:'rosa@prueba.cl',state:J(F.B),clock});if(big)await p.setViewportSize({width:360,height:800});
  await p.evaluate(`(${setupF})(${JSON.stringify(cfg)})`);if(big)await p.evaluate(()=>{S.ui.big=true;render()});
  for(const where of ['dia','entreno']){const r=await p.evaluate(w=>{tab=w;render();const c=document.querySelector('#main .lvup');if(!c)return null;const st=STAGES[S.train.stage-1][1],L=S.train.lvl;return{btn:c.querySelector('[data-act=stepUp]').textContent,items:[...c.querySelectorAll('#lvCambio li')].map(x=>x.textContent),exp:st.map(([id,d,alt])=>`${alt||EX[id].n}: ${doseAt(d,L)} → ${doseAt(d,L+1)}`),head:(c.querySelector('.lvlh')||{}).textContent}},where);
   ok2(`Fuerza ${lbl} [${where==='dia'?'Mi día':'Entreno'}]: botón «${btnExp}» y, antes de confirmar, el cambio de cada ejercicio`,r&&r.btn===btnExp&&r.head==='Así cambia tu pauta:'&&JSON.stringify(r.items)===JSON.stringify(r.exp),r)}
  if(OUT&&big){await p.evaluate(()=>{tab='dia';render();document.querySelector('#main .lvup').scrollIntoView()});await p.screenshot({path:OUT+'/fuerza_aumento_360_grande.png'})}
  const pre=await p.evaluate(()=>{const st=STAGES[S.train.stage-1][1],L=S.train.lvl;return st.map(([id,d])=>doseAt(d,L+1))});
  const t=await p.evaluate(()=>{tab='entreno';render();document.querySelector('#main [data-act=stepUp]').click();return document.querySelector('#toast').textContent});
  const after=await p.evaluate(()=>{tab='entreno';render();const t=document.querySelector('#main').innerText;return /Hoy: fuerza|Próxima sesión de fuerza/.test(t)?t:STAGES[S.train.stage-1][1].map(([id,d])=>doseAt(d,S.train.lvl)).join(' ')});
  ok2(`Fuerza ${lbl}: el aviso describe el cambio efectivo`,toastRe.test(t),t);
  ok2(`Fuerza ${lbl}: lo que se mostró antes de confirmar es lo que queda indicado`,pre.every(d=>after.includes(d)),{pre});
  ok2(`Fuerza ${lbl}: sin errores`,!errs.length,errs);await b.close()}
 // Pauta simulada con un solo tipo de ejercicio: se omite el incremento que no corresponde
 for(const [lbl,keep,btn,toast] of [['solo repeticiones',d=>!/ s/.test(d),'Usar 2 repeticiones más en mi próxima sesión de fuerza',/tendrá 2 repeticiones más por serie\.$/],['solo ejercicios por tiempo',d=>/ s/.test(d),'Usar 5 segundos más en mi próxima sesión de fuerza',/tendrá 5 segundos más por serie\.$/]]){
  const {b,p}=await open(port,{email:'rosa@prueba.cl',state:J(F.B),clock:'2026-11-26T12:00:00-03:00'});await p.evaluate(`(${setupF})(${JSON.stringify({lvl:1,hoy:'completa'})})`);
  const r=await p.evaluate(k=>{const keep=eval(k);const a=STAGES[1][1];const f=a.filter(([,d])=>keep(String(d)));a.length=0;a.push(...f);tab='entreno';render();const c=document.querySelector('#main .lvup');const bt=c.querySelector('[data-act=stepUp]').textContent;c.querySelector('[data-act=stepUp]').click();return{bt,t:document.querySelector('#toast').textContent}},keep.toString());
  ok2(`Fuerza · pauta simulada con ${lbl}: botón «${btn}» y aviso sin el incremento que no corresponde`,r.bt===btn&&toast.test(r.t),r);await b.close()}
 const f=R.filter(x=>!x.ok).length;console.log(`\n${R.length-f}/${R.length} OK`);srv.close();process.exit(f?1:0)})();
