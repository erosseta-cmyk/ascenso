const {serve,open}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const OUT='/home/claude/ux';
const shot=async(p,name,prep)=>{await p.evaluate(prep);await p.waitForTimeout(450);await p.evaluate(()=>window.scrollTo(0,0));const h=await p.evaluate(()=>Math.min(document.documentElement.scrollHeight,2600));await p.setViewportSize({width:390,height:h});await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${name}.png`});await p.setViewportSize({width:390,height:844});console.log('ok',name,h)};
(async()=>{const s=await serve(8991);const st=J(F.B);st.train.sessions=st.train.sessions.filter(x=>x.date!==new Date().toISOString().slice(0,10));let {b,p}=await open(8991,{email:'ana@x.cl',state:st});
await shot(p,'03_entreno',()=>{view.evo=null;S.seenStage=99;S.train.hold=null;S.train.parq=Array(10).fill(false);tab='entreno';view.log=null;render()});
await shot(p,'04_registrar_sesion',()=>{tab='entreno';view.log={};render()});
await b.close();s.close()})();
