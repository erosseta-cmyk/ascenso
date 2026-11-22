const {serve,open}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8991);const st=J(F.B);st.ui.simpleAsked=1;st.ui.kineAsked=1;st.ui.big=true;st.train.senior=true;
const {b,p}=await open(8991,{email:"t@x.cl",state:st});await p.evaluate(()=>{const t=S.train;t.sessions=t.sessions.filter(x=>x.date!==today());t.hold=null;view.evo=null;S.seenStage=99;tab='entreno';view.log={result:"",borg:null,pain:null};render()});
await p.evaluate(()=>document.querySelector('[data-act=scale][data-s=pain][data-v="1"]').scrollIntoView({block:'center'}));await p.waitForTimeout(200);
const where=async()=>p.evaluate(()=>{const e=document.querySelector('[data-act=scale][data-s=pain][data-v="1"]').getBoundingClientRect(),a=document.querySelector('#logAlert').closest('label').getBoundingClientRect();return{sy:Math.round(scrollY),painBtnY:Math.round(e.top),alertY:[Math.round(a.top),Math.round(a.bottom)]}});
console.log('antes',JSON.stringify(await where()));
const bb=await (await p.$('[data-act=scale][data-s=pain][data-v="1"]')).boundingBox();await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(150);
console.log('despues',JSON.stringify(await where()));
// segundo toque en el mismo punto de la pantalla (doble toque)
await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(150);console.log('alert marcado tras doble toque:',await p.evaluate(()=>document.querySelector('#logAlert').checked),JSON.stringify(await where()));
await b.close();srv.close()})();
