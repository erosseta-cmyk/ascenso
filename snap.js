// Captura los valores que NO pueden cambiar entre versiones (prueba de continuidad)
const {serve,open,ok}=require('./lib');const F=require('./fixtures');
(async()=>{const port=+process.env.PORT||8901;const srv=await serve(port);const out={};
for(const [k,email,st,mine] of [["A","a@x.cl",F.A],["B","b@x.cl",F.B],["C","c@x.cl",F.C,F.mineC]]){
 const {b,p,errs}=await open(port,{email,state:st,mine});
 out[k]=await p.evaluate(()=>({xp:totalXP(),forma:stageIdx(totalXP())+1,stage:S.train.stage,lvl:S.train.lvl||0,plan:S.train.plan,sessions:S.train.sessions.length,done:Object.keys(S.done).length,rxDone:Object.keys(S.rxDone||{}).length,loads:JSON.stringify(S.loads||{}),ageR:S.profile.ageR||null,av:JSON.stringify(S.profile.av),missions:S.missions.length,journal:S.journal.length,onboard:!!S.onboard,v:S.v,rx:SH.mine.flatMap(x=>x.rx||[]).length,rxHoyDone:SH.mine.flatMap(x=>x.rx||[]).filter(it=>rxIsDone(rxKey(it))).length}));
 out[k].errs=errs;await b.close()}
console.log(JSON.stringify(out,null,1));require('fs').writeFileSync(process.env.OUT||'snap.json',JSON.stringify(out,null,1));srv.close()})();
