const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8988);
const go=async(email,member)=>{const r=await open(8988,{email,state:J(F.B),member});await r.p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='planes';render()});await r.p.waitForTimeout(500);return r};
let {b,p,errs}=await go('kine@x.cl',{active:true,pro:true,is_admin:false,expires_at:null,trial_used:true,server_now:new Date().toISOString(),audit:[]});
let t=await p.innerText('#main');ok('kine (sin admin) ve «Revisión clínica de fichas»',/Revisión clínica de fichas/.test(t)&&/Revisión de biblioteca/.test(t));ok('kine (sin admin) NO ve Administración',!/Administración/.test(t));ok('sin errores kine',!errs.length,errs);await b.close();
({b,p,errs}=await go('kine2@x.cl',{active:true,pro:false,is_admin:true,expires_at:null,trial_used:true,server_now:new Date().toISOString(),audit:[]}));
t=await p.innerText('#main');ok('admin (sin kine) ve Administración',/Administración/.test(t));ok('admin (sin kine) NO firma fichas',!/Revisión de biblioteca/.test(t)&&!/Revisión clínica/.test(t));ok('sin errores admin',!errs.length,errs);await b.close();srv.close()})();
