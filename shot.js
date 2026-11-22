const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),'/usr/lib/node_modules','/usr/local/lib/node_modules']}));const http=require('http'),fs=require('fs'),path=require('path');
const srv=http.createServer((q,r)=>{const f=path.join('/home/claude/review',decodeURIComponent(q.url.split('?')[0])==='/'?'index.html':decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'image/jpeg'});r.end(d)})}).listen(8777,async()=>{
const b=await chromium.launch();const p=await b.newPage({viewport:{width:430,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8777/');await p.waitForTimeout(800);
await p.click('.cell[data-id="lum_bicho_muerto_f"] .y');await p.click('.cell[data-id="lum_bicho_muerto_m"] .n');await p.fill('.cell[data-id="lum_bicho_muerto_m"] textarea','brazo raro');
await p.click('#copy');await p.waitForTimeout(300);console.log(await p.textContent('#out'));console.log('cards',await p.$$eval('.card',x=>x.length),'errs',errs);
await p.screenshot({path:'/tmp/rev.png'});await b.close();srv.close()});
