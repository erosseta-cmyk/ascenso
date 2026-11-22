const {serve,open}=require('./lib');const F=require('./fixtures');const iso=d=>new Date(Date.now()+d*864e5).toISOString();
(async()=>{const srv=await serve(8952);let {b,p}=await open(8952,{email:"b@x.cl",state:F.B,member:{active:true,status:"ACTIVO",expires_at:iso(4),pro:false,trial_used:true,server_now:iso(0)}});
console.log(await p.evaluate(()=>JSON.stringify({M,st:memberState(),mb:memberBanner0().slice(0,80),ls:localStorage.getItem('stub.member')})));await b.close();srv.close()})();
