const {chromium}=require('playwright');const fs=require('fs');
const URL='file:///mnt/user-data/outputs/Ascenso_validar_buscador_v3.html';let fails=0;
const ok=(n,c,x)=>{console.log((c?'OK  ':'FAIL')+' '+n+(c?'':' :: '+JSON.stringify(x)));if(!c)fails++};
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:400,height:850},permissions:['clipboard-read','clipboard-write']});
// 7. migración desde v2
const p0=await ctx.newPage();await p0.goto(URL);await p0.evaluate(()=>{localStorage.clear();localStorage.setItem('validar_buscador_1811',JSON.stringify({v:2,conf:true,firma:'X',dx:{menisco:{note:'nota menisco v2',dec:'ok'},cervicalgia:{note:'nota cervical',dec:'ok'}}}))});await p0.close();
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(URL);await p.waitForTimeout(500);
const q=async t=>{await p.fill('#q',t);await p.waitForTimeout(60);return p.evaluate(()=>{const r=document.querySelector('#res');return{title:(r.querySelector('p b')||{}).textContent||'',pick:[...r.querySelectorAll('button[data-pick]')].map(x=>x.dataset.pick),grp:[...r.querySelectorAll('.grp')].map(g=>g.textContent),fi:[...r.querySelectorAll('.fi')].length}})};
// página 1
for(const t of['sin fractura vertebral','artroscopia de rodilla','rotura de LCA','prótesis parcial de cadera','fractura de mano','fractura por fragilidad']){const r=await q(t);ok(`«${t}» no abre pauta`,r.fi===0&&!r.grp.length,r)}
for(const [t,id] of [['osteoporosis sin fractura reciente','Osteoporosis'],['fractura vertebral reciente','Fractura vertebral'],['lesion meniscal','Lesión meniscal'],['meniscectomia','Posmeniscectomía'],['sutura meniscal','Reparación meniscal']]){const r=await q(t);ok(`«${t}» abre ${id}`,r.title.startsWith(id)&&r.fi>0,r.title)}
for(const t of['mareo','dolor de rodilla','silla de ruedas','menisco','cervicobraquealgia']){const r=await q(t);ok(`«${t}» pide elegir`,r.pick.length>0&&r.fi===0,r)}
// 1. exclusión
let r=await q('fractura vertebral reciente');const exInd=await p.evaluate(()=>[...document.querySelectorAll('#res .fi')].filter(f=>!f.closest('details')).map(f=>f.querySelector('.nm').textContent));
ok('extensión torácica fuera de las opciones',!exInd.includes('Extensión de espalda alta en la silla'),exInd);
ok('extensión torácica en excluidas con motivo',await p.evaluate(()=>[...document.querySelectorAll('#res details .fi')].some(f=>/Extensión de espalda alta/.test(f.textContent)&&/fractura vertebral reciente/.test(f.textContent))));
await p.fill('#q','');await p.click('details.dx[data-id="fx_vertebral"]>summary');
ok('sin selector para la excluida',await p.evaluate(()=>!document.querySelector('details.dx[data-id="fx_vertebral"] select[data-f="tor_extension_silla"]')&&![...document.querySelectorAll('details.dx[data-id="fx_vertebral"] select[data-add] option')].some(o=>o.value==='tor_extension_silla')));
ok('estado forzado no la reasigna',await p.evaluate(()=>{const d=DX.find(x=>x.id==='fx_vertebral');st(d).ov={tor_extension_silla:'a'};const m=cur(d);delete st(d).ov;return!m.tor_extension_silla}));
// 2. condición sobrevive al cambio de etapa
await p.click('details.dx[data-id="sutura_meniscal"]>summary');
for(const g of['p','e','a']){await p.selectOption('details.dx[data-id="sutura_meniscal"] select[data-f="res_calibrar_carga"]',g);const t=await p.evaluate(()=>[...document.querySelectorAll('details.dx[data-id="sutura_meniscal"] .fi')].find(f=>/Carga parcial con balanza|balanza/i.test(f.querySelector('.nm').textContent)).textContent);ok(`balanza en ${g} conserva la condición`,/orden de carga parcial/.test(t),t.slice(0,120))}
// 3. orden de carga
await p.fill('#q','sutura meniscal');await p.waitForTimeout(60);
const offered=async()=>p.evaluate(()=>{const out={};let g='';for(const el of document.querySelectorAll('#res .grp,#res .fi')){if(el.classList.contains('grp')){g=el.textContent.split(' (')[0];continue}if(el.closest('details'))continue;out[el.querySelector('.nm').textContent]=g+'|'+((el.querySelector('.st')||{}).textContent||'')}return out});
let o=await offered();ok('sin orden: condicionadas requieren confirmar',/Requiere confirmar/.test(o['Puente de glúteos en la cama']||''),o['Puente de glúteos en la cama']);
await p.click('#res button[data-load="sutura_meniscal|descarga"]');o=await offered();
ok('descarga: puente no compatible',/^No compatibles/.test(o['Puente de glúteos en la cama']||''),o['Puente de glúteos en la cama']);ok('descarga: un pie no compatible',Object.entries(o).some(([k,v])=>/un pie/i.test(k)&&/^No compatibles/.test(v)),o);ok('descarga: balanza no compatible',Object.entries(o).some(([k,v])=>/balanza|carga/i.test(k)&&/^No compatibles/.test(v)));
await p.click('#res button[data-load="sutura_meniscal|parcial"]');o=await offered();
ok('parcial: puente compatible',/Compatible/.test(o['Puente de glúteos en la cama']||''),o['Puente de glúteos en la cama']);ok('parcial: un pie sigue no compatible',Object.entries(o).some(([k,v])=>/un pie/i.test(k)&&/^No compatibles/.test(v)),o);
// condición sin carga: confirmación de 3 estados
r=await q('encamado');await p.evaluate(()=>{});const cf=await p.$('#res button[data-cf^="encamado|sc_press_pecho|no"]');ok('press de pecho tiene confirmación',!!cf);await cf.click();o=await offered();ok('no se cumple → no compatible',Object.entries(o).some(([k,v])=>/Empuje de pecho/i.test(k)&&/^No compatibles/.test(v)),o);
// 4. filtro de etapa
await p.click('#stg button[data-s="e"]');r=await q('sutura meniscal');ok('estable no muestra aguda',!r.grp.some(g=>/Irritable/.test(g))&&r.grp.some(g=>/Estable/.test(g)),r.grp);await p.click('#stg button[data-s=""]');
// 5. editar invalida
await p.fill('#q','');await p.click('details.dx[data-id="cervicalgia"]>summary');await p.click('details.dx[data-id="cervicalgia"] button[data-dec="ok"]');
await p.fill('#firma','Klgo. Prueba');await p.check('#conf');
await p.fill('details.dx[data-id="cervicalgia"] textarea[data-k="syn"]','cervicalgia, torticolis');await p.waitForTimeout(50);
ok('editar sinónimos deja pendiente y retira confirmación',await p.evaluate(()=>!S.dx.cervicalgia.dec&&!S.conf&&!document.getElementById('conf').checked));
await p.click('details.dx[data-id="cervicalgia"] button[data-dec="ok"]');await p.check('#conf');await p.selectOption('details.dx[data-id="cervicalgia"] select[data-f="tor_libro"]','x');
ok('cambiar etapa deja pendiente y retira confirmación',await p.evaluate(()=>!S.dx.cervicalgia.dec&&!S.conf));
await p.click('details.dx[data-id="whiplash"]>summary');await p.click('details.dx[data-id="whiplash"] button[data-dec="no"]');r=await q('latigazo');
ok('rechazado se rotula en el buscador',await p.evaluate(()=>/rechazado/i.test(document.querySelector('#res').textContent)));
// 7. migración y firma
ok('nota v2 de menisco visible en las 3 entradas',await p.evaluate(()=>{const n=[];for(const id of['menisco_conservador','meniscectomia','sutura_meniscal']){document.querySelector(`details.dx[data-id="${id}"]`).open=true}return true})&&await p.evaluate(()=>{return ['menisco_conservador','meniscectomia','sutura_meniscal'].every(id=>card(DX.find(d=>d.id===id)).includes('nota menisco v2'))}));
ok('nota de cervicalgia importada',await p.evaluate(()=>S.dx.cervicalgia.note==='nota cervical'));
await p.fill('#q','');await p.click('#flt button[data-f="m"]');ok('«con cambios» incluye nota sola',await p.evaluate(()=>!!document.querySelector('details.dx[data-id="cervicalgia"]')));await p.click('#flt button[data-f=""]');
await p.fill('#firma','');ok('sin nombre no hay confirmación',await p.evaluate(()=>document.getElementById('conf').disabled&&!S.conf));
// 6. copia literal
const NOTE='Prueba $& $1 $$ "comillas" ñandú\nsegunda línea </script> fin';
await p.fill('#firma','Klgo. Prueba');await p.check('#conf');
await p.click('details.dx[data-id="ptc"]>summary');await p.fill('details.dx[data-id="ptc"] textarea[data-k="note"]',NOTE);await p.fill('#gral','general $& ü');
const before=await p.evaluate(()=>JSON.stringify({dx:S.dx,f:S.firma,g:S.gral,c:S.conf}));
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#save')]);const path='/tmp/'+dl.suggestedFilename();fs.copyFileSync(await dl.path(),path);console.log('copia',dl.suggestedFilename(),fs.statSync(path).size>>10,'KB');
const ctx2=await b.newContext({viewport:{width:400,height:850}});const p2=await ctx2.newPage();p2.on('pageerror',e=>errs.push('p2 '+e.message));await p2.goto('file://'+path);await p2.waitForTimeout(500);
const after=await p2.evaluate(()=>JSON.stringify({dx:S.dx,f:S.firma,g:S.gral,c:S.conf}));ok('copia reabierta: todos los campos iguales',after===before,{before:before.length,after:after.length});
ok('nota literal con $&, tildes y salto de línea',await p2.evaluate(n=>S.dx.ptc.note===n,NOTE));
await p2.fill('#gral','editado en la copia');await p2.reload();await p2.waitForTimeout(400);ok('edición en la copia sobrevive a recargar',await p2.evaluate(()=>S.gral==='editado en la copia'));
ok('la copia usa su propia clave',await p2.evaluate(()=>KEY!=='vb3_v3_orig'&&!!localStorage.getItem(KEY)));
await p.reload();await p.waitForTimeout(400);ok('el original no se pisa con la copia',await p.evaluate(()=>S.gral==='general $& ü'));
await p.click('#copy');const clip=await p.evaluate(()=>navigator.clipboard.readText());ok('resumen con versión, historial y nota literal',/v3 · 19-11-2026/.test(clip)&&/Historial/.test(clip)&&clip.includes('$&'),clip.slice(0,300));
console.log(clip.split('\n').slice(0,4).join('\n'));
ok('sin errores de página',!errs.length,errs);console.log(fails?`\n${fails} FALLAS`:'\nTODO OK');await b.close()})();
