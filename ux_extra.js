// Capturas extra: las 3 preguntas de Mi día (modo simple, WhatsApp, edad) y los recordatorios
const {serve,open}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const OUT=process.env.OUT;
(async()=>{const srv=await serve(8987);const st=J(F.B);st.ui=Object.assign({},st.ui||{},{simple:false,simpleAsked:false,waNo:false,ageNo:false});delete st.profile.ageR;delete st.profile.age60;
 const {b,p,errs}=await open(8987,{email:'ana@x.cl',state:st,ct:{phone:null,wa_ok:false}});
 const sh=async(n,fn,sel,vp)=>{await p.evaluate(()=>{view.evo=null;S.seenStage=stageIdx(totalXP())+1});await p.evaluate(fn);await p.evaluate(()=>{view.evo=null;const w=document.getElementById('evoWrap');if(w)w.innerHTML=''});await p.waitForTimeout(600);if(sel){const e=await p.$(sel);if(e){await e.screenshot({path:OUT+'/'+n+'.png'});console.log('ok',n);return}}await p.screenshot({path:OUT+'/'+n+'.png',fullPage:!vp});console.log('ok',n)};
 await sh('15_mi_dia_tres_preguntas',()=>{CT={phone:null,wa_ok:false};S.ui.simpleAsked=false;S.ui.waNo=false;delete S.profile.ageR;delete S.profile.age60;tab='dia';render();scrollTo(0,0)});
 const txt=await p.evaluate(()=>{const m=document.querySelector('#main').innerText;return{simple:/modo simple\?/.test(m),wa:/Te avisamos por WhatsApp/.test(m),edad:/rango de edad/.test(m)}});console.log('preguntas visibles',JSON.stringify(txt));
 await sh('16_ajustes_whatsapp',()=>{tab='ajustes';render();const f=document.querySelector('#waForm');const c=f&&(f.closest('.card')||f);if(c)window.scrollTo(0,c.getBoundingClientRect().top+scrollY-140)},null,true);
 await sh('17_ajustes_avisos_misiones',()=>{tab='ajustes';render()},null);
 await p.evaluate(()=>{const c=[...document.querySelectorAll('.card')].find(c=>/Avisos de tus misiones/.test(c.innerText));c&&c.setAttribute('id','avisosCard')});
 const e=await p.$('#avisosCard');if(e){await e.screenshot({path:OUT+'/17_ajustes_avisos_misiones.png'});console.log('ok avisos (tarjeta)')}
 await sh('18_alarma_mision',()=>{tab='dia';render();const m=(S.missions||[]).find(x=>!x.archived)||{id:'m1',name:'Caminar 20 minutos',time:'08:00'};scrollTo(0,0);alFire(Object.assign({cat:'Cuerpo',xp:20},m,{time:'08:00'}))},null,true);
 console.log('errores',JSON.stringify(errs));await b.close();srv.close()})();
