const {serve}=require('./lib');const {chromium}=require('playwright');const F=require('./fixtures');const fs=require('fs');
const J=o=>JSON.parse(JSON.stringify(o));const W=390,H=844;
const OV=`window.__ov={
 cap(t){let c=document.getElementById('__cap');if(!c){c=document.createElement('div');c.id='__cap';c.style.cssText='position:fixed;left:10px;right:10px;bottom:14px;z-index:2147483646;background:rgba(10,14,24,.92);color:#fff;font:600 19px/1.3 system-ui,Segoe UI,sans-serif;padding:12px 14px;border-radius:14px;border:2px solid #ff9a3d;box-shadow:0 6px 24px rgba(0,0,0,.5);transition:opacity .3s';document.documentElement.appendChild(c)}c.style.opacity=t?1:0;if(t)c.innerHTML=t},
 tap(x,y){const d=document.createElement('div');d.style.cssText='position:fixed;z-index:2147483647;left:'+(x-26)+'px;top:'+(y-26)+'px;width:52px;height:52px;border-radius:50%;background:rgba(255,154,61,.45);border:3px solid #ff9a3d;pointer-events:none;transform:scale(.4);transition:transform .45s ease-out,opacity .6s';document.documentElement.appendChild(d);requestAnimationFrame(()=>{d.style.transform='scale(1.25)'});setTimeout(()=>{d.style.opacity=0},450);setTimeout(()=>d.remove(),1100)},
 full(html){let c=document.getElementById('__full');if(!html){if(c)c.remove();return}if(!c){c=document.createElement('div');c.id='__full';c.style.cssText='position:fixed;inset:0;z-index:2147483645;background:linear-gradient(160deg,#0b0f17,#1b2440);color:#eef1f7;font:500 18px/1.4 system-ui,Segoe UI,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:28px;gap:14px';document.documentElement.appendChild(c)}c.innerHTML=html}
};`;
(async()=>{const srv=await serve(8991);const b=await chromium.launch();const log=[];const t0=Date.now();
 const mark=(s)=>{log.push({t:(Date.now()-t0)/1000,s});};
 async function ctxFor(init){const ctx=await b.newContext({viewport:{width:W*2,height:H*2},deviceScaleFactor:1,recordVideo:{dir:'video/raw',size:{width:W*2,height:H*2}}});await ctx.addInitScript(init.fn,init.arg);await ctx.addInitScript(OV);await ctx.addInitScript(()=>{const f=()=>{if(!document.documentElement)return setTimeout(f,5);const st=document.createElement('style');st.textContent='html{zoom:2}';document.documentElement.appendChild(st)};f()});return ctx}
 const st=J(F.B);st.profile.name="Rosa";st.profile.ageR="75+";st.ui={};st.missions=[{id:"m1",name:"Caminar 15 minutos",cat:"actividad",xp:10,time:"10:00",dur:15,days:[0,1,2,3,4,5,6],created:"2026-10-01"},{id:"m2",name:"Tomar 6 vasos de agua",cat:"salud",xp:5,time:"",dur:0,days:[0,1,2,3,4,5,6],created:"2026-10-01"},{id:"m3",name:"Tomar mis remedios",cat:"salud",xp:5,time:"09:00",dur:0,days:[0,1,2,3,4,5,6],created:"2026-10-01"}];st.done={};
 const rx=[{ex:"hom_re_toalla",name:"",dose:"2×10 por lado",note:"Lento y sin dolor"},{ex:"mmii_puente_cama",name:"",dose:"2×10",note:""},{ex:"fz_silla",name:"",dose:"2×8",note:"Con los brazos cruzados"}];
 const mine=[{email:"kinesiologo@ejemplo.cl",since:"2026-10-01",rx,rxAt:"2026-11-08",id:7,clear:[]}];
 const ctx=await ctxFor({fn:({st,mine})=>{if(sessionStorage.getItem('init'))return;sessionStorage.setItem('init','1');localStorage.clear();localStorage.setItem('stub.state.rosa@ejemplo.cl',JSON.stringify({data:st,rev:5}));localStorage.setItem('stub.mine.rosa@ejemplo.cl',JSON.stringify(mine))},arg:{st,mine}});
 const p=await ctx.newPage();await p.goto('http://localhost:8991/');await p.waitForTimeout(800);
 const w=ms=>p.waitForTimeout(ms),cap=t=>p.evaluate(t=>__ov.cap(t),t),full=h=>p.evaluate(h=>__ov.full(h),h);
 async function tap(sel,pause=700){const el=await p.$(sel);if(!el)throw new Error('no '+sel);await el.scrollIntoViewIfNeeded();await w(250);const bb=await el.boundingBox();await p.evaluate(([x,y])=>__ov.tap(x,y),[(bb.x+bb.width/2)/2,(bb.y+bb.height/2)/2]);await w(350);await p.evaluate(s=>document.querySelector(s).click(),sel);await w(pause)}
 async function scroll(y,ms=1200){await p.evaluate(([y,ms])=>{const s=scrollY,t=performance.now();return new Promise(r=>{(function f(n){const k=Math.min(1,(n-t)/ms);scrollTo(0,s+(y-s)*(0.5-Math.cos(Math.PI*k)/2));k<1?requestAnimationFrame(f):r()})(t)})},[y,ms])}
 async function type(sel,text){await tap(sel,200);await p.focus(sel);for(const ch of text){await p.keyboard.type(ch);await w(70)}}
 // 0 Portada
 mark('portada');await full(`<div style="font:800 44px/1 Barlow Condensed,Arial Narrow,sans-serif;color:#ff9a3d">Ascenso</div><div style="font-size:28px;font-weight:700">Cómo usar la app,<br>paso a paso</div><div style="color:#9aa6bf">Kinesiología RECUPERA</div>`);await w(4500);
 // 1 Instalación
 mark('instalacion');const steps=[["1","Abre el enlace que te envió tu kinesiólogo","Desde WhatsApp o tu correo. Se abre en el navegador del celular."],["2","Toca el menú del navegador","En Android: los tres puntos ⋮ arriba a la derecha.<br>En iPhone: el botón Compartir ⬆️ abajo."],["3","Elige «Agregar a pantalla de inicio»","En algunos celulares dice «Instalar app»."],["4","Abre Ascenso desde su ícono","Queda junto a tus otras aplicaciones, como WhatsApp."]];
 for(let i=1;i<=steps.length;i++){await full(`<div style="font-size:15px;letter-spacing:.12em;color:#ff9a3d;font-weight:700">ANTES DE EMPEZAR · INSTALAR</div>${steps.slice(0,i).map(([n,t,d],j)=>`<div style="display:flex;gap:14px;align-items:flex-start;opacity:${j===i-1?1:.55};transition:opacity .4s"><div style="flex:none;width:44px;height:44px;border-radius:50%;background:#ff9a3d;color:#111;font:800 22px/44px system-ui;text-align:center">${n}</div><div><div style="font-size:21px;font-weight:700">${t}</div><div style="color:#9aa6bf;font-size:16px">${d}</div></div></div>`).join("")}`);await w(i===2?6500:5000)}
 await full(null);
 // 2 Entrar
 mark('entrar');await cap('Escribe tu correo y tu contraseña, y toca «Entrar».');await w(1500);
 await type('#auEmail','rosa@ejemplo.cl');await type('#auPass','********');await tap('#authForm button[type=submit]',1800);
 await w(1500);await p.evaluate(()=>{view.evo=null;S.seenStage=99;render()});
 // 3 Oferta modo simple
 mark('oferta');await cap('La app te pregunta si quieres el <b>modo simple</b>: una sola pantalla, letra grande y un ejercicio a la vez.');await w(4000);
 await tap('[data-act=simpleOn]',1500);
 // 4 Hoy
 mark('hoy');await cap('Esta es tu pantalla <b>Hoy</b>. Arriba, los ejercicios que te indicó tu kinesiólogo.');await w(4000);
 await cap('Más abajo: tu plan Ascenso, tus hábitos y cómo te sentiste.');await scroll(900,2500);await w(1200);await scroll(0,1500);await w(500);
 // 5 Ejercicio 1
 mark('ejercicio1');await cap('Toca <b>«Empezar mis ejercicios»</b>.');await w(1500);await tap('.simple .btn.pri[data-act=sxGo]',1200);
 await cap('Verás un ejercicio a la vez: la imagen, la dosis y lo que te indicó tu kinesiólogo.');await w(3500);
 await cap('Si tienes dudas, toca <b>«¿Cómo se hace?»</b> para ver los pasos.');await p.evaluate(()=>{const d=document.querySelector('.simple details');d.scrollIntoView({behavior:'smooth',block:'center'})});await w(900);
 {const el=await p.$('.simple details summary');const bb=await el.boundingBox();await p.evaluate(([x,y])=>__ov.tap(x,y),[(bb.x+bb.width/2)/2,(bb.y+bb.height/2)/2]);await w(300);await el.click();}await w(1200);await scroll(700,1800);await w(2500);
 await cap('Cuando termines, toca <b>«Listo, lo hice»</b>.');await w(1200);await tap('[data-act=sxDone]',1300);
 // 6 cómo te fue
 mark('comotefue');await cap('Cuéntale cómo te fue: <b>Fácil</b>, <b>Me costó</b> o <b>Me dolió</b>.');await w(3200);await tap('[data-act=sxFb][data-v=facil]',1500);
 mark('ejercicio2');await cap('La app pasa sola al siguiente ejercicio.');await w(2500);await tap('[data-act=sxDone]',1200);
 await cap('Si te dolió, toca <b>«Me dolió»</b>…');await w(1800);await tap('[data-act=sxFb][data-v=dolio]',1300);
 await cap('…y marca cuánto, del 0 al 10. Si es 5 o más, la app te dirá que pares y podrás avisarle a tu kinesiólogo.');await w(4500);await tap('[data-act=sxScale][data-k=ex][data-v="3"]',1600);
 mark('ejercicio3');await cap('Último ejercicio.');await w(1500);await tap('[data-act=sxDone]',1000);await tap('[data-act=sxFb][data-v=costo]',1500);
 await cap('¡Listo! Terminaste los ejercicios de hoy.');await w(3000);await tap('[data-act=sxHome]',1200);
 // 9 hábitos
 mark('habitos');await cap('Ahora marca tus <b>hábitos</b> a medida que los cumples.');const hb=await p.$('.simple [data-act=toggle][data-id=m2]');await hb.scrollIntoViewIfNeeded();await w(1500);await tap('.simple [data-act=toggle][data-id=m2]',1200);await tap('.simple [data-act=toggle][data-id=m3]',1500);
 // 10 sensaciones
 mark('sensaciones');await cap('Al final del día, marca tu <b>cansancio</b> y tu <b>dolor</b>, del 0 al 10. Solo toca el número.');await p.evaluate(()=>document.querySelector('[data-act=sxScale][data-k=tired]').scrollIntoView({behavior:'smooth',block:'center'}));await w(2500);await tap('[data-act=sxScale][data-k=tired][data-v="4"]',1200);await tap('[data-act=sxScale][data-k=pain][data-v="2"]',2500);
 // 11 plan
 mark('plan');await cap('Si sigues el plan Ascenso, toca <b>«Hacer mi plan de hoy»</b>.');await tap('[data-act=sxPlan]',2500);await scroll(500,1800);await w(1500);await scroll(0,800);await tap('[data-act=sxHome]',1200);
 // 12 más opciones
 mark('opciones');await cap('En <b>«Más opciones»</b> están los ajustes: letra, recordatorios por WhatsApp y tus datos.');await p.evaluate(()=>document.querySelector('[data-act=sxMore]').scrollIntoView({behavior:'smooth',block:'center'}));await w(2000);await tap('[data-act=sxMore]',2500);
 await scroll(400,1500);await w(2000);await scroll(0,800);await cap('Para regresar, toca <b>«Volver al modo simple»</b>.');await w(1500);await tap('[data-act=sxBack]',1500);
 // 13 salir
 mark('salir');await cap('¿Prefieres la vista completa? Toca <b>«Salir del modo simple»</b>.');await p.evaluate(()=>document.querySelector('[data-act=simpleOff]').scrollIntoView({behavior:'smooth',block:'center'}));await w(2000);await tap('[data-act=simpleOff]',2000);
 await p.evaluate(()=>{view.evo=null;render()});await cap('Para volver, toca <b>«Modo simple: toca aquí»</b>, arriba en Mi día.');await w(3000);await tap('[data-act=simpleOn]',2000);
 await cap(null);await w(500);mark('fin_paciente');
 await ctx.close();
 // Panel del kinesiólogo
 const d=new Date(),dd=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const pro=[{id:7,email:"rosa@ejemplo.cl",name:"Rosa",since:"2026-10-01",stage:2,parq:Array(10).fill(false),parqKey:"x",clear:[],rx,rxVersions:2,sessions:[],done:{},rxDone:{[dd]:{hom_re_toalla:Date.now()-36e5,mmii_puente_cama:Date.now()-35e5,fz_silla:Date.now()-34e5}},rxFb:{[dd]:{hom_re_toalla:{f:"facil"},mmii_puente_cama:{f:"dolio",p:3},fz_silla:{f:"costo"}}},dayFb:{[dd]:{tired:4,pain:2}},loads:{}}];
 const ctx2=await ctxFor({fn:({pro,st})=>{if(sessionStorage.getItem('init'))return;sessionStorage.setItem('init','1');localStorage.clear();localStorage.setItem('stub.email','kinesiologo@ejemplo.cl');localStorage.setItem('stub.state.kinesiologo@ejemplo.cl',JSON.stringify({data:st,rev:5}));localStorage.setItem('stub.pro',JSON.stringify(pro));localStorage.setItem('stub.hist.7',JSON.stringify([{at:new Date().toISOString(),by:'kinesiologo@ejemplo.cl',rx:pro[0].rx}]))},arg:{pro,st:J(F.B)}});
 const p2=await ctx2.newPage();await p2.goto('http://localhost:8991/');await p2.waitForTimeout(1500);
 const P=p2;const w2=ms=>P.waitForTimeout(ms);
 await P.evaluate(()=>{view.evo=null;S.seenStage=99;tab='pacientes';render()});mark('kine');
 await P.evaluate(()=>__ov.full('<div style="font-size:15px;letter-spacing:.12em;color:#ff9a3d;font-weight:700">PARA EL KINESIÓLOGO</div><div style="font-size:30px;font-weight:800">Así ves el avance de tu paciente</div>'));await w2(3500);await P.evaluate(()=>__ov.full(null));
 await P.evaluate(()=>__ov.cap('En <b>Pacientes</b> ves qué hizo hoy, cómo le fue en cada ejercicio y cómo se sintió.'));await w2(5500);
 await P.evaluate(()=>{const b=document.querySelector('[data-act=rxOpen]');b.scrollIntoView({behavior:'smooth',block:'center'})});await w2(1500);
 {const el=await P.$('[data-act=rxOpen]');const bb=await el.boundingBox();await P.evaluate(([x,y])=>__ov.tap(x,y),[(bb.x+bb.width/2)/2,(bb.y+bb.height/2)/2]);await w2(350);await P.evaluate(()=>document.querySelector('[data-act=rxOpen]').click());}await w2(1200);
 await P.evaluate(()=>{document.querySelector('[data-act=rxDaysAll]').scrollIntoView({behavior:'smooth',block:'start'});__ov.cap('Al indicar ejercicios eliges la dosis y <b>los días</b> en que tu paciente debe hacerlos.')});await w2(3000);
 {const el=await P.$('[data-act=rxDaysAll][data-v="2,4,6"]');const bb=await el.boundingBox();await P.evaluate(([x,y])=>__ov.tap(x,y),[(bb.x+bb.width/2)/2,(bb.y+bb.height/2)/2]);await w2(350);await P.evaluate(()=>document.querySelector('[data-act=rxDaysAll][data-v="2,4,6"]').click());}await w2(3500);
 await P.evaluate(()=>__ov.full('<div style="font:800 44px/1 Barlow Condensed,Arial Narrow,sans-serif;color:#ff9a3d">Ascenso</div><div style="font-size:24px;font-weight:700">Tu avance, un día a la vez.</div><div style="color:#9aa6bf">¿Dudas? Escríbele a tu kinesiólogo.</div>'));await w2(4000);mark('fin');
 await ctx2.close();await b.close();srv.close();fs.writeFileSync('video/marks.json',JSON.stringify(log,null,1));console.log(JSON.stringify(log))})().catch(e=>{console.error(e);process.exit(1)});
