/* Supabase falso para pruebas locales: todo vive en localStorage del navegador de prueba */
(function(){
const L=k=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}},W=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const em=()=>localStorage.getItem("stub.email");
const sess=()=>em()?{user:{id:"u_"+em().replace(/\W/g,"_"),email:em()},access_token:"x"}:null;
let cbs=[];
const now=()=>new Date().toISOString();
const isPro=()=>/^kine/.test(em()||"");
const H={
 get_state_v2:()=>{const d=L("stub.state."+em());return d?{data:d.data,rev:d.rev}:null},
 save_state_v2:({p_data,p_rev})=>{const d=L("stub.state."+em())||{rev:0};const rev=(d.rev||0)+1;W("stub.state."+em(),{data:p_data,rev});return{ok:true,rev}},
 my_membership:()=>L("stub.member")||({active:true,pro:isPro(),is_admin:isPro(),expires_at:isPro()?null:new Date(Date.now()+20*864e5).toISOString(),trial_used:true,server_now:now(),audit:[]}),
 share_mine:()=>L("stub.mine."+em())||[],
 share_grant:({p_email})=>{const l=L("stub.mine."+em())||[];if(l.length>=3)return{ok:false,msg:"Máximo 3"};if(!/^kine/.test(p_email))return{ok:false,msg:"Ese correo no corresponde a un profesional registrado en Ascenso."};l.push({email:p_email,since:now()});W("stub.mine."+em(),l);return{ok:true,msg:"Compartiendo con "+p_email}},
 pro_patients:()=>isPro()?(L("stub.pro")||[]):[],
 my_notes:()=>L("stub.mynotes."+em())||[],
 pro_notes:()=>isPro()?(L("stub.pronotes")||[]):[],
 content_reviews:()=>L("stub.rv")||{},
 admin_review:({p_item,p_ok,p_reviewer})=>{const r=L("stub.rv")||{};if(p_ok)r[p_item]={at:now(),by:p_reviewer};else delete r[p_item];W("stub.rv",r);return{ok:true}},
 ux_hit:({p_kind})=>{const c=L("stub.ux")||{};c[p_kind]=(c[p_kind]||0)+1;W("stub.ux",c);return null},
 pro_assign:({p_share,p_items})=>{if(!isPro())return{ok:false,msg:"Solo profesional"};if(p_items.some(i=>!(i.dose||"").trim()||i.dose.trim().length<2))return{ok:false,msg:"Revisa los ejercicios: cada uno necesita nombre y dosis (series, repeticiones o tiempo), con textos cortos."};const P=L("stub.pro")||[];const p=P.find(x=>x.id===p_share);if(!p)return{ok:false,msg:"Esta persona ya no comparte su avance contigo."};p.rx=p_items;p.rxAt=now();p.rxVersions=(p.rxVersions||0)+1;W("stub.pro",P);const h=L("stub.hist."+p_share)||[];h.unshift({at:now(),by:em(),rx:p_items});W("stub.hist."+p_share,h);return{ok:true}},
 pro_report:({p_share,p_day,p_note,p_on})=>{if(!isPro())return{ok:false,msg:"Solo profesional"};const P=L("stub.pro")||[];const p=P.find(x=>x.id===p_share);if(!p)return{ok:false,msg:"Esta persona ya no comparte su avance contigo."};p.reported=(p.reported||[]).filter(x=>x.date!==p_day);if(p_on!==false){if((p_note||"").trim().length<5)return{ok:false,msg:"nota"};p.reported.unshift({date:p_day,note:p_note,at:now(),by:em()})}W("stub.pro",P);W("stub.lastrep",{p_share,p_day,p_note,p_on});return{ok:true}},
 pro_rx_history:({p_share})=>L("stub.hist."+p_share)||[],
 pro_clear:({p_share,p_kind,p_note,p_on})=>{if(!isPro())return{ok:false,msg:"Solo un profesional registrado en Ascenso puede autorizar."};const P=L("stub.pro")||[];const p=P.find(x=>x.id===p_share);if(!p)return{ok:false,msg:"Esta persona ya no comparte su avance contigo."};p.clear=(p.clear||[]).filter(c=>c.kind!==p_kind);if(p_on!==false){if((p_note||"").length<5)return{ok:false,msg:"nota"};p.clear.push({kind:p_kind,key:p_kind==="parq"?p.parqKey:p_kind==="hold"?(p.hold&&p.hold.sid):null,at:now(),note:p_note})}W("stub.pro",P);return{ok:true}},
 contact_get:()=>L("stub.ct."+em())||{phone:(((L("stub.state."+em())||{}).data||{}).profile||{}).birthY?"+56900000000":null,wa_ok:false},
 contact_set:({p_phone,p_wa_ok})=>{const d=String(p_phone||"").replace(/\D/g,"");let v=null;if(d==="")v=null;else if(/^9\d{8}$/.test(d))v="+56"+d;else if(/^569\d{8}$/.test(d))v="+"+d;else return{ok:false,msg:"Escribe un celular chileno: 9 dígitos que empiezan con 9 (ej.: 9 1234 5678)."};if(p_wa_ok&&!v)return{ok:false,msg:"Para recibir recordatorios necesitamos tu número."};W("stub.ct."+em(),{phone:v,wa_ok:!!p_wa_ok});return{ok:true,phone:v,wa_ok:!!p_wa_ok}},
 admin_list:()=>L("stub.adm")||[], admin_audit:()=>[], admin_feedback:()=>[],
 admin_wa:({p_email,p_action})=>{const l=L("stub.adm")||[];const u=l.find(x=>x.email===p_email);if(!u)return{ok:false,msg:"no"};if(p_action==="sent"){if(!u.wa_ok)return{ok:false,msg:"Esta persona no aceptó recordatorios por WhatsApp."};u.wa_last=now()}else{u.wa_ok=false;u.phone=null}W("stub.adm",l);return{ok:true}},
 minor_auth_mine:()=>{const all=L("stub.ma")||[];const me=em();const u=all.find(x=>x.minor===me&&x.used&&!x.revoked);return{asMinor:u?{by:u.name,rel:u.rel,at:u.used}:null,asAdult:all.filter(x=>x.adult===me&&!x.revoked).map(x=>({id:x.id,rel:x.rel,code:x.used?null:x.code,expires:x.expires,used:x.used||null,minor:x.minor?"Menor":null}))}},
 minor_auth_create:({p_name,p_rel})=>{const all=L("stub.ma")||[];const code=String(10000000+all.length*1111111).slice(0,8);all.push({id:all.length+1,adult:em(),name:p_name,rel:p_rel,code,expires:new Date(Date.now()+48*36e5).toISOString()});W("stub.ma",all);return{ok:true,code}},
 minor_auth_use:({p_code})=>{const all=L("stub.ma")||[];const x=all.find(y=>y.code===p_code&&!y.used&&!y.revoked);if(!x)return{ok:false,msg:"El código no es válido o ya venció. Pídele uno nuevo a tu madre, padre o tutor."};if(x.adult===em())return{ok:false,msg:"El código lo debe crear una persona adulta desde su propia cuenta."};x.minor=em();x.used=now();W("stub.ma",all);return{ok:true,by:x.name,rel:x.rel,at:Date.now()}},
 minor_auth_revoke:({p_id})=>{const all=L("stub.ma")||[];for(const x of all){if(p_id==null?x.minor===em():x.id===p_id&&x.adult===em())x.revoked=now()}W("stub.ma",all);return{ok:true}},
 note_send:(a)=>{const l=L("stub.mynotes."+em())||[];l.unshift({id:Date.now(),at:now(),text:a.p_text,tags:a.p_tags||[],read:false});W("stub.mynotes."+em(),l);return{ok:true}},
};
const client={
 auth:{
  getSession:async()=>({data:{session:sess()}}),
  onAuthStateChange:(f)=>{cbs.push(f);return{data:{subscription:{unsubscribe(){}}}}},
  signInWithPassword:async({email})=>{localStorage.setItem("stub.email",email);cbs.forEach(f=>f("SIGNED_IN",sess()));return{data:{session:sess()},error:null}},
  signUp:async({email})=>{localStorage.setItem("stub.email",email);cbs.forEach(f=>f("SIGNED_IN",sess()));return{data:{session:sess(),user:sess().user},error:null}},
  signOut:async()=>{localStorage.removeItem("stub.email");cbs.forEach(f=>f("SIGNED_OUT",null));return{error:null}},
  updateUser:async()=>({data:{},error:null}),resetPasswordForEmail:async()=>({data:{},error:null})},
 rpc:async(n,a)=>{try{const h=H[n];const d=h?h(a||{}):null;return{data:d,error:null}}catch(e){return{data:null,error:{message:String(e.message)}}}},
 functions:{invoke:async()=>({data:null,error:null})}
};
window.supabase={createClient:()=>client};
})();
