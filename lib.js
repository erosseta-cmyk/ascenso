const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT=process.env.SITE;
function serve(port){return new Promise(r=>{const s=http.createServer((q,res)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/index.html';
 if(u==='/supabase.js'){res.writeHead(200,{'content-type':'text/javascript'});return res.end(fs.readFileSync(__dirname+'/stub.js'))}
 if(u==='/sw.js'){res.writeHead(404);return res.end()}
 const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){res.writeHead(404);return res.end()}
 const ext=path.extname(f).slice(1);res.writeHead(200,{'content-type':{html:'text/html',js:'text/javascript',jpg:'image/jpeg',png:'image/png',json:'application/json',webmanifest:'application/json'}[ext]||'application/octet-stream'});res.end(fs.readFileSync(f))}).listen(port,()=>r(s))})}
async function open(port,{email,state,mine,rv,pro,adm,ct,member,width=390,path='',clock}={}){const b=await chromium.launch();const ctx=await b.newContext({viewport:{width,height:844},deviceScaleFactor:1,timezoneId:'America/Santiago'});if(clock)await ctx.clock.install({time:new Date(clock)});
 await ctx.addInitScript(({email,state,mine,rv,pro,adm,ct,member})=>{if(sessionStorage.getItem('init'))return;sessionStorage.setItem('init','1');localStorage.clear();if(adm)localStorage.setItem('stub.adm',JSON.stringify(adm));if(ct)localStorage.setItem('stub.ct.'+email,JSON.stringify(ct));if(member)localStorage.setItem('stub.member',JSON.stringify(member));if(email)localStorage.setItem('stub.email',email);if(state)localStorage.setItem('stub.state.'+email,JSON.stringify({data:state,rev:5}));if(mine)localStorage.setItem('stub.mine.'+email,JSON.stringify(mine));if(rv)localStorage.setItem('stub.rv',JSON.stringify(rv));if(pro)localStorage.setItem('stub.pro',JSON.stringify(pro))},{email,state,mine,rv,pro,adm,ct,member});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon|bad HTTP response code \(404\)/.test(m.text()))errs.push(m.text())});
 await p.goto(`http://localhost:${port}/${path}`);await p.waitForTimeout(1500);return{b,p,errs}}
const RETIRADOS=[/menor detectado por la fecha/,/F03 pasa a la autorización del adulto/,/edad 15 entra \(con autorización pendiente\)/,/15 años queda pendiente del adulto/,/adulto ve «Autorizar a un menor de edad»/,/#14 Familia con las tres acciones/];
let fails=0;function ok(n,c,extra){if(!c&&RETIRADOS.some(r=>r.test(n))){console.log('RETIRADO (L1 solo adultos) '+n);return}console.log((c?'OK   ':'FAIL ')+n+(c||extra===undefined?'':' :: '+JSON.stringify(extra).slice(0,400)));if(!c)fails++}
module.exports={serve,open,ok,get fails(){return fails}};
