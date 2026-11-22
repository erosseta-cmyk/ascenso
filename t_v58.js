const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
async function fill(p,{alert,pain=1}){await p.evaluate(()=>{const t=S.train;t.sessions=t.sessions.filter(x=>x.date!==today());t.hold=null;view.evo=null;S.seenStage=99;tab='entreno';view.log={result:"",borg:null,pain:null};render()});
 await p.evaluate(async([alert,pain])=>{const c=(s,v)=>document.querySelector(`[data-act=scale][data-s=${s}][data-v="${v}"]`).click();c('borg',1);await new Promise(r=>setTimeout(r,40));c('pain',pain);await new Promise(r=>setTimeout(r,40));const f=document.querySelector('#logForm');(f.querySelector('input[name=res][value=completa]')||f.querySelector('input[name=res]')).checked=true;f.querySelectorAll('.logEx').forEach(x=>x.checked=true);if(alert)document.querySelector('#logAlert').checked=true;f.requestSubmit()},[alert,pain]);await p.waitForTimeout(250)}
(async()=>{const srv=await serve(8990);
let {b,p,errs}=await open(8990,{email:"ana@x.cl",state:J(F.B)});
await fill(p,{alert:true});let r=await p.evaluate(()=>({saved:!!sessionToday(),box:!!document.querySelector('#sxBox'),hold:S.train.hold}));
ok('marcar síntomas NO guarda de inmediato: pide confirmar cuál',!r.saved&&r.box&&!r.hold,r);
await p.evaluate(()=>document.querySelector('#logForm').requestSubmit());await p.waitForTimeout(200);ok('sin elegir síntoma no guarda',await p.evaluate(()=>!sessionToday()));
ok('el formulario conserva lo marcado (esfuerzo, dolor, ejercicios)',await p.evaluate(()=>view.log.borg===1&&view.log.pain===1&&document.querySelector('#logForm input[name=res]:checked')!==null));
await p.evaluate(()=>{document.querySelector('.sxk[value=mareo]').checked=true;document.querySelector('#logForm').requestSubmit()});await p.waitForTimeout(250);
r=await p.evaluate(()=>({s:sessionToday(),hold:S.train.hold}));ok('con «Mareo» guarda y pausa',r.s&&r.s.alert===true&&JSON.stringify(r.s.sx)==='["mareo"]'&&r.hold&&r.hold.kind==='sintomas',r);
await fill(p,{alert:true});await p.evaluate(()=>document.querySelector('[data-act=sxNo]').click());await p.waitForTimeout(300);
r=await p.evaluate(()=>({s:sessionToday(),hold:S.train.hold}));ok('«Me equivoqué» guarda sin alerta ni pausa',r.s&&!r.s.alert&&!r.hold,r);ok('sin errores paciente',!errs.length,errs);
// el kine levantó la pausa: llega por share_mine.clear
await p.evaluate(()=>{const t=S.train;t.sessions=t.sessions.filter(x=>x.date!==today())});await fill(p,{alert:true});await p.evaluate(()=>{document.querySelector('.sxk[value=mareo]').checked=true;document.querySelector('#logForm').requestSubmit()});await p.waitForTimeout(250);
const sid=await p.evaluate(()=>S.train.hold.sid);await p.evaluate(sid=>{localStorage.setItem('stub.mine.ana@x.cl',JSON.stringify([{email:'kinerecupera@gmail.com',since:new Date().toISOString(),clear:[{kind:'hold',key:sid,at:new Date().toISOString(),note:'Llamé, fue un error',by:'kinerecupera@gmail.com'}]}]))},sid);
const pq=await p.evaluate(()=>JSON.stringify(S.train.parq));await p.evaluate(async()=>{await loadShares();render()});await p.waitForTimeout(500);
r=await p.evaluate(()=>({hold:S.train.hold,s:S.train.sessions.find(x=>x.date===today()),parq:JSON.stringify(S.train.parq),txt:document.querySelector('#main').innerText}));
ok('la pausa se levanta cuando el kine la libera',!r.hold&&r.s.liftBy==='kine'&&!/Tu plan está en pausa/.test(r.txt));ok('no le borra el cuestionario ni tu autorización',r.parq===pq);await b.close();
// panel del kine
const d=new Date().toISOString().slice(0,10);const pt={id:5,email:'p@x.cl',name:'P',since:new Date().toISOString(),stage:2,parq:[0,0,0,0,0,0,0].map(()=>false),hold:{at:d,kind:'sintomas',sid:'s9'},rx:[],sessions:[{id:'s9',date:d,type:'fuerza',result:'completa',borg:1,pain:1,alert:true,sx:['mareo','<b>x</b>'],paused:'sintomas',exN:4,note:''}],done:{},dayFb:{},rxFb:{},rxDone:{},loads:{},clear:[]};
({b,p,errs}=await open(8990,{email:"kine@x.cl",state:J(F.B),pro:[pt]}));await p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='pacientes';render()});await p.waitForTimeout(600);await p.evaluate(()=>{const e=document.querySelector('[data-act=ptOpen]');if(e)e.click()});await p.waitForTimeout(300);
let t=await p.innerText('#main');ok('kine ve el síntoma exacto (Mareo)',/síntomas de alerta en la sesión del .*: Mareo/.test(t),t.slice(0,700));ok('kine ve «Levantar pausa»',/Levantar pausa/.test(t));
await p.evaluate(()=>{document.querySelector('#clr_hold_5').value='Llamé, marcó por error';document.querySelector('[data-act=ptClr][data-k=hold]').click()});await p.waitForTimeout(500);
ok('kine registra el levantamiento',await p.evaluate(()=>JSON.parse(localStorage.getItem('stub.pro'))[0].clear.some(c=>c.kind==='hold'&&c.key==='s9')));ok('sin errores kine',!errs.length,errs);await b.close();srv.close()})();
