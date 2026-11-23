const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');const {ok}=require('./lib');
const ROOT=process.env.BROOT;
const srv=http.createServer((q,res)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';
 if(u==='/ascenso/supabase.js'){res.writeHead(200,{'content-type':'text/javascript'});return res.end(fs.readFileSync(__dirname+'/stub.js'))}
 const f=path.join(ROOT,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end()}const ext=path.extname(f).slice(1);res.writeHead(200,{'content-type':{html:'text/html',js:'text/javascript',jpg:'image/jpeg',png:'image/png',json:'application/json'}[ext]||'application/octet-stream'});res.end(fs.readFileSync(f))}).listen(8995);
(async()=>{const F=require('./fixtures');const b=await chromium.launch();
 const run=async(pre,url)=>{const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.addInitScript(pre);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8995'+url);await p.waitForTimeout(1500);return{ctx,p,errs}};
 // sesión real existente en la app de pacientes (sin prefijo)
 const real=(st)=>`if(!sessionStorage.getItem('i')){sessionStorage.setItem('i','1');localStorage.clear();localStorage.setItem('stub.email','ana@x.cl');localStorage.setItem('stub.state.ana@x.cl',${JSON.stringify(JSON.stringify(st))});}`;
 let {ctx,p,errs}=await run(real(F.B),'/ascenso/beta/');
 let r=await p.evaluate(()=>({bar:/COPIA DE PRUEBA/.test(document.body.innerText),beta:window.__BETA===true,logged:!!(typeof session!=='undefined'&&session),man:!!document.querySelector('link[rel=manifest]'),title:document.title,img:[...document.images].filter(i=>i.complete&&i.naturalWidth>0).length}));
 ok('beta muestra el aviso rojo',r.bar,r);ok('beta no hereda la sesión real del navegador',!r.logged,r);ok('beta no se puede instalar (sin manifest)',!r.man);ok('título de prueba',/COPIA DE PRUEBA/.test(r.title));
 r=await p.evaluate(()=>{localStorage.setItem('ascenso.prueba','1');const raw=[];for(let i=0;i<window.localStorage.length;i++)raw.push(Storage.prototype.key.call(window.localStorage,i));return raw});
 ok('lo que guarda beta queda con prefijo beta::',r.includes('beta::ascenso.prueba')&&!r.includes('ascenso.prueba'),r);
 r=await p.evaluate(async()=>navigator.serviceWorker?(await navigator.serviceWorker.getRegistrations()).length:0);ok('beta no registra service worker',r===0,r);
 ok('sin errores beta',!errs.length,errs);await ctx.close();
 // cuenta no autorizada intentando entrar en beta
 ({ctx,p,errs}=await run(`if(!sessionStorage.getItem('i')){sessionStorage.setItem('i','1');localStorage.clear();localStorage.setItem('beta::stub.email','ana@x.cl');localStorage.setItem('beta::stub.state.ana@x.cl',${JSON.stringify(JSON.stringify(F.B))});}`,'/ascenso/beta/'));
 r=await p.evaluate(()=>({logged:!!(typeof session!=='undefined'&&session),msg:document.body.innerText.includes('solo acepta cuentas de prueba autorizadas')}));
 ok('beta rechaza cuentas no autorizadas',!r.logged,r);await ctx.close();
 // app real intacta
 ({ctx,p,errs}=await run(real(F.B),'/ascenso/'));
 r=await p.evaluate(()=>({bar:/COPIA DE PRUEBA/.test(document.body.innerText),logged:!!(typeof session!=='undefined'&&session),beta:!!window.__BETA}));
 ok('app real sin aviso de prueba y con su sesión',!r.bar&&!r.beta&&r.logged,r);ok('sin errores app real',!errs.length,errs);
 await b.close();srv.close();process.exit(require('./lib').fails?1:0)})();
