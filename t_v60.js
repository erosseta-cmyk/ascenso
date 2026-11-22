const {serve,open,ok}=require('./lib');const F=require('./fixtures');const J=o=>JSON.parse(JSON.stringify(o));
(async()=>{const srv=await serve(8989);
let {b,p,errs}=await open(8989,{email:'pac@x.cl',state:J(F.B)});
const r=await p.evaluate(async()=>{const out={};
 S.profile.route='aventurera';view.exStill=false;
 out.f=libImg('lum_bicho_muerto',{n:'Bicho muerto'});out.fa=libImg('ab_talones',{n:'Talones'});
 S.profile.route='otra';out.m=libImg('mmss_brazos',{n:'Brazos'});
 view.exStill=true;out.still=libImg('mmss_brazos',{n:'Brazos'});view.exStill=false;
 out.stat=libImg('ves_ojos_cerrados',{n:'Ojos'});
 const keys=Object.keys(LIBANIM);out.n=keys.length;const bad=[];
 for(const k of keys){const a=Array.isArray(LIBANIM[k]);for(const u of [`ex/lib_${k}${a?'_a':''}.jpg`,`ex/lib_${k}_b.jpg`]){const x=await fetch(u);if(!x.ok)bad.push(u);else{const bl=await x.blob();const im=await createImageBitmap(bl);(out.sz=out.sz||{})[u]=[im.width,im.height]}}}
 out.bad=bad;const mism=[];for(const k of keys){const a=Array.isArray(LIBANIM[k]);const A=out.sz[`ex/lib_${k}${a?'_a':''}.jpg`],B=out.sz[`ex/lib_${k}_b.jpg`];if(A&&B&&(A[0]!==B[0]||A[1]!==B[1]))mism.push(k+':'+A+'/'+B)}out.mism=mism;delete out.sz;return out});
ok('54 animaciones registradas',r.n===54,r.n);
ok('las 108 imágenes cargan',!r.bad.length,r.bad);
ok('A y B del mismo tamaño en las 54',!r.mism.length,r.mism);
ok('mujer → flip con frame B',/class="flip"/.test(r.f)&&/lib_lum_bicho_muerto_f_b\.jpg/.test(r.f)&&/animation-duration:4\.5s/.test(r.f));
ok('frame A recortado se usa cuando existe',/lib_ab_talones_f_a\.jpg/.test(r.fa)&&/lib_ab_talones_f_b\.jpg/.test(r.fa));
ok('hombre → imágenes _m',/lib_mmss_brazos_m\.jpg/.test(r.m)&&/lib_mmss_brazos_m_b\.jpg/.test(r.m));
ok('modo quieto → dos posiciones + botón',/grid-template-columns:1fr 1fr/.test(r.still)&&/Ver el movimiento/.test(r.still));
ok('ficha estática no anima',!/flip/.test(r.stat)&&/lib_ves_ojos_cerrados/.test(r.stat));
ok('sin errores',!errs.length,errs);await b.close();
// reduced motion
({b,p,errs}=await open(8989,{email:'pac@x.cl',state:J(F.B)}));
await p.emulateMedia({reducedMotion:'reduce'});
const vis=await p.evaluate(async()=>{S.profile.route='aventurera';const d=document.createElement('div');d.innerHTML=libImg('fz_curl',{n:'Curl'});document.body.appendChild(d);await new Promise(r=>setTimeout(r,300));return [getComputedStyle(d.querySelector('.flip')).display,getComputedStyle(d.querySelector('.still')).display]});
ok('movimiento reducido → imagen quieta',vis[0]==='none'&&vis[1]==='block',vis);
await b.close();srv.close()})();
