const {serve,open,ok}=require('./lib');const F=require('./fixtures');
(async()=>{const srv=await serve(8998);const {b,p,errs}=await open(8998,{email:'pac@x.cl',state:JSON.parse(JSON.stringify(F.B))});
const r=await p.evaluate(()=>{const o={bad:[]};for(const id of Object.keys(LIBSEQ))for(const v of['f','m','f_y','m_y'])if(LIBIMG.includes(id+'_'+v)&&!seqHas(id,v))o.bad.push(id+'_'+v);
S.profile.route='aventurera';o.ie=(libImg('tob_inv_ev',LIB.tob_inv_ev).match(/<figure/g)||[]).length;S.minor=true;o.ieY=/tob_inv_ev_f_s1/.test(libImg('tob_inv_ev',LIB.tob_inv_ev));o.kn=/lib_mmii_flex_rodilla_silla_f_y\.jpg/.test(libImg('mmii_flex_rodilla_silla',LIB.mmii_flex_rodilla_silla));return o});
ok('todas las variantes con secuencia completa',!r.bad.length,r.bad);ok('inv/ev muestra 3 pasos',r.ie===3,r.ie);ok('joven sin inv/ev cae a adulto',r.ieY);ok('rodilla sentado tiene imagen joven',r.kn);
const miss=await p.evaluate(async()=>{const m=[];for(const k of LIBIMG){const res=await fetch('ex/lib_'+k+'.jpg',{method:'HEAD'});if(!res.ok)m.push(k)}return m});ok('todas las imágenes de LIBIMG existen',!miss.length,miss.slice(0,10));
ok('sin errores',!errs.length,errs);await b.close();srv.close()})();
