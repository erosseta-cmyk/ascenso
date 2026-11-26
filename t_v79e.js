const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8985);let {b,p,errs}=await open(8985,{email:'ana@x.cl',state:J(F.B)});
let r=await p.evaluate(()=>{const s0=session;session=null;render();const m=document.querySelector('#main');const pm=m.querySelector('#privMail');const t1=pm?pm.textContent:'';const ln=pm&&pm.querySelector('[data-act=legal]');ln&&ln.click();const t2=document.body.textContent;session=s0;view.legal=null;return{t1,href:pm&&pm.querySelector('a')?.getAttribute('href'),leg:/Tus derechos y cómo ejercerlos/.test(t2)&&/escribe a kinerecupera@gmail\.com/.test(t2),resp:/Responsable del tratamiento: Esteban Rosset/.test(t2)}});
ok('Acceso: muestra el canal de privacidad',/Solicitudes sobre tus datos personales/.test(r.t1)&&r.href==='mailto:kinerecupera@gmail.com',r);
ok('Privacidad (sin sesión): derechos con el correo',r.leg,r);ok('Privacidad: responsable (L3)',r.resp,r);
ok('sin errores',!errs.length,errs);await b.close();srv.close();process.exit(require('./lib').fails?1:0)})();
