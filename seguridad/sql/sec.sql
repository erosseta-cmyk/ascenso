-- =====================================================================
-- Ascenso v79 · Seguridad de la cuenta: llave, PIN, revocación y recuperación
-- PENDIENTE: no aplicar en producción sin la aprobación de Esteban.
-- Es aditivo: crea el esquema "sec" y funciones nuevas (_v3). No cambia las
-- funciones v2 que usa v78. El día de la publicación hay que retirar el
-- acceso directo a las v2 y a la tabla app_state (ver sec_corte.sql).
-- =====================================================================
create schema if not exists sec;

create table if not exists sec.config(k text primary key, v text not null);
insert into sec.config values ('t0', now()::text) on conflict (k) do nothing;

create table if not exists sec.acct(user_id uuid primary key references auth.users(id) on delete cascade,
  suspended_at timestamptz, suspended_by text, first_key_at timestamptz);
create table if not exists sec.keys(id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade,
  cred_id text not null unique, pubkey text not null, counter bigint not null default 0, label text, via text not null,
  status text not null default 'activa' check (status in ('activa','revocada')),
  created_at timestamptz not null default now(), last_used_at timestamptz, revoked_at timestamptz, revoked_why text);
create table if not exists sec.bind(session_id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  key_id bigint not null references sec.keys(id) on delete cascade,
  cache_key text not null default encode(extensions.gen_random_bytes(32),'base64'), at timestamptz not null default now());
create table if not exists sec.grants(session_id uuid not null, scope text not null, expires_at timestamptz not null, primary key(session_id, scope));
create table if not exists sec.challenges(id uuid primary key default gen_random_uuid(), user_id uuid not null, session_id uuid not null,
  kind text not null check (kind in ('reg','auth')), challenge text not null, created_at timestamptz not null default now(), used_at timestamptz);
create table if not exists sec.pin(user_id uuid primary key references auth.users(id) on delete cascade, hash text not null,
  fails int not null default 0, locked_until timestamptz, set_at timestamptz not null default now());
create table if not exists sec.codes(id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade,
  hash text not null, batch int not null, created_at timestamptz not null default now(), used_at timestamptz);
create table if not exists sec.activation(id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade,
  hash text not null, kind text not null check (kind in ('visita','remota','equipo')), issued_by uuid not null,
  created_at timestamptz not null default now(), expires_at timestamptz not null, used_at timestamptz);
create table if not exists sec.recovery(id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null, method text not null, requested_at timestamptz not null default now(), not_before timestamptz not null,
  status text not null default 'en_espera' check (status in ('en_espera','lista','usada','cancelada')), cancelled_by text, done_at timestamptz);
create table if not exists sec.tries(id bigserial primary key, user_id uuid not null, kind text not null, at timestamptz not null default now());
create table if not exists sec.docs(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('informe','informe_kine')), share_id bigint, created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days');
create table if not exists sec.carers(id bigserial primary key, patient_id uuid not null references auth.users(id) on delete cascade,
  carer_email text not null, scopes text[] not null default '{plan}', created_at timestamptz not null default now(), revoked_at timestamptz);
create table if not exists sec.events(id bigserial primary key, user_id uuid, kind text not null, detail jsonb not null default '{}'::jsonb,
  at timestamptz not null default now(), notify boolean not null default false, notified_at timestamptz);

do $$ declare t text; begin
  foreach t in array array['config','acct','keys','bind','grants','challenges','pin','codes','activation','recovery','tries','docs','carers','events'] loop
    execute format('alter table sec.%I enable row level security', t);
    execute format('revoke all on sec.%I from anon, authenticated', t);
  end loop; end $$;
revoke all on schema sec from anon, authenticated;

-- ---------- utilidades ----------
create or replace function sec.t0() returns timestamptz language sql stable security definer set search_path to '' as
$$ select v::timestamptz from sec.config where k = 't0' $$;
create or replace function sec.sid() returns uuid language sql stable set search_path to '' as
$$ select nullif(auth.jwt()->>'session_id','')::uuid $$;
-- La sesión sigue viva solo si su fila existe en auth.sessions: al revocar un equipo se borra y
-- el permiso de acceso que ya tenía la pestaña abierta deja de servir en la siguiente llamada.
create or replace function sec.alive() returns boolean language sql stable security definer set search_path to '' as
$$ select auth.uid() is not null and exists(select 1 from auth.sessions s where s.id = sec.sid() and s.user_id = auth.uid()) $$;
create or replace function sec.has_history(p_uid uuid) returns boolean language sql stable security definer set search_path to '' as $$
  select coalesce((select (a.data->'onboard'->'health') = 'true'::jsonb
      or jsonb_array_length(case when jsonb_typeof(a.data#>'{train,sessions}')='array' then a.data#>'{train,sessions}' else '[]'::jsonb end) > 0
      or jsonb_array_length(case when jsonb_typeof(a.data->'journal')='array' then a.data->'journal' else '[]'::jsonb end) > 0
      or (jsonb_typeof(a.data->'dayFb')='object' and a.data->'dayFb' <> '{}'::jsonb)
    from public.app_state a where a.user_id = p_uid), false) $$;
create or replace function sec.bound_key() returns bigint language sql stable security definer set search_path to '' as $$
  select b.key_id from sec.bind b join sec.keys k on k.id = b.key_id
  where b.session_id = sec.sid() and b.user_id = auth.uid() and k.status = 'activa' $$;
create or replace function sec.has_grant(p_scope text) returns boolean language sql stable security definer set search_path to '' as $$
  select exists(select 1 from sec.grants g where g.session_id = sec.sid() and g.scope = p_scope and g.expires_at > now()) $$;
create or replace function sec.give(p_sid uuid, p_scope text, p_for interval) returns void language sql security definer set search_path to '' as $$
  insert into sec.grants(session_id, scope, expires_at) values (p_sid, p_scope, now() + p_for)
  on conflict (session_id, scope) do update set expires_at = excluded.expires_at $$;
create or replace function sec.log(p_uid uuid, p_kind text, p_detail jsonb default '{}'::jsonb, p_notify boolean default false) returns void
  language sql security definer set search_path to '' as $$ insert into sec.events(user_id, kind, detail, notify) values (p_uid, p_kind, p_detail, p_notify) $$;
create or replace function sec.hash(p text) returns text language sql volatile security definer set search_path to '' as
$$ select extensions.crypt(p, extensions.gen_salt('bf', 8)) $$;
create or replace function sec.match(p text, h text) returns boolean language sql stable security definer set search_path to '' as
$$ select h is not null and extensions.crypt(p, h) = h $$;
create or replace function sec.norm(p text) returns text language sql immutable set search_path to '' as
$$ select upper(regexp_replace(coalesce(p,''), '[^0-9A-Za-z]', '', 'g')) $$;
-- Código legible: 8 caracteres sin letras confusas (sin 0/O, 1/I/L)
create or replace function sec.new_code(p_digits boolean default false) returns text language plpgsql volatile security definer set search_path to '' as $$
declare a text := case when p_digits then '0123456789' else '23456789ABCDEFGHJKMNPQRSTUVWXYZ' end; r text := ''; b bytea := extensions.gen_random_bytes(8); i int;
begin for i in 0..7 loop r := r || substr(a, 1 + (get_byte(b, i) % length(a)), 1); end loop; return r; end $$;
create or replace function sec.too_many(p_uid uuid, p_kind text, p_max int, p_win interval) returns boolean language sql stable security definer set search_path to '' as
$$ select count(*) >= p_max from sec.tries t where t.user_id = p_uid and t.kind = p_kind and t.at > now() - p_win $$;

-- ---------- estado de seguridad de la cuenta en esta sesión ----------
-- ok                  : este equipo confirmó la llave
-- suspendida          : alguien reportó robo; nada clínico hasta recuperar
-- confirmar_llave     : la cuenta tiene llave, pero este equipo aún no la usó
-- en_espera           : hay una recuperación pendiente para esta sesión
-- antigua_transicion  : cuenta antigua sin llave, sesión abierta antes del cambio (registro diario, nada sensible)
-- activar             : cuenta antigua sin llave, sesión nueva (incluye la que se abre tras restablecer la contraseña)
-- nueva               : cuenta sin historial: debe vincular la llave antes de registrar datos de salud
create or replace function sec.mode() returns text language plpgsql stable security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); v_s auth.sessions; v_u auth.users;
begin
  if not sec.alive() then return 'sin_sesion'; end if;
  -- Una recuperación con código válido, pedida desde esta sesión, es la salida de la suspensión
  if exists(select 1 from sec.recovery r where r.session_id = sec.sid() and r.status in ('en_espera','lista')) then return 'en_espera'; end if;
  if exists(select 1 from sec.acct a where a.user_id = v_uid and a.suspended_at is not null) then return 'suspendida'; end if;
  if sec.bound_key() is not null then return 'ok'; end if;
  if exists(select 1 from sec.keys k where k.user_id = v_uid and k.status = 'activa') then return 'confirmar_llave'; end if;
  if exists(select 1 from sec.keys k where k.user_id = v_uid) then return 'activar'; end if; -- tuvo llaves y todas fueron revocadas
  select * into v_u from auth.users where id = v_uid;
  if sec.has_history(v_uid) or v_u.created_at < sec.t0() then
    select * into v_s from auth.sessions where id = sec.sid();
    if v_s.created_at < sec.t0() then return 'antigua_transicion'; end if;
    return 'activar';
  end if;
  return 'nueva';
end $$;

-- Exige un nivel. 'diario' = registro del día; 'sensible' = bitácora, informes, exportar, llaves, PIN; 'pro' = panel del kinesiólogo
create or replace function sec.need(p_level text) returns text language plpgsql stable security definer set search_path to '' as $$
declare m text := sec.mode();
begin
  if m = 'sin_sesion' then raise exception 'SEC:sin_sesion'; end if;
  if p_level = 'diario' then
    if m in ('ok','antigua_transicion','nueva') then return m; end if;
    raise exception 'SEC:%', m;
  end if;
  if m <> 'ok' then raise exception 'SEC:%', m; end if;
  if p_level = 'sensible' and not sec.has_grant('sensible') then raise exception 'SEC:confirmar'; end if;
  if p_level = 'pro' and not (app.is_pro(auth.uid()) and sec.has_grant('pro')) then raise exception 'SEC:confirmar_pro'; end if;
  return m;
end $$;

-- Quita todo lo que deja entrar a otras sesiones de la cuenta (no toca la que llama si p_keep)
create or replace function sec.kick(p_uid uuid, p_keep uuid) returns int language plpgsql security definer set search_path to '' as $$
declare n int;
begin
  delete from sec.grants g where g.session_id in (select s.id from auth.sessions s where s.user_id = p_uid and s.id is distinct from p_keep);
  delete from sec.bind b where b.user_id = p_uid and b.session_id is distinct from p_keep;
  delete from auth.sessions s where s.user_id = p_uid and s.id is distinct from p_keep;
  get diagnostics n = row_count; return n;
end $$;

-- ---------- lo que ve el cliente ----------
create or replace function public.sec_status() returns jsonb language plpgsql stable security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); m text := sec.mode(); v_rec sec.recovery;
begin
  if m = 'sin_sesion' then return jsonb_build_object('mode', m); end if;
  select * into v_rec from sec.recovery r where r.session_id = sec.sid() and r.status in ('en_espera','lista') order by r.id desc limit 1;
  return jsonb_build_object('mode', m,
    'sensible', sec.has_grant('sensible'), 'pro', app.is_pro(v_uid), 'proOk', sec.has_grant('pro'),
    'pin', exists(select 1 from sec.pin p where p.user_id = v_uid),
    'codes', (select count(*) from sec.codes c where c.user_id = v_uid and c.used_at is null),
    'keys', (select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'label', k.label, 'at', k.created_at, 'last', k.last_used_at, 'via', k.via,
               'here', k.id = sec.bound_key()) order by k.created_at), '[]'::jsonb) from sec.keys k where k.user_id = v_uid and k.status = 'activa'),
    'recovery', case when v_rec.id is null then null else jsonb_build_object('id', v_rec.id, 'method', v_rec.method, 'at', v_rec.requested_at,
               'ready', v_rec.not_before, 'wait_s', greatest(0, extract(epoch from v_rec.not_before - now()))::int) end,
    'pending', (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'method', r.method, 'at', r.requested_at, 'ready', r.not_before)), '[]'::jsonb)
               from sec.recovery r where r.user_id = v_uid and r.status = 'en_espera' and r.session_id <> sec.sid()),
    'carers', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'email', c.carer_email, 'scopes', c.scopes)), '[]'::jsonb)
               from sec.carers c where c.patient_id = v_uid and c.revoked_at is null),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('kind', e.kind, 'at', e.at) order by e.at desc), '[]'::jsonb)
               from (select * from sec.events e where e.user_id = v_uid order by e.at desc limit 8) e));
end $$;

-- ---------- datos del paciente (reemplazan a get_state_v2 / save_state_v2) ----------
create or replace function public.get_state_v3() returns jsonb language plpgsql stable security definer set search_path to '' as $$
declare m text := sec.need('diario'); r jsonb := public.get_state_v2();
begin
  if r is not null and jsonb_typeof(r->'data') = 'object' then r := jsonb_set(r, '{data}', (r->'data') - 'journal'); end if;
  return coalesce(r, '{}'::jsonb) || jsonb_build_object('sec', m,
    'cache_key', (select b.cache_key from sec.bind b where b.session_id = sec.sid() and b.key_id = sec.bound_key()));
end $$;

create or replace function public.save_state_v3(p_data jsonb, p_rev bigint) returns jsonb language plpgsql security definer set search_path to '' as $$
declare m text := sec.need('diario'); v_j jsonb;
begin
  if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'formato inválido'; end if;
  if m = 'nueva' and ((p_data->'onboard'->'health') = 'true'::jsonb
     or jsonb_array_length(case when jsonb_typeof(p_data#>'{train,sessions}')='array' then p_data#>'{train,sessions}' else '[]'::jsonb end) > 0
     or (jsonb_typeof(p_data->'dayFb')='object' and p_data->'dayFb' <> '{}'::jsonb)
     or (jsonb_typeof(p_data#>'{train,parq}')='object')) then
    raise exception 'SEC:llave_primero';
  end if;
  -- La bitácora no viaja en el estado: el servidor conserva la suya
  select a.data->'journal' into v_j from public.app_state a where a.user_id = auth.uid();
  return public.save_state_v2(jsonb_set(p_data - 'journal', '{journal}', coalesce(v_j, '[]'::jsonb)), p_rev);
end $$;

-- ---------- bitácora ----------
create or replace function public.journal_list() returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin perform sec.need('sensible');
  return coalesce((select a.data->'journal' from public.app_state a where a.user_id = auth.uid()), '[]'::jsonb); end $$;
create or replace function public.journal_add(p_text text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_id text := substr(md5(random()::text), 1, 8);
begin
  perform sec.need('diario');
  if sec.mode() = 'nueva' then raise exception 'SEC:llave_primero'; end if;
  if length(trim(coalesce(p_text,''))) = 0 or length(p_text) > 1000 then return jsonb_build_object('ok', false); end if;
  update public.app_state a set data = jsonb_set(a.data, '{journal}', jsonb_build_array(jsonb_build_object('id', v_id, 'at', (extract(epoch from now())*1000)::bigint, 'text', p_text))
      || case when jsonb_typeof(a.data->'journal')='array' then a.data->'journal' else '[]'::jsonb end), updated_at = now(), rev = a.rev + 1
    where a.user_id = auth.uid();
  return jsonb_build_object('ok', found, 'id', v_id);
end $$;
create or replace function public.journal_del(p_id text) returns jsonb language plpgsql security definer set search_path to '' as $$
begin perform sec.need('sensible');
  update public.app_state a set data = jsonb_set(a.data, '{journal}', coalesce((select jsonb_agg(e) from jsonb_array_elements(a.data->'journal') e where e->>'id' <> p_id), '[]'::jsonb)),
    updated_at = now(), rev = a.rev + 1 where a.user_id = auth.uid();
  return jsonb_build_object('ok', found); end $$;

-- ---------- informes y exportación ----------
create or replace function public.doc_new(p_kind text default 'informe') returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_id uuid;
begin perform sec.need('diario');
  insert into sec.docs(user_id, kind) values (auth.uid(), 'informe') returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id); end $$;
-- El enlace del correo solo lleva el id. Abrirlo exige sesión del dueño, llave en este equipo y PIN.
create or replace function public.doc_open(p_doc uuid) returns jsonb language plpgsql security definer set search_path to '' as $$
declare d sec.docs; st jsonb;
begin
  perform sec.need('sensible');
  select * into d from sec.docs where id = p_doc;
  if d.id is null or d.user_id <> auth.uid() or d.expires_at < now() then
    perform sec.log(auth.uid(), 'informe_rechazado', jsonb_build_object('doc', p_doc)); return jsonb_build_object('ok', false, 'msg', 'Este informe no existe, venció o no es tuyo.'); end if;
  select a.data - 'journal' into st from public.app_state a where a.user_id = auth.uid();
  perform sec.log(auth.uid(), 'informe_abierto', jsonb_build_object('doc', p_doc));
  return jsonb_build_object('ok', true, 'kind', d.kind, 'created', d.created_at, 'data', st);
end $$;
create or replace function public.export_data() returns jsonb language plpgsql security definer set search_path to '' as $$
begin perform sec.need('sensible'); perform sec.log(auth.uid(), 'exportacion', '{}'::jsonb, true);
  return (select a.data from public.app_state a where a.user_id = auth.uid()); end $$;

-- ---------- PIN de Ascenso (lo sabe el paciente, no el cuidador) ----------
create or replace function public.pin_set(p_pin text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid();
begin
  if sec.mode() <> 'ok' then raise exception 'SEC:%', sec.mode(); end if;
  -- Primer PIN: basta la llave recién usada. Cambiarlo: hay que haber confirmado con llave + PIN actual.
  if exists(select 1 from sec.pin where user_id = v_uid) then
    if not sec.has_grant('sensible') then raise exception 'SEC:confirmar'; end if;
  elsif not sec.has_grant('llave') then raise exception 'SEC:llave'; end if;
  if p_pin !~ '^\d{6}$' or p_pin in ('000000','111111','222222','333333','444444','555555','666666','777777','888888','999999','123456','654321','012345','121212')
    then return jsonb_build_object('ok', false, 'msg', 'Elige 6 números que no sean seguidos ni repetidos.'); end if;
  insert into sec.pin(user_id, hash) values (v_uid, sec.hash(p_pin))
    on conflict (user_id) do update set hash = excluded.hash, fails = 0, locked_until = null, set_at = now();
  perform sec.give(sec.sid(), 'sensible', interval '5 minutes');
  if app.is_pro(v_uid) then perform sec.give(sec.sid(), 'pro', interval '12 hours'); end if;
  perform sec.log(v_uid, 'pin_cambiado', '{}'::jsonb, true);
  return jsonb_build_object('ok', true);
end $$;
-- Paso 2 de la confirmación: la llave ya se usó en este equipo hace menos de 2 minutos
create or replace function public.pin_check(p_pin text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); p sec.pin;
begin
  if sec.mode() <> 'ok' then raise exception 'SEC:%', sec.mode(); end if;
  if not sec.has_grant('llave') then raise exception 'SEC:llave'; end if;
  select * into p from sec.pin where user_id = v_uid for update;
  if p.user_id is null then return jsonb_build_object('ok', false, 'nopin', true); end if;
  if p.locked_until is not null and p.locked_until > now() then
    return jsonb_build_object('ok', false, 'locked', true, 'until', p.locked_until, 'msg', 'Demasiados intentos. Espera antes de volver a intentar.'); end if;
  if not sec.match(p_pin, p.hash) then
    update sec.pin set fails = fails + 1, locked_until = case when fails + 1 >= 8 then now() + interval '24 hours' when fails + 1 >= 5 then now() + interval '15 minutes' end where user_id = v_uid;
    if p.fails + 1 >= 5 then perform sec.log(v_uid, 'pin_bloqueado', jsonb_build_object('fails', p.fails + 1), true);
      return jsonb_build_object('ok', false, 'locked', true, 'until', now() + interval '15 minutes', 'msg', 'Demasiados intentos. Espera antes de volver a intentar.'); end if;
    return jsonb_build_object('ok', false, 'left', greatest(0, 5 - (p.fails + 1)), 'msg', 'PIN incorrecto.');
  end if;
  update sec.pin set fails = 0, locked_until = null where user_id = v_uid;
  delete from sec.grants where session_id = sec.sid() and scope = 'llave';
  perform sec.give(sec.sid(), 'sensible', interval '5 minutes');
  if app.is_pro(v_uid) then perform sec.give(sec.sid(), 'pro', interval '12 hours'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- códigos para casa y códigos de activación ----------
create or replace function public.codes_new() returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); v_b int; c text; out_ text[] := '{}'; i int;
begin
  perform sec.need('sensible');
  select coalesce(max(batch), 0) + 1 into v_b from sec.codes where user_id = v_uid;
  update sec.codes set used_at = now() where user_id = v_uid and used_at is null;
  for i in 1..8 loop c := sec.new_code(); out_ := out_ || (substr(c,1,4) || '-' || substr(c,5,4));
    insert into sec.codes(user_id, hash, batch) values (v_uid, sec.hash(c), v_b); end loop;
  perform sec.log(v_uid, 'codigos_nuevos', '{}'::jsonb, true);
  return jsonb_build_object('ok', true, 'codes', to_jsonb(out_));
end $$;
-- Desde un teléfono que ya tiene la llave: código para sumar un teléfono nuevo (10 minutos, inmediato)
create or replace function public.equipo_code() returns jsonb language plpgsql security definer set search_path to '' as $$
declare c text := sec.new_code(true);
begin perform sec.need('sensible');
  insert into sec.activation(user_id, hash, kind, issued_by, expires_at) values (auth.uid(), sec.hash(c), 'equipo', auth.uid(), now() + interval '10 minutes');
  perform sec.log(auth.uid(), 'codigo_equipo', '{}'::jsonb, true);
  return jsonb_build_object('ok', true, 'code', c, 'minutes', 10); end $$;
-- El kinesiólogo entrega un código de activación: en la visita (comprobó la cédula) o a distancia (con espera)
create or replace function public.pro_activation_issue(p_share bigint, p_kind text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_pt uuid; c text := sec.new_code(true);
begin
  perform sec.need('pro');
  if p_kind not in ('visita','remota') then raise exception 'tipo inválido'; end if;
  select s.patient_id into v_pt from public.shares s join auth.users u on u.id = auth.uid() and lower(u.email) = s.pro_email
    where s.id = p_share and s.revoked_at is null;
  if v_pt is null then return jsonb_build_object('ok', false, 'msg', 'Esta persona ya no comparte su avance contigo.'); end if;
  update sec.activation set used_at = now() where user_id = v_pt and used_at is null and kind in ('visita','remota');
  insert into sec.activation(user_id, hash, kind, issued_by, expires_at)
    values (v_pt, sec.hash(c), p_kind, auth.uid(), now() + case when p_kind = 'visita' then interval '30 minutes' else interval '24 hours' end);
  perform sec.log(v_pt, 'activacion_emitida', jsonb_build_object('kind', p_kind), true);
  return jsonb_build_object('ok', true, 'code', c, 'kind', p_kind);
end $$;
-- Pacientes sin kinesiólogo: la emite la administración de Ascenso con la misma regla
create or replace function public.admin_activation_issue(p_email text, p_kind text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_pt uuid; c text := sec.new_code(true);
begin
  perform sec.need('pro');
  if not app.is_admin(auth.uid()) then raise exception 'solo administración'; end if;
  if p_kind not in ('visita','remota') then raise exception 'tipo inválido'; end if;
  select id into v_pt from auth.users where lower(email) = lower(trim(p_email));
  if v_pt is null then return jsonb_build_object('ok', false, 'msg', 'No existe una cuenta con ese correo.'); end if;
  insert into sec.activation(user_id, hash, kind, issued_by, expires_at)
    values (v_pt, sec.hash(c), p_kind, auth.uid(), now() + case when p_kind = 'visita' then interval '30 minutes' else interval '24 hours' end);
  perform sec.log(v_pt, 'activacion_emitida', jsonb_build_object('kind', p_kind, 'por', 'administracion'), true);
  return jsonb_build_object('ok', true, 'code', c, 'kind', p_kind);
end $$;

-- ---------- recuperación ----------
-- Espera según el riesgo de cada método:
--   equipo (desde tu otro teléfono con llave y PIN) .... 0 h: ya probó dos factores
--   visita (el kine vio tu cédula en persona) .......... 0 h
--   codigo_pin (código de casa + PIN de Ascenso) ....... 0 h: algo que tienes en casa + algo que sabes
--   codigo (código de casa sin PIN) .................... 24 h: un solo factor, con aviso
--   remota (el kine por teléfono o video) .............. 72 h: identidad verificada a distancia, con aviso
create or replace function public.rec_start(p_code text, p_pin text default null) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); c text := sec.norm(p_code); a sec.activation; h sec.codes; v_m text; v_wait interval; v_id bigint; p sec.pin;
begin
  if not sec.alive() then raise exception 'SEC:sin_sesion'; end if;
  if sec.mode() = 'ok' then return jsonb_build_object('ok', false, 'msg', 'Este teléfono ya tiene tu llave.'); end if;
  if sec.too_many(v_uid, 'rec', 5, interval '1 hour') then
    return jsonb_build_object('ok', false, 'msg', 'Demasiados intentos. Espera una hora o pide ayuda a tu kinesiólogo.'); end if;
  select * into a from sec.activation x where x.user_id = v_uid and x.used_at is null and x.expires_at > now() and sec.match(c, x.hash) order by x.id desc limit 1;
  if a.id is not null then
    update sec.activation set used_at = now() where id = a.id;
    v_m := a.kind; v_wait := case when a.kind = 'remota' then interval '72 hours' else interval '0' end;
  else
    select * into h from sec.codes x where x.user_id = v_uid and x.used_at is null and sec.match(c, x.hash) limit 1;
    if h.id is null then
      insert into sec.tries(user_id, kind) values (v_uid, 'rec');
      perform sec.log(v_uid, 'recuperacion_fallida', '{}'::jsonb, false);
      return jsonb_build_object('ok', false, 'msg', 'Ese código no es válido o ya se usó.'); end if;
    update sec.codes set used_at = now() where id = h.id;
    select * into p from sec.pin where user_id = v_uid;
    if p_pin is not null and p.user_id is not null and (p.locked_until is null or p.locked_until < now()) and sec.match(p_pin, p.hash) then
      v_m := 'codigo_pin'; v_wait := interval '0';
    else v_m := 'codigo'; v_wait := interval '24 hours'; end if;
  end if;
  update sec.recovery set status = 'cancelada', cancelled_by = 'reemplazada' where session_id = sec.sid() and status in ('en_espera','lista');
  insert into sec.recovery(user_id, session_id, method, not_before) values (v_uid, sec.sid(), v_m, now() + v_wait) returning id into v_id;
  perform sec.log(v_uid, 'recuperacion_pedida', jsonb_build_object('method', v_m, 'espera_h', extract(epoch from v_wait)/3600), true);
  return jsonb_build_object('ok', true, 'id', v_id, 'method', v_m, 'wait_s', extract(epoch from v_wait)::int);
end $$;
-- Cancelar: solo desde un teléfono con llave activa y PIN, o el kinesiólogo / la administración.
-- Un correo no puede cancelar, y un equipo revocado o denunciado tampoco (ya no tiene llave activa).
create or replace function public.rec_cancel(p_id bigint) returns jsonb language plpgsql security definer set search_path to '' as $$
declare r sec.recovery; v_by text;
begin
  select * into r from sec.recovery where id = p_id and status = 'en_espera';
  if r.id is null then return jsonb_build_object('ok', false); end if;
  if r.user_id = auth.uid() then perform sec.need('sensible'); v_by := 'paciente';
  elsif sec.has_grant('pro') and app.is_pro(auth.uid()) and exists(select 1 from public.shares s join auth.users u on u.id = auth.uid() and lower(u.email) = s.pro_email where s.patient_id = r.user_id and s.revoked_at is null) then v_by := 'kinesiologo';
  elsif sec.has_grant('pro') and app.is_admin(auth.uid()) then v_by := 'administracion';
  else raise exception 'SEC:confirmar'; end if;
  update sec.recovery set status = 'cancelada', cancelled_by = v_by where id = p_id;
  perform sec.log(r.user_id, 'recuperacion_cancelada', jsonb_build_object('por', v_by), true);
  return jsonb_build_object('ok', true);
end $$;
-- Cuando se cumple la espera: deja registrar la llave en este teléfono
create or replace function public.rec_finish() returns jsonb language plpgsql security definer set search_path to '' as $$
declare r sec.recovery;
begin
  if not sec.alive() then raise exception 'SEC:sin_sesion'; end if;
  select * into r from sec.recovery where session_id = sec.sid() and status in ('en_espera','lista') order by id desc limit 1 for update;
  if r.id is null then return jsonb_build_object('ok', false, 'msg', 'No hay una recuperación pendiente en este teléfono.'); end if;
  if r.not_before > now() then return jsonb_build_object('ok', false, 'wait_s', extract(epoch from r.not_before - now())::int); end if;
  update sec.recovery set status = 'lista' where id = r.id;
  perform sec.give(sec.sid(), 'alta', interval '15 minutes');
  return jsonb_build_object('ok', true, 'method', r.method);
end $$;

-- ---------- robo, suspensión y revocación ----------
-- Suspender: inmediato y sin PIN, desde cualquier sesión de la cuenta, o por el kine / la administración.
-- No entrega la cuenta a nadie: deja todo cerrado hasta una recuperación.
create or replace function public.sec_suspend(p_email text default null) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid; v_by text; n int;
begin
  if not sec.alive() then raise exception 'SEC:sin_sesion'; end if;
  if p_email is null then v_uid := auth.uid(); v_by := 'paciente';
  else
    select u.id into v_uid from auth.users u where lower(u.email) = lower(trim(p_email));
    if v_uid is null then return jsonb_build_object('ok', false, 'msg', 'No existe una cuenta con ese correo.'); end if;
    if sec.has_grant('pro') and app.is_pro(auth.uid()) and exists(select 1 from public.shares s join auth.users u on u.id = auth.uid() and lower(u.email) = s.pro_email where s.patient_id = v_uid and s.revoked_at is null) then v_by := 'kinesiologo';
    elsif sec.has_grant('pro') and app.is_admin(auth.uid()) then v_by := 'administracion';
    else raise exception 'SEC:confirmar_pro'; end if;
  end if;
  insert into sec.acct(user_id, suspended_at, suspended_by) values (v_uid, now(), v_by)
    on conflict (user_id) do update set suspended_at = now(), suspended_by = v_by;
  n := sec.kick(v_uid, case when v_uid = auth.uid() then sec.sid() end);
  delete from sec.grants where session_id = sec.sid() and v_uid = auth.uid();
  delete from sec.bind where session_id = sec.sid() and v_uid = auth.uid();
  update sec.recovery set status = 'cancelada', cancelled_by = 'suspension' where user_id = v_uid and status in ('en_espera','lista') and session_id is distinct from sec.sid();
  perform sec.log(v_uid, 'cuenta_suspendida', jsonb_build_object('por', v_by, 'sesiones_cerradas', n), true);
  return jsonb_build_object('ok', true, 'closed', n);
end $$;
-- Revocar una llave (un teléfono): exige llave + PIN en el teléfono desde donde se revoca
create or replace function public.key_revoke(p_key bigint) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); n int;
begin
  perform sec.need('sensible');
  if p_key = sec.bound_key() then return jsonb_build_object('ok', false, 'msg', 'No puedes revocar la llave del teléfono que estás usando. Hazlo desde otro, o usa «Cerrar sesión».'); end if;
  update sec.keys set status = 'revocada', revoked_at = now(), revoked_why = 'paciente' where id = p_key and user_id = v_uid and status = 'activa';
  if not found then return jsonb_build_object('ok', false); end if;
  delete from sec.grants where session_id in (select session_id from sec.bind where key_id = p_key);
  delete from auth.sessions where id in (select session_id from sec.bind where key_id = p_key);
  get diagnostics n = row_count;
  delete from sec.bind where key_id = p_key;
  perform sec.log(v_uid, 'llave_revocada', jsonb_build_object('key', p_key, 'sesiones_cerradas', n), true);
  return jsonb_build_object('ok', true, 'closed', n);
end $$;
create or replace function public.pro_lift_suspension(p_share bigint) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_pt uuid;
begin perform sec.need('pro');
  select s.patient_id into v_pt from public.shares s join auth.users u on u.id = auth.uid() and lower(u.email) = s.pro_email where s.id = p_share and s.revoked_at is null;
  if v_pt is null then return jsonb_build_object('ok', false); end if;
  -- Levantar la suspensión no entrega la cuenta: el paciente igual necesitará un código de activación para una llave nueva
  update sec.acct set suspended_at = null where user_id = v_pt;
  update sec.keys set status = 'revocada', revoked_at = now(), revoked_why = 'suspension' where user_id = v_pt and status = 'activa';
  perform sec.log(v_pt, 'suspension_levantada', jsonb_build_object('por', 'kinesiologo'), true);
  return jsonb_build_object('ok', true); end $$;

-- ---------- quien me ayuda (cuidador con cuenta propia) ----------
create or replace function public.carer_invite(p_email text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare e text := lower(trim(coalesce(p_email,'')));
begin perform sec.need('sensible');
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok', false, 'msg', 'Escribe un correo válido.'); end if;
  if e = lower(auth.email()) then return jsonb_build_object('ok', false, 'msg', 'Escribe el correo de la persona que te ayuda, no el tuyo.'); end if;
  if (select count(*) from sec.carers where patient_id = auth.uid() and revoked_at is null) >= 2 then return jsonb_build_object('ok', false, 'msg', 'Puedes tener hasta 2 personas.'); end if;
  insert into sec.carers(patient_id, carer_email) values (auth.uid(), e);
  perform sec.log(auth.uid(), 'ayudante_agregado', jsonb_build_object('email', e), true);
  return jsonb_build_object('ok', true); end $$;
create or replace function public.carer_revoke(p_id bigint) returns jsonb language plpgsql security definer set search_path to '' as $$
begin perform sec.need('sensible');
  update sec.carers set revoked_at = now() where id = p_id and patient_id = auth.uid() and revoked_at is null;
  return jsonb_build_object('ok', found); end $$;
-- Lo único que ve quien ayuda: nombre, ejercicios indicados hoy y los hábitos (sin dolor, sin bitácora, sin cuestionario)
create or replace function public.carer_view() returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin
  perform sec.need('diario');
  if sec.mode() <> 'ok' then raise exception 'SEC:%', sec.mode(); end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', left(coalesce(a.data->'profile'->>'name',''),30),
      'rx', (select coalesce(jsonb_agg(jsonb_build_object('name', r->>'name', 'dose', r->>'dose')), '[]'::jsonb)
             from public.shares s, jsonb_array_elements(case when jsonb_typeof(s.rx)='array' then s.rx else '[]'::jsonb end) r
             where s.patient_id = c.patient_id and s.revoked_at is null),
      'missions', (select coalesce(jsonb_agg(m->>'name'), '[]'::jsonb) from jsonb_array_elements(case when jsonb_typeof(a.data->'missions')='array' then a.data->'missions' else '[]'::jsonb end) m where m->>'archived' is null))), '[]'::jsonb)
    from sec.carers c join public.app_state a on a.user_id = c.patient_id
    where c.revoked_at is null and c.carer_email = lower(auth.email()));
end $$;

-- ---------- panel del kinesiólogo ----------
create or replace function public.pro_patients_v3() returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin perform sec.need('pro'); return public.pro_patients(); end $$;

-- ---------- solo para la función del servidor que verifica la llave (service_role) ----------
create or replace function sec.svc_mode(p_uid uuid, p_sid uuid) returns text language plpgsql stable security definer set search_path to '' as $$
begin perform set_config('request.jwt.claims', jsonb_build_object('sub', p_uid, 'session_id', p_sid, 'role', 'authenticated')::text, true); return sec.mode(); end $$;
-- ¿Puede esta sesión registrar una llave? Nunca solo con el correo.
create or replace function sec.svc_can_register(p_uid uuid, p_sid uuid) returns text language plpgsql stable security definer set search_path to '' as $$
declare m text := sec.svc_mode(p_uid, p_sid);
begin
  -- La recuperación terminada vale incluso con la cuenta suspendida: es la forma de salir de la suspensión
  if exists(select 1 from sec.grants g where g.session_id = p_sid and g.scope = 'alta' and g.expires_at > now()) then return 'alta'; end if;
  if m = 'suspendida' then return 'suspendida'; end if;
  if m = 'nueva' then return 'nueva'; end if;
  if m = 'ok' and exists(select 1 from sec.grants g where g.session_id = p_sid and g.scope = 'sensible' and g.expires_at > now()) then return 'reemplazo'; end if;
  return null;
end $$;
create or replace function sec.svc_challenge(p_uid uuid, p_sid uuid, p_kind text, p_ch text) returns uuid language plpgsql security definer set search_path to '' as $$
declare v_id uuid;
begin
  if p_kind = 'reg' and sec.svc_can_register(p_uid, p_sid) is null then raise exception 'SEC:no_puede_registrar'; end if;
  if p_kind = 'auth' and sec.svc_mode(p_uid, p_sid) in ('suspendida','sin_sesion') then raise exception 'SEC:%', sec.svc_mode(p_uid, p_sid); end if;
  delete from sec.challenges where created_at < now() - interval '10 minutes';
  insert into sec.challenges(user_id, session_id, kind, challenge) values (p_uid, p_sid, p_kind, p_ch) returning id into v_id;
  return v_id; end $$;
create or replace function sec.svc_take_challenge(p_id uuid, p_uid uuid, p_sid uuid, p_kind text) returns text language plpgsql security definer set search_path to '' as $$
declare c text;
begin update sec.challenges set used_at = now() where id = p_id and user_id = p_uid and session_id = p_sid and kind = p_kind and used_at is null and created_at > now() - interval '5 minutes'
  returning challenge into c; return c; end $$;
create or replace function sec.svc_key_add(p_uid uuid, p_sid uuid, p_cred text, p_pub text, p_counter bigint, p_label text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare why text := sec.svc_can_register(p_uid, p_sid); v_k bigint; n int := 0; r sec.recovery;
begin
  if why is null or why = 'suspendida' then raise exception 'SEC:no_puede_registrar'; end if;
  insert into sec.keys(user_id, cred_id, pubkey, counter, label, via) values (p_uid, p_cred, p_pub, p_counter, left(coalesce(p_label,'Teléfono'),60), why) returning id into v_k;
  select * into r from sec.recovery where session_id = p_sid and status = 'lista' order by id desc limit 1;
  if why = 'alta' and r.method in ('codigo','codigo_pin','remota','visita') then
    -- Recuperación por pérdida o robo: este teléfono queda como el único; los demás pierden la llave y la sesión
    update sec.keys set status = 'revocada', revoked_at = now(), revoked_why = 'recuperacion' where user_id = p_uid and id <> v_k and status = 'activa';
    n := sec.kick(p_uid, p_sid);
  end if;
  update sec.recovery set status = 'usada', done_at = now() where session_id = p_sid and status = 'lista';
  delete from sec.grants where session_id = p_sid and scope = 'alta';
  insert into sec.acct(user_id, first_key_at) values (p_uid, now()) on conflict (user_id) do update set suspended_at = null, first_key_at = coalesce(sec.acct.first_key_at, now());
  insert into sec.bind(session_id, user_id, key_id) values (p_sid, p_uid, v_k) on conflict (session_id) do update set key_id = excluded.key_id, at = now();
  perform sec.give(p_sid, 'llave', interval '2 minutes');
  perform sec.log(p_uid, 'llave_nueva', jsonb_build_object('via', why, 'recuperacion', r.method, 'sesiones_cerradas', n), true);
  return jsonb_build_object('ok', true, 'key', v_k, 'via', why, 'closed', n);
end $$;
create or replace function sec.svc_key_get(p_uid uuid, p_cred text) returns jsonb language sql stable security definer set search_path to '' as $$
  select jsonb_build_object('id', id, 'pubkey', pubkey, 'counter', counter) from sec.keys where user_id = p_uid and cred_id = p_cred and status = 'activa' $$;
create or replace function sec.svc_key_list(p_uid uuid) returns jsonb language sql stable security definer set search_path to '' as $$
  select coalesce(jsonb_agg(cred_id), '[]'::jsonb) from sec.keys where user_id = p_uid and status = 'activa' $$;
create or replace function sec.svc_assert_ok(p_uid uuid, p_sid uuid, p_cred text, p_counter bigint) returns jsonb language plpgsql security definer set search_path to '' as $$
declare k sec.keys; m text := sec.svc_mode(p_uid, p_sid);
begin
  if m in ('suspendida','sin_sesion') then raise exception 'SEC:%', m; end if;
  select * into k from sec.keys where user_id = p_uid and cred_id = p_cred and status = 'activa' for update;
  if k.id is null then raise exception 'SEC:llave_desconocida'; end if;
  if p_counter > 0 and p_counter <= k.counter then perform sec.log(p_uid, 'llave_clonada', jsonb_build_object('key', k.id), true); raise exception 'SEC:llave_clonada'; end if;
  update sec.keys set counter = greatest(counter, p_counter), last_used_at = now() where id = k.id;
  insert into sec.bind(session_id, user_id, key_id) values (p_sid, p_uid, k.id) on conflict (session_id) do update set key_id = excluded.key_id;
  perform sec.give(p_sid, 'llave', interval '2 minutes');
  return jsonb_build_object('ok', true, 'key', k.id);
end $$;

revoke all on all functions in schema sec from public, anon, authenticated;
grant usage on schema sec to service_role;
grant execute on function sec.svc_mode(uuid,uuid), sec.svc_can_register(uuid,uuid), sec.svc_challenge(uuid,uuid,text,text), sec.svc_take_challenge(uuid,uuid,uuid,text),
  sec.svc_key_add(uuid,uuid,text,text,bigint,text), sec.svc_key_get(uuid,text), sec.svc_key_list(uuid), sec.svc_assert_ok(uuid,uuid,text,bigint) to service_role;
do $$ declare f text; begin
  foreach f in array array['sec_status()','get_state_v3()','save_state_v3(jsonb,bigint)','journal_list()','journal_add(text)','journal_del(text)','doc_new(text)','doc_open(uuid)',
    'export_data()','pin_set(text)','pin_check(text)','codes_new()','equipo_code()','pro_activation_issue(bigint,text)','admin_activation_issue(text,text)','rec_start(text,text)',
    'rec_cancel(bigint)','rec_finish()','sec_suspend(text)','key_revoke(bigint)','pro_lift_suspension(bigint)','carer_invite(text)','carer_revoke(bigint)','carer_view()','pro_patients_v3()'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop; end $$;

-- ---------- cambio de correo asistido (paciente que perdió su Gmail) ----------
create or replace function public.sec_admin_ok() returns boolean language sql stable security definer set search_path to '' as $$
  select sec.mode() = 'ok' and app.is_admin(auth.uid()) and sec.has_grant('pro') $$;
create or replace function public.sec_admin_prepare_email_change(p_old text, p_new text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid; n int; e text := lower(trim(coalesce(p_new,'')));
begin
  if not public.sec_admin_ok() then raise exception 'SEC:confirmar_pro'; end if;
  select id into v_uid from auth.users where lower(email) = lower(trim(p_old));
  if v_uid is null then return jsonb_build_object('ok', false, 'msg', 'No existe una cuenta con ese correo.'); end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or exists(select 1 from auth.users where lower(email) = e) then return jsonb_build_object('ok', false, 'msg', 'El correo nuevo no es válido o ya está en uso.'); end if;
  insert into sec.acct(user_id, suspended_at, suspended_by) values (v_uid, now(), 'cambio_correo') on conflict (user_id) do update set suspended_at = now(), suspended_by = 'cambio_correo';
  update sec.keys set status = 'revocada', revoked_at = now(), revoked_why = 'cambio_correo' where user_id = v_uid and status = 'activa';
  n := sec.kick(v_uid, null);
  perform sec.log(v_uid, 'correo_cambiado', jsonb_build_object('por', 'administracion', 'sesiones_cerradas', n), true);
  return jsonb_build_object('ok', true, 'uid', v_uid, 'closed', n);
end $$;
revoke all on function public.sec_admin_ok(), public.sec_admin_prepare_email_change(text,text) from public, anon;
grant execute on function public.sec_admin_ok(), public.sec_admin_prepare_email_change(text,text) to authenticated;

-- ---------- olvidé mi PIN ----------
-- Requiere la llave de este teléfono (recién usada) y además un código de la hoja de casa o uno entregado
-- por el kinesiólogo en la visita. Un código «a distancia» no sirve aquí: quien conoce el código del teléfono
-- (por ejemplo, un familiar) podría pedirlo por teléfono haciéndose pasar por el paciente.
create or replace function public.pin_forgot(p_code text) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); c text := sec.norm(p_code); a sec.activation; h sec.codes;
begin
  if sec.mode() <> 'ok' then raise exception 'SEC:%', sec.mode(); end if;
  if not sec.has_grant('llave') then raise exception 'SEC:llave'; end if;
  if sec.too_many(v_uid, 'pin_forgot', 5, interval '1 hour') then return jsonb_build_object('ok', false, 'msg', 'Demasiados intentos. Espera una hora o pide ayuda a tu kinesiólogo.'); end if;
  select * into a from sec.activation x where x.user_id = v_uid and x.used_at is null and x.expires_at > now() and x.kind = 'visita' and sec.match(c, x.hash) order by x.id desc limit 1;
  if a.id is not null then update sec.activation set used_at = now() where id = a.id;
  else
    select * into h from sec.codes x where x.user_id = v_uid and x.used_at is null and sec.match(c, x.hash) limit 1;
    if h.id is null then insert into sec.tries(user_id, kind) values (v_uid, 'pin_forgot'); return jsonb_build_object('ok', false, 'msg', 'Ese código no es válido o ya se usó.'); end if;
    update sec.codes set used_at = now() where id = h.id;
  end if;
  delete from sec.pin where user_id = v_uid;
  perform sec.give(sec.sid(), 'llave', interval '5 minutes');
  perform sec.log(v_uid, 'pin_olvidado', '{}'::jsonb, true);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.pin_forgot(text) from public, anon;
grant execute on function public.pin_forgot(text) to authenticated;
