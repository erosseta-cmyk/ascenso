const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8979);const d=k=>{const x=new Date();x.setDate(x.getDate()-k);return x.toLocaleDateString("sv-SE",{timeZone:"America/Santiago"})};
// paciente con pauta (C)
let {b,p,errs}=await open(8979,{email:'luis@x.cl',state:J(F.C),mine:F.mineC});
let r=await p.evaluate(()=>{view.evo=null;S.seenStage=99;S.rxDone={};tab='dia';render();const bt=document.querySelector('[data-act=rxStart]');return bt&&bt.textContent});
ok('botón de inicio nombra el ejercicio',/Empezar: /.test(r),r);
r=await p.evaluate(async()=>{const k=document.querySelector('.rxchk[data-act=rxTick]').dataset.k;document.querySelector('.rxchk[data-act=rxTick]').click();await new Promise(r=>setTimeout(r,200));const o={done:rxIsDone(k),undo:!!document.querySelector('#toast [data-act=undo]'),btn:(document.querySelector('[data-act=rxStart]')||{}).textContent};document.querySelector('#toast [data-act=undo]').click();await new Promise(r=>setTimeout(r,200));o.after=rxIsDone(k);o.hidden=document.querySelector('#toast').hidden||/Desmarcado/.test(document.querySelector('#toast').textContent);return o});
ok('marcar muestra «Deshacer»',r.done&&r.undo,r);ok('«Deshacer» desmarca',r.after===false,r);ok('el botón dice «siguiente ejercicio»',/Ver el siguiente ejercicio: /.test(r.btn),r);
r=await p.evaluate(async()=>{const its=rxAll();its.slice(0,-1).forEach(it=>rxMark(rxKey(it),true));render();return (document.querySelector('[data-act=rxStart]')||{}).textContent});
ok('último pendiente: «Ver el último ejercicio»',/Ver el último ejercicio: /.test(r),r);
// desmarcar sigue pidiendo doble toque
r=await p.evaluate(async()=>{const it=rxAll()[0],k=rxKey(it);const e=document.querySelector(`.rxchk[data-k="${k}"]`);e.click();await new Promise(r=>setTimeout(r,100));return rxIsDone(k)});
ok('desmarcar sigue pidiendo confirmación',r===true);
// progreso y misiones vacíos
r=await p.evaluate(()=>{S.missions=[];S.done={};tab='progreso';render();const a=document.querySelector('#main').innerText;tab='misiones';view.cat='Todas';render();const m=document.querySelector('#main').innerText;view.cat='Mente';render();const m2=document.querySelector('#main').innerText;return{a,m,m2}});
ok('progreso sin hábitos no muestra 0 %',/Aún no hay hábitos programados/.test(r.a)&&!/\b0%/.test(r.a),r.a.slice(0,400));
ok('misiones vacías: «Todavía no elegiste hábitos»',/Todavía no elegiste hábitos/.test(r.m)&&/Elegir mi primer hábito/.test(r.m));
ok('filtro por categoría mantiene su mensaje',/Sin misiones en esta categoría/.test(r.m2));
// contraste lvup
r=await p.evaluate(()=>{const d=document.createElement('div');d.className='card lvup';document.body.appendChild(d);const bg=getComputedStyle(d).backgroundImage;d.remove();return bg});
const hx=[...r.matchAll(/rgb\((\d+), (\d+), (\d+)\)/g)].map(m=>[+m[1],+m[2],+m[3]]);const L=c=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])};const cr=Math.min(...hx.map(c=>1.05/(L(c)+0.05)));
ok('contraste blanco sobre tarjeta de avance ≥ 4,5:1',hx.length>=2&&cr>=4.5,{r,cr});
ok('sin errores paciente',!errs.length,errs);await b.close();
// walkUp con tope senior
const st=J(F.B);({b,p,errs}=await open(8979,{email:'ana@x.cl',state:st}));
r=await p.evaluate(()=>{const t=S.train;t.hold=null;t.parq=Array(10).fill(false);walkUp=()=>t.plan.walk+5;todayTrain=()=>"caminata";const p0=progression;progression=()=>({state:"cap",n:3});const u=lvUp();progression=()=>({state:"keep",n:1});const u2=lvUp();progression=p0;return{u,u2}});
ok('con fuerza en espera de autorización, el aviso aclara que es solo caminata',r.u&&/Caminata: puedes caminar más/.test(r.u.title)&&/hasta que tu kinesiólogo lo autorice/.test(r.u.why),r.u);
ok('sin tope, el aviso normal',r.u2&&/¡Estás listo para caminar más!/.test(r.u2.title),r.u2);
ok('sin errores',!errs.length,errs);await b.close();
// kine: orden de avisos y membresía
const base=(id,o)=>Object.assign({id,email:'p'+id+'@x.cl',name:'P'+id,since:new Date().toISOString(),stage:2,parq:Array(10).fill(false),hold:null,rx:[],sessions:[],done:{},dayFb:{},rxFb:{},rxDone:{},loads:{},clear:[],reported:[]},o);
const pts=[base(1,{sessions:[{id:'a',date:d(10),type:'caminata',result:'completa',borg:3,pain:0}]}),base(2,{hold:{at:d(1),sid:'h',kind:'dolor'},sessions:[{id:'h',date:d(1),type:'fuerza',result:'completa',borg:3,pain:7,paused:'dolor'}]})];
({b,p,errs}=await open(8979,{email:'kine@x.cl',state:J(F.B),pro:pts}));
r=await p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='pacientes';render();const t=document.querySelector('#main').textContent;tab='planes';render();const pl=document.querySelector('#main').textContent;return{ip:t.indexOf('en pausa por dolor'),ii:t.indexOf('7 días o más sin registrar'),sing:/Al contactarlo,/.test(t),und:/undefined/.test(pl),prof:/Mi membresía\s*Profesional/.test(pl)}});
ok('aviso de pausas antes que el de sin registro',r.ip>=0&&r.ii>r.ip,r);ok('singular correcto',r.sing,r);ok('sin «undefined» en membresía',!r.und&&r.prof,r);
ok('sin errores kine',!errs.length,errs);await b.close();srv.close();process.exit(require('./lib').fails?1:0)})();
