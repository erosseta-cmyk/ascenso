// Entrega 1: qué deja ver el restablecimiento de contraseña y qué queda en el navegador (v78 y v79)
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
const V=process.env.VER||'?';
(async()=>{const srv=await serve(8986);const st=J(F.B);
 st.journal=[{id:'j1',at:Date.now()-864e5,text:'NOTA PRIVADA DE PRUEBA: hoy me sentí triste'}];
 st.dayFb={'2026-11-25':{pain:6,at:Date.now()}};
 // 1) El atacante abre el enlace de recuperación desde el Gmail robado: la librería crea la sesión y avisa PASSWORD_RECOVERY
 let {b,p,errs}=await open(8986,{email:'ana@x.cl',state:st});
 await p.evaluate(()=>window.__fire('PASSWORD_RECOVERY'));await p.waitForTimeout(600);
 let r=await p.evaluate(()=>{const raw=Object.keys(localStorage).filter(k=>/^(beta::)?ascenso\.u_/.test(k)&&!/\.(rev|m|dirty)$/.test(k)).map(k=>localStorage.getItem(k)).join('');
  return{pantalla:/Elige una contraseña nueva/.test(document.body.textContent),
   enDisco:{bitacora:/NOTA PRIVADA DE PRUEBA/.test(raw),dolor:/"pain":6/.test(raw),parq:/"parq"/.test(raw),sesiones:/"sessions":\[\{/.test(raw)},
   pideOtraCosa:!!document.querySelector('#newPassForm input:not([type=password])')}});
 ok(V+' R1 el enlace del correo abre la pantalla «Elige una contraseña nueva»',r.pantalla,r);
 ok(V+' R2 antes de poner la contraseña, la bitácora ya quedó guardada en el teléfono del atacante',r.enDisco.bitacora,r);
 ok(V+' R3 y también el dolor diario y el cuestionario',r.enDisco.dolor&&r.enDisco.parq,r);
 ok(V+' R4 la pantalla no pide nada más que la contraseña nueva (sin segundo factor)',!r.pideOtraCosa,r);
 await p.fill('#npPass','Atacante123');await p.fill('#npPass2','Atacante123');await p.evaluate(()=>document.querySelector('#newPassForm').requestSubmit());await p.waitForTimeout(900);
 r=await p.evaluate(()=>({tabs:!document.querySelector('#tabs').hidden,txt:document.body.textContent}));
 ok(V+' R5 con la contraseña nueva entra a la cuenta completa',r.tabs,r.txt.slice(0,200));
 await p.evaluate(()=>{tab='bitacora';render()});await p.waitForTimeout(300);
 r=await p.evaluate(()=>/NOTA PRIVADA DE PRUEBA/.test(document.body.textContent));
 ok(V+' R6 y lee la bitácora en pantalla',r,r);
 // 2) Cambiar la contraseña desde Ajustes no pide la actual
 await p.evaluate(()=>{tab='ajustes';view.pass=true;render()});await p.waitForTimeout(300);
 r=await p.evaluate(()=>{const f=document.querySelector('#chPassForm');return f?[...f.querySelectorAll('input')].map(i=>i.id):null});
 ok(V+' R7 cambiar contraseña en Ajustes no pide la contraseña actual',r&&r.join()==='cpPass,cpPass2',r);
 // 3) El token de la sesión vive en localStorage sin cifrar (en real: sb-<proyecto>-auth-token) y no hay cierre por inactividad
 const src=require('fs').readFileSync(process.env.SITE+'/index.html','utf8');
 ok(V+' R8 el cliente no configura vencimiento ni bloqueo por inactividad',!/persistSession\s*:\s*false|storage\s*:\s*sessionStorage|lockAfter|idleLock|inactividad/.test(src));
 ok(V+' R9 los datos se guardan como JSON plano (no hay crypto.subtle en el guardado)',!/crypto\.subtle\.(encrypt|importKey)/.test(src));
 await b.close();srv.close();process.exit(require('./lib').fails?1:0)})();
