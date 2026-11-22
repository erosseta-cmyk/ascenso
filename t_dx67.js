const {serve,open,ok}=require('./lib');const F=require('./fixtures');
(async()=>{const srv=await serve(8996);
const mk=(id,name)=>({id,email:name+"@x.cl",name,since:"2026-10-01",stage:2,parq:Array(10).fill(false),parqKey:"x",clear:[],hold:null,rx:[],rxVersions:0,sessions:[],done:{},rxDone:{},loads:{}});
let {b,p,errs}=await open(8996,{email:"kine@x.cl",state:F.B,pro:[mk(7,"Guerrero"),mk(8,"Real")]});
const go=async id=>{await p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='pacientes';SH.rxFor=null;SH.rxDraft=null;render()});await p.waitForTimeout(200);await p.click(`[data-act="rxOpen"][data-id="${id}"]`);await p.evaluate(()=>{document.getElementById('dxBox').open=true})};
const res=()=>p.innerText('#dxRes'),toastTxt=()=>p.evaluate(()=>document.getElementById('toast').textContent);
await go(7);
// 2. borradores solo con cuenta de prueba
await p.fill('#dxQ','sutura meniscal');await p.click('#dxRes [data-act="dxLoad"][data-v="parcial"]');await p.click('#dxRes [data-act="dxSideSet"][data-v="der"]');
await p.check('#dxRes input[data-k="tob_bombeo"]');await p.click('#dxRes [data-act="dxAddSel"]');await p.click('#dxRes [data-act="dxAddSel"]');
ok('borrador bloqueado si no es cuenta de prueba',await p.evaluate(()=>SH.rxDraft.length===0)&&/Solo se puede usar con una cuenta de prueba/.test(await toastTxt()));
await p.check('#dxBox input[data-act="dxTestMark"]');await p.check('#dxRes input[data-k="tob_bombeo"]');await p.click('#dxRes [data-act="dxAddSel"]');await p.click('#dxRes [data-act="dxAddSel"]');
ok('cuenta de prueba: borrador se agrega con doble toque',await p.evaluate(()=>SH.rxDraft.length===1));
// 1. lado y bloqueo al guardar en sutura
await p.check('#dxRes input[data-k="mmii_puente_cama"]');await p.click('#dxRes [data-act="dxAddSel"]');await p.click('#dxRes [data-act="dxAddSel"]');
ok('el lado queda en la indicación de la ficha con carga',await p.evaluate(()=>/derecho/.test((SH.rxDraft.find(x=>x.ex==="mmii_puente_cama")||{}).note||"")));
await p.evaluate(()=>{SH.rxDraft.push({ex:"eq_escalon",name:"",dose:"2×8",note:""});render()});
ok('banner avisa el escalón sin regla',/Subir y bajar un escalón: sin regla de carga revisada/.test(await p.evaluate(()=>document.getElementById('dxBox').innerText)));
await p.click('[data-act="rxSave"]');await p.waitForTimeout(300);ok('sutura: no se guarda con el escalón',await p.evaluate(()=>SH.rxFor===7)&&/No se guardó/.test(await toastTxt()));
await p.click('#dxRes [data-act="dxLoad"][data-v="descarga"]');await p.evaluate(()=>{SH.rxDraft=SH.rxDraft.filter(x=>x.ex!=="eq_escalon");render()});
ok('con descarga el puente ya agregado bloquea el guardado',/Puente de glúteos en la cama: No compatible|no compatible/i.test(await p.evaluate(()=>document.getElementById('dxBox').innerText)));
await p.evaluate(()=>{SH.rxDraft=SH.rxDraft.filter(x=>x.ex!=="mmii_puente_cama");render()});await p.click('[data-act="rxSave"]');await p.waitForTimeout(500);
ok('sin conflictos se guarda en la cuenta de prueba',await p.evaluate(()=>SH.rxFor===null));
// 1b. sin carga con lado y escalón manual (sin usar el buscador para agregar)
await go(7);await p.fill('#dxQ','sin carga');await p.click('#dxRes [data-act="dxSideSet"][data-v="izq"]');
await p.evaluate(()=>{SH.rxDraft.push({ex:"eq_escalon",name:"",dose:"2×8",note:""});render()});await p.click('[data-act="rxSave"]');await p.waitForTimeout(300);
ok('sin carga: escalón manual no se guarda',await p.evaluate(()=>SH.rxFor===7&&SH.rxDraft.some(x=>x.ex==="eq_escalon"))&&/No se guardó/.test(await toastTxt()));
const saved=await p.evaluate(()=>(SH.pro.find(x=>x.id===7).rx||[]).map(x=>x.ex));ok('el escalón no llega a la pauta guardada (Mi día)',!saved.includes('eq_escalon'),saved);
await p.click('#dxBox [data-act="dxCtxClear"]');ok('quitar el diagnóstico es explícito',!(await p.evaluate(()=>(SH.dxCtx||{})[7])));
// 2b. paciente real
await go(8);await p.fill('#dxQ','sutura meniscal');await p.click('#dxRes [data-act="dxLoad"][data-v="parcial"]');await p.click('#dxRes [data-act="dxSideSet"][data-v="der"]');
await p.check('#dxRes input[data-k="tob_bombeo"]');await p.click('#dxRes [data-act="dxAddSel"]');await p.click('#dxRes [data-act="dxAddSel"]');
ok('paciente real: el borrador no entra ni con doble toque',await p.evaluate(()=>SH.rxDraft.length===0));
ok('la marca de prueba es por persona',!(await p.isChecked('#dxBox input[data-act="dxTestMark"]')));
// 3. términos sin opción equivalente
for(const [t,id] of [['fractura de mano','fx_muneca'],['rotura de LCA','lca'],['protesis parcial de cadera','fx_cadera'],['amputacion','sin_carga']]){
 await p.fill('#dxQ',t);let r=await res();ok(`«${t}» ofrece «Ninguna corresponde»`,/Ninguna corresponde/.test(r),r.slice(0,200));
 await p.click(`#dxRes [data-act="dxPick"][data-d="${id}"]`);r=await res();ok(`«${t}» pide confirmar antes de mostrar ejercicios`,/¿Corresponde a/.test(r)&&!(await p.$('#dxRes input[data-act="dxTick"]')),r.slice(0,200))}
await p.click('#dxRes [data-act="dxPickOk"]');ok('al confirmar muestra la entrada',!!(await p.$('#dxRes input[data-act="dxTick"]')));
await p.fill('#dxQ','fractura de mano');await p.click('#dxRes [data-act="dxNone"]');ok('ninguna corresponde: no ofrece ejercicios',/No se ofrecen ejercicios/.test(await res())&&!(await p.$('#dxRes input[data-act="dxTick"]')));
ok('amputación ya no abre directo',await p.evaluate(()=>dxFind("amputacion").k==="pick"));
// 4. versión de la firma
await p.fill('#dxQ','esguince de tobillo');let r=await res();const ver=await p.evaluate(()=>dxHash(DXB.DX.find(x=>x.id==="esguince_tobillo")));ok('muestra versión de la entrada',!!ver,r.slice(-300));
await p.fill('#dxBy','Klgo. Prueba Uno');await p.click('#dxRes [data-act="dxSign"][data-ok="1"]');await p.waitForTimeout(300);r=await res();ok('firma registra la versión',new RegExp('Versión '+ver+' validada por Klgo. Prueba Uno').test(r),r.slice(-250));
await p.reload();await p.waitForTimeout(600);await go(8);await p.fill('#dxQ','esguince de tobillo');ok('al reabrir sigue validada',/✓ validada/.test(await res()));
ok('al editar una condición deja de estar vigente',await p.evaluate(()=>{const d=DXB.DX.find(x=>x.id==="esguince_tobillo");d.c=Object.assign({},d.c,{tob_banda:{t:"Nueva condición"}});return !dxSigned(d)}));
await p.evaluate(()=>render());ok('y se muestra como borrador',/borrador/.test(await res())&&!/✓ validada/.test(await res()));
ok('sin errores',!errs.length,errs);await b.close();srv.close()})();
