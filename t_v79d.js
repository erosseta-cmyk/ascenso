// Seis decisiones (26-11): D1, D2, L1, L4 · cuentas ficticias
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
const R={};const rec=(k,v)=>{R[k]=v;console.log('CASO',k,JSON.stringify(v))};
(async()=>{const srv=await serve(8984);
const base=`view.evo=null;S.seenStage=99;S.minor=null;S.ui=S.ui||{};S.ui.simple=false;const t=S.train;t.hold=null;t.parq=Array(10).fill(false);t.sessions=t.sessions.filter(x=>x.date!==today());view.log=null;view.sx=null;tab='entreno';render();`;
const logSave=(pain,alert)=>`${base}view.log={};render();const c=(s,v)=>{const e=document.querySelector('[data-act=scale][data-s='+s+'][data-v="'+v+'"]');e&&e.click()};c('borg',4);c('pain',${pain});let f=document.querySelector('#logForm');(f.querySelector('input[name=res][value=completa]')||f.querySelector('input[name=res]')).checked=true;f.querySelectorAll('.logEx').forEach(x=>x.checked=true);${alert?`document.querySelector('#logAlert').checked=true;f.requestSubmit();f=document.querySelector('#logForm');const k=f.querySelector('.sxk');k&&(k.checked=true);`:''}f.requestSubmit();`;
let {b,p,errs}=await open(8984,{email:'ana@x.cl',state:J(F.B),mine:J(F.mineC)});
const st=()=>p.evaluate(()=>{const t=S.train,sd=t.sessions[0];tab='dia';render();const d=document.querySelector('#main').textContent;tab='entreno';render();const e=document.querySelector('#main').textContent;S.ui.simple=true;render();const sm=document.querySelector('#main').textContent;S.ui.simple=false;render();return{tr:trainReady(),hold:t.hold&&t.hold.kind,pain:sd&&sd.pain,pr:progression().state,rxPausaHoy:/Pauta en pausa/.test(d),rxPausaEntreno:/Pauta en pausa/.test(e),rxPausaSimple:/Pauta en pausa/.test(sm),panelVe:/Tu kinesiólogo ve este aviso en su panel/.test(e),puedeReanudar:!!document.querySelector('[data-act=holdOff]'),corregir:!!document.querySelector('#main [data-act=delToday]')}});
// Dolor 5
await p.evaluate(new Function(logSave(5,false)));await p.waitForTimeout(300);let r=await st();rec('dolor5',r);
ok('dolor 5: sin pausa',r.tr==='ok'&&!r.hold&&r.pain===5,r);ok('dolor 5: pauta del kine activa',!r.rxPausaHoy&&!r.rxPausaEntreno&&!r.rxPausaSimple,r);
// Dolor 6
await p.evaluate(new Function(logSave(6,false)));await p.waitForTimeout(300);r=await st();rec('dolor6',r);
ok('dolor 6: pausa',r.tr==='hold'&&r.hold==='dolor',r);ok('dolor 6: pauta en pausa en Mi día, Entreno y modo simple',r.rxPausaHoy&&r.rxPausaEntreno&&r.rxPausaSimple,r);
ok('dolor 6: aviso visible en panel (con vínculo)',r.panelVe,r);
r=await p.evaluate(()=>{tab='dia';render();const ck=document.querySelector('#main [data-act=rxTick]'),st=document.querySelector('#main [data-act=rxStart]');const before=JSON.stringify(S.rxDone||{});A.rxTick({dataset:{k:'x'}});A.rxStart();A.rxHoy({dataset:{i:'0'}});return{ck:!!ck,st:!!st,cambio:before!==JSON.stringify(S.rxDone||{}),rxh:view.rxh}});
ok('dolor 6: sin iniciar, continuar ni marcar',!r.ck&&!r.st&&!r.cambio&&r.rxh==null,r);
r=await p.evaluate(()=>{S.ui.simple=true;render();A.sxGo({dataset:{i:'0'}});const v=!!view.sx;S.ui.simple=false;render();return v});ok('dolor 6: modo simple no abre ejercicios',!r,r);
// quién la levanta: paciente con la casilla
r=await p.evaluate(()=>{tab='entreno';render();document.querySelector('#holdChk').checked=true;A.holdOff({dataset:{m:'same'}});return trainReady()});rec('dolor6_levanta_paciente',r);ok('dolor 6: el paciente puede reanudar confirmando que el dolor volvió a su nivel',r==='ok',r);
// Pausa por cuestionario
r=await p.evaluate(new Function(`${base}S.train.parq=Array(10).fill(false);S.train.parq[0]=true;S.train.clearSrv=null;render();tab='dia';render();const d=document.querySelector('#main').textContent;return{tr:trainReady(),msg:/Tu pauta está en pausa\\. Tu kinesiólogo debe revisar tu respuesta antes de que retomes los ejercicios\\./.test(d),pausa:/Pauta en pausa/.test(d)}`));rec('parq',r);
ok('cuestionario: pausa con el texto acordado',r.tr==='paused'&&r.msg&&r.pausa,r);
// Síntomas
await p.evaluate(()=>{S.train.parq=Array(10).fill(false)});
await p.evaluate(new Function(logSave(2,true)));await p.waitForTimeout(400);r=await st();rec('sintomas',r);
ok('síntomas: pausa',r.tr==='hold'&&r.hold==='sintomas',r);
r=await p.evaluate(()=>{tab='dia';render();const c=document.querySelector('#rxPaused');const html=c?c.innerHTML:'';return{samuPrimero:html.indexOf('tel:131')>=0&&html.indexOf('tel:131')<html.indexOf('Pauta en pausa'),tel:/href="tel:131"/.test(html)}});
ok('síntomas: aviso de urgencia y «Llamar al 131» antes de la pauta',r.samuPrimero&&r.tel,r);
r=await p.evaluate(()=>{tab='dia';render();const m=document.querySelector('#main');const c=m.querySelector('#rxPaused');return{primero:!!c&&m.firstElementChild===c,sinOferta:!/¿Quieres usar el modo simple\?/.test(m.textContent)}});ok('síntomas: en Mi día el aviso va primero, sin invitaciones antes',r.primero&&r.sinOferta,r);
r=await p.evaluate(()=>{tab='entreno';render();return{corr:!!document.querySelector('#main [data-act=delToday]')}});ok('síntomas: se puede corregir el registro de hoy',r.corr,r);
r=await p.evaluate(()=>{A.delToday();return trainReady()});rec('sintomas_corregido',r);ok('síntomas: corregir el registro de hoy quita la pausa',r==='ok',r);
// Dolor 3-4 y caminata
r=await p.evaluate(new Function(`${base}t.senior=false;t.walkAt=0;const dw=new Date().getDay();if(DAYSETS[t.plan.days].d.includes(dw)){t.plan.days=Object.keys(DAYSETS).find(k=>!DAYSETS[k].d.includes(dw))}const mk=(i,type,pain)=>({id:'w'+i,date:new Date(Date.now()-(i+1)*864e5).toLocaleDateString('sv-SE',{timeZone:'America/Santiago'}),type,stage:t.stage,result:'completa',borg:4,pain,at:Date.now()-(i+1)*864e5});t.sessions=[mk(0,'fuerza',3),mk(1,'caminata',0),mk(2,'caminata',0),mk(3,'caminata',0),mk(4,'caminata',0)];tab='dia';render();const d=document.querySelector('#main').textContent;const u=lvUp();return{wu:walkUp(),oferta:!!(u&&u.act==='walkUp'),msg:/Por ahora, mantén tu caminata de \\d+ minutos/.test(d),tr:trainReady()}`));rec('dolor3',r);
ok('dolor 3: sin oferta de caminata y con «Por ahora, mantén…»',r.wu>0&&!r.oferta&&r.msg&&r.tr==='ok',r);
r=await p.evaluate(()=>{const t=S.train;t.sessions[0].pain=4;render();const u=lvUp();return{oferta:!!(u&&u.act==='walkUp')}});ok('dolor 4: sin oferta de caminata',!r.oferta,r);
r=await p.evaluate(()=>{const t=S.train;t.sessions.unshift({id:'w9',date:t.sessions[0].date,type:'caminata',stage:t.stage,result:'completa',borg:4,pain:1,at:Date.now()-3600e3});const u=lvUp();return{oferta:!!(u&&u.act==='walkUp'),wu:walkUp()}});rec('dolor3_luego_2',r);
ok('registro posterior con dolor ≤2: se vuelven a evaluar los criterios',r.oferta===(r.wu>0),r);
r=await p.evaluate(()=>{const t=S.train;t.hold={at:today(),kind:'dolor',sid:'w0'};t.sessions.find(x=>x.id==='w0').pain=7;t.sessions.unshift({id:'w10',date:today(),type:'caminata',stage:t.stage,result:'completa',borg:3,pain:1,at:Date.now()});return trainReady()});
ok('un registro con dolor ≤2 no levanta una pausa por sí solo',r==='hold',r);
ok('sin errores',!errs.length,errs);await b.close();
// L1 + L4: alta
const nuevo=()=>{const s=J(F.B);s.onboard=null;s.profile={name:'Nueva',route:'aventurera',av:{ch:'camina',v:'f'}};return s};
({b,p,errs}=await open(8984,{email:'nuevo@x.cl',state:nuevo(),ct:{phone:null,wa_ok:false}}));
r=await p.evaluate(async()=>{render();const y=document.querySelector('#obY');if(!y)return{sinForm:document.querySelector('#main').textContent.slice(0,200)};y.value='1958';document.querySelector('#obM').value='4';document.querySelector('#obP').value='';document.querySelector('#obTerms').checked=true;await A.onboard();await new Promise(r=>setTimeout(r,300));return{onb:!!S.onboard,ct:CT,need:profNeed(),main:document.querySelector('#main').textContent.slice(0,120)}});rec('alta_adulta_sin_celular',r);
ok('alta adulta sin celular',r.onb&&(!r.ct||!r.ct.phone)&&!r.need.length,r);
await b.close();
({b,p,errs}=await open(8984,{email:'menor@x.cl',state:nuevo(),ct:{phone:null,wa_ok:false}}));
r=await p.evaluate(async()=>{render();const Y=new Date().getFullYear();document.querySelector('#obY').value=String(Y-16);document.querySelector('#obM').value='1';document.querySelector('#obTerms').checked=true;const msgs=[];const t0=window.toast;window.toast=m=>{msgs.push(m);t0(m)};await A.onboard();return{onb:!!S.onboard,minor:S.minor,msgs}});rec('alta_menor',r);
ok('alta de menor rechazada',!r.onb&&r.msgs.some(m=>/solo para personas de 18 años o más/.test(m)),r);
await b.close();
({b,p,errs}=await open(8984,{email:'ana@x.cl',state:J(F.B),ct:{phone:null,wa_ok:false}}));
r=await p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='ajustes';render();const t=document.querySelector('#main').textContent;const msgs=[];const t0=window.toast;window.toast=m=>{msgs.push(m);t0(m)};document.querySelector('#pfP').value='912345678';document.querySelectorAll('input[name=pfPB]').forEach(x=>x.checked=false);const rp=readProf('pf');const f=document.createElement('form');f.id='maForm';document.body.appendChild(f);f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return{familia:/Familia: autorizar/.test(t),err:rp.err,msgs,opc:/Tu celular\s*\(opcional\)/.test(t)}});rec('ajustes',r);
ok('Familia oculta (no se crean códigos)',!r.familia,r);ok('crear código bloqueado en la interfaz',r.msgs.some(m=>/solo para personas de 18/.test(m)),r);
ok('celular opcional; si se da, pide de quién es',r.opc&&/de quien te ayuda/.test(r.err||''),r);
r=await p.evaluate(()=>{const msgs=[];window.toast=m=>msgs.push(m);document.querySelector('#waPhone').value='912345678';document.querySelector('#waOk').checked=true;document.querySelectorAll('input[name=waPB]').forEach(x=>x.checked=false);document.querySelector('#waForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));const m1=msgs.slice();document.querySelector('input[name=waPB][value=ayuda]').checked=true;document.querySelector('#waForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));return{m1,owner:S.profile.phoneBy,aviso:/no le autoriza a recibir tus datos de salud/.test(document.querySelector('#waForm').textContent)}});rec('whatsapp',r);
ok('WhatsApp: pide de quién es el número y lo guarda',r.m1.some(m=>/tuyo o de quien te ayuda/.test(m))&&r.owner==='ayuda'&&r.aviso,r);
ok('sin errores 2',!errs.length,errs);await b.close();
require('fs').writeFileSync('/tmp/t_v79d_casos.json',JSON.stringify(R,null,1));srv.close();process.exit(require('./lib').fails?1:0)})();
