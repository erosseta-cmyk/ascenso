const {serve,open}=require('./lib');const F=require('./fixtures');const fs=require('fs');const J=o=>JSON.parse(JSON.stringify(o));
const AXE=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const rx=[{ex:"hom_re_toalla",name:"",dose:"2×10 por lado",note:"Lento"},{ex:"fz_silla",name:"",dose:"2×8",note:""}];const mine=[{email:"kine@x.cl",since:"2026-10-01",rx,rxAt:"2026-11-08",id:7,clear:[]}];
async function audit(p,label,out){await p.evaluate(AXE);const r=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,help:v.help,ex:v.nodes[0].html.slice(0,140)}))});
 const small=await p.evaluate(()=>{const els=[...document.querySelectorAll('#main button,#main a,#main input,#main select,#main summary,#tabs button')].filter(e=>e.offsetParent&&!e.hidden);let lt44=0,lt24=0;const ex=[];for(const e of els){const b=e.getBoundingClientRect();const m=Math.min(b.width,b.height);if(m<24){lt24++;ex.push((e.innerText||e.id||e.type||'').slice(0,30)+' '+Math.round(b.width)+'x'+Math.round(b.height))}if(m<44)lt44++}return{total:els.length,lt44,lt24,ex:ex.slice(0,4)}});
 out.push({label,violations:r,targets:small})}
(async()=>{const srv=await serve(8995);const out=[];
 let {b,p}=await open(8995,{});await audit(p,'Entrar',out);await b.close();
 ({b,p}=await open(8995,{email:"n@x.cl"}));await audit(p,'Registro (antes de empezar)',out);await b.close();
 const st=J(F.B);st.missions=[{id:"m1",name:"Caminar 15 minutos",cat:"Cuerpo",xp:10,time:"10:00",dur:15,days:[0,1,2,3,4,5,6],created:"2026-10-01"}];
 ({b,p}=await open(8995,{email:"r@x.cl",state:st,mine}));await p.evaluate(()=>{view.evo=null;S.seenStage=99;S.ui.simpleAsked=1;render()});
 for(const tb of ['dia','misiones','entreno','evolucion','bitacora','planes','ajustes']){await p.evaluate(tb=>{tab=tb;render()},tb);await p.waitForTimeout(250);await audit(p,'Vista completa: '+tb,out)}
 await p.evaluate(()=>{tab='dia';A.simpleOn()});await p.waitForTimeout(300);await audit(p,'Modo simple: Hoy',out);
 await p.evaluate(()=>document.querySelector('[data-act=sxGo]').click());await p.waitForTimeout(300);await audit(p,'Modo simple: ejercicio',out);
 await p.evaluate(()=>A.sxDone());await audit(p,'Modo simple: ¿cómo te fue?',out);
 // zoom de texto 200% y reflow 320px
 const refl=await (async()=>{await p.setViewportSize({width:320,height:640});await p.evaluate(()=>A.sxHome());await p.waitForTimeout(200);return p.evaluate(()=>({scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth}))})();
 await b.close();
 ({b,p}=await open(8995,{email:"kine@x.cl",state:J(F.B),pro:[{id:7,email:"p@x.cl",name:"P",since:"2026-10-01",stage:1,parq:Array(10).fill(false),parqKey:"x",clear:[],rx,rxVersions:1,sessions:[],done:{},rxDone:{},loads:{}}]}));await p.evaluate(()=>{view.evo=null;tab='pacientes';render()});await audit(p,'Panel del kinesiólogo',out);
 await p.evaluate(()=>document.querySelector('[data-act=rxOpen]').click());await audit(p,'Panel: indicar ejercicios',out);await b.close();srv.close();
 fs.writeFileSync('axe.json',JSON.stringify({out,refl},null,1));
 const agg={};for(const o of out)for(const v of o.violations){const a=agg[v.id]=agg[v.id]||{impact:v.impact,help:v.help,screens:0,nodes:0,ex:v.ex};a.screens++;a.nodes+=v.n}
 console.log(JSON.stringify(agg,null,1));console.log('reflow320',JSON.stringify(refl));for(const o of out)console.log(o.label,'| violaciones',o.violations.length,'| controles',o.targets.total,'<44px',o.targets.lt44,'<24px',o.targets.lt24,o.targets.ex.join(' ; '))})();
