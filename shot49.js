const {serve,open}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8987);const s=J(F.B);delete s.profile.birthY;delete s.profile.birthM;s.ui={big:true};
let {b,p}=await open(8987,{email:"o@x.cl",state:s});await p.evaluate(()=>{view.evo=null;S.seenStage=99;render()});await p.screenshot({path:'shots/v49_gate.png',fullPage:true});await b.close();srv.close()})();
