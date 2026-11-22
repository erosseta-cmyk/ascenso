const {serve}=require('./lib');const {chromium}=require('playwright');const F=require('./fixtures');const zlib=require('zlib');
(async()=>{const srv=await serve(8996);const b=await chromium.launch();const res=[];
 for(const run of [1,2,3]){const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(({st,mine})=>{localStorage.clear();localStorage.setItem('stub.email','r@x.cl');localStorage.setItem('stub.state.r@x.cl',JSON.stringify({data:st,rev:5}));localStorage.setItem('stub.mine.r@x.cl',JSON.stringify(mine))},{st:F.B,mine:[{email:"k@x.cl",since:"2026-10-01",rx:[{ex:"hom_re_toalla",name:"",dose:"2×10",note:""},{ex:"fz_silla",name:"",dose:"2×8",note:""},{ex:"mmii_puente_cama",name:"",dose:"2×10",note:""}],rxAt:"2026-11-08",id:7,clear:[]}]});
 const p=await ctx.newPage();const cdp=await ctx.newCDPSession(p);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 let bytes=0;cdp.on('Network.loadingFinished',e=>bytes+=e.encodedDataLength);
 const t0=Date.now();await p.goto('http://localhost:8996/',{waitUntil:'domcontentloaded'});const dcl=Date.now()-t0;
 await p.waitForFunction(()=>document.querySelector('#main')&&document.querySelector('#main').innerText.length>40,{timeout:60000});const first=Date.now()-t0;
 await p.waitForFunction(()=>document.querySelector('.rxgo,[data-act=rxStart],[data-act=simpleOn]'),{timeout:60000}).catch(()=>{});const usable=Date.now()-t0;await p.waitForTimeout(2500);
 // foco tras interacción
 const focus=await p.evaluate(()=>{const bt=document.querySelector('#tabs button:nth-child(2)');bt.focus();bt.click();return document.activeElement?document.activeElement.tagName+(document.activeElement.id?'#'+document.activeElement.id:''):'none'});
 res.push({dcl,first,usable,kb:Math.round(bytes/1024),focus});await ctx.close()}
 console.log(JSON.stringify(res));await b.close();srv.close()})();
