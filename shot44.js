const {serve,open}=require('./lib');const F=require('./fixtures');const iso=d=>new Date(Date.now()+d*864e5).toISOString();
(async()=>{const srv=await serve(8953);
let {b,p}=await open(8953,{email:"b@x.cl",state:F.B,member:{active:false,status:"VENCIDO",expires_at:iso(-3),pro:false,trial_used:true,server_now:iso(0)}});
await p.evaluate(()=>{view.evo=null;S.seenStage=99;render()});await p.waitForTimeout(300);await p.screenshot({path:'shots/v44_vencido.png'});await b.close();
const adm=[{email:"a@x.cl",status:"ACTIVO",expires_at:iso(20)},{email:"v1@x.cl",status:"VENCIDO",expires_at:iso(-5),wa_ok:true,phone:"+56911111111"},{email:"v2@x.cl",status:"VENCIDO",expires_at:iso(-1)},{email:"pv@x.cl",status:"ACTIVO",expires_at:iso(3),wa_ok:true,phone:"+56922222222"}];
({b,p}=await open(8953,{email:"kine@x.cl",state:F.B,adm}));
await p.evaluate(async()=>{const a=await sb.rpc("admin_list");ADM={list:a.data,audit:[],fb:[]};tab='planes';view.evo=null;S.seenStage=99;render()});await p.waitForTimeout(300);
const el=await p.$('.admchips');await el.scrollIntoViewIfNeeded();const bb=await el.boundingBox();await p.screenshot({path:'shots/v44_admin.png',clip:{x:0,y:bb.y+ (await p.evaluate(()=>scrollY)) -10,width:390,height:760},fullPage:true});await b.close();srv.close()})();
