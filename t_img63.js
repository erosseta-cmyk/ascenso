const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8990);const {b,p,errs}=await open(8990,{email:'pac@x.cl',state:J(F.B)});
const r=await p.evaluate(async()=>{const bad=[];for(const n of LIBIMG){const x=await fetch(`ex/lib_${n}.jpg`);if(!x.ok)bad.push(n)}
S.profile.route='aventurera';return {bad,n:LIBIMG.length,h:libImg('eq_semitandem',{n:'Semitándem'})}});
ok('500 imágenes cargan',!r.bad.length,r.bad);ok('semitándem con imagen',/lib_eq_semitandem_f\.jpg/.test(r.h),r.h.slice(0,200));ok('sin errores',!errs.length,errs);await b.close();srv.close()})();
