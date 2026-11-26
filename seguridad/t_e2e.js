// Pruebas de extremo a extremo de la copia v79 con varios equipos (navegadores separados, cada uno con su
// propia llave virtual) contra el servidor de pruebas con el SQL real (base.sql + sec.sql).
const { start } = require('./shim'); const { chromium } = require('playwright'); const fs = require('fs');
const F = require('/home/claude/qa/fixtures'); const J = (o) => JSON.parse(JSON.stringify(o));
const SITE = process.env.SITE || '/home/claude/ascenso'; const PORT = +process.env.PORT || 8991;
let fails = 0, n = 0; const R = [];
function ok(name, c, x) { n++; R.push({ name, ok: !!c }); console.log((c ? 'OK   ' : 'FAIL ') + name + (c ? '' : ' :: ' + String(typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 500))); if (!c) fails++; }
(async () => {
  const S = await start(PORT, SITE); const O = S.ORIGIN; const q = S.q;
  const t0 = new Date((await q('select sec.t0() t'))[0].t); const before = new Date(t0 - 40 * 864e5).toISOString();
  const mkUser = async (email, pw, created) => (await q("insert into auth.users(email,encrypted_password,created_at) values($1,extensions.crypt($2,extensions.gen_salt('bf',4)),$3) returning id", [email, pw, created || new Date().toISOString()]))[0].id;
  const ana = await mkUser('ana@prueba.cl', 'AnaClave2026', before), kine = await mkUser('kine@prueba.cl', 'KineClave2026', before);
  const st = J(F.B); st.journal = [{ id: 'j1', at: Date.now() - 864e5, text: 'NOTA PRIVADA DE ANA: hoy me sentí triste' }];
  st.dayFb = Object.assign({}, st.dayFb || {}, { [new Date(Date.now() - 864e5).toISOString().slice(0, 10)]: { pain: 6, at: Date.now() } });
  await q('insert into public.app_state(user_id,data,rev) values($1,$2,3),($3,$4,1)', [ana, st, kine, J(F.A)]);
  await q("insert into public.pro_emails values('kine@prueba.cl')"); await q("insert into public.admin_emails values('kine@prueba.cl')");
  await q("insert into public.shares(patient_id,pro_email) values($1,'kine@prueba.cl')", [ana]);
  // Arranque del profesional: Esteban se da a sí mismo un código desde el panel SQL de Supabase (paso documentado)
  await q("insert into sec.activation(user_id,hash,kind,issued_by,expires_at) values($1,sec.hash('11112222'),'visita',$1,now()+interval '30 min')", [kine]);
  const B = await chromium.launch();
  async function device(name) {
    const ctx = await B.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true }); const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|favicon|status of 4\d\d|bad HTTP response code \(404\)/.test(m.text())) errs.push(m.text()) });
    const cdp = await ctx.newCDPSession(page); await cdp.send('WebAuthn.enable');
    const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
    return { ctx, page, errs, cdp, authenticatorId, name };
  }
  const W = (d, ms) => d.page.waitForTimeout(ms || 700);
  const main = (d) => d.page.evaluate(() => (document.querySelector('#main') || document.body).innerText);
  const store = (d) => d.page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
  async function until(d, re, ms) { const t = Date.now() + (ms || 8000); let x = ''; while (Date.now() < t) { x = await main(d); if (re.test(x)) return true; await W(d, 250); } return false; }
  const click = (d, sel) => d.page.evaluate((s) => { const el = document.querySelector(s); if (!el) return false; el.click(); return true; }, sel);
  const submit = (d, sel) => d.page.evaluate((s) => { const f = document.querySelector(s); if (!f) return false; f.requestSubmit(); return true; }, sel);
  async function login(d, email, pw) { await d.page.goto(O + '/'); await d.page.waitForSelector('#auEmail', { timeout: 8000 }); await d.page.fill('#auEmail', email); await d.page.fill('#auPass', pw); await submit(d, '#authForm'); await W(d, 1800); }
  async function resetPass(d, email, pw) {
    await fetch(O + '/auth/v1/recover?redirect_to=' + encodeURIComponent(O + '/'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
    const m = await (await fetch(O + '/__t/mail?email=' + encodeURIComponent(email))).json(); if (!m || !m.link) return false;
    await d.page.goto(m.link); await d.page.waitForSelector('#npPass', { timeout: 8000 }); await d.page.waitForFunction(() => { try { return !!session && recovering } catch (e) { return false } }, null, { timeout: 8000 }).catch(() => {}); await W(d, 400); await d.page.fill('#npPass', pw); await d.page.fill('#npPass2', pw); await submit(d, '#newPassForm'); await W(d, 2000); return true;
  }
  async function pin(d, p, p2) { await d.page.waitForSelector('#secPin', { timeout: 8000 }); await d.page.fill('#secPin', p); if (p2 !== undefined) await d.page.fill('#secPin2', p2); await submit(d, '#secPinForm'); await W(d, 1200); }
  async function useKey(d) { await click(d, '[data-act=secNeedGo]'); await W(d, 1500); }
  async function confirmIfAsked(d, p) { if (await d.page.$('[data-act=secNeedGo]')) { await useKey(d); if (await d.page.$('#secPin2')) await pin(d, p, p); else await pin(d, p); } }
  async function code(d, c, p, path) { await click(d, `[data-act=secPath][data-v=${path || (p ? 'hoja' : 'kine')}]`); await W(d, 300); await d.page.fill('#secCode', c); if (p && await d.page.$('#secCodePin')) await d.page.fill('#secCodePin', p); await submit(d, '#secCodeForm'); await W(d, 1200); }
  const SH_DIR = '/home/claude/ux_sec'; fs.mkdirSync(SH_DIR, { recursive: true }); let shN = 0;
  const shot = async (d, name) => { try { await d.page.screenshot({ path: `${SH_DIR}/${String(++shN).padStart(2, '0')}-${name}.png`, fullPage: true }) } catch (e) { } };
  const noSecrets = (s) => !/NOTA PRIVADA/.test(s) && !/"pain"\s*:\s*\d/.test(s);

  // ===================== 1. Cuenta antigua sin llave: el ladrón tiene el Gmail =====================
  const L = await device('ladrón');
  ok('P1.1 el ladrón restablece la contraseña con el Gmail robado', await resetPass(L, 'ana@prueba.cl', 'LadronClave1'));
  ok('P1.2 en vez de los datos, ve «Activa la llave de tu cuenta»', await until(L, /Activa la llave de tu cuenta/), await main(L));
  await shot(L,'ladron-activar');
  let mt = await main(L), ls = await store(L);
  ok('P1.3 no ve la bitácora ni el dolor en pantalla', noSecrets(mt) && !/Bitácora\./.test(mt), mt.slice(0, 300));
  ok('P1.4 y en su navegador no quedó ningún dato clínico', noSecrets(ls) && !/"sessions":\[\{/.test(ls), ls.slice(0, 600));
  await code(L, '12345678'); ok('P1.5 inventar un código no sirve', /no es válido/.test(await main(L)), await main(L));
  let rr = await L.page.evaluate(() => secRegister()); ok('P1.6 intentar registrar la primera llave a su nombre: rechazado por el servidor', rr && rr.ok === false, rr);
  rr = await L.page.evaluate(async () => { const r = await sb.rpc('get_state_v2'); return !!(r.data && r.data.data) }); ok('P1.7 la función antigua (v2) ya no responde (simula el corte de la publicación)', rr === false, rr);
  ok('P1.8 la pantalla ofrece «Llamar al 131»', !!(await L.page.$('#secGate a[href="tel:131"]')));

  // ===================== 2. Activación asistida en la visita =====================
  const K = await device('kine');
  await login(K, 'kine@prueba.cl', 'KineClave2026');
  ok('P2.1 la cuenta del kine también necesita activar su llave', await until(K, /Activa la llave de tu cuenta/), await main(K));
  await code(K, '1111-2222'); ok('P2.2 el código de arranque del kine se acepta sin espera', await until(K, /Ya puedes crear tu llave/), await main(K));
  await click(K, '[data-act=secFinish]'); await W(K, 2500); await pin(K, '482917', '482917');
  ok('P2.3 el kine creó su llave y su PIN', await K.page.evaluate(() => SEC.mode === 'ok'), await K.page.evaluate(() => SEC.mode));
  await K.page.evaluate(() => { tab = 'pacientes'; render() }); await W(K, 500);
  ok('P2.4 ver pacientes pide llave + PIN', /Confirma que eres tú/.test(await main(K)), await main(K));
  await shot(K,'kine-pacientes-cerrado');
  await click(K, '[data-act=secProOpen]'); await useKey(K); await pin(K, '482917'); await W(K, 1200);
  ok('P2.5 confirmado, ve a su paciente', /ana@prueba\.cl/.test(await main(K)), (await main(K)).slice(0, 400));
  await click(K, '[data-act=secActIssue][data-k=visita]'); await W(K, 1200);
  const cVisita = await K.page.evaluate(() => SEC.act && SEC.act.code); ok('P2.6 en la visita emite un código de activación', /^\d{8}$/.test(cVisita || ''), cVisita);
  await shot(K,'kine-codigo-visita');

  // ===================== 3. Ana recupera su cuenta en su teléfono =====================
  const A = await device('Ana');
  ok('P3.1 Ana restablece su contraseña con su propio Gmail', await resetPass(A, 'ana@prueba.cl', 'AnaNueva2026'));
  ok('P3.2 ve la pantalla de activación', await until(A, /Activa la llave de tu cuenta/), await main(A));
  await code(A, cVisita); ok('P3.3 con el código de la visita: sin espera', await until(A, /Ya puedes crear tu llave/), await main(A));
  await shot(A,'ana-lista-para-crear-llave');
  await click(A, '[data-act=secFinish]'); await W(A, 2500); await pin(A, '739215', '739215'); await W(A, 1200);
  ok('P3.4 Ana entra a su cuenta con su llave', await A.page.evaluate(() => SEC.mode === 'ok' && !!S.onboard), await A.page.evaluate(() => SEC.mode));
  await L.page.evaluate(() => pull(false)); await W(L, 1500);
  ok('P3.5 la pestaña abierta del ladrón es rechazada y queda en la pantalla de acceso (con el 131 a mano)', /Desconectamos este equipo/.test(await main(L)) && !!(await L.page.$('#main a[href="tel:131"]')) && await L.page.evaluate(() => !session), await main(L));
  await shot(L,'ladron-desconectado');
  ls = await store(L); ok('P3.6 y se borró lo que había en su navegador', !/ascenso\.[0-9a-f-]{36}\.(enc|lite)/.test(ls), ls.slice(0, 300));
  // El ladrón insiste con el Gmail
  ok('P3.7 el ladrón vuelve a restablecer la contraseña', await resetPass(L, 'ana@prueba.cl', 'LadronClave2'));
  ok('P3.8 ahora la cuenta tiene llave: le pide «Confirma que eres tú en este teléfono»', await until(L, /Confirma que eres tú en este teléfono/), await main(L));
  await shot(L,'ladron-confirmar-llave');
  await click(L, '[data-act=secUse]'); await W(L, 2000);
  ok('P3.9 su teléfono no tiene la llave de Ana: no entra', await L.page.evaluate(() => SEC.mode !== 'ok') && noSecrets(await main(L)), await main(L));
  rr = await L.page.evaluate(() => secRegister()); ok('P3.10 y no puede agregar una llave nueva desde el correo', rr && rr.ok === false, rr);
  // El cambio de contraseña del ladrón cerró la sesión de Ana: ella vuelve a entrar con su llave
  await A.page.evaluate(() => pull(false)); await W(A, 1500);
  ok('P3.11 (costo) el restablecimiento del ladrón cerró la sesión de Ana', await A.page.evaluate(() => !session), await main(A));
  ok('P3.12 Ana restablece otra vez con su Gmail', await resetPass(A, 'ana@prueba.cl', 'AnaNueva2027'));
  await click(A, '[data-act=secUse]'); await W(A, 2500);
  ok('P3.13 y entra con su llave, sin códigos', await A.page.evaluate(() => SEC.mode === 'ok'), await main(A));

  // ===================== 4. Teléfono familiar ya desbloqueado =====================
  await A.page.evaluate(() => { tab = 'bitacora'; render() }); await W(A, 400);
  ok('P4.1 la bitácora aparece cerrada', /Tus notas están protegidas/.test(await main(A)) && noSecrets(await main(A)), await main(A));
  await shot(A,'bitacora-cerrada');
  await click(A, '[data-act=secJn]'); await W(A, 700);
  ok('P4.2 pide la llave y tiene «Llamar al 131» a la vista', !!(await A.page.$('#secNeed [data-act=secNeedGo]')) && !!(await A.page.$('#secNeed a[href="tel:131"]')));
  await shot(A,'confirmar-paso1-llave');
  await useKey(A);   // el cuidador conoce el código del teléfono: la llave responde
  ok('P4.3 la llave responde porque el cuidador sabe el código del teléfono, pero falta el PIN de Ascenso', !!(await A.page.$('#secPinForm')) && !(await A.page.$('#secPin2')), await main(A));
  await shot(A,'confirmar-paso2-pin');
  for (const p of ['111222', '135790', '246802', '102030', '908070']) await pin(A, p);
  let m4 = await main(A); ok('P4.4 cinco PIN equivocados: bloqueado con la hora en que puede reintentar, y la bitácora sigue cerrada', /Tu PIN está bloqueado por ahora/.test(m4) && /a las \d/.test(m4) && noSecrets(m4), m4.slice(0, 400));
  await shot(A,'pin-bloqueado');
  ok('P4.5 bloqueado: no hay campo de PIN, ofrece «Olvidé mi PIN», ayuda y «Llamar al 131»', !(await A.page.$('#secPin')) && !!(await A.page.$('[data-act=secForgot]')) && !!(await A.page.$('[data-act=secHelpT]')) && !!(await A.page.$('#secNeed a[href="tel:131"]')), await main(A));
  rr = await A.page.evaluate(async () => (await sb.rpc('pin_check', { p_pin: '739215' })).data); ok('P4.5b y el servidor rechaza incluso el PIN correcto durante el bloqueo', rr && rr.ok === false, rr);
  await click(A, '[data-act=secNeedNo]'); await A.page.evaluate(() => { tab = 'ajustes'; view.expAsk = true; render() }); await W(A, 400);
  await click(A, '[data-act=export]'); await W(A, 900); ok('P4.6 descargar los datos también pide llave + PIN', !!(await A.page.$('#secNeed')), await main(A));
  await click(A, '[data-act=secNeedNo]'); await A.page.evaluate(() => { tab = 'dia'; render() }); await W(A, 300);
  ok('P4.7 el registro del día sigue disponible para quien ayuda', /Hoy|Mi día|hoy/.test(await main(A)) && !(await A.page.$('#secGate')), (await main(A)).slice(0, 200));
  await q('update sec.pin set fails=0, locked_until=null where user_id=$1', [ana]);   // pasan los 15 minutos
  // Acceso propio para la hija
  const hija = await mkUser('hija@prueba.cl', 'HijaClave2026');
  const hs = J(F.A); hs.onboard = Object.assign({}, hs.onboard || {}, { health: false }); hs.train = Object.assign({}, hs.train || {}, { sessions: [], parq: null }); delete hs.dayFb; hs.journal = [];
  await q('insert into public.app_state(user_id,data,rev) values($1,$2,1)', [hija, hs]);
  await A.page.evaluate(() => { tab = 'ajustes'; render() }); await W(A, 300);
  await A.page.fill('#secCarer', 'hija@prueba.cl'); await submit(A, '#secCarerForm'); await W(A, 800); await confirmIfAsked(A, '739215'); await W(A, 800);
  ok('P4.8 Ana le da a su hija su propio acceso (con llave + PIN)', /hija@prueba\.cl/.test(await main(A)), (await main(A)).slice(0, 300));
  const H = await device('hija'); await login(H, 'hija@prueba.cl', 'HijaClave2026');
  ok('P4.9 la hija primero crea su propia llave', await until(H, /Configura el acceso a tu cuenta/), await main(H));
  await shot(H,'nueva-crear-llave');
  await click(H, '[data-act=secCreate]'); await W(H, 2500); await pin(H, '864209', '864209'); await H.page.evaluate(async () => { await loadShares(); tab = 'dia'; render() }); await W(H, 800);
  m4 = await main(H); ok('P4.10 la hija ve los hábitos de Ana, sin dolor, bitácora ni cuestionario', /ayudando a/i.test(m4) && noSecrets(m4) && !/cuestionario previo|PAR-Q/.test(await H.page.evaluate(() => (document.querySelector('#carerView') || {}).innerText || '')), m4.slice(0, 500));
  await shot(H,'hija-vista-ayudante');

  // ===================== 5. Revocar un equipo con la pestaña abierta =====================
  await A.page.evaluate(() => { tab = 'ajustes'; render() }); await W(A, 300);
  await click(A, '[data-act=secAddPhone]'); await W(A, 900); await confirmIfAsked(A, '739215'); await W(A, 900);
  const cEq = await A.page.evaluate(() => SEC.eq); ok('P5.1 desde su teléfono, Ana genera un código para la tablet', /^\d{8}$/.test(cEq || ''), cEq);
  await shot(A,'ajustes-codigo-equipo');
  const T = await device('tablet'); await login(T, 'ana@prueba.cl', 'AnaNueva2027');
  ok('P5.2 la tablet pide la llave', await until(T, /Confirma que eres tú en este teléfono/), await main(T));
  await code(T, cEq, null, 'otro'); await click(T, '[data-act=secFinish]'); await W(T, 2500);
  ok('P5.3 la tablet queda con su propia llave y ve el registro diario', await T.page.evaluate(() => SEC.mode === 'ok' && !!S.onboard), await main(T));
  ls = await store(T); ok('P5.4 en la tablet, el historial queda cifrado y lo único en claro es el plan del día', /\.enc"/.test(ls) && /\.lite"/.test(ls) && noSecrets(ls), ls.slice(0, 500));
  rr = await T.page.evaluate(async () => { const k = SEC.key; SEC.key = null; const a = await secUncache(); SEC.key = k; const b = await secUncache(); return { sinClave: a, conClave: !!b } });
  ok('P5.5 sin la clave del servidor, la copia cifrada no se puede abrir', rr.sinClave === null && rr.conClave === true, rr);
  rr = await T.page.evaluate(() => { const keep = { S, off: SEC.offline }; S = blank(); SEC.offline = true; render(); const t = document.querySelector('#main').innerText; S = keep.S; SEC.offline = keep.off; render(); return t });
  await T.page.evaluate(() => { window.__k = { S, off: SEC.offline }; S = blank(); SEC.offline = true; render() }); await shot(T,'sin-conexion-plan-del-dia'); await T.page.evaluate(() => { S = window.__k.S; SEC.offline = window.__k.off; render() });
  ok('P5.6 sin conexión (simulado): solo el plan del día y «Llamar al 131»', /plan de hoy/i.test(rr) && /131/.test(rr) && noSecrets(rr), rr.slice(0, 400));
  await A.page.evaluate(async () => { await secStatus(); render() }); await W(A, 400);
  const tabKey = await A.page.evaluate(() => (SEC.st.keys.find(k => !k.here && /Computador/.test(k.label || '') && k.via === 'alta') || SEC.st.keys.filter(k => !k.here).pop() || {}).id);
  await click(A, `[data-act=secRevoke][data-id="${tabKey}"]`); await W(A, 900); await confirmIfAsked(A, '739215'); await W(A, 900);
  ok('P5.7 Ana revoca la tablet desde su teléfono', await A.page.evaluate((k) => !SEC.st.keys.some(x => x.id === k), tabKey), await A.page.evaluate(() => SEC.st.keys));
  // La tablet sigue con la pestaña abierta y registra algo: el servidor lo rechaza
  await T.page.evaluate(() => { S.updatedAt = Date.now(); dirty = true; return flush() }); await W(T, 1800);
  ok('P5.8 la pestaña abierta de la tablet es rechazada en su siguiente escritura', /Desconectamos este equipo/.test(await main(T)) && await T.page.evaluate(() => !session), await main(T));
  await shot(T,'tablet-revocada');
  ls = await store(T); ok('P5.9 y la tablet borró su copia local', !/\.(enc|lite)"/.test(ls), ls.slice(0, 300));

  // ===================== 6. Robo del teléfono y recuperación sin Gmail =====================
  // El ladrón se queda con el teléfono de Ana desbloqueado, con Gmail y Ascenso abiertos. Ana llama a su kine.
  await K.page.evaluate(async () => { tab = 'pacientes'; await loadShares(); render() }); await W(K, 800);
  await click(K, '[data-act=secProSuspend]'); await W(K, 300); await click(K, '[data-act=secProSuspend]'); await W(K, 1500); await confirmIfAsked(K, '482917'); await W(K, 800);
  ok('P6.1 el kine suspende la cuenta de Ana', (await q('select suspended_at from sec.acct where user_id=$1', [ana]))[0].suspended_at !== null);
  await A.page.evaluate(() => pull(false)); await W(A, 1500);
  ok('P6.2 el teléfono robado (pestaña abierta, con llave) queda fuera en su siguiente lectura', /Desconectamos este equipo/.test(await main(A)), await main(A));
  // Ana no tiene su Gmail: el kine (también administrador) cambia el correo después de ver su cédula, y le da un código en la visita
  await K.page.evaluate(() => { tab = 'ajustes'; render() }); await W(K, 400);
  await K.page.fill('#secMailOld', 'ana@prueba.cl'); await K.page.fill('#secMailNew', 'ana.nueva@prueba.cl'); await submit(K, '#secMailForm'); await W(K, 1200); await confirmIfAsked(K, '482917'); await W(K, 1200);
  ok('P6.3 la administración cambia el correo de la cuenta', (await q('select email from auth.users where id=$1', [ana]))[0].email === 'ana.nueva@prueba.cl');
  await K.page.evaluate(async () => { tab = 'pacientes'; await loadShares(); render() }); await W(K, 800);
  await click(K, '[data-act=secActIssue][data-k=visita]'); await W(K, 1200); await confirmIfAsked(K, '482917'); await W(K, 800);
  const cV2 = await K.page.evaluate(() => SEC.act && SEC.act.code); ok('P6.4 y le entrega un código en la visita', /^\d{8}$/.test(cV2 || ''), cV2);
  // El ladrón, con el Gmail viejo, ya no puede restablecer nada
  await fetch(O + '/auth/v1/recover', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'ana@prueba.cl' }) });
  const mOld = await (await fetch(O + '/__t/mail?email=ana@prueba.cl')).json();
  ok('P6.5 el correo viejo ya no recibe enlaces nuevos', !mOld || mOld.t === null, mOld);
  const Fd = await device('teléfono nuevo de Ana');
  ok('P6.6 Ana pone su contraseña con el correo nuevo', await resetPass(Fd, 'ana.nueva@prueba.cl', 'AnaFinal2026'));
  ok('P6.7 ve su cuenta suspendida, sin datos', await until(Fd, /Tu cuenta está suspendida/) && noSecrets(await main(Fd)), await main(Fd));
  await shot(Fd,'cuenta-suspendida');
  await code(Fd, cV2); await click(Fd, '[data-act=secFinish]'); await W(Fd, 2500);
  ok('P6.8 Ana recupera su cuenta en el teléfono nuevo', await Fd.page.evaluate(() => SEC.mode === 'ok' && !!S.onboard), await main(Fd));
  ok('P6.9 la llave del teléfono robado quedó revocada', (await q("select count(*)::int c from sec.keys where user_id=$1 and status='activa'", [ana]))[0].c === 1);
  await Fd.page.evaluate(() => { tab = 'bitacora'; render() }); await click(Fd, '[data-act=secJn]'); await W(Fd, 600); await confirmIfAsked(Fd, '739215'); await W(Fd, 800);
  ok('P6.10 con su llave y su PIN de siempre vuelve a leer su bitácora', /NOTA PRIVADA DE ANA/.test(await main(Fd)), (await main(Fd)).slice(0, 300));

  // ===================== 7. Archivos y correo con enlace =====================
  await Fd.page.evaluate(() => { tab = 'ajustes'; view.expAsk = true; render() }); await W(Fd, 300);
  const dl = Fd.page.waitForEvent('download', { timeout: 15000 }); await click(Fd, '[data-act=export]'); await W(Fd, 800); await confirmIfAsked(Fd, '739215');
  const file = await dl; const fpath = '/tmp/ascenso-export-prueba.html'; await file.saveAs(fpath); await W(Fd, 1500);
  const phrase = await Fd.page.evaluate(() => SEC.copy && SEC.copy.phrase); const raw = fs.readFileSync(fpath, 'utf8');
  ok('P7.1 la exportación se guarda como copia protegida con una frase de 7 palabras', !!phrase && phrase.split(' ').length === 7, phrase);
  await shot(Fd,'copia-protegida-frase');
  rr = await Fd.page.evaluate(() => { const e = document.querySelector('#secPhrase'); if (!e) return null; const c = getComputedStyle(e).color.match(/\d+/g).map(Number), b = getComputedStyle(e).backgroundColor.match(/\d+/g).map(Number); const L = (x) => x.slice(0, 3).reduce((a, v) => a + v, 0) / 3; return { txt: e.innerText, contraste: Math.abs(L(c) - L(b)) } });
  ok('P7.1b la frase se ve en pantalla con contraste suficiente', rr && rr.txt.trim().split(' ').length === 7 && rr.contraste > 150, rr);
  ok('P7.2 el archivo no deja leer nada sin la frase (ni la bitácora, ni el dolor, ni el nombre)', noSecrets(raw) && !/AnaNueva|ana\.nueva/.test(raw) && !raw.includes(phrase), raw.slice(0, 200));
  const P = await (await B.newContext()).newPage(); await P.goto('file://' + fpath);
  await P.fill('#f', 'luna sol mar rio pan sal flor'); await P.click('#b'); await P.waitForTimeout(3500);
  ok('P7.3 con otra frase no se abre', /no es correcta/.test(await P.innerText('#m')), await P.innerText('#m'));
  await P.fill('#f', phrase); await P.click('#b'); await P.waitForTimeout(4000);
  ok('P7.4 con la frase correcta se abre y contiene su bitácora', /NOTA PRIVADA DE ANA/.test(await P.innerText('#j')), (await P.innerText('body')).slice(0, 200));
  await click(Fd, '[data-act=secCopyDone]');
  // Informe
  await Fd.page.evaluate(() => A.secReport()); await W(Fd, 1200); await confirmIfAsked(Fd, '739215'); await W(Fd, 800);
  ok('P7.5 «Ver informe» lo muestra en pantalla y no incluye la bitácora', !!(await Fd.page.$('#secRep')) && !/NOTA PRIVADA/.test(await main(Fd)), (await main(Fd)).slice(0, 300));
  await shot(Fd,'ver-informe');
  await click(Fd, '[data-act=secRepClose]');
  // Enlace del correo
  const doc = await Fd.page.evaluate(async () => (await sb.rpc('doc_new', {})).data.id);
  const link = O + '/?doc=' + doc;
  const Z = await device('sin sesión'); await Z.page.goto(link); await W(Z, 1500);
  ok('P7.6 abrir el enlace en un equipo sin sesión: solo la pantalla de acceso', !!(await Z.page.$('#auEmail')) && noSecrets(await main(Z)), await main(Z));
  const beto = await mkUser('beto@prueba.cl', 'BetoClave2026'); const Bt = await device('Beto (recibió el correo reenviado)');
  await login(Bt, 'beto@prueba.cl', 'BetoClave2026'); await click(Bt, '[data-act=secCreate]'); await W(Bt, 2500); await pin(Bt, '520741', '520741');
  rr = await Bt.page.evaluate(async (id) => (await sb.rpc('doc_open', { p_doc: id })).data, doc);
  ok('P7.7 reenviado a otra persona, aunque tenga su propia llave y PIN, el informe no se abre', rr && rr.ok === false, rr);
  await Fd.page.goto(link); await W(Fd, 2500);
  const opened = !!(await Fd.page.$('#secRep')) || !!(await Fd.page.$('#secNeed'));
  ok('P7.8 abierto desde la sesión ya iniciada de Ana: pide llave + PIN (o abre si confirmó hace menos de 5 min)', opened, await main(Fd));
  await q("delete from sec.grants where scope='sensible'"); await Fd.page.goto(link); await W(Fd, 2500);
  ok('P7.9 con la confirmación vencida, el enlace pide llave + PIN antes de mostrar nada', !!(await Fd.page.$('#secNeed')) && !(await Fd.page.$('#secRep')), await main(Fd));
  await confirmIfAsked(Fd, '739215'); await W(Fd, 1000); ok('P7.10 tras confirmar, se abre', !!(await Fd.page.$('#secRep')), await main(Fd));
  await Fd.page.evaluate(async () => { SEC.rep = null; tab = 'ajustes'; await secStatus(); render() }); await shot(Fd,'ajustes-seguridad');
  // Olvidé mi PIN: con la llave del teléfono + un código de la hoja para casa
  await Fd.page.evaluate(() => { SEC.rep = null; tab = 'ajustes'; render() }); await click(Fd, '[data-act=secCodes]'); await W(Fd, 900); await confirmIfAsked(Fd, '739215'); await W(Fd, 900);
  const hoja = await Fd.page.evaluate(() => SEC.codes); ok('P9.1 Ana crea su hoja de 8 códigos para casa', Array.isArray(hoja) && hoja.length === 8, hoja);
  await shot(Fd, 'hoja-de-codigos'); await click(Fd, '[data-act=secCodesHide]');
  await q("delete from sec.grants where scope in ('sensible','llave')");
  await Fd.page.evaluate(() => { SEC.jn = null; tab = 'bitacora'; render() }); await click(Fd, '[data-act=secJn]'); await W(Fd, 600); await useKey(Fd);
  await click(Fd, '[data-act=secForgot]'); await W(Fd, 400); await shot(Fd, 'olvide-mi-pin');
  await Fd.page.fill('#secFgCode', hoja[0]); await submit(Fd, '#secForgotForm'); await W(Fd, 1200);
  ok('P9.2 «Olvidé mi PIN» con un código de la hoja deja crear uno nuevo', !!(await Fd.page.$('#secPin2')), await main(Fd));
  await pin(Fd, '615283', '615283'); await W(Fd, 800); await Fd.page.evaluate(() => A.secJn()); await W(Fd, 1200); await confirmIfAsked(Fd, '615283'); await W(Fd, 800);
  ok('P9.3 con el PIN nuevo vuelve a abrir su bitácora', /NOTA PRIVADA DE ANA/.test(await main(Fd)), (await main(Fd)).slice(0, 300));
  // errores de página
  const allErr = [L, K, A, H, T, Fd, Bt].flatMap(d => d.errs.map(e => d.name + ': ' + e));
  ok('P8 sin errores de JavaScript en ningún equipo', !allErr.length, allErr);
  fs.writeFileSync('/tmp/t_e2e.json', JSON.stringify(R));
  console.log(`\n${n - fails}/${n} OK`); await B.close(); S.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
