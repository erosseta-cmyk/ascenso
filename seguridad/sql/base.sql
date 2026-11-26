-- Réplica mínima del servidor real de Ascenso para pruebas locales (PGlite). Solo estructura, sin datos reales.
create schema if not exists auth; create schema if not exists app; create schema if not exists extensions;
create extension if not exists pgcrypto schema extensions;
do $$ begin create role authenticated; exception when others then null; end $$;
do $$ begin create role anon; exception when others then null; end $$;
do $$ begin create role service_role; exception when others then null; end $$;
create table auth.users(id uuid primary key default gen_random_uuid(), email text unique, encrypted_password text, email_confirmed_at timestamptz default now(), created_at timestamptz default now());
create table auth.sessions(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, created_at timestamptz default now(), refreshed_at timestamptz default now(), aal text default 'aal1');
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
create function auth.email() returns text language sql stable as $$ select auth.jwt()->>'email' $$;
create table public.app_state(user_id uuid primary key, data jsonb default '{}'::jsonb, updated_at timestamptz default now(), rev bigint default 0);
create table public.memberships(user_id uuid primary key, trial_start timestamptz, suspended boolean default false, created_at timestamptz default now());
create table public.periods(id bigserial primary key, user_id uuid, kind text, start_at timestamptz, end_at timestamptz);
create table public.pro_emails(email text primary key, added_at timestamptz default now());
create table public.admin_emails(email text primary key);
create table public.audit_log(id bigserial primary key, actor uuid, target uuid, action text, detail text, created_at timestamptz default now());
create table public.contact_prefs(user_id uuid primary key, phone text, wa_ok boolean default false, wa_ok_at timestamptz, updated_at timestamptz default now());
create table public.shares(id bigserial primary key, patient_id uuid, pro_email text, consent_version text, created_at timestamptz default now(), revoked_at timestamptz, rx jsonb, rx_at timestamptz, minor_ok_at timestamptz, minor_ok_by text);
create table public.pro_clearances(id bigserial primary key, share_id bigint, patient_id uuid, pro_email text, kind text, parq_key text, note text, created_at timestamptz default now(), revoked_at timestamptz);
create table public.pro_reports(id bigserial primary key, share_id bigint, patient_id uuid, pro_email text, day date, kind text default 'caminata', note text, created_at timestamptz default now(), revoked_at timestamptz);
create table public.rx_history(id bigserial primary key, share_id bigint, patient_id uuid, pro_email text, rx jsonb, rx_at timestamptz default now());
create function app.trial_days() returns int language sql immutable as $$ select 30 $$;
create function app.is_admin(p_uid uuid) returns boolean language sql stable security definer set search_path to '' as $$
  select exists(select 1 from auth.users u join public.admin_emails a on lower(a.email) = lower(u.email) where u.id = p_uid and u.email_confirmed_at is not null) $$;
create function app.is_pro(p_uid uuid) returns boolean language sql stable security definer set search_path to '' as $$
  select exists(select 1 from auth.users u join public.pro_emails pe on pe.email = lower(u.email) where u.id = p_uid and u.email_confirmed_at is not null) $$;
create function app.expiry(p_uid uuid) returns timestamptz language sql stable security definer set search_path to '' as $$
  select case when app.is_pro(p_uid) or app.is_admin(p_uid) then timestamptz '2999-12-31 00:00:00+00' else greatest(
    (select m.trial_start + make_interval(days => app.trial_days()) from public.memberships m where m.user_id = p_uid and m.trial_start is not null),
    (select max(p.end_at) from public.periods p where p.user_id = p_uid)) end $$;
create function app.is_active(p_uid uuid) returns boolean language sql stable security definer set search_path to '' as $$
  select coalesce((select not m.suspended from public.memberships m where m.user_id = p_uid), true) and coalesce(app.expiry(p_uid) > now(), false) $$;
create function app.j010(j jsonb) returns jsonb language sql immutable set search_path to '' as $$
  select case when jsonb_typeof(j) = 'number' and (j #>> '{}')::numeric between 0 and 10 then to_jsonb(round((j #>> '{}')::numeric)::int) end $$;
-- Copias textuales de las funciones reales v2 (las que hoy usa v78)
create function public.get_state_v2() returns jsonb language sql stable security definer set search_path to '' as $$
  select jsonb_build_object('data', a.data, 'rev', a.rev) from public.app_state a where a.user_id = auth.uid() $$;
create function public.save_state_v2(p_data jsonb, p_rev bigint) returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); v_old jsonb; v_rev bigint; v_found boolean := false;
begin
  if v_uid is null then raise exception 'no autenticado'; end if;
  if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'formato inválido'; end if;
  if octet_length(p_data::text) > 600000 then raise exception 'datos demasiado grandes'; end if;
  select data, rev, true into v_old, v_rev, v_found from public.app_state where user_id = v_uid for update;
  v_found := coalesce(v_found, false);
  if v_found and p_rev is distinct from v_rev then return jsonb_build_object('ok', false, 'conflict', true, 'rev', v_rev, 'data', v_old); end if;
  insert into public.app_state(user_id, data, updated_at, rev) values (v_uid, p_data - 'member', now(), 1)
    on conflict (user_id) do update set data = excluded.data, updated_at = now(), rev = public.app_state.rev + 1 returning rev into v_rev;
  return jsonb_build_object('ok', true, 'rev', v_rev);
end $$;
create function public.pro_patients() returns jsonb language sql stable security definer set search_path to '' as $$
  with me as (select lower(u0.email) as email from auth.users u0 where u0.id = auth.uid() and u0.email_confirmed_at is not null and exists(select 1 from public.pro_emails pe where pe.email = lower(u0.email)))
  select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'email', u.email, 'since', s.created_at, 'name', a.data->'profile'->>'name', 'sessions', a.data->'train'->'sessions', 'dayFb', a.data->'dayFb', 'hold', a.data->'train'->'hold') order by s.created_at desc), '[]'::jsonb)
  from public.shares s join me on me.email = s.pro_email join auth.users u on u.id = s.patient_id join public.app_state a on a.user_id = s.patient_id
  where s.revoked_at is null $$;
create function public.share_mine() returns jsonb language sql stable security definer set search_path to '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('email', pro_email, 'since', created_at, 'rx', coalesce(rx, '[]'::jsonb), 'rxAt', rx_at, 'id', id, 'clear', '[]'::jsonb) order by created_at), '[]'::jsonb)
  from public.shares where patient_id = auth.uid() and revoked_at is null $$;
create function public.my_membership() returns jsonb language sql stable security definer set search_path to '' as $$
  select jsonb_build_object('status','ACTIVO','active',true,'expires_at', now()+interval '20 days','trial_used',true,'pro',app.is_pro(auth.uid()),'kind','Plan 30 días','is_admin',app.is_admin(auth.uid()),'server_now',now()) $$;
-- Funciones que la app llama al arrancar (respuestas neutras)
create function public.content_reviews() returns jsonb language sql as $$ select '{}'::jsonb $$;
create function public.contact_get() returns jsonb language sql as $$ select jsonb_build_object('phone', null, 'wa_ok', false) $$;
create function public.my_notes() returns jsonb language sql as $$ select '[]'::jsonb $$;
create function public.pro_notes() returns jsonb language sql as $$ select '[]'::jsonb $$;
create function public.minor_auth_mine() returns jsonb language sql as $$ select jsonb_build_object('asMinor', null, 'asAdult', '[]'::jsonb) $$;
create function public.consent_log(p_kind text, p_version text, p_value boolean) returns void language sql as $$ select $$;
create function public.ux_hit(p_kind text) returns void language sql as $$ select $$;
create function public.push_public_key() returns text language sql as $$ select null::text $$;
create function public.start_trial() returns jsonb language sql as $$ select jsonb_build_object('ok', true) $$;
