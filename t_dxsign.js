const {serve,open,ok}=require('./lib');const F=require('./fixtures');
(async()=>{const srv=await serve(8993);
const pts=[{id:7,email:"d@x.cl",name:"Paciente D",since:"2026-10-01",stage:2,parq:Array(10).fill(false),parqKey:"x",clear:[],hold:null,rx:[],rxVersions:0,sessions:[],done:{},rxDone:{},loads:{}}];
let {b,p,errs}=await open(8993,{email:"kine@x.cl",state:F.B,pro:pts});
await p.evaluate(()=>{view.evo=null;S.seenStage=99;tab='pacientes';render()});await p.waitForTimeout(300);await p.click('[data-act="rxOpen"][data-id="7"]');
await p.evaluate(()=>{document.getElementById('dxBox').open=true});
ok('lista de revisión 0 de 45',await p.evaluate(()=>/0 de 45 validadas/.test(document.getElementById('dxBox').innerText)));
await p.check('#dxBox input[data-act="dxTestMark"]');await p.fill('#dxQ','sutura meniscal');let t=await p.innerText('#dxRes');ok('borrador rotulado',/borrador/.test(t)&&/no aprobado para uso con pacientes/.test(t));
const st=await p.evaluate(()=>{const c=getComputedStyle([...document.querySelectorAll('#dxRes p')].find(x=>/Antes de elegir/.test(x.textContent)));return [c.color,c.backgroundColor]});ok('requisito legible en tema oscuro',st[0]!==st[1]&&!/255, 255, 255|238, 243, 251/.test(st[1]),st);
// agregar desde borrador pide doble toque
await p.click('#dxRes [data-act="dxLoad"][data-v="parcial"]');await p.check('#dxRes input[data-k="tob_bombeo"]');await p.click('#dxRes [data-act="dxAddSel"]');
ok('borrador: primer toque no agrega',await p.evaluate(()=>SH.rxDraft.length===0));await p.click('#dxRes [data-act="dxAddSel"]');ok('segundo toque agrega',await p.evaluate(()=>SH.rxDraft.length===1));
// firma
await p.fill('#dxBy','Klg');await p.click('#dxRes [data-act="dxSign"][data-ok="1"]');ok('firma exige nombre',await p.evaluate(()=>!dxSigned(DXB.DX.find(d=>d.id==="sutura_meniscal"))));
await p.check('#dxRes input[data-k="otr_cuadriceps"]');ok('nombre escrito se conserva al marcar',await p.inputValue('#dxBy')==='Klg');
await p.fill('#dxBy','Klgo. Esteban Rosset');await p.click('#dxRes [data-act="dxSign"][data-ok="1"]');await p.waitForTimeout(300);
t=await p.innerText('#dxRes');ok('firmada: muestra validada y por quién',/validada/.test(t)&&/validada por Klgo\. Esteban Rosset/.test(t),t.slice(0,200));
ok('item con huella del contenido',await p.evaluate(()=>/^dx_sutura_meniscal_[a-z0-9]{1,6}$/.test(dxItem(DXB.DX.find(d=>d.id==="sutura_meniscal")))));
ok('lista 1 de 45',await p.evaluate(()=>/1 de 45 validadas/.test(document.getElementById('dxBox').innerText)));
await p.check('#dxRes input[data-k="otr_pierna_estirada"]');await p.click('#dxRes [data-act="dxAddSel"]');ok('validada agrega con un toque',await p.evaluate(()=>SH.rxDraft.some(x=>x.ex==="otr_pierna_estirada")));
ok('si cambia el contenido la firma deja de valer',await p.evaluate(()=>{const d=DXB.DX.find(d=>d.id==="sutura_meniscal");const old=JSON.stringify(d.a);d.a=d.a.concat(["eq_escalon"]);const v=!dxSigned(d);d.a=JSON.parse(old);return v&&!!dxSigned(d)}));
await p.click('#dxRes [data-act="dxSign"][data-ok="0"]');await p.waitForTimeout(300);ok('retirar validación',await p.evaluate(()=>!dxSigned(DXB.DX.find(d=>d.id==="sutura_meniscal"))));
await p.evaluate(()=>{document.querySelector('#dxBox details').open=true});await p.click('[data-act="dxOpenEntry"][data-d="fx_vertebral"]');ok('abrir entrada desde la lista',/Fractura vertebral reciente/.test(await p.innerText('#dxRes')));
ok('sin errores',!errs.length,errs);await b.close();srv.close()})();
