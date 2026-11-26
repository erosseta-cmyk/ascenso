// Pruebas del servidor (SQL real del archivo sec.sql sobre PostgreSQL local)
const {mk}=require('./db');let fails=0,n=0;const R=[];
function ok(name,c,x){n++;R.push({name,ok:!!c});console.log((c?'OK   ':'FAIL ')+name+(c?'':' :: '+JSON.stringify(x)));if(!c)fails++}
(async()=>{const db=await mk();
 const q=async(s,p)=>(await db.query(s,p)).rows;
 async function as(uid,sid,sql,params){await db.exec('begin');try{await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uid,session_id:sid,email:(await q('select email from auth.users where id=$1',[uid]))[0]?.email,role:'authenticated'})]);
   const r=(await db.query(sql,params)).rows;await db.exec('commit');return {r:r[0]?Object.values(r[0])[0]:null}}catch(e){await db.exec('rollback');return {err:e.message}}}
 const user=async(email,created)=> (await q("insert into auth.users(email,created_at) values($1,$2) returning id",[email,created||new Date()]))[0].id;
 const sess=async(uid,created)=> (await q("insert into auth.sessions(user_id,created_at) values($1,$2) returning id",[uid,created||new Date()]))[0].id;
 const t0=new Date((await q('select sec.t0() t'))[0].t);const before=new Date(t0-40*864e5);
 const histState={v:1,onboard:{health:true},train:{sessions:[{date:'2026-11-20',pain:3}],parq:{a:1}},dayFb:{'2026-11-25':{pain:6}},journal:[{id:'j1',at:1,text:'NOTA PRIVADA'}],profile:{name:'Ana'}};
 // ---------- cuenta antigua con historial y sin llave ----------
 const ana=await user('ana@prueba.cl',before);await q("insert into public.app_state(user_id,data,rev) values($1,$2,3)",[ana,histState]);
 const kine=await user('kine@prueba.cl',before);await q("insert into public.pro_emails values('kine@prueba.cl')");
 const share=(await q("insert into public.shares(patient_id,pro_email) values($1,'kine@prueba.cl') returning id",[ana]))[0].id;
 const sAnaVieja=await sess(ana,before);            // el teléfono de Ana, abierto desde antes del cambio
 const sLadron=await sess(ana);                       // el ladrón restableció la contraseña desde el Gmail robado
 let r=await as(ana,sLadron,'select public.sec_status()');ok('A1 sesión abierta tras restablecer la contraseña: modo «activar»',r.r&&r.r.mode==='activar',r);
 r=await as(ana,sLadron,'select public.get_state_v3()');ok('A2 el ladrón no recibe ningún dato clínico',/SEC:activar/.test(r.err),r);
 r=await as(ana,sLadron,'select public.get_state_v2()');ok('A2b (la v2 de hoy sí se los entrega: por eso hay que retirarla al publicar)',r.r&&r.r.data&&r.r.data.journal,0);
 r=await as(ana,sLadron,"select sec.svc_challenge($1,$2,'reg','x')",[ana,sLadron]);ok('A3 el ladrón no puede registrar la primera llave',/no_puede_registrar/.test(r.err),r);
 r=await as(ana,sLadron,"select public.rec_start('12345678')");ok('A4 inventar un código de activación no sirve',r.r&&r.r.ok===false,r);
 r=await as(ana,sAnaVieja,'select public.sec_status()');ok('A5 el teléfono de Ana abierto desde antes queda en transición',r.r.mode==='antigua_transicion',r);
 r=await as(ana,sAnaVieja,'select public.get_state_v3()');ok('A6 en transición ve su registro diario, pero sin la bitácora',r.r&&r.r.data&&r.r.data.dayFb&&!r.r.data.journal,r);
 r=await as(ana,sAnaVieja,'select public.journal_list()');ok('A7 abrir la bitácora exige llave y PIN',/SEC:antigua_transicion/.test(r.err),r);
 r=await as(ana,sAnaVieja,'select public.save_state_v3($1,3)',[{...histState,journal:[]}]);
 let j=(await q('select data->\'journal\' j from public.app_state where user_id=$1',[ana]))[0].j;ok('A8 guardar el día no borra ni reemplaza la bitácora del servidor',r.r&&r.r.ok&&j.length===1,{r,j});
 // ---------- activación asistida en la visita ----------
 const sKine=await sess(kine);const kKine=(await q("insert into sec.keys(user_id,cred_id,pubkey,via) values($1,'ck','pk','alta') returning id",[kine]))[0].id;
 await q('insert into sec.bind(session_id,user_id,key_id) values($1,$2,$3)',[sKine,kine,kKine]);
 r=await as(kine,sKine,"select public.pro_activation_issue($1,'visita')",[share]);ok('B1 el kine sin confirmar con llave y PIN no puede emitir códigos',/SEC:confirmar_pro/.test(r.err),r);
 await q("insert into sec.pin(user_id,hash) values($1,sec.hash('482917'))",[kine]);
 await q("select sec.give($1,'llave',interval '2 min')",[sKine]);
 r=await as(kine,sKine,"select public.pin_check('482917')");ok('B2 el kine confirma con llave + PIN',r.r&&r.r.ok,r);
 r=await as(kine,sKine,"select public.pro_activation_issue($1,'visita')",[share]);const codeVisita=r.r&&r.r.code;ok('B3 en la visita el kine emite un código de 8 dígitos que dura 30 min',/^\d{8}$/.test(codeVisita||''),r);
 const sAnaNuevo=await sess(ana);   // Ana, en un teléfono nuevo, entra con su contraseña
 r=await as(ana,sLadron,"select public.rec_start($1)",[codeVisita.slice(0,4)+'0000']);ok('B4 un código distinto no le sirve al ladrón',r.r&&r.r.ok===false,r);
 r=await as(ana,sAnaNuevo,"select public.rec_start($1)",[codeVisita]);ok('B5 Ana usa el código de la visita: sin espera',r.r&&r.r.ok&&r.r.wait_s===0,r);
 r=await as(ana,sLadron,"select public.rec_start($1)",[codeVisita]);ok('B6 el mismo código no se puede usar dos veces',r.r&&r.r.ok===false,r);
 r=await as(ana,sAnaNuevo,'select public.rec_finish()');ok('B7 terminada la verificación, puede registrar la llave',r.r&&r.r.ok,r);
 r=await as(ana,sAnaNuevo,"select sec.svc_key_add($1,$2,'cred-ana-1','pub',0,'Teléfono de Ana')",[ana,sAnaNuevo]);ok('B8 primera llave registrada en el teléfono de Ana',r.r&&r.r.ok,r);
 r=await as(ana,sAnaNuevo,'select public.sec_status()');ok('B9 el teléfono nuevo queda en modo ok',r.r.mode==='ok',r);
 ok('B10 al recuperar, se cerraron las demás sesiones (la del ladrón y la vieja)',(await q('select count(*)::int c from auth.sessions where user_id=$1',[ana]))[0].c===1);
 r=await as(ana,sLadron,'select public.get_state_v3()');ok('B11 el ladrón, con su pestaña abierta, recibe rechazo en la siguiente lectura',/SEC:sin_sesion/.test(r.err),r);
 // ---------- PIN y bitácora ----------
 r=await as(ana,sAnaNuevo,"select public.pin_set('123456')");ok('C1 rechaza un PIN trivial',r.r&&r.r.ok===false,r);
 r=await as(ana,sAnaNuevo,"select public.pin_set('739215')");ok('C2 crea su PIN de Ascenso',r.r&&r.r.ok,r);
 r=await as(ana,sAnaNuevo,'select public.journal_list()');ok('C3 recién confirmada, ve su bitácora',Array.isArray(r.r)&&r.r[0].text==='NOTA PRIVADA',r);
 await q("delete from sec.grants where session_id=$1",[sAnaNuevo]);
 r=await as(ana,sAnaNuevo,'select public.journal_list()');ok('C4 vencida la confirmación, la bitácora vuelve a pedir llave y PIN',/SEC:confirmar/.test(r.err),r);
 r=await as(ana,sAnaNuevo,"select public.pin_check('739215')");ok('C5 el PIN solo vale después de usar la llave en este equipo',/SEC:llave/.test(r.err),r);
 // ---------- teléfono familiar: el cuidador conoce el código del teléfono, no el PIN ----------
 await q("select sec.give($1,'llave',interval '2 min')",[sAnaNuevo]);   // el cuidador desbloquea el teléfono: la llave responde
 let lefts=[];for(let i=0;i<5;i++){r=await as(ana,sAnaNuevo,"select public.pin_check($1)",[String(100000+i*7)]);lefts.push(r.r&&r.r.ok)}
 r=await as(ana,sAnaNuevo,"select public.pin_check('739215')");ok('D1 tras 5 PIN equivocados se bloquea 15 min, aunque luego acierte',r.r&&r.r.locked===true&&!lefts.some(Boolean),{r,lefts});
 r=await as(ana,sAnaNuevo,'select public.export_data()');ok('D2 sin PIN no puede exportar',/SEC:confirmar/.test(r.err),r);
 r=await as(ana,sAnaNuevo,"select public.key_revoke(1)");ok('D3 sin PIN no puede tocar las llaves',/SEC:confirmar/.test(r.err),r);
 r=await as(ana,sAnaNuevo,"select public.pin_set('555123')");ok('D4 sin PIN no puede cambiar el PIN',/SEC:(confirmar|llave)/.test(r.err),r);
 r=await as(ana,sAnaNuevo,'select public.get_state_v3()');ok('D5 el registro diario sigue disponible (y el 131 es de la interfaz, no del servidor)',r.r&&r.r.data,r);
 await q("update sec.pin set locked_until=null, fails=0 where user_id=$1",[ana]);
 // ---------- dos teléfonos de Ana y revocación ----------
 await q("select sec.give($1,'llave',interval '2 min')",[sAnaNuevo]);await as(ana,sAnaNuevo,"select public.pin_check('739215')");
 r=await as(ana,sAnaNuevo,'select public.equipo_code()');const cEq=r.r&&r.r.code;ok('E1 desde el teléfono con llave + PIN genera un código para sumar otro teléfono',/^\d{8}$/.test(cEq||''),r);
 const sTablet=await sess(ana);r=await as(ana,sTablet,"select public.rec_start($1)",[cEq]);ok('E2 la tablet lo usa sin espera',r.r&&r.r.ok&&r.r.wait_s===0,r);
 await as(ana,sTablet,'select public.rec_finish()');r=await as(ana,sTablet,"select sec.svc_key_add($1,$2,'cred-tablet','pub',0,'Tablet')",[ana,sTablet]);
 ok('E3 la tablet suma su llave sin sacar al teléfono',r.r&&r.r.ok&&r.r.closed===0,r);
 const kTab=r.r.key;
 r=await as(ana,sTablet,'select public.get_state_v3()');ok('E4 la tablet lee datos',r.r&&r.r.data,r);
 r=await as(ana,sAnaNuevo,"select public.key_revoke($1)",[kTab]);ok('E5 Ana revoca la tablet desde el teléfono',r.r&&r.r.ok&&r.r.closed===1,r);
 r=await as(ana,sTablet,'select public.get_state_v3()');ok('E6 la pestaña abierta de la tablet es rechazada en su siguiente lectura',/SEC:sin_sesion/.test(r.err),r);
 r=await as(ana,sTablet,"select public.save_state_v3($1,1)",[{v:1}]);ok('E7 y en su siguiente escritura',/SEC:sin_sesion/.test(r.err),r);
 // ---------- robo: suspender no es entregar ----------
 const sLadron2=await sess(ana);      // el ladrón vuelve a entrar con la contraseña
 r=await as(ana,sLadron2,'select public.sec_status()');ok('F1 nueva sesión con contraseña en cuenta con llave: «confirmar_llave»',r.r.mode==='confirmar_llave',r);
 r=await as(ana,sLadron2,'select public.get_state_v3()');ok('F2 sin la llave no ve datos',/SEC:confirmar_llave/.test(r.err),r);
 const sAmiga=await sess(ana);        // Ana entra desde el teléfono de una amiga para reportar el robo
 r=await as(ana,sAmiga,'select public.sec_suspend()');ok('F3 Ana suspende la cuenta desde cualquier sesión, sin PIN',r.r&&r.r.ok&&r.r.closed>=2,r);
 r=await as(ana,sAnaNuevo,'select public.get_state_v3()');ok('F4 el teléfono robado (con llave) queda fuera de inmediato',/SEC:sin_sesion/.test(r.err),r);
 const sLadron3=await sess(ana);r=await as(ana,sLadron3,'select public.sec_status()');ok('F5 si el ladrón vuelve a entrar, ve la cuenta suspendida',r.r.mode==='suspendida',r);
 r=await as(ana,sLadron3,"select sec.svc_assert_ok($1,$2,'cred-ana-1',5)",[ana,sLadron3]);ok('F6 ni con la llave del teléfono robado la puede reactivar',/SEC:suspendida/.test(r.err),r);
 // ---------- recuperar sin el teléfono y sin Gmail: códigos de casa ----------
 // (Ana había impreso sus códigos: los generamos con una sesión de prueba confirmada antes del robo)
 const hojas=[];for(let i=0;i<8;i++){const c=(await q("select sec.new_code() c"))[0].c;hojas.push(c);await q("insert into sec.codes(user_id,hash,batch) values($1,sec.hash($2),1)",[ana,c])}
 const sCasa=await sess(ana);
 r=await as(ana,sCasa,"select public.rec_start($1,'739215')",[hojas[0].slice(0,4)+'-'+hojas[0].slice(4)]);ok('G1 código de casa + PIN: recuperación inmediata',r.r&&r.r.ok&&r.r.method==='codigo_pin'&&r.r.wait_s===0,r);
 await as(ana,sCasa,'select public.rec_finish()');r=await as(ana,sCasa,"select sec.svc_key_add($1,$2,'cred-ana-2','pub',0,'Teléfono nuevo')",[ana,sCasa]);
 ok('G2 nueva llave: se levanta la suspensión y la llave robada queda revocada',r.r&&r.r.ok&&(await q("select status from sec.keys where cred_id='cred-ana-1'"))[0].status==='revocada'&&(await q('select suspended_at from sec.acct where user_id=$1',[ana]))[0].suspended_at===null,r);
 const sCasa2=await sess(ana);r=await as(ana,sCasa2,"select public.rec_start($1)",[hojas[1]]);ok('G3 código de casa sin PIN: 24 horas de espera',r.r&&r.r.method==='codigo'&&r.r.wait_s>=86000,r);
 const recId=r.r.id;r=await as(ana,sCasa2,'select public.rec_finish()');ok('G4 antes de las 24 h no deja registrar llave',r.r&&r.r.ok===false&&r.r.wait_s>0,r);
 r=await as(ana,sLadron3,"select public.rec_cancel($1)",[recId]);ok('G5 una sesión sin llave (la del ladrón) no puede cancelar',/SEC:/.test(r.err),r);
 await q("select sec.give($1,'llave',interval '2 min')",[sCasa]);await as(ana,sCasa,"select public.pin_check('739215')");
 r=await as(ana,sCasa,"select public.rec_cancel($1)",[recId]);ok('G6 el teléfono legítimo (llave + PIN) sí puede cancelar un intento ajeno',r.r&&r.r.ok,r);
 // recuperación a distancia con el kine: 72 h; el teléfono denunciado no puede cancelarla
 await q("select sec.give($1,'llave',interval '2 min')",[sKine]);await as(kine,sKine,"select public.pin_check('482917')");
 r=await as(kine,sKine,"select public.pro_activation_issue($1,'remota')",[share]);const cRem=r.r.code;
 const sAnaSinGmail=await sess(ana);r=await as(ana,sAnaSinGmail,"select public.rec_start($1)",[cRem]);ok('H1 a distancia con el kine: 72 horas de espera',r.r&&r.r.method==='remota'&&r.r.wait_s>=259000,r);
 const recRem=r.r.id;r=await as(ana,sLadron3,"select public.rec_cancel($1)",[recRem]);ok('H2 el ladrón no puede cancelarla',/SEC:/.test(r.err),r);
 await q("update sec.recovery set not_before=now()-interval '1 min' where id=$1",[recRem]);   // simulamos que pasaron 72 h
 r=await as(ana,sAnaSinGmail,'select public.rec_finish()');ok('H3 cumplida la espera, puede registrar su llave',r.r&&r.r.ok,r);
 // ---------- cuenta nueva ----------
 const beto=await user('beto@prueba.cl');const sBeto=await sess(beto);
 r=await as(beto,sBeto,'select public.sec_status()');ok('I1 cuenta nueva: modo «nueva»',r.r.mode==='nueva',r);
 r=await as(beto,sBeto,'select public.save_state_v3($1,null)',[{v:1,onboard:{health:true}}]);ok('I2 no deja autorizar ni registrar salud antes de la llave',/llave_primero/.test(r.err),r);
 r=await as(beto,sBeto,'select public.save_state_v3($1,null)',[{v:1,onboard:{name:'Beto'}}]);ok('I3 sí deja guardar datos sin salud',r.r&&r.r.ok,r);
 r=await as(beto,sBeto,"select sec.svc_key_add($1,$2,'cred-beto','pub',0,'Teléfono')",[beto,sBeto]);ok('I4 vincula la llave',r.r&&r.r.ok,r);
 r=await as(beto,sBeto,'select public.save_state_v3($1,1)',[{v:1,onboard:{health:true}}]);ok('I5 ahora sí registra salud',r.r&&r.r.ok,r);
 const sBetoReset=await sess(beto);r=await as(beto,sBetoReset,"select sec.svc_challenge($1,$2,'reg','x')",[beto,sBetoReset]);ok('I6 restablecer la contraseña no permite agregar otra llave',/no_puede_registrar/.test(r.err),r);
 // ---------- informes ----------
 const sAnaOk=sAnaSinGmail;await as(ana,sAnaOk,"select sec.svc_key_add($1,$2,'cred-ana-3','pub',0,'Teléfono')",[ana,sAnaOk]);
 r=await as(ana,sAnaOk,"select public.doc_new()");const doc=r.r.id;
 r=await as(ana,sAnaOk,"select public.doc_open($1)",[doc]);ok('J1 abrir el informe del correo exige llave y PIN',/SEC:confirmar/.test(r.err),r);
 r=await as(beto,sBeto,"select public.doc_open($1)",[doc]);ok('J2 un correo reenviado a otra cuenta no abre nada',/SEC:confirmar/.test(r.err)||r.r&&r.r.ok===false,r);
 await q("select sec.give($1,'sensible',interval '5 min')",[sBeto]);r=await as(beto,sBeto,"select public.doc_open($1)",[doc]);ok('J3 ni siquiera confirmada, otra cuenta puede abrir un informe ajeno',r.r&&r.r.ok===false,r);
 await q("select sec.give($1,'sensible',interval '5 min')",[sAnaOk]);r=await as(ana,sAnaOk,"select public.doc_open($1)",[doc]);ok('J4 Ana confirmada lo abre, y el informe no trae la bitácora',r.r&&r.r.ok&&!r.r.data.journal,r);
 r=await as(ana,sAnaOk,"select public.export_data()");ok('J5 la exportación sí incluye la bitácora',r.r&&r.r.journal&&r.r.journal.length>=1,r);
 // ---------- quien ayuda ----------
 const hija=await user('hija@prueba.cl');const sHija=await sess(hija);await as(hija,sHija,"select sec.svc_key_add($1,$2,'cred-hija','pub',0,'Teléfono')",[hija,sHija]);
 r=await as(ana,sAnaOk,"select public.carer_invite('hija@prueba.cl')");ok('K1 Ana invita a su hija (con llave y PIN)',r.r&&r.r.ok,r);
 r=await as(hija,sHija,'select public.carer_view()');const cv=JSON.stringify(r.r||{});ok('K2 la hija ve el nombre y los hábitos, sin dolor ni bitácora ni cuestionario',r.r&&r.r.length===1&&!/pain|NOTA PRIVADA|parq|sessions/.test(cv),r);

 // ---------- olvidé mi PIN ----------
 const pf=await user('pf@prueba.cl');const sPf=await sess(pf);await as(pf,sPf,"select sec.svc_key_add($1,$2,'cred-pf','pub',0,'Tel')",[pf,sPf]);await as(pf,sPf,"select public.pin_set('482913')");
 const hc=(await q("select sec.new_code() c"))[0].c;await q("insert into sec.codes(user_id,hash,batch) values($1,sec.hash($2),1)",[pf,hc]);
 await q("delete from sec.grants where session_id=$1",[sPf]);
 r=await as(pf,sPf,"select public.pin_forgot($1)",[hc]);ok('M1 olvidé mi PIN exige usar la llave antes',/SEC:llave/.test(r.err),r);
 await q("select sec.give($1,'llave',interval '2 min')",[sPf]);
 r=await as(pf,sPf,"select public.pin_forgot('ZZZZZZZZ')");ok('M2 con un código falso no se borra el PIN',r.r&&r.r.ok===false,r);
 r=await as(pf,sPf,"select public.pin_forgot($1)",[hc]);ok('M3 llave + código de casa: el PIN se puede volver a crear',r.r&&r.r.ok,r);
 r=await as(pf,sPf,"select public.pin_set('604817')");ok('M4 y crea uno nuevo',r.r&&r.r.ok,r);
 // ---------- permisos ----------
 await db.exec('begin');let e1=null;try{await db.exec("set local role authenticated");await db.query("select sec.svc_key_add(gen_random_uuid(),gen_random_uuid(),'x','y',0,'z')")}catch(e){e1=e.message}await db.exec('rollback');
 ok('L1 una sesión normal no puede llamar a las funciones internas de la llave',/permission denied/.test(e1||''),e1);
 await db.exec('begin');let e2=null;try{await db.exec("set local role authenticated");await db.query("select * from sec.keys")}catch(e){e2=e.message}await db.exec('rollback');
 ok('L2 ni leer las tablas de seguridad',/permission denied/.test(e2||''),e2);
 console.log(`\n${n-fails}/${n} OK`);require('fs').writeFileSync('/tmp/t_sql.json',JSON.stringify(R));process.exit(fails?1:0)})().catch(e=>{console.error('ERR',e);process.exit(2)});
