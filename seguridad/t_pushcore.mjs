// B3 · contenido que push-tick enviaría (core.mjs), incluso si la consulta entregara el nombre del hábito (como push_due_v2).
import { payloadFor } from '/home/claude/ascenso/supabase/functions/push-tick/core.mjs';
let f=0;const ok=(n,c,x)=>{console.log((c?'OK  ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x)));if(!c)f++};
const rows=[{mission_id:'wk',kind:'m',title:'Ascenso · es la hora',body:'Caminar 20 minutos'},{mission_id:null,kind:'pro',title:'Ascenso · revisa a un paciente',body:'Alguien … registró dolor'},{mission_id:null,kind:'rx',body:'Te quedan 2 ejercicios'},{mission_id:null,kind:'vence',body:'Tu acceso termina el 29/11'},{mission_id:null,kind:'raro'}];
for(const r of rows){const p=payloadFor(r),s=JSON.stringify(p);ok(`push-tick (${r.kind}): título «Ascenso» y cuerpo genérico; sin texto de la consulta`,p.title==='Ascenso'&&p.body==='Tienes un recordatorio de Ascenso'&&!/Caminar|dolor|ejercicios|29\/11|paciente/.test(s),p)}
ok('push-tick: el aviso de hábito conserva su identificador para «Posponer» y para abrir el detalle',payloadFor(rows[0]).mid==='wk'&&payloadFor(rows[0]).tag==='m-wk',payloadFor(rows[0]));
console.log(f?`${f} FAIL`:'6/6 OK');process.exit(f?1:0);
