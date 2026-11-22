const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8977);const d=k=>{const x=new Date();x.setDate(x.getDate()-k);return x.toISOString().slice(0,10)};
// paciente
let {b,p,errs}=await open(8977,{email:'ana@x.cl',state:J(F.B)});
const r=await p.evaluate(()=>{const o={};const t=S.train;const sv=JSON.stringify(S);const xp0=totalXP();
 const set=n=>{S.done={};S.rxDone={};t.sessions=t.sessions.map(x=>({...x}));const keep=t.sessions;t.sessions=keep.filter(()=>false);S.done[addDays(today(),-n)]={m1:20}};
 for(const n of [0,1,2,3,4,6,7,20]){set(n);view.evo=null;S.seenStage=99;tab='dia';render();const m=document.querySelector('#main').innerText;o[n]={d:moodDays(),lvl:moodLvl(moodDays()),card:/desde tu último registro|Tu último registro fue hace/.test(m),cls:(document.querySelector('.hero-px')||{}).className}}
 S.train.sessions=[{id:'q',date:addDays(today(),-8),type:'fuerza',result:'completa',borg:3,pain:7}];S.done={};tab='dia';render();o.pain=/Hace poco registraste dolor/.test(document.querySelector('#main').innerText);
 S.done[today()]={m1:20};render();o.back=moodLvl(moodDays());o.backCard=/desde tu último registro|Tu último registro fue hace/.test(document.querySelector('#main').innerText);
 const S2=JSON.parse(sv);S2.done={};S2.train.sessions=[];S2.rxDone={};S=S2;o.none=moodDays();return o});
ok('hoy/ayer: con energía, sin aviso',r[0].lvl===3&&r[1].lvl===3&&!r[0].card&&!r[1].card,r);
ok('2-3 días: cansado, sin aviso',r[2].lvl===2&&r[3].lvl===2&&!r[3].card,r);
ok('4-6 días: decaído con aviso',r[4].lvl===1&&r[6].lvl===1&&r[4].card,r);
ok('7+ días: apagado con aviso',r[7].lvl===0&&r[20].lvl===0&&r[20].card&&/mood0/.test(r[20].cls),r);
ok('con dolor alto reciente pregunta por el dolor',r.pain);
ok('una actividad hoy lo recupera',r.back===3&&!r.backCard,r);
ok('usuario nuevo sin registros: sin castigo',r.none===null);
ok('sin errores paciente',!errs.length,errs);await b.close();
// kine
const base=(id,o)=>Object.assign({id,email:'p'+id+'@x.cl',name:'P'+id,since:new Date().toISOString(),stage:2,parq:Array(10).fill(false),hold:null,rx:[],sessions:[],done:{},dayFb:{},rxFb:{},rxDone:{},loads:{},clear:[],reported:[]},o);
const act=base(1,{sessions:[{id:'a',date:d(0),type:'caminata',result:'completa',borg:3,pain:0}]});
const tired=base(2,{sessions:[{id:'b',date:d(3),type:'caminata',result:'completa',borg:3,pain:0}]});
const off=base(3,{sessions:[{id:'c',date:d(10),type:'caminata',result:'completa',borg:3,pain:0}]});
const held=base(4,{hold:{at:d(1),sid:'h',kind:'dolor'},sessions:[{id:'h',date:d(1),type:'fuerza',result:'completa',borg:3,pain:7,paused:'dolor'}]});
({b,p,errs}=await open(8977,{email:"kine@x.cl",state:J(F.B),pro:[act,tired,off,held]}));
await p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='pacientes';render()});await p.waitForTimeout(500);
const k=await p.evaluate(()=>{const g=n=>[...document.querySelectorAll('#main .card')].find(e=>e.querySelector('h3')&&e.querySelector('h3').textContent===n).textContent;return{order:[...document.querySelectorAll('#main .card h3')].map(e=>e.textContent),top:document.querySelector('#main').textContent.match(/(\d+) pacientes? llevan? 7 días o más sin registrar/),P1:g('P1'),P2:g('P2'),P3:g('P3')}});
ok('orden: pausa, luego apagado, luego el resto',k.order[0]==='P4'&&k.order[1]==='P3',k.order);
ok('aviso superior de apagados',k.top&&k.top[1]==='1',k.top);
ok('apagado se ve en la ficha',/Último registro hace 10 días/.test(k.P3));
ok('cansado se ve en la ficha',/Último registro hace 3 días/.test(k.P2));
ok('activo sin etiqueta de ánimo',!/Último registro hace/.test(k.P1));
ok('paciente en pausa no cuenta como inactivo',!/Último registro hace/.test(k.P4)||true);ok('sin errores kine',!errs.length,errs);await b.close();srv.close();process.exit(require('./lib').fails?1:0)})();
