const {serve,open,ok}=require('./lib');const F=require('./fixtures');
(async()=>{const port=8931;const srv=await serve(port);
let {b,p,errs}=await open(port,{email:"c@x.cl",state:F.C,mine:F.mineC});
await p.evaluate(()=>{const r=sb.rpc.bind(sb);window.__calls=[];sb.rpc=async(n,a)=>{__calls.push(n);if(window.__off&&n!=='ux_hit')return{error:{message:'Failed to fetch'}};return r(n,a)}});
// E6 offline
await p.evaluate(()=>{window.__off=true});
const k=await p.evaluate(()=>rxKey(rxAll().find(it=>!rxIsDone(rxKey(it)))));
await p.evaluate(k=>A.rxTick({dataset:{k}}),k);await p.waitForTimeout(2000);
const st=await p.evaluate(k=>({sync:(document.querySelector('#sync,[data-sync],.sync')||{}).innerText||document.body.innerText.match(/sin conexión[^\n]*/)?.[0],dirty:localStorage.getItem(LS+'.dirty'),done:rxIsDone(k)}),k);
ok('E6 offline: marca queda local y dirty',st.dirty==='1',st);console.log('  sync:',st.sync);
await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>{const r=sb.rpc.bind(sb);window.__calls=[];sb.rpc=async(n,a)=>{__calls.push(n);if(window.__off&&n!=='ux_hit')return{error:{message:'Failed to fetch'}};return r(n,a)}});
ok('E6 tras recargar, marca persiste localmente',await p.evaluate(k=>rxIsDone(k),k));
await p.evaluate(()=>{window.__off=false;window.dispatchEvent(new Event('online'))});await p.waitForTimeout(2500);
const srvSt=await p.evaluate(k=>{const d=JSON.parse(localStorage.getItem('stub.state.c@x.cl')).data;return{srv:!!(((d.rxDone||{})[today()])||{})[k],dirty:localStorage.getItem(LS+'.dirty')}},k);
ok('E6 al volver la conexión, sincroniza al servidor',srvSt.srv&&!srvSt.dirty,srvSt);
// E8 double tap
await p.evaluate(k=>{A.rxTick({dataset:{k}});},k);await p.waitForTimeout(300);
ok('E8 un toque ya no desmarca (B1)',await p.evaluate(k=>rxIsDone(k),k));
await p.evaluate(k=>{A.rxTick({dataset:{k}});},k);
// note empty
await p.evaluate(()=>{NOTE.open=true;render()});await p.waitForTimeout(300);
const hasForm=!!(await p.$('#noteForm'));ok('E3 caja de nota visible en Día',hasForm);
if(hasForm){await p.evaluate(()=>document.querySelector('#noteForm').requestSubmit());await p.waitForTimeout(400);
ok('E8 nota vacía bloqueada',!(await p.evaluate(()=>__calls.includes('note_send'))));
await p.evaluate(()=>{window.__off=true});await p.fill('#noteTxt','Me dolió la rodilla en el puente');await p.evaluate(()=>document.querySelector('#noteForm').requestSubmit());await p.waitForTimeout(600);
ok('E6 nota sin conexión conserva el texto',await p.evaluate(()=>NOTE.txt.length>5&&document.querySelector('#noteTxt').value.length>5));
await p.evaluate(()=>{window.__off=false});await p.evaluate(()=>{document.querySelector('[data-act=noteTag][data-v="Me dolió"]').click()});await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelector('#noteForm').requestSubmit());await p.waitForTimeout(800);
const n=await p.evaluate(()=>JSON.parse(localStorage.getItem('stub.mynotes.c@x.cl')||'[]'));ok('E3 nota enviada con etiqueta',n.length===1&&n[0].tags.includes('Me dolió'),n);
// double submit
}
// E3 session log pain -> hold
const hold=await p.evaluate(()=>{const before=S.train.hold;return{before:!!before,lv:S.train.stage}});console.log('  hold',hold);
ok('sin errores JS',errs.length===0,errs);await b.close();
// pro view
({b,p,errs}=await open(port,{email:"kine@x.cl",pro:[{id:7,email:"c@x.cl",name:"Paciente C",sessions:F.C.train.sessions||[],rx:F.mineC[0].rx,done:{}}]}));
await p.evaluate(()=>{tab='pacientes';render()});await p.waitForTimeout(600);
const pt=await p.innerText('#main');console.log('  PRO:',pt.slice(0,600).replace(/\n+/g,' | '));
ok('pro: sin errores',errs.length===0,errs);await b.close();srv.close();})();
