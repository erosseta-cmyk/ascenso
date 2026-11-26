// Capturas de la Ola 1: mismos estados ficticios antes y después, a 360 y 390 px, letra normal y grande.
const {serve,open}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const fs=require('fs');
const OUT=process.env.OUT;fs.mkdirSync(OUT,{recursive:true});
const ST={
 e1_05c_15_20:{st:'B',walk:15,dur:20,pain:3,q:true},
 e2_05c_10_30:{st:'B',walk:10,dur:30,pain:3,q:true},
 e3_pausa_real:{st:'B',walk:15,dur:20,pain:6,hoy:true,q:false},
 e4_sesion_registrada:{st:'B',walk:15,dur:20,pain:1,hoy:true,q:false},
 e5_existente_pauta:{st:'B',walk:15,dur:20,pain:1,rx:true,q:false},
 e6_cuenta_nueva:{st:'A',q:true},
 e7_sin_anio:{st:'A',q:true,noYear:true},
 e8_progresion:{st:'B',walk:15,dur:20,pain:0,q:false,up:true},
};
const VIEWS={dia:'dia',entreno:'entreno',simple:'simple',ajustes:'ajustes'};
const PLAN={e1_05c_15_20:['dia','entreno','simple'],e2_05c_10_30:['dia','simple'],e3_pausa_real:['dia','entreno','simple'],e4_sesion_registrada:['dia','entreno'],e5_existente_pauta:['dia','ajustes'],e6_cuenta_nueva:['dia'],e7_sin_anio:['dia'],e8_progresion:['dia','entreno']};
(async()=>{const srv=await serve(8989);const only=process.env.ONLY;
 for(const [k,c] of Object.entries(ST)){if(only&&!k.includes(only))continue;
  const st=J(F[c.st]);
  if(c.noYear){delete st.profile.birthY;delete st.profile.birthM}
  if(c.q){st.ui=Object.assign({},st.ui||{},{simple:false,simpleAsked:false,waNo:false,ageNo:false,kineAsked:true});delete st.profile.ageR;delete st.profile.age60}
  else st.ui=Object.assign({},st.ui||{},{simpleAsked:true,waNo:true,kineAsked:true});
  st.seenStage=99;
  for(const w of [360,390])for(const big of [false,true]){
   const {b,p}=await open(8989,{email:'rosa@prueba.cl',state:st,ct:c.q?{phone:null,wa_ok:false}:{phone:'+56911112222',wa_ok:true}});
   await p.setViewportSize({width:w,height:800});
   await p.evaluate(({c,big,mine})=>{view.evo=null;S.seenStage=99;S.ui.big=big;const t=S.train;
     if(t&&t.plan){t.hold=null;t.parq=Array(10).fill(false);t.plan.walk=c.walk;t.sessions=t.sessions.filter(x=>x.date!==today());
      const stg=STAGES[t.stage-1][1].map(x=>x[0]);
      if(c.pain!=null&&!c.up)t.sessions.unshift({id:'prev',date:addDays(today(),-1),type:'fuerza',stage:t.stage,result:'completa',borg:4,pain:c.pain,at:Date.now()-864e5,ex:stg,exN:stg.length,xp:50});
      if(c.hoy){const s={id:'hoy',date:today(),type:todayTrain()||'caminata',stage:t.stage,result:c.pain>=6?'parcial':'completa',borg:5,pain:c.pain,at:Date.now(),xp:c.pain>=6?25:50};t.sessions.unshift(s);if(c.pain>=6){t.hold={at:today(),kind:'dolor',sid:'hoy'};s.paused='dolor'}}
      S.missions=S.missions.filter(m=>!/camin/i.test(m.name));S.missions.unshift({id:'mc',name:'Caminar '+c.dur+' minutos',cat:'Cuerpo',xp:40,time:'08:00',dur:c.dur,days:[0,1,2,3,4,5,6],created:addDays(today(),-30)})}
     SH.mine=c.rx?mine:[];render()},{c,big,mine:F.mineC});
   for(const v of PLAN[k]){
    await p.evaluate(v=>{view.evo=null;const w=document.getElementById('evoWrap');if(w)w.innerHTML='';S.ui.simple=v==='simple';view.sOut=false;view.ssub=null;tab=v==='simple'?'dia':v;render();scrollTo(0,0)},v);await p.waitForTimeout(350);
    const h=await p.evaluate(()=>Math.min(document.documentElement.scrollHeight,3200));await p.setViewportSize({width:w,height:h});await p.waitForTimeout(120);
    await p.screenshot({path:`${OUT}/${k}__${v}__${w}${big?'_grande':''}.png`});await p.setViewportSize({width:w,height:800})}
   await b.close()}
  console.log('ok',k)}
 srv.close()})();
