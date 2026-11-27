// Ola 1d: (1) Entreno con la fuerza de hoy registrada tras aceptar un aumento; (2) textos y reglas de edad con fechas de ensayo; (3) «mañana toca caminata» con fecha de ensayo persistente.
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const fs=require('fs');
const R=[];const ok2=(n,c,x)=>{R.push({n,ok:!!c});ok(n,c,x)};const OUT=process.env.OUT;if(OUT)fs.mkdirSync(OUT,{recursive:true});
const JUEVES='2026-11-26T12:00:00-03:00',SABADO='2026-11-28T12:00:00-03:00';
function setupF(o){view.evo=null;S.seenStage=99;S.ui.simpleAsked=true;S.ui.waNo=true;S.ui.kineAsked=true;S.ui.simple=false;const t=S.train;t.hold=null;t.senior=false;t.parq=Array(10).fill(false);
 t.plan.days='mar-jue-sab';t.plan.walk=15;t.stage=2;t.lvl=o.lvl;t.stageAt=Date.now()-30*864e5;t.lvlAt=Date.now()-25*864e5;
 const ids=STAGES[1][1].map(x=>x[0]);const mk=(i,res)=>({id:'f'+i,date:addDays(today(),-i),type:'fuerza',stage:2,result:res,borg:4,pain:0,painNew:false,alert:false,note:'',at:Date.now()-i*864e5-1000,ex:res==='completa'?ids:ids.slice(0,2),exN:ids.length,xp:res==='completa'?50:25});
 const prev=o.etapa?[2,5,7,9]:[2,5];t.sessions=prev.map(i=>mk(i,'completa'));if(o.sinAumento)t.sessions=[mk(2,'parcial'),mk(5,'completa')];
 if(o.hoy==='completa')t.sessions.unshift(mk(0,'completa'));save();tab='entreno';render();return true}
(async()=>{const srv=await serve(9005);const port=9005;
 // ===== 1. Fuerza =====
 const CF=[{lvl:1,hoy:null,act:'stepUp'},{lvl:1,hoy:'completa',act:'stepUp'},{lvl:1,hoy:'parcial',act:'stepUp'},{lvl:0,hoy:'completa',act:'stageUp',etapa:1},{lvl:1,hoy:'completa',act:null,sinAumento:1}];
 for(const c of CF){const n=`Fuerza ${c.act==='stageUp'?'etapa 2→3':c.act?'escalón '+c.lvl+'→'+(c.lvl+1):'sin aumento'} · hoy ${c.hoy?'registrada '+c.hoy:'pendiente'}`;
  const {b,p,errs}=await open(port,{email:'rosa@prueba.cl',state:J(F.B),clock:JUEVES});
  await p.evaluate(`(${setupF})(${JSON.stringify(c)})`);await p.waitForTimeout(200);
  const pre=await p.evaluate(()=>({n:S.train.sessions.length,xp:totalXP(),hoy:JSON.stringify(sessionToday()||null),btn:(document.querySelector('#main [data-act=stepUp],#main [data-act=stageUp]')||{}).textContent||''}));
  if(c.act){ok2(`${n}: se ofrece el aumento`,!!pre.btn,pre.btn);
   if(c.hoy==='completa')ok2(`${n}: el botón habla de la próxima sesión de fuerza`,/próxima sesión de fuerza/.test(pre.btn),pre.btn);
   if(OUT&&c.act==='stepUp'&&c.hoy==='completa'){await p.evaluate(()=>{scrollTo(0,0)});await p.screenshot({path:`${OUT}/f1_antes_de_aceptar.png`,fullPage:true})}
   const toastT=await p.evaluate(a=>{document.querySelector('#main [data-act='+a+']').click();return document.querySelector('#toast').textContent},c.act);await p.waitForTimeout(300);
   if(c.hoy==='completa')ok2(`${n}: el aviso dice que el cambio es para la próxima sesión`,/^Listo: tu próxima sesión de fuerza/.test(toastT),toastT);}
  else ok2(`${n}: no se ofrece aumento`,!pre.btn,pre.btn);
  if(c.hoy==='parcial'){await p.evaluate(()=>{tab='entreno';view.log={borg:4,pain:1};render();const f=document.querySelector('#logForm');f.querySelectorAll('.logEx')[0].checked=true;f.querySelectorAll('.logEx')[1].checked=true;f.querySelector('input[value=parcial]').checked=true;f.requestSubmit()});await p.waitForTimeout(300);
   pre.n=await p.evaluate(()=>S.train.sessions.length);pre.hoy=await p.evaluate(()=>JSON.stringify(sessionToday()||null));pre.xp=await p.evaluate(()=>totalXP());ok2(`${n}: la sesión parcial de hoy quedó registrada después de aceptar`,/"result":"parcial"/.test(pre.hoy),pre.hoy)}
  const post=await p.evaluate(()=>({lvl:S.train.lvl||0,stage:S.train.stage}));
  for(const et of ['tras cambiar de pestaña','tras recargar']){
   if(et==='tras recargar'){await p.waitForTimeout(1800);await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>{view.evo=null;S.seenStage=99})}
   const r=await p.evaluate(()=>{tab='dia';render();const dia=document.querySelector('#main').innerText;tab='entreno';render();const m=document.querySelector('#main'),ent=m.innerText,reg=m.querySelector('#hoyFuerzaReg'),hc=m.querySelector('.hcard'),st=STAGES[S.train.stage-1][1],lv=S.train.lvl||0;
    return{dia,ent,reg:reg?reg.innerText:'',prox:(m.querySelector('#proxFuerza')||{innerText:''}).innerText,doses:st.map(([id,d,alt])=>(alt||EX[id].n)+' · '+doseAt(d,lv)),hoyCard:/Hoy: fuerza/.test(ent),registrar:!!m.querySelector('[data-act=openLog]'),corr:!!(reg&&reg.querySelector('[data-act=delToday]')),hist:hc?hc.innerText:'',n:S.train.sessions.length,xp:totalXP(),hoy:JSON.stringify(sessionToday()||null),lvl:S.train.lvl||0,stage:S.train.stage}});
   ok2(`${n} ${et}: etapa y escalón quedan como se aceptaron, sin cambiar sesiones ni XP`,r.lvl===post.lvl&&r.stage===post.stage&&r.n===pre.n&&r.xp===pre.xp,{r:[r.lvl,r.stage,r.n,r.xp],pre:[post.lvl,post.stage,pre.n,pre.xp]});
   if(c.hoy){const R0=c.hoy==='completa'?'Completa':'Parcial';
    ok2(`${n} ${et}: el registro de hoy conserva su resultado`,r.hoy===pre.hoy,{antes:pre.hoy,ahora:r.hoy});
    ok2(`${n} ${et}: primero «Sesión de fuerza de hoy registrada · ${R0}»`,r.reg.startsWith('HOY\nSesión de fuerza de hoy registrada · '+R0)&&r.ent.indexOf('Sesión de fuerza de hoy registrada')<r.ent.indexOf('Cuándo detenerte'),r.reg.slice(0,120));
    ok2(`${n} ${et}: muestra solo lo guardado de hoy (${c.hoy==='completa'?'4':'2'} de 4 ejercicios), sin repeticiones`,r.reg.includes(`${c.hoy==='completa'?4:2} de 4 ejercicios`)&&!/\d×\d/.test(r.reg.split('Próxima sesión de fuerza')[0]),r.reg);
    ok2(`${n} ${et}: las dosis vigentes aparecen bajo «Próxima sesión de fuerza (el sábado)»`,/^Próxima sesión de fuerza \(el sábado\)/.test(r.prox)&&r.doses.every(d=>r.prox.includes(d))&&(post.lvl?r.prox.includes('escalón '+post.lvl):true)&&r.prox.includes('Etapa '+post.stage),{prox:r.prox,doses:r.doses});
    ok2(`${n} ${et}: sin «Hoy: fuerza» ni «Registrar sesión de hoy», con «Corregir el registro de hoy»`,!r.hoyCard&&!r.registrar&&r.corr,r);
    ok2(`${n} ${et}: mañana caminata, coherente con Mi día`,r.reg.includes('Mañana toca caminata de 15 minutos.')&&r.dia.includes('Próxima: mañana, caminata de 15 minutos'),{reg:r.reg,dia:r.dia.slice(0,600)});
    ok2(`${n} ${et}: el historial muestra «${R0}» sin repeticiones`,new RegExp('Resultado: '+R0).test(r.hist)&&!/\d×\d/.test(r.hist),r.hist);
   }else{
    ok2(`${n} ${et}: sesión pendiente: «Hoy: fuerza» con las dosis nuevas y botón para registrar`,r.hoyCard&&!r.reg&&r.registrar&&r.doses.every(d=>r.ent.includes(d))&&r.ent.includes('escalón '+post.lvl+' de 3'),{doses:r.doses});
    ok2(`${n} ${et}: Mi día indica fuerza de la misma etapa`,r.dia.includes('Fuerza · etapa '+post.stage),r.dia.slice(0,500));}
  }
  if(OUT&&c.act==='stepUp'&&c.hoy==='completa'){await p.evaluate(()=>{tab='entreno';render();scrollTo(0,0)});await p.screenshot({path:`${OUT}/f2_despues_de_aceptar.png`,fullPage:true})}
  ok2(`${n}: sin errores`,!errs.length,errs);await b.close()}
 // ===== 2. Edad =====
 const gate=async(clock,y,m)=>{const st=J(F.B);delete st.profile.birthM;const {b,p,errs}=await open(port,{email:'rosa@prueba.cl',state:st,clock});await p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='dia';render()});
  const r=await p.evaluate(([y,m])=>{const g=document.querySelector('#profGate');if(!g)return{nog:1};const txt=g.querySelector('#profGateTxt').innerText,lab=[...g.querySelectorAll('label')].map(l=>l.textContent.split(/Ej\.|Elige/)[0].replace(/\s+/g,' ').trim()).slice(0,2);g.querySelector('#pgY').value=y;g.querySelector('#pgM').value=m;const pb=g.querySelector('input[name=pgPB][value=yo]');if(pb)pb.checked=true;g.requestSubmit();const bd=document.querySelector('#bdayAviso');return{txt,lab,toast:document.querySelector('#toast').textContent,aviso:bd?bd.textContent:''}},[String(y),String(m)]);await p.waitForTimeout(900);Object.assign(r,await p.evaluate(()=>({gate:!!document.querySelector('#profGate'),by:S.profile.birthY,bm:S.profile.birthM||null})));await b.close();return{...r,errs}};
 const TXT='Ingresa tu año y mes de nacimiento para revisar si puedes usar Ascenso. También los usamos para elegir las imágenes de los ejercicios. Puedes cambiar esas imágenes. Tu celular es opcional.';
 let g=await gate(JUEVES,2008,'');ok2('Edad: texto de «Completa tus datos» aprobado',g.txt===TXT,g.txt);ok2('Edad: etiquetas «Año de nacimiento (obligatorio)» y «Mes de nacimiento (obligatorio)»',g.lab[0]==='Año de nacimiento (obligatorio)'&&g.lab[1]==='Mes de nacimiento (obligatorio)',g.lab);
 ok2('Edad: año sin mes → «Elige tu mes de nacimiento.» y no guarda',g.toast==='Elige tu mes de nacimiento.'&&g.gate&&!g.bm&&!g.aviso,g);
 const AV=m=>`Si cumples 18 este mes, podrás ingresar el 1 de ${m}. Ascenso calcula el acceso con tu año y mes de nacimiento.`;
 const GEN='Por ahora, Ascenso es solo para personas de 18 años o más. Si tienes menos, pídele a tu kinesiólogo otra forma de seguir tus ejercicios.';
 for(const [clk,y,m,esp,lbl] of [
  [JUEVES,2008,11,'aviso:diciembre','26-11-2026, nacido 11/2008 (cumple 18 este mes)'],
  ['2026-11-30T23:50:00-03:00',2008,11,'aviso:diciembre','30-11-2026 23:50, nacido 11/2008'],
  ['2026-12-01T00:10:00-03:00',2008,11,'entra','1-12-2026 00:10, nacido 11/2008'],
  [JUEVES,2008,12,'general','26-11-2026, nacido 12/2008 (cumple el mes siguiente)'],
  [JUEVES,2008,10,'entra','26-11-2026, nacido 10/2008'],
  ['2026-12-15T12:00:00-03:00',2008,12,'aviso:enero','15-12-2026, nacido 12/2008 (paso de diciembre a enero)'],
  ['2026-12-31T23:50:00-03:00',2008,12,'aviso:enero','31-12-2026 23:50, nacido 12/2008'],
  ['2027-01-01T00:10:00-03:00',2008,12,'entra','1-1-2027 00:10, nacido 12/2008'],
  ['2027-01-01T00:10:00-03:00',2009,1,'aviso:febrero','1-1-2027, nacido 1/2009']]){
  const r=await gate(clk,y,m);
  if(esp==='entra')ok2(`Edad ${lbl}: puede ingresar y se guarda año y mes`,!r.gate&&r.by===y&&r.bm===m&&!r.errs.length,r);
  else if(esp==='general')ok2(`Edad ${lbl}: rechazo general, sin el aviso de cumpleaños`,r.gate&&r.toast===GEN&&!r.aviso&&r.bm===null,r);
  else{const mm=esp.split(':')[1];ok2(`Edad ${lbl}: aviso «…el 1 de ${mm}…» visible en el formulario y sin guardar`,r.gate&&r.toast===AV(mm)&&r.aviso===AV(mm)&&r.bm===null,r)}}
 {const st=J(F.A);const {b,p,errs}=await open(port,{email:'nueva@prueba.cl',state:st,clock:JUEVES});
  const r=await p.evaluate(()=>{S.onboard=null;render();const lg=document.querySelector('#obEdadTxt'),pol=LEGAL.privacy,f=document.querySelector('#obY')?document.querySelector('#obY').closest('fieldset'):null;return{lg:lg?lg.innerText:'',lab:f?[...f.querySelectorAll('label')].map(l=>l.textContent.split(/Ej\.|Elige/)[0].replace(/\s+/g,' ').trim()).slice(0,2):[],pol,cv:CFG.consentVersion,ids:['obY','obM','obP','obW','obH','obTerms','obHealth'].map(i=>!!document.getElementById(i))}});
  ok2('Edad: bienvenida «Ascenso está disponible para personas de 18 años o más.»',r.lg==='Ascenso está disponible para personas de 18 años o más.',r.lg);
  ok2('Edad: bienvenida con las mismas etiquetas obligatorias',r.lab[0]==='Año de nacimiento (obligatorio)'&&r.lab[1]==='Mes de nacimiento (obligatorio)',r.lab);
  const POL='• El año y el mes de nacimiento son obligatorios. Con los datos que declaras, calculamos la edad que aparece en Ajustes y evaluamos si cumples el requisito de acceso. Si cumples 18 durante el mes en curso, el acceso se habilita el primer día del mes siguiente. También usamos tu edad para elegir imágenes de ejercicios y respetamos las que elijas tú. Tu kinesiólogo puede ver tu edad cuando autorizas el uso de tus datos de salud y compartes tu avance con él. La versión adaptada del plan la eliges tú.';
  ok2('Edad: política de privacidad con el texto aprobado y sin «adaptar tu plan»',r.pol.includes(POL)&&!/adaptar tu plan/.test(r.pol),r.pol.slice(r.pol.indexOf('• El año')-50,r.pol.indexOf('• El año')+120));
  ok2('Edad: campos y consentimientos de la bienvenida intactos; versión de consentimiento sin cambios',r.ids.every(Boolean)&&r.cv==='2026-11-09-v4',r);
  const r2=await p.evaluate(()=>{document.querySelector('#obY').value='2008';document.querySelector('#obM').value='11';A.onboard();const bd=document.querySelector('#bdayAviso');return{t:document.querySelector('#toast').textContent,a:bd?bd.textContent:'',onb:!!S.onboard}});
  ok2('Edad: en la bienvenida, quien cumple 18 este mes ve el aviso y no entra',r2.t===AV('diciembre')&&r2.a===AV('diciembre')&&!r2.onb,r2);
  ok2('Edad (bienvenida): sin errores',!errs.length,errs);await b.close()}
 {const {b,p,errs}=await open(port,{email:'rosa@prueba.cl',state:J(F.B),clock:JUEVES});const r=await p.evaluate(()=>{view.evo=null;tab='ajustes';render();const f=document.querySelector('#datosForm');const ed=f.innerText.match(/Edad: \d+ años/);f.querySelector('#pfY').value='2008';f.querySelector('#pfM').value='11';const pb=f.querySelector('input[name=pfPB][value=yo]');if(pb)pb.checked=true;f.requestSubmit();return{ed:ed&&ed[0],t:document.querySelector('#toast').textContent,by:S.profile.birthY,bm:S.profile.birthM}});
  ok2('Edad (Ajustes): muestra la edad y aplica el mismo aviso sin cambiar los datos guardados',r.ed==='Edad: 68 años'&&r.t===AV('diciembre')&&r.by===1958&&r.bm===4,r);ok2('Edad (Ajustes): sin errores',!errs.length,errs);await b.close()}
 // ===== 3. Mañana toca caminata (sábado, plan lun-mie-vie: hoy y mañana son caminata) =====
 function setupW(o){view.evo=null;S.seenStage=99;S.ui.simpleAsked=true;S.ui.waNo=true;S.ui.kineAsked=true;S.ui.simple=false;const t=S.train;t.hold=null;t.parq=Array(10).fill(false);t.senior=false;t.walkAt=0;t.plan.walk=15;t.plan.days='lun-mie-vie';
  const mk=i=>({id:'w'+i,date:addDays(today(),-(i+1)),type:'caminata',stage:t.stage,result:'completa',borg:4,pain:0,at:Date.now()-(i+1)*864e5,ex:[],exN:0,xp:50});t.sessions=[0,1,2,3].map(mk);
  if(o.hoy==='completa')t.sessions.unshift({id:'hoy',date:today(),type:'caminata',stage:t.stage,result:'completa',borg:4,pain:0,at:Date.now()-60000,ex:[],exN:0,xp:50});save();tab='entreno';render();return[new Date().getDay(),DAYSETS[t.plan.days].d.includes((new Date().getDay()+1)%7)]}
 for(const hoy of [null,'completa','parcial']){const n=`Caminata sábado 28-11 (mañana domingo, caminata) · 15→20 · hoy ${hoy?'registrada '+hoy:'pendiente'}`;
  const {b,p,errs}=await open(port,{email:'rosa@prueba.cl',state:J(F.B),clock:SABADO});const d=await p.evaluate(`(${setupW})(${JSON.stringify({hoy})})`);ok2(`${n}: la fecha de ensayo es sábado y mañana no es fuerza`,d[0]===6&&d[1]===false,d);
  await p.evaluate(()=>document.querySelector('#main [data-act=walkUp]').click());await p.waitForTimeout(300);
  if(hoy==='parcial'){await p.evaluate(()=>{tab='entreno';view.log={borg:4,pain:1};render();const f=document.querySelector('#logForm');f.querySelector('input[value=parcial]').checked=true;f.requestSubmit()});await p.waitForTimeout(300)}
  const pre=await p.evaluate(()=>({n:S.train.sessions.length,hoy:JSON.stringify(sessionToday()||null)}));
  for(const et of ['tras cambiar de pestaña','tras recargar']){
   if(et==='tras recargar'){await p.waitForTimeout(1800);await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>{view.evo=null;S.seenStage=99})}
   const r=await p.evaluate(()=>{tab='dia';render();const dia=document.querySelector('#main').innerText;tab='entreno';render();const m=document.querySelector('#main');return{dow:new Date().getDay(),dia,ent:m.innerText,reg:(m.querySelector('#hoyRegistrada')||{innerText:''}).innerText,walk:S.train.plan.walk,n:S.train.sessions.length,hoy:JSON.stringify(sessionToday()||null)}});
   ok2(`${n} ${et}: sigue siendo sábado, plan en 20 minutos, mismas sesiones`,r.dow===6&&r.walk===20&&r.n===pre.n&&r.hoy===pre.hoy,{dow:r.dow,walk:r.walk,n:r.n});
   if(hoy){ok2(`${n} ${et}: Entreno «Próxima caminata: 20 minutos (mañana)», sin «Mañana toca fuerza»`,r.reg.includes('Próxima caminata: 20 minutos (mañana)')&&!/Mañana toca fuerza/.test(r.reg)&&r.reg.includes('Caminata de hoy registrada · '+(hoy==='completa'?'Completa':'Parcial')),r.reg);
    ok2(`${n} ${et}: Mi día coincide en día y duración («Próxima: mañana, caminata de 20 minutos»)`,r.dia.includes('Próxima: mañana, caminata de 20 minutos'),r.dia.slice(0,500))}
   else ok2(`${n} ${et}: Mi día y Entreno indican 20 minutos para hoy`,r.dia.includes('Tu plan de hoy indica caminar 20 minutos')&&r.ent.includes('Camina 20 minutos'),{dia:r.dia.slice(0,400)});}
  if(OUT&&hoy==='completa'){await p.evaluate(()=>{tab='entreno';render();scrollTo(0,0)});await p.screenshot({path:`${OUT}/w_sabado_registrada.png`,fullPage:true})}
  ok2(`${n}: sin errores`,!errs.length,errs);await b.close()}
 const f=R.filter(x=>!x.ok).length;console.log(`\n${R.length-f}/${R.length} OK`);fs.writeFileSync('/tmp/t_ola1d.json',JSON.stringify(R));srv.close();process.exit(f?1:0)})();
