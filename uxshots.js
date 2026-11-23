const {serve,open}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
const OUT=process.env.OUT||'/home/claude/ux';require('fs').mkdirSync(OUT,{recursive:true});
const shot=async(p,name,prep)=>{try{if(prep)await p.evaluate(prep);await p.waitForTimeout(450);await p.evaluate(()=>window.scrollTo(0,0));const h=await p.evaluate(()=>Math.min(document.documentElement.scrollHeight,2600));await p.setViewportSize({width:390,height:h});await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${name}.png`});await p.setViewportSize({width:390,height:844});console.log('ok',name,h)}catch(e){console.log('ERR',name,e.message.slice(0,150))}};
(async()=>{const s=await serve(8990);
// 0. pantalla de acceso (sin sesión)
let {b,p}=await open(8990,{});await shot(p,'00_acceso');await b.close();
// paciente con pauta del kine
const st=J(F.C);({b,p}=await open(8990,{email:'luis@x.cl',state:st,mine:F.mineC}));
const T=t=>`()=>{view.evo=null;S.seenStage=99;view.form=null;view.log=null;tab='${t}';render()}`;
await shot(p,'01_mi_dia',eval(T('dia')));
await shot(p,'02_misiones',eval(T('misiones')));
await shot(p,'03_entreno',eval(T('entreno')));
await shot(p,'04_registrar_sesion',()=>{tab='entreno';view.log={};render();const f=document.querySelector('#logForm');f&&f.scrollIntoView()});
await shot(p,'05_evolucion',eval(T('evolucion')));
await shot(p,'06_progreso',eval(T('progreso')));
await shot(p,'07_bitacora',eval(T('bitacora')));
await shot(p,'08_ajustes',eval(T('ajustes')));
await shot(p,'09_modo_simple',()=>{S.ui=S.ui||{};S.ui.simple=true;view.sOut=null;render()});
await p.evaluate(()=>{S.ui.simple=false;render()});await b.close();
// onboarding nuevo usuario
({b,p}=await open(8990,{email:'nuevo@x.cl'}));await shot(p,'10_bienvenida_nuevo');await b.close();
// kine
const d=k=>{const x=new Date();x.setDate(x.getDate()-k);return x.toISOString().slice(0,10)};
const base=(id,o)=>Object.assign({id,email:'p'+id+'@x.cl',name:'P'+id,since:new Date(Date.now()-30*864e5).toISOString(),stage:2,parq:Array(10).fill(false),hold:null,rx:[],sessions:[],done:{},dayFb:{},rxFb:{},rxDone:{},loads:{},clear:[],reported:[]},o);
const S1=[];for(let i=1;i<14;i++)S1.push({id:'s'+i,date:d(i),type:i%2?'caminata':'fuerza',result:'completa',borg:4,pain:i===3?3:1});
const pts=[base(1,{name:'Rosa Pérez',birthY:1953,sessions:S1,rx:F.mineC[0].rx,rxAt:d(14)}),base(2,{name:'Jorge Díaz',hold:{at:d(2),sid:'h',kind:'dolor'},sessions:[{id:'h',date:d(2),type:'fuerza',result:'completa',borg:5,pain:7,paused:'dolor'}]}),base(3,{name:'Marta Soto',sessions:[{id:'m',date:d(12),type:'caminata',result:'completa',borg:3,pain:0}]}),base(4,{name:'Pedro Rojas',parq:[false,true,false,false,false,false,false],parqAt:d(1),parqKey:'k1'})];
({b,p}=await open(8990,{email:'kine@x.cl',state:J(F.B),pro:pts}));
await shot(p,'11_kine_pacientes',eval(T('pacientes')));
await shot(p,'12_kine_ficha_paciente',()=>{tab='pacientes';render();document.querySelector('[data-act=ptOpen]').click()});
await shot(p,'13_kine_indicar_ejercicios',()=>{tab='pacientes';SH.open=null;render();const e=document.querySelector('[data-act=rxOpen]');e&&e.click()});
await shot(p,'14_kine_planes_biblioteca',eval(T('planes')));
await b.close();s.close()})();
