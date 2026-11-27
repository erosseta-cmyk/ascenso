const {serve,open,ok}=require('./lib');const F=require('./fixtures');const L=require('./lib');
(async()=>{const port=8911;const srv=await serve(port);
// C: paciente con pauta
let {b,p,errs}=await open(port,{email:"c@x.cl",state:F.C,mine:F.mineC});
let t=await p.innerText('#main');let h=await p.innerText('header').catch(()=>"");
ok('C sin "Nivel" en la cabecera',!/Nivel \d/.test(await p.evaluate(()=>document.body.innerText)),h);
ok('C botón Seguir',/Seguir \(\d de 3\)|Empezar|Ver el siguiente ejercicio|Ver el último ejercicio/.test(t),t.slice(0,300));
ok('C sin chips de contadores',!(await p.$('#main .chips')));
ok('C héroe compacto',!!(await p.$('#main .hero.mini')));
await p.screenshot({path:'shots/v43_C_dia.png',fullPage:true});
await p.click('#main [data-act=rxStart]');await p.waitForTimeout(500);
ok('Empezar abre el primero pendiente',await p.evaluate(()=>view.rxh!==null&&!rxIsDone(rxKey(rxAll()[view.rxh]))));
await p.screenshot({path:'shots/v43_C_empezar.png'});
const ux=await p.evaluate(()=>JSON.parse(localStorage.getItem('stub.ux')||'{}'));ok('conteos anónimos',ux.open===1&&ux.open_rx===1&&ux.rx_start===1,ux);
const before=await p.evaluate(()=>JSON.stringify([totalXP(),S.train.stage,Object.keys(S.rxDone).length]));
await p.evaluate(()=>{tab='entreno';render()});await p.waitForTimeout(300);t=await p.innerText('#main');ok('C Entreno sin pregunta de edad',!t.includes('rango de edad'));
ok('C datos intactos',before===await p.evaluate(()=>JSON.stringify([totalXP(),S.train.stage,Object.keys(S.rxDone).length])));
ok('C sin errores',!errs.length,errs);await b.close();
// B: usuario con plan, etapa 2 escalón 1
({b,p,errs}=await open(port,{email:"b@x.cl",state:F.B}));
t=await p.innerText('#main');h=await p.evaluate(()=>document.getElementById('whoLevel').textContent);
ok('B cabecera etapa y escalón',h==='Etapa 2 de 6 · escalón 1',h);
ok('B barra de etapa',t.includes('Etapa 2 de 6 · escalón 1 de 3')&&/faltan? .* para la etapa 3|Ya puedes pasar/.test(t),t.slice(0,500));
ok('B mantiene contadores',!!(await p.$('#main .chips')));
ok('B personaje sin número',!t.includes('de 16'));
await p.screenshot({path:'shots/v43_B_dia.png',fullPage:true});
await p.evaluate(()=>{tab='entreno';render()});await p.waitForTimeout(300);t=await p.innerText('#main');ok('B Entreno dice escalón',t.includes('escalón 1 de 3')&&!/\bpaso 1\b/.test(t),t.match(/Etapa[^\n]*/));
await p.evaluate(()=>{tab='evolucion';render()});await p.waitForTimeout(300);t=await p.innerText('#main');ok('B Evolución sin "Nivel N"',!/Nivel \d/.test(t)&&t.includes('Por descubrir'),t.slice(0,400));
await p.evaluate(()=>{window.progression=()=>({state:"keep",n:1});window.stepReady=()=>true;tab='dia';render()});await p.waitForTimeout(300);t=await p.innerText('#main');ok('B tarjeta subir escalón',t.includes('Subir un escalón')||/Aplicar aumento desde (hoy|mi próxima sesión de fuerza)/.test(t),t.slice(0,300));/* texto aprobado en la ronda B2/B3 */
ok('B sin errores',!errs.length,errs);await b.close();
// A: usuario nuevo sin edad
({b,p,errs}=await open(port,{email:"a@x.cl",state:F.A}));
t=await p.evaluate(()=>document.querySelector('#main').textContent);{const known=await p.evaluate(()=>typeof ageKnown==='function'&&ageKnown()!=null);ok('A pregunta edad con Ahora no (Ola 1 B1: sin pregunta si ya hay año de nacimiento)',known?!t.includes('rango de edad'):(t.includes('rango de edad')&&t.includes('Ahora no')));}
await p.screenshot({path:'shots/v43_A_dia.png',fullPage:true});
await p.click('#main [data-act=ageNo]');await p.waitForTimeout(300);
ok('A Ahora no la oculta',!(await p.innerText('#main')).includes('rango de edad'));
await p.reload();await p.waitForTimeout(1500);ok('A no vuelve tras recargar',!(await p.innerText('#main')).includes('rango de edad'));
const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('stub.state.a@x.cl')).data);ok('A guarda ageNo sin tocar formato',st.v===1&&!!st.ui.ageNo&&!st.profile.ageR,st.ui);
await p.evaluate(()=>{tab='ajustes';render()});await p.waitForTimeout(200);
ok('A sin errores',!errs.length,errs);await b.close();
console.log('FALLAS',L.fails);srv.close()})();
