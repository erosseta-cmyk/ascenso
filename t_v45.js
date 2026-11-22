const {serve,open,ok}=require('./lib');const F=require('./fixtures');
(async()=>{const srv=await serve(8961);
const rx=[{ex:"hom_re_toalla",dose:"2×10 por lado"},{ex:"hom_empuje_toalla",dose:"2×10"},{ex:"mmss_elev_escapular",dose:"2×10"},{ex:"hom_desliz_pared",dose:"2×8"},{ex:"mmii_puente_cama",dose:"2×10"},{ex:"mmii_abd_cadera",dose:"2×10 por lado"},{ex:"fz_silla",dose:"2×8"},{ex:"mmii_ext_cadera",dose:"2×10 por lado"}].map(x=>Object.assign({name:"",note:""},x));
for(const route of ["aventurera","guerrero"]){const st=JSON.parse(JSON.stringify(F.B));st.profile.route=route;
let {b,p,errs}=await open(8961,{email:"m@x.cl",state:st,mine:[{email:"kine@recupera.cl",since:"2026-10-01",rx,rxAt:"2026-11-08",id:7,clear:[]}]});
await p.evaluate(()=>{view.evo=null;S.seenStage=99;render()});
const r=await p.evaluate(()=>rxAll().map(it=>({id:it.ex,src:rxSrc(it.ex),n:rxName(it)})));
ok(route+': 8 ejercicios con nombre',r.length===8&&r.every(x=>x.n&&x.n.length>3),r);
ok(route+': todos con imagen',r.every(x=>x.src),r.filter(x=>!x.src));
const bad=await p.evaluate(async srcs=>{const o=[];for(const s of srcs){const i=new Image();await new Promise(z=>{i.onload=i.onerror=z;i.src=s});if(!i.naturalWidth)o.push(s)}return o},r.map(x=>x.src));ok(route+': imágenes cargan',!bad.length,bad);
for(let i=0;i<8;i++){await p.evaluate(i=>{view.rxh=i;render()},i)}
ok(route+': sin errores',!errs.length,errs);if(route==="aventurera"){await p.evaluate(()=>{view.rxh=0;render()});await p.screenshot({path:'shots/v45_rx.png',fullPage:false})}await b.close()}
let {b,p,errs}=await open(8961,{email:"kine@x.cl",state:F.B,pro:[{id:7,email:"m@x.cl",name:"P",since:"2026-10-01",stage:1,parq:Array(10).fill(false),parqKey:"x",clear:[],rx:[],sessions:[],done:{},rxDone:{},loads:{}}]});
const g=await p.evaluate(()=>{const h=RXA.find(a=>a[0]==="trauma")[2];return{hom:h.find(x=>x[0]==="hombro")[2],cad:h.find(x=>x[0]==="cadrod")[2]}});
ok('editor: en Hombro',["hom_re_toalla","hom_empuje_toalla","hom_desliz_pared"].every(x=>g.hom.includes(x)),g.hom);ok('editor: en Cadera',g.cad.includes("mmii_puente_cama"));
await b.close();srv.close()})();
