const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
async function logSession(p,pain,nuevo){await p.evaluate(()=>{const t=S.train;t.sessions=t.sessions.filter(x=>x.date!==today());t.hold=null;view.evo=null;S.seenStage=99;tab='entreno';view.log={};render()});
 await p.evaluate(async([pain,nuevo])=>{const c=(s,v)=>document.querySelector(`[data-act=scale][data-s=${s}][data-v="${v}"]`).click();c('borg',3);await new Promise(r=>setTimeout(r,50));c('pain',pain);await new Promise(r=>setTimeout(r,50));const f=document.querySelector('#logForm');const r=f.querySelector('input[name=res][value=completa]')||f.querySelector('input[name=res]');r.checked=true;f.querySelectorAll('.logEx').forEach(x=>x.checked=true);if(nuevo)document.querySelector('#logNew').checked=true;f.requestSubmit()},[pain,nuevo]);await p.waitForTimeout(300);
 return p.evaluate(()=>({hold:S.train.hold,s:S.train.sessions[0],toast:(document.querySelector('#toast')||{}).textContent||''}))}
(async()=>{const srv=await serve(8996);
let {b,p,errs}=await open(8996,{email:"ana@x.cl",state:J(F.B)});
let r=await logSession(p,3,true);ok('dolor nuevo 3/10 NO pausa el plan',!r.hold,r);ok('queda marcado como dolor nuevo',r.s.painNew===true&&r.s.pain===3);ok('avisa que el kine lo verá',/dolor nuevo/.test(r.toast),r.toast);
r=await logSession(p,4,true);ok('dolor nuevo 4/10 NO pausa',!r.hold);
r=await logSession(p,5,false);ok('dolor 5/10 SÍ pausa',r.hold&&r.hold.kind==='dolor');ok('la sesión guarda que pausó',r.s.paused==='dolor');
await p.evaluate(()=>{tab='entreno';render();document.querySelector('#holdChk').checked=true;document.querySelector('[data-act=holdOff]').click()});await p.waitForTimeout(200);
r=await p.evaluate(()=>({hold:S.train.hold,s:S.train.sessions[0]}));ok('al reanudar queda registro de la reanudación',!r.hold&&r.s.paused==='dolor'&&typeof r.s.resumedAt==='number');
// pausa antigua con dolor nuevo 3 se levanta sola
await p.evaluate(()=>{const t=S.train;t.sessions[0].pain=3;t.sessions[0].painNew=true;delete t.sessions[0].paused;delete t.sessions[0].resumedAt;t.hold={at:today(),kind:'dolor',sid:t.sessions[0].id};tab='entreno';render()});
r=await p.evaluate(()=>({hold:S.train.hold,s:S.train.sessions[0],txt:document.querySelector('#main').innerText}));ok('pausa antigua por dolor 3 se levanta sola',!r.hold&&!/Tu plan está en pausa/.test(r.txt)&&r.s.autoLift===1);
// síntomas siguen pausando
await p.evaluate(()=>{S.train.hold=null;S.train.sessions=S.train.sessions.filter(x=>x.date!==today());view.log={};tab='entreno';render()});
await p.evaluate(async()=>{const c=(s,v)=>document.querySelector(`[data-act=scale][data-s=${s}][data-v="${v}"]`).click();c('borg',3);await new Promise(r=>setTimeout(r,50));c('pain',1);await new Promise(r=>setTimeout(r,50));const f=document.querySelector('#logForm');(f.querySelector('input[name=res][value=completa]')||f.querySelector('input[name=res]')).checked=true;f.querySelectorAll('.logEx').forEach(x=>x.checked=true);document.querySelector('#logAlert').checked=true;f.requestSubmit()});await p.waitForTimeout(300);
r=await p.evaluate(()=>S.train.hold);ok('síntomas de alerta siguen pausando',r&&r.kind==='sintomas');ok('sin errores paciente',!errs.length,errs);await b.close();
// panel del kine
const d=new Date().toISOString().slice(0,10);const pt={id:7,email:'pac@x.cl',name:'Paciente',since:new Date().toISOString(),stage:1,parq:[0,0,0,0,0,0,0].map(()=>false),hold:null,rx:[],sessions:[{id:'s1',date:d,type:'fuerza',result:'completa',borg:3,pain:3,painNew:true,paused:'dolor',resumedAt:Date.now(),ex:['a'],exN:4,note:'<img src=x onerror=alert(1)>'}],done:{},dayFb:{},rxFb:{},rxDone:{},loads:{},clear:[]};
({b,p,errs}=await open(8996,{email:"kine@x.cl",state:J(F.B),pro:[pt]}));await p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='pacientes';render()});await p.waitForTimeout(600);await p.evaluate(()=>{const e=document.querySelector('[data-act=ptOpen]');if(e)e.click()});await p.waitForTimeout(400);
const t=await p.innerText('#main');ok('kine ve banner de dolor nuevo',/Dolor nuevo 3 de 10/.test(t),t.slice(0,600));ok('kine ve que se pausó y se reanudó',/reanudó/.test(t));ok('cuenta 1 sesión con aviso',/1 sesión con aviso/.test(t));ok('tabla muestra (nuevo) y pausa',/3 \(nuevo\)/.test(t)&&/⏸ pausa · reanudada/.test(t));
ok('nota escapada (sin XSS)',await p.evaluate(()=>!document.querySelector('#main img[src=x]')));ok('sin errores kine',!errs.length,errs);await b.close();
srv.close()})();
