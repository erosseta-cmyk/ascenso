// Servidor de pruebas: imita Supabase (autenticación, funciones SQL y funciones del servidor) sobre
// PostgreSQL local con el SQL real de base.sql + sec.sql. Sirve la app tal cual, cambiando solo la URL del servidor.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { mk } = require('./db');
const wa = require('@simplewebauthn/server');
const SECRET = crypto.randomBytes(32);
const b64u = (b) => Buffer.from(b).toString('base64url');
function sign(p) { const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), q = b64u(JSON.stringify(p)); return h + '.' + q + '.' + b64u(crypto.createHmac('sha256', SECRET).update(h + '.' + q).digest()); }
function verify(t) { try { const [h, q, s] = String(t || '').split('.'); if (b64u(crypto.createHmac('sha256', SECRET).update(h + '.' + q).digest()) !== s) return null; const p = JSON.parse(Buffer.from(q, 'base64url')); if (p.exp < Date.now() / 1000) return null; return p; } catch (e) { return null; } }
function cspFix(s) {
  s = s.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\n?/, '');
  const hs = [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => "'sha256-" + crypto.createHash('sha256').update(m[1], 'utf8').digest('base64') + "'");
  return s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="script-src \'self\' ' + hs.join(' ') + "; object-src 'none'; base-uri 'self'\">");
}
async function start(port, SITE) {
  const db = await mk(); let chain = Promise.resolve();
  const lock = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => { }); return p; };
  const q = (s, p) => lock(async () => (await db.query(s, p)).rows);
  const ORIGIN = 'http://localhost:' + port;
  const mail = {}; const refresh = {}; // refresh_token -> session_id
  const args = {}; for (const r of await q("select p.proname n, coalesce(pg_get_function_identity_arguments(p.oid),'') a from pg_proc p where p.pronamespace in ('public'::regnamespace,'sec'::regnamespace)")) args[r.n] = r.a;
  async function asUser(claims, fn) {
    return lock(async () => { await db.exec('begin'); try { await db.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify(claims || {})]); const r = await fn(); await db.exec('commit'); return r; } catch (e) { await db.exec('rollback'); throw e; } });
  }
  async function callFn(schema, name, a, claims) {
    const sig = args[name]; if (sig === undefined) { const e = new Error('Could not find the function ' + schema + '.' + name); e.code = 'PGRST202'; e.status = 404; throw e; }
    const parts = sig ? sig.split(',').map(x => x.trim().split(/\s+/)) : [];
    const vals = [], frag = [];
    for (const [nm, ...ty] of parts) { if (!(nm in (a || {}))) continue; const t = ty.join(' '); vals.push(a[nm] === null ? null : (t === 'jsonb' ? JSON.stringify(a[nm]) : String(a[nm]))); frag.push(nm + ' => $' + vals.length + '::' + t); }
    return asUser(claims, async () => { const r = (await db.query(`select to_jsonb(${schema}.${name}(${frag.join(',')})) as r`, vals)).rows[0]; return r ? r.r : null; });
  }
  async function newSession(uid) {
    const sid = (await q('insert into auth.sessions(user_id) values($1) returning id', [uid]))[0].id;
    return tokens(uid, sid);
  }
  async function tokens(uid, sid) {
    const u = (await q('select id,email,created_at,email_confirmed_at from auth.users where id=$1', [uid]))[0];
    const now = Math.floor(Date.now() / 1000), rt = crypto.randomBytes(16).toString('hex'); refresh[rt] = sid;
    const at = sign({ sub: uid, email: u.email, session_id: sid, role: 'authenticated', aud: 'authenticated', aal: 'aal1', iat: now, exp: now + 3600 });
    return { access_token: at, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: rt, user: userObj(u) };
  }
  const userObj = (u) => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: u.email_confirmed_at, created_at: u.created_at, app_metadata: { provider: 'email' }, user_metadata: {}, identities: [] });
  async function body(req) { return new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => { try { r(d ? JSON.parse(d) : {}) } catch (e) { r({}) } }) }); }
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
  const send = (res, code, obj, h) => { res.writeHead(code, Object.assign({ 'content-type': 'application/json' }, cors, h || {})); res.end(obj === undefined ? '' : JSON.stringify(obj)); };
  const claimsOf = (req) => verify((req.headers.authorization || '').replace(/^Bearer /, ''));
  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, ORIGIN);
    try {
      if (req.method === 'OPTIONS') return send(res, 200, {});
      // ---------- autenticación ----------
      if (u.pathname === '/auth/v1/token') {
        const b = await body(req);
        if (u.searchParams.get('grant_type') === 'password') {
          const r = (await q('select id from auth.users where lower(email)=lower($1) and encrypted_password = extensions.crypt($2, encrypted_password)', [b.email, b.password]))[0];
          if (!r) return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials', code: 'invalid_credentials', msg: 'Invalid login credentials' });
          return send(res, 200, await newSession(r.id));
        }
        if (u.searchParams.get('grant_type') === 'refresh_token') {
          const sid = refresh[b.refresh_token]; delete refresh[b.refresh_token];
          const s = sid && (await q('update auth.sessions set refreshed_at=now() where id=$1 returning user_id', [sid]))[0];
          if (!s) return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid Refresh Token: Refresh Token Not Found', code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
          return send(res, 200, await tokens(s.user_id, sid));
        }
      }
      if (u.pathname === '/auth/v1/signup') { const b = await body(req);
        const r = (await q("insert into auth.users(email,encrypted_password) values(lower($1), extensions.crypt($2, extensions.gen_salt('bf',4))) returning id", [b.email, b.password]))[0];
        return send(res, 200, await newSession(r.id)); }
      if (u.pathname === '/auth/v1/user') {
        const c = claimsOf(req); if (!c) return send(res, 401, { code: 'bad_jwt', msg: 'invalid JWT' });
        if (req.method === 'PUT') { const b = await body(req);
          if (b.password) { await q("update auth.users set encrypted_password = extensions.crypt($2, extensions.gen_salt('bf',4)) where id=$1", [c.sub, b.password]);
            await q('delete from auth.sessions where user_id=$1 and id<>$2', [c.sub, c.session_id]); }   // como Supabase: cambiar la contraseña cierra las demás sesiones
        }
        const usr = (await q('select id,email,created_at,email_confirmed_at from auth.users where id=$1', [c.sub]))[0];
        return usr ? send(res, 200, userObj(usr)) : send(res, 404, { msg: 'User not found' });
      }
      if (u.pathname === '/auth/v1/logout') { const c = claimsOf(req); if (c) { const sc = u.searchParams.get('scope') || 'global';
          if (sc === 'global') await q('delete from auth.sessions where user_id=$1', [c.sub]); else if (sc === 'others') await q('delete from auth.sessions where user_id=$1 and id<>$2', [c.sub, c.session_id]); else await q('delete from auth.sessions where id=$1', [c.session_id]); }
        return send(res, 204); }
      if (u.pathname === '/auth/v1/recover') { const b = await body(req); const r = (await q('select id from auth.users where lower(email)=lower($1)', [b.email]))[0];
        if (r) { const t = crypto.randomBytes(12).toString('hex'); mail[b.email.toLowerCase()] = { t, uid: r.id, link: ORIGIN + '/auth/v1/verify?token=' + t + '&type=recovery&redirect_to=' + encodeURIComponent(u.searchParams.get('redirect_to') || b.redirect_to || ORIGIN + '/') }; }
        return send(res, 200, {}); }
      if (u.pathname === '/auth/v1/verify') { const t = u.searchParams.get('token'); const m = Object.values(mail).find(x => x.t === t);
        if (!m) return send(res, 400, { msg: 'Token has expired or is invalid' }); m.t = null;
        const tk = await newSession(m.uid);
        const to = u.searchParams.get('redirect_to') + '#access_token=' + tk.access_token + '&expires_at=' + tk.expires_at + '&expires_in=3600&refresh_token=' + tk.refresh_token + '&token_type=bearer&type=recovery';
        res.writeHead(303, { Location: to }); return res.end(); }
      // ---------- funciones SQL (como PostgREST) ----------
      if (u.pathname.startsWith('/rest/v1/rpc/')) {
        const name = u.pathname.split('/').pop(); const c = claimsOf(req);
        if ((req.headers.authorization || '').length > 20 && !c) return send(res, 401, { code: 'PGRST301', message: 'JWT expired' });
        if (name.startsWith('svc_') || ['get_state_v2', 'save_state_v2', 'pro_patients'].includes(name) && process.env.KEEP_V2 !== '1')
          return send(res, 404, { code: 'PGRST202', message: 'Could not find the function public.' + name, details: null, hint: null });
        try { return send(res, 200, await callFn('public', name, await body(req), c || { role: 'anon' })); }
        catch (e) { return send(res, e.status || 400, { code: e.code || 'P0001', message: e.message, details: null, hint: null }); }
      }
      // ---------- funciones del servidor ----------
      if (u.pathname === '/functions/v1/sec-llave') {
        const c = claimsOf(req); if (!c) return send(res, 401, { ok: false, msg: 'Sin sesión' });
        const { handle } = await import(require('url').pathToFileURL(path.join(SITE, 'supabase/functions/sec-llave/core.mjs')).href);
        const b = await body(req); const { action, ...rest } = b;
        const svc = (n, a) => callFn('sec', n, a, { role: 'service_role' });
        try { return send(res, 200, await handle(action, rest, { uid: c.sub, sid: c.session_id, email: c.email, origin: ORIGIN, rpID: 'localhost', svc, wa })); }
        catch (e) { const k = (String(e.message).match(/SEC:([a-z_]+)/) || [])[1]; return send(res, 200, { ok: false, sec: k || null, msg: k ? 'No permitido en este momento.' : String(e.message) }); }
      }
      if (u.pathname === '/functions/v1/sec-admin') {
        const c = claimsOf(req); const b = await body(req);
        try { const ok = await callFn('public', 'sec_admin_ok', {}, c);
          if (ok !== true) return send(res, 200, { ok: false, msg: 'Confirma con tu llave y PIN.' });
          const pt = await callFn('public', 'sec_admin_prepare_email_change', { p_old: b.old_email, p_new: b.new_email }, c);
          if (!pt || !pt.ok) return send(res, 200, pt || { ok: false });
          await q('update auth.users set email=lower($2), email_confirmed_at=now() where id=$1', [pt.uid, b.new_email]);
          return send(res, 200, { ok: true }); }
        catch (e) { return send(res, 200, { ok: false, msg: e.message }); }
      }
      if (u.pathname.startsWith('/functions/v1/')) return send(res, 404, { ok: false });
      // ---------- control de la prueba ----------
      if (u.pathname === '/__t/sql') { const b = await body(req); return send(res, 200, await q(b.sql, b.params || [])); }
      if (u.pathname === '/__t/mail') return send(res, 200, mail[(u.searchParams.get('email') || '').toLowerCase()] || null);
      // ---------- archivos de la app ----------
      let f = decodeURIComponent(u.pathname); if (f === '/' || f.endsWith('/')) f += 'index.html';
      if (f === '/sw.js') { res.writeHead(404); return res.end(); }
      const fp = path.join(SITE, f); if (!fp.startsWith(SITE) || !fs.existsSync(fp)) { res.writeHead(404); return res.end(); }
      const ext = path.extname(fp).slice(1);
      let data = fs.readFileSync(fp);
      if (ext === 'html') data = cspFix(data.toString('utf8').replace('https://gtwqhrmobusntfsqebdc.supabase.co', ORIGIN));
      res.writeHead(200, { 'content-type': { html: 'text/html; charset=utf-8', js: 'text/javascript', mjs: 'text/javascript', png: 'image/png', jpg: 'image/jpeg', json: 'application/json', webmanifest: 'application/json' }[ext] || 'application/octet-stream' });
      return res.end(data);
    } catch (e) { console.error('SHIM', req.method, req.url, e); send(res, 500, { message: String(e.message) }); }
  });
  await new Promise(r => srv.listen(port, r));
  return { srv, q, ORIGIN, mail, close: () => srv.close() };
}
module.exports = { start };
