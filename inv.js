const {serve,open}=require('./lib');const F=require('./fixtures');
(async()=>{const srv=await serve(8920);const {b,p}=await open(8920,{email:"b@x.cl",state:F.B});
const inv=await p.evaluate(()=>{const out=[];const fs=n=>n;
 for(const id of Object.keys(EX)){const e=EX[id];const imgs=[];if(EXIMG.includes(id))imgs.push(`ex/${id}.jpg`);for(const g of["f","m"])if(SIMG.includes(id))imgs.push(`ex/s_${id}_${g}.jpg`);out.push({kind:"EX",id,n:e.n,how:e.how,desc:e.desc||"",imgs,anim:!!e.anim})}
 for(const id of Object.keys(LIB)){const e=LIB[id];const imgs=[];for(const s of["f","m","f_y","m_y"])if(LIBIMG.includes(id+"_"+s))imgs.push(`ex/lib_${id}_${s}.jpg`);out.push({kind:"LIB",id,n:e.n,how:e.how,desc:e.desc||"",imgs})}
 return out});
require('fs').writeFileSync('inv.json',JSON.stringify(inv,null,1));
const c=inv.reduce((a,x)=>(a[x.kind]=(a[x.kind]||0)+1,a.img+=x.imgs.length,a.none+=x.imgs.length?0:1,a),{img:0,none:0});console.log(c);
await b.close();srv.close()})();
