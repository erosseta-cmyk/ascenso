// Selector de mes: Septiembre, Noviembre y Diciembre completos a 360/390, letra normal y grande, en Completa tus datos, bienvenida y Ajustes.
const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));const fs=require('fs');const OUT=process.env.OUT;
const R=[];const ok2=(n,c,x)=>{R.push({n,ok:!!c});ok(n,c,x)};
(async()=>{const srv=await serve(9011);
 for(const w of [360,390])for(const big of [0,1])for(const where of ['pg','ob','pf']){const n=`[${where==='pg'?'Completa tus datos':where==='ob'?'Bienvenida':'Ajustes'} ${w}${big?' grande':''}]`;
  const st=where==='ob'?J(F.A):J(F.B);if(where==='pg')delete st.profile.birthM;st.ui=Object.assign(st.ui||{},{big:!!big});
  const {b,p,errs}=await open(9011,{email:where==='ob'?'nueva@prueba.cl':'rosa@prueba.cl',state:st,width:w,clock:'2026-11-26T12:00:00-03:00'});
  await p.evaluate(([where,big])=>{view.evo=null;S.seenStage=99;S.ui.big=!!big;if(where==='ob')S.onboard=null;tab=where==='pf'?'ajustes':'dia';render()},[where,big]);
  for(const m of [9,11,12]){const r=await p.evaluate(([pre,m])=>{const s=document.getElementById(pre+'M');s.value=String(m);const cs=getComputedStyle(s),c=document.createElement('canvas').getContext('2d');c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;const tw=c.measureText(s.options[s.selectedIndex].text).width;const pad=parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight);const y=document.getElementById(pre+'Y').getBoundingClientRect(),sr=s.getBoundingClientRect();return{txt:s.options[s.selectedIndex].text,w:s.clientWidth,need:Math.ceil(tw+pad+20),sw:document.documentElement.scrollWidth,vw:innerWidth,yw:Math.round(y.width),apilado:sr.top>y.bottom-2}},[where,m]);
   ok2(`${n} «${r.txt}» se lee completo (ancho ${r.w} ≥ ${r.need})`,r.w>=r.need&&r.sw<=r.vw,r);
   if(OUT&&m===9&&where==='pg'){await p.evaluate(()=>{const g=document.querySelector('#profGate');g.scrollIntoView()});}
   if(OUT&&where==='pg'){await p.evaluate(()=>document.querySelector('#profGate').scrollIntoView());await p.screenshot({path:`${OUT}/mes_${w}_${big?'grande':'normal'}_${m}.png`,clip:await p.evaluate(()=>{const r=document.querySelector('#profGate').getBoundingClientRect();return{x:0,y:Math.max(0,r.top),width:innerWidth,height:Math.min(760,innerHeight)}})})}}
  ok2(`${n} sin errores`,!errs.length,errs);await b.close()}
 const f=R.filter(x=>!x.ok).length;console.log(`\n${R.length-f}/${R.length} OK`);srv.close();process.exit(f?1:0)})();
