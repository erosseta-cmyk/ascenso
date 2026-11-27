// Reproducción: fuerza registrada hoy → aceptar +2 repeticiones → volver a Entreno (perfil ficticio Rosa)
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
function setup(){view.evo=null;S.seenStage=99;S.ui.simpleAsked=true;S.ui.waNo=true;S.ui.kineAsked=true;const t=S.train;t.hold=null;t.senior=false;
 const dw=new Date().getDay();t.plan.days=Object.keys(DAYSETS).find(k=>DAYSETS[k].d.includes(dw));t.stage=2;t.lvl=1;t.stageAt=Date.now()-20*864e5;t.lvlAt=Date.now()-15*864e5;
 const ids=STAGES[1][1].map(x=>x[0]);const mk=(i,d,res)=>({id:'f'+i,date:d,type:'fuerza',stage:2,result:res,borg:4,pain:0,at:Date.now()-i*864e5-1000,ex:res==='completa'?ids:ids.slice(0,2),exN:ids.length,xp:res==='completa'?50:25});
 t.sessions=[mk(0,today(),'completa'),mk(2,addDays(today(),-2),'completa'),mk(5,addDays(today(),-5),'completa')];save();tab='entreno';render()}
(async()=>{const srv=await serve(9003);const {b,p,errs}=await open(9003,{email:'rosa@prueba.cl',state:J(F.B)});
 await p.evaluate(`(${setup})()`);await p.waitForTimeout(200);
 const pre=await p.evaluate(()=>({btn:(document.querySelector('#main [data-act=stepUp]')||{}).textContent,lvl:S.train.lvl,ent:document.querySelector('#main').innerText.slice(0,1500)}));console.log(JSON.stringify(pre,null,1));
 await p.screenshot({path:'/home/claude/ola1d/repro_1_antes.png',fullPage:true});
 await p.evaluate(()=>document.querySelector('#main [data-act=stepUp]').click());await p.waitForTimeout(300);
 await p.evaluate(()=>{tab='dia';render();tab='entreno';render();scrollTo(0,0)});
 const post=await p.evaluate(()=>({lvl:S.train.lvl,ent:document.querySelector('#main').innerText.slice(0,1800),hoy:JSON.stringify(sessionToday())}));console.log(JSON.stringify(post,null,1));
 await p.screenshot({path:'/home/claude/ola1d/repro_2_despues.png',fullPage:true});console.log(errs);await b.close();srv.close()})();
