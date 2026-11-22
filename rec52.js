const {serve}=require('./lib');const {chromium}=require('playwright');const F=require('./fixtures');const fs=require('fs');
const J=o=>JSON.parse(JSON.stringify(o));const W=390,H=844;
const OV=`window.__ov={
 cap(t){let c=document.getElementById('__cap');if(!c){c=document.createElement('div');c.id='__cap';c.style.cssText='position:fixed;left:10px;right:10px;bottom:14px;z-index:2147483646;background:rgba(10,14,24,.92);color:#fff;font:600 19px/1.3 system-ui,Segoe UI,sans-serif;padding:12px 14px;border-radius:14px;border:2px solid #ff9a3d;box-shadow:0 6px 24px rgba(0,0,0,.5);transition:opacity .3s';document.documentElement.appendChild(c)}c.style.opacity=t?1:0;if(t)c.innerHTML=t},
 tap(x,y){const d=document.createElement('div');d.style.cssText='position:fixed;z-index:2147483647;left:'+(x-26)+'px;top:'+(y-26)+'px;width:52px;height:52px;border-radius:50%;background:rgba(255,154,61,.45);border:3px solid #ff9a3d;pointer-events:none;transform:scale(.4);transition:transform .45s ease-out,opacity .6s';document.documentElement.appendChild(d);requestAnimationFrame(()=>{d.style.transform='scale(1.25)'});setTimeout(()=>{d.style.opacity=0},450);setTimeout(()=>d.remove(),1100)},
 full(html){let c=document.getElementById('__full');if(!html){if(c)c.remove();return}if(!c){c=document.createElement('div');c.id='__full';c.style.cssText='position:fixed;inset:0;z-index:2147483645;background:linear-gradient(160deg,#0b0f17,#1b2440);color:#eef1f7;font:500 18px/1.4 system-ui,Segoe UI,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:28px;gap:14px';document.documentElement.appendChild(c)}c.innerHTML=html}
};`;
(async()=>{const srv=await serve(8992);const b=await chromium.launch();const log=[];const t0=Date.now();
 const mark=(s)=>{log.push({t:(Date.now()-t0)/1000,s});};
 async function ctxFor(init){const ctx=await b.newContext({viewport:{width:W*2,height:H*2},deviceScaleFactor:1,recordVideo:{dir:'video52/raw',size:{width:W*2,height:H*2}}});await ctx.addInitScript(init.fn,init.arg);await ctx.addInitScript(OV);await ctx.addInitScript(()=>{const f=()=>{if(!document.documentElement)return setTimeout(f,5);const st=document.createElement('style');st.textContent='html{zoom:2}';document.documentElement.appendChild(st)};f()});return ctx}

 const mk=(name,extra)=>{const st=J(F.B);st.profile.name=name;st.ui=Object.assign({simpleAsked:1},extra||{});st.seenStage=99;return st};
 const KG='Barlow Condensed,Arial Narrow,sans-serif';
 const ctx=await ctxFor({fn:({st})=>{if(sessionStorage.getItem('init'))return;sessionStorage.setItem('init','1');localStorage.clear();localStorage.setItem('stub.email','rosa@ejemplo.cl');localStorage.setItem('stub.state.rosa@ejemplo.cl',JSON.stringify({data:st,rev:5}))},arg:{st:mk('Rosa')}});
 const p=await ctx.newPage();await p.goto('http://localhost:8992/?k=recupera');await p.waitForTimeout(1200);
 const w=ms=>p.waitForTimeout(ms),cap=t=>p.evaluate(t=>__ov.cap(t),t),full=h=>p.evaluate(h=>__ov.full(h),h);
 async function tapP(P,sel,pause=700){const el=await P.$(sel);if(!el)throw new Error('no '+sel);await el.scrollIntoViewIfNeeded();await P.waitForTimeout(250);const bb=await el.boundingBox();await P.evaluate(([x,y])=>__ov.tap(x,y),[(bb.x+bb.width/2)/2,(bb.y+bb.height/2)/2]);await P.waitForTimeout(350);await P.evaluate(s=>document.querySelector(s).click(),sel);await P.waitForTimeout(pause)}
 await p.evaluate(()=>{view.evo=null;tab='dia';render();scrollTo(0,0)});
 mark('portada');await full(`<div style="font:800 46px/1 ${KG};color:#ff9a3d">Ascenso</div><div style="font-size:30px;font-weight:800;line-height:1.2">Agrega a tu kinesiólogo<br>en 30 segundos</div><div style="font-size:20px">Así <b>Esteban Rosset</b> puede seguir tu avance, ajustar tus ejercicios y avisarte si algo no va bien.</div><div style="color:#9aa6bf">Kinesiología RECUPERA</div>`);await w(5000);
 mark('A');await full(`<div style="font-size:15px;letter-spacing:.12em;color:#ff9a3d;font-weight:700">FORMA 1 · CON EL LINK</div><div style="font-size:27px;font-weight:800;line-height:1.2">Abre el link que te envió Esteban</div><div style="font-size:19px">Entra con tu cuenta de Ascenso, como siempre.</div>`);await w(3800);await full(null);
 await cap('En <b>Mi día</b> aparece esta tarjeta.');await w(3200);
 await cap('Lee qué verá tu kinesiólogo. <b>No ve tu bitácora ni tus pagos.</b>');await w(3500);
 await cap('Marca la casilla de autorización…');await tapP(p,'#kOk',1400);
 await cap('…y toca <b>«Compartir con mi kinesiólogo»</b>.');await w(900);await tapP(p,'[data-act=kineYes]',2200);
 await cap('¡Listo! Esteban ya puede ver tu avance. ✅');await w(3200);await cap(null);
 await ctx.close();
 const ctx2=await ctxFor({fn:({st})=>{if(sessionStorage.getItem('init'))return;sessionStorage.setItem('init','1');localStorage.clear();localStorage.setItem('stub.email','luis@ejemplo.cl');localStorage.setItem('stub.state.luis@ejemplo.cl',JSON.stringify({data:st,rev:5}))},arg:{st:mk('Luis',{kineAsked:1})}});
 const P=await ctx2.newPage();await P.goto('http://localhost:8992/');await P.waitForTimeout(1200);await P.evaluate(()=>{view.evo=null;tab='dia';render();scrollTo(0,0)});
 const w2=ms=>P.waitForTimeout(ms),cap2=t=>P.evaluate(t=>__ov.cap(t),t);
 mark('B');await P.evaluate(h=>__ov.full(h),`<div style="font-size:15px;letter-spacing:.12em;color:#ff9a3d;font-weight:700">FORMA 2 · SIN EL LINK</div><div style="font-size:27px;font-weight:800;line-height:1.2">¿No te aparece la tarjeta?</div><div style="font-size:19px">Hazlo desde la pestaña <b>Entreno</b>.</div>`);await w2(3500);await P.evaluate(()=>__ov.full(null));
 await cap2('Toca la pestaña <b>Entreno</b>.');await w2(1000);await tapP(P,'[data-act=tab][data-k=entreno]',1200);
 await cap2('Baja hasta <b>«Compartir mi avance con mi profesional»</b>.');await P.evaluate(()=>document.querySelector('#shareForm').scrollIntoView({behavior:'smooth',block:'center'}));await w2(2600);
 await cap2('Escribe el correo de Esteban: <b>kinerecupera@gmail.com</b>');await tapP(P,'#shEmail',200);await P.focus('#shEmail');for(const ch of 'kinerecupera@gmail.com'){await P.keyboard.type(ch);await w2(60)}await w2(900);
 await cap2('Marca la autorización y toca <b>«Compartir»</b>.');await tapP(P,'#shOk',900);await tapP(P,'#shareForm button[type=submit]',1500);
 await P.evaluate(()=>{const e=[...document.querySelectorAll('.card h3')].find(h=>/Compartir mi avance/.test(h.textContent));if(e)e.scrollIntoView({behavior:'smooth',block:'start'})});await cap2('¡Listo! Ahí queda Esteban, con la fecha desde que compartes. ✅');await w2(3800);
 await cap2('Si algún día quieres dejar de compartir, toca <b>«Dejar de compartir»</b>. Tú decides.');await w2(4000);await cap2(null);
 mark('fin');await P.evaluate(h=>__ov.full(h),`<div style="font:800 46px/1 ${KG};color:#ff9a3d">Ascenso</div><div style="font-size:26px;font-weight:800;line-height:1.25">Gracias. Ahora puedo acompañarte en tu avance.</div><div style="font-size:19px">Klgo. Esteban Rosset<br>Kinesiología RECUPERA</div><div style="color:#9aa6bf;font-size:16px">¿Dudas? Escríbeme por WhatsApp.</div>`);await w2(4500);
 await ctx2.close();await b.close();srv.close();fs.writeFileSync('video52/marks.json',JSON.stringify(log,null,1));console.log(JSON.stringify(log))})().catch(e=>{console.error(e);process.exit(1)});
