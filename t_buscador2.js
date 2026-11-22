const {chromium,firefox}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:400,height:850},offline:true,permissions:['clipboard-read','clipboard-write']});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///mnt/user-data/outputs/Ascenso_validar_buscador_v2.html');await p.waitForTimeout(800);
const q=async t=>{await p.fill('#q',t);await p.waitForTimeout(80);return p.evaluate(()=>{const b=document.querySelector('#res p b');const ch=[...document.querySelectorAll('#res button[data-pick]')].map(x=>x.textContent);return (b?b.textContent:'(nada)')+(ch.length?' → '+ch.join(' | '):'')})};
for(const t of ['fractura vertebral reciente','osteoporosis sin fractura reciente','osteoporosis','lesion meniscal','meniscectomia','sutura meniscal','menisco','mareo','dolor de rodilla','silla de ruedas','muletas','vertigo','rodilla','dolor rodilla','cervicobraquealgia','PTC','lumbago','dolor lumbar','vppb','neuritis vestibular','tunel carpiano'])console.log(t.padEnd(36),'→',await q(t));
const det=async t=>{await q(t);return p.evaluate(()=>({req:(document.querySelector('#res .req')||{}).textContent||'',grp:[...document.querySelectorAll('#res .grp')].map(g=>g.textContent),cnd:[...document.querySelectorAll('#res .cnd')].map(x=>x.closest('.fi').querySelector('.nm').textContent+' :: '+x.textContent),
 indic:[...document.querySelectorAll('#res .fi')].filter(f=>!f.querySelector('.why')).map(f=>f.querySelector('.nm').textContent)}))};
let r=await det('fractura vertebral reciente');console.log('\nFX VERTEBRAL',r.req,r.grp,'extension en indicadas?',r.indic.includes('Extensión de espalda alta en la silla'));
r=await det('osteoporosis sin fractura reciente');console.log('OSTEOPOROSIS extension indicada?',r.indic.includes('Extensión de espalda alta en la silla'));
r=await det('sutura meniscal');console.log('SUTURA',r.req,r.grp,r.cnd);
// orden: requisito antes que la primera ficha
console.log('req antes de fichas', await p.evaluate(()=>{const a=document.querySelector('#res .req'),f=document.querySelector('#res .fi');return !!(a&&f&&(a.compareDocumentPosition(f)&Node.DOCUMENT_POSITION_FOLLOWING))}));
for(const t of ['fractura de cadera','fractura de tobillo','rotura de aquiles','encamado','fractura de muneca']){r=await det(t);console.log(t,'|',r.cnd)}
r=await det('neuritis vestibular');console.log('HIPOFUNCION',r.indic.filter(x=>/Seguimiento|Brandt/.test(x)),r.grp);
await q('mareo');await p.click('#res button[data-pick="vppb"]');console.log('elige vppb →',await p.textContent('#res p b'));
// decisiones y copia
await p.fill('#q','');await p.click('#flt button[data-f="n"]');console.log('novedades',await p.$$eval('details.dx',a=>a.map(x=>x.dataset.id).join(',')));
await p.click('details.dx[data-id="fx_vertebral"]>summary');await p.click('details.dx[data-id="fx_vertebral"] button[data-dec="ok"]');
await p.click('details.dx[data-id="sutura_meniscal"]>summary');await p.selectOption('details.dx[data-id="sutura_meniscal"] select[data-f="fz_silla"]','p');await p.click('details.dx[data-id="sutura_meniscal"] button[data-dec="no"]');
await p.fill('#firma','Prueba v2');
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#save')]);require('fs').copyFileSync(await dl.path(),'/tmp/copia_v2.html');
console.log('stats',await p.textContent('#cnt2'));
const fb=await firefox.launch().catch(()=>null);const B2=fb||b;const p2=await (await B2.newContext({offline:true})).newPage();p2.on('pageerror',e=>errs.push('p2 '+e.message));
await p2.goto('file:///tmp/copia_v2.html');await p2.waitForTimeout(800);console.log('copia reabierta en',fb?'firefox':'chromium(otro contexto)',await p2.textContent('#cnt2'),await p2.inputValue('#firma'),'KB',require('fs').statSync('/tmp/copia_v2.html').size>>10);
await p.click('#copy');console.log((await p.evaluate(()=>navigator.clipboard.readText())).split('\n').slice(0,6).join('\n'));
console.log('errores',errs);await b.close();if(fb)await fb.close()})();
