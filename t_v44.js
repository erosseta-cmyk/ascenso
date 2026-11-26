const {serve,open,ok}=require('./lib');const F=require('./fixtures');
const iso=d=>new Date(Date.now()+d*864e5).toISOString();
(async()=>{const port=8951;const srv=await serve(port);
// vencido
let {b,p,errs}=await open(port,{email:"b@x.cl",state:F.B,member:{active:false,status:"VENCIDO",expires_at:iso(-3),pro:false,trial_used:true,server_now:iso(0)}});
let t=await p.innerText('#main');ok('vencido: aviso grande en Mi día',t.includes('Tu plan venció')&&t.includes('Renovar ahora'),t.slice(0,300));
for(const tb of ['misiones','entreno','ajustes']){await p.evaluate(tb=>{tab=tb;render()},tb);t=await p.innerText('#main');ok('vencido: aviso también en '+tb,t.includes('Tu plan venció'))}
await p.evaluate(()=>{tab='dia';render()});await p.screenshot({path:'shots/v44_vencido.png'});
ok('vencido: botón de pago directo',!!(await p.$('#main .renew [data-act=pay]')));ok('sin errores',!errs.length,errs);await b.close();
// por vencer 4 días + pedir WhatsApp
({b,p,errs}=await open(port,{email:"b@x.cl",state:F.B,member:{active:true,status:"ACTIVO",expires_at:iso(4),pro:false,trial_used:true,server_now:iso(0)}}));
t=await p.innerText('#main');ok('por vencer: aviso con días',/Tu plan vence en [34] días/.test(t),t.slice(0,300));
await p.evaluate(()=>{tab='ajustes';render()});await p.evaluate(()=>{document.querySelector('#waPhone').value='12345';document.querySelector('#waOk').checked=true;document.querySelector('#waForm').requestSubmit()});await p.waitForTimeout(400);
ok('número inválido rechazado',!(await p.evaluate(()=>CT&&CT.wa_ok)));
await p.evaluate(()=>{document.querySelector('#waPhone').value='9 1234 5678';document.querySelector('input[name=waPB][value=yo]').checked=true;document.querySelector('#waOk').checked=true;document.querySelector('#waForm').requestSubmit()});await p.waitForTimeout(400);
ok('acepta recordatorios con número válido',await p.evaluate(()=>CT.wa_ok&&CT.phone==="+56912345678"));
await p.screenshot({path:'shots/v44_ajustes.png'});
await p.evaluate(()=>document.querySelector('[data-act=waOff]').click());await p.waitForTimeout(400);
ok('baja en un toque sin borrar la cuenta',await p.evaluate(()=>CT.wa_ok===false&&!!session));ok('sin errores',!errs.length,errs);await b.close();
// activo 20 días: sin aviso de renovación
({b,p,errs}=await open(port,{email:"b@x.cl",state:F.B}));t=await p.innerText('#main');ok('activo: sin aviso de renovación',!t.includes('Renovar ahora'));await b.close();
// administrador
const adm=[{email:"a@x.cl",status:"ACTIVO",expires_at:iso(20)},{email:"v1@x.cl",status:"VENCIDO",expires_at:iso(-5),wa_ok:true,phone:"+56911111111"},{email:"v2@x.cl",status:"VENCIDO",expires_at:iso(-1)},{email:"pv@x.cl",status:"ACTIVO",expires_at:iso(3),wa_ok:true,phone:"+56922222222"},{email:"s@x.cl",status:"SIN MEMBRESÍA"}];
({b,p,errs}=await open(port,{email:"kine@x.cl",state:F.B,adm}));
await p.evaluate(async()=>{const[a,b,c]=await Promise.all([sb.rpc("admin_list"),sb.rpc("admin_audit"),sb.rpc("admin_feedback")]);ADM={list:a.data,audit:[],fb:[]};tab='planes';view.evo=null;render()});await p.waitForTimeout(300);
const order=await p.evaluate(()=>[...document.querySelectorAll('.admu .em')].map(x=>x.textContent));ok('orden por urgencia',JSON.stringify(order)===JSON.stringify(["v2@x.cl","v1@x.cl","pv@x.cl","a@x.cl","s@x.cl"]),order);
await p.evaluate(()=>document.querySelector('[data-act=admF][data-k=vencido]').click());const ord2=await p.evaluate(()=>[...document.querySelectorAll('.admu .em')].map(x=>x.textContent));ok('filtro vencidos',ord2.length===2,ord2);
await p.evaluate(()=>{window.__open=[];window.open=(u)=>{__open.push(u)}});await p.evaluate(()=>document.querySelector('[data-act=admWa]').click());await p.waitForTimeout(400);
const u=await p.evaluate(()=>__open[0]);ok('WhatsApp con mensaje prellenado',/^https:\/\/wa\.me\/56911111111\?text=/.test(u)&&decodeURIComponent(u).includes('venció'),u);
ok('registra envío y bloquea doble envío hoy',await p.evaluate(()=>!!document.querySelector('[data-act=admWa][disabled]')));
await p.evaluate(()=>document.querySelector('[data-act=admF][data-k=todos]').click());await p.screenshot({path:'shots/v44_admin.png',fullPage:true});
ok('admin sin errores',!errs.length,errs);await b.close();srv.close();})();
