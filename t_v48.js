const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8985);
for(const [lbl,mod] of [["antiguo sin edad",st=>{delete st.profile.ageR}],["antiguo que dijo no",st=>{st.ui={simpleAsked:1}}],["con edad",st=>{st.profile.ageR="60-74"}]]){const st=J(F.A.onboard?F.A:F.B);delete st.profile.ageR;st.ui={};mod(st);
 let {b,p,errs}=await open(8985,{email:"u@x.cl",state:st});await p.evaluate(()=>{view.evo=null;S.seenStage=99;render()});const t=await p.innerText('#main');
 ok(lbl+': ve la opción',t.includes('¿Quieres usar el modo simple?')||t.includes('Modo simple: toca aquí'),t.slice(0,200));
 await p.evaluate(()=>{tab='ajustes';render()});ok(lbl+': opción en Ajustes',await p.evaluate(()=>!!document.querySelector('#main [data-act=simpleOn]')));
 await p.evaluate(()=>document.querySelector('#main [data-act=simpleOn]').click());ok(lbl+': se activa',await p.evaluate(()=>S.ui.simple&&document.querySelector('#tabs').hidden));ok(lbl+': sin errores',!errs.length,errs);await b.close()}
let {b,p,errs}=await open(8985,{email:"kine@x.cl",state:J(F.B),pro:[]});await p.evaluate(()=>{view.evo=null;render()});ok('profesional no ve la oferta',!(await p.innerText('#main')).includes('modo simple'));await b.close();srv.close()})();
