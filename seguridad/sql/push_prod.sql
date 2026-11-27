-- Copia local (solo para pruebas) de las tablas de avisos y de push_due / push_due_v2 tal como están desplegadas (lectura del 27-11-2026).
create table public.push_config(key text primary key, value text);
create table public.push_subs(endpoint text primary key, user_id uuid, p256dh text, auth text, tz text default 'America/Santiago', enabled boolean default true, updated_at timestamptz default now());
create table public.push_log(user_id uuid, mission_id text, day text, sent_at timestamptz default now(), primary key(user_id, mission_id, day));
create table public.push_snooze(id bigserial primary key, user_id uuid, mission_id text, fire_at timestamptz, sent boolean default false);
create function app.jnum(j jsonb) returns numeric language sql immutable set search_path to '' as $$ select case when jsonb_typeof(j) = 'number' then (j #>> '{}')::numeric end $$;

CREATE OR REPLACE FUNCTION public.push_due()
 RETURNS TABLE(user_id uuid, mission_id text, name text, endpoint text, p256dh text, auth text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $function$
with utz as (
  select distinct on (s.user_id) s.user_id, s.tz from public.push_subs s where s.enabled order by s.user_id, s.updated_at desc
), loc as (
  select u.user_id, (now() at time zone u.tz) as lnow from utz u where app.is_active(u.user_id)
), m as (
  select l.user_id, l.lnow, to_char(l.lnow,'YYYY-MM-DD') as day, a.data, e.value as mj
  from loc l join public.app_state a on a.user_id = l.user_id
  cross join lateral jsonb_array_elements(case when jsonb_typeof(a.data->'missions')='array' then a.data->'missions' else '[]'::jsonb end) e
), cand as (
  select m.user_id, m.mj->>'id' as mission_id, left(coalesce(m.mj->>'name','Tu misión'),80) as name, m.day
  from m
  where (m.mj->>'time') ~ '^[0-2][0-9]:[0-5][0-9]$'
    and (m.mj->>'id') is not null
    and ((m.mj->>'archived') is null or (m.mj->>'archived') > m.day)
    and coalesce(m.mj->>'created','0000-00-00') <= m.day
    and jsonb_typeof(m.mj->'days')='array'
    and (m.mj->'days') @> to_jsonb(extract(dow from m.lnow)::int)
    and (extract(hour from m.lnow)::int*60 + extract(minute from m.lnow)::int)
        - (split_part(m.mj->>'time',':',1)::int*60 + split_part(m.mj->>'time',':',2)::int) between 0 and 9
    and not (coalesce(m.data->'done'->m.day,'{}'::jsonb) ? (m.mj->>'id'))
), ins as (
  insert into public.push_log(user_id, mission_id, day)
  select c.user_id, c.mission_id, c.day from cand c
  on conflict do nothing
  returning user_id, mission_id
), sn as (
  update public.push_snooze z set sent = true
  where not z.sent and z.fire_at <= now()
  returning z.user_id, z.mission_id, z.fire_at
), sn_ok as (
  select sn.user_id, sn.mission_id,
         (select left(coalesce(e.value->>'name','Tu misión'),80) from public.app_state a
            cross join lateral jsonb_array_elements(case when jsonb_typeof(a.data->'missions')='array' then a.data->'missions' else '[]'::jsonb end) e
           where a.user_id = sn.user_id and e.value->>'id' = sn.mission_id limit 1) as name
  from sn where sn.fire_at > now() - interval '30 minutes' and app.is_active(sn.user_id)
), allp as (
  select i.user_id, i.mission_id, c.name from ins i join cand c on c.user_id=i.user_id and c.mission_id=i.mission_id
  union all
  select s.user_id, s.mission_id, coalesce(s.name,'Tu misión') from sn_ok s
)
select p.user_id, p.mission_id, p.name, s.endpoint, s.p256dh, s.auth
from allp p join public.push_subs s on s.user_id = p.user_id and s.enabled
$function$;

CREATE OR REPLACE FUNCTION public.push_due_v2()
 RETURNS TABLE(user_id uuid, mission_id text, title text, body text, endpoint text, p256dh text, auth text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $function$
  with mine as (
    select d.user_id, d.mission_id, 'Ascenso · es la hora'::text as title, d.name as body, d.endpoint, d.p256dh, d.auth
    from public.push_due() d
  ), cand as (
    select pu.id as pro_id, 'alert:' || (x.value->>'id') as mid, x.value->>'date' as day
    from public.shares s
    join auth.users pu on lower(pu.email) = s.pro_email and pu.email_confirmed_at is not null
    join public.app_state a on a.user_id = s.patient_id
    cross join lateral jsonb_array_elements((case when jsonb_typeof(a.data->'train'->'sessions')='array' then a.data->'train'->'sessions' else '[]'::jsonb end)
      || (select coalesce(jsonb_agg(jsonb_build_object('id', 'dia-' || f.key, 'date', f.key, 'pain', f.value->'pain')), '[]'::jsonb)
          from jsonb_each(case when jsonb_typeof(a.data->'dayFb')='object' then a.data->'dayFb' else '{}'::jsonb end) f
          where jsonb_typeof(f.value)='object' and jsonb_typeof(f.value->'pain')='number')) x
    where s.revoked_at is null
      and ((a.data->'onboard'->'health') = 'true'::jsonb)
      and (x.value->>'id') is not null
      and x.value->>'date' >= to_char(now() - interval '2 days','YYYY-MM-DD')
      and (((x.value->'alert') = 'true'::jsonb) or coalesce(app.jnum(x.value->'pain'), 0) >= 5 or (((x.value->'painNew') = 'true'::jsonb) and coalesce(app.jnum(x.value->'pain'), 0) >= 3))
      and exists(select 1 from public.push_subs ps where ps.user_id = pu.id and ps.enabled)
  ), ins as (
    insert into public.push_log(user_id, mission_id, day)
    select distinct c.pro_id, c.mid, c.day from cand c
    on conflict do nothing
    returning user_id, mission_id
  ), pro as (
    select distinct i.user_id from ins i
  ), vence as (
    select m.user_id, app.expiry(m.user_id) as exp
    from public.memberships m
    where not coalesce(m.suspended, false)
      and extract(hour from now() at time zone 'America/Santiago') between 9 and 20
      and app.expiry(m.user_id) > now()
      and app.expiry(m.user_id) <= now() + interval '48 hours'
      and exists(select 1 from public.push_subs ps where ps.user_id = m.user_id and ps.enabled)
  ), vins as (
    insert into public.push_log(user_id, mission_id, day)
    select v.user_id, 'vence:' || to_char(v.exp at time zone 'UTC', 'YYYYMMDDHH24MI'), to_char(v.exp at time zone 'America/Santiago', 'YYYY-MM-DD')
    from vence v
    on conflict do nothing
    returning user_id, day
  ), rxc as (
    select s.patient_id as uid, to_char(now() at time zone 'America/Santiago','YYYY-MM-DD') as day,
           count(*) filter (where not coalesce((a.data->'rxDone'->(to_char(now() at time zone 'America/Santiago','YYYY-MM-DD'))) ?
             coalesce(nullif(x.value->>'ex',''), 'c:' || left(coalesce(x.value->>'name',''),60)), false)) as pend
    from public.shares s
    join public.app_state a on a.user_id = s.patient_id
    cross join lateral jsonb_array_elements(case when jsonb_typeof(s.rx)='array' then s.rx else '[]'::jsonb end) x
    where s.revoked_at is null
      and ((a.data->'onboard'->'health') = 'true'::jsonb)
      and (not (x.value ? 'days') or jsonb_typeof(x.value->'days') <> 'array' or (x.value->'days') @> to_jsonb(extract(dow from now() at time zone 'America/Santiago')::int))
      and extract(hour from now() at time zone 'America/Santiago') = 19
      and exists(select 1 from public.push_subs ps where ps.user_id = s.patient_id and ps.enabled)
    group by s.patient_id
  ), rxins as (
    insert into public.push_log(user_id, mission_id, day)
    select r.uid, 'rx', r.day from rxc r where r.pend > 0
    on conflict do nothing
    returning user_id
  )
  select * from mine
  union all
  select p.user_id, null::text, 'Ascenso · revisa a un paciente'::text, 'Alguien que comparte su avance contigo registró dolor o una alerta y su plan quedó en pausa. Abre la pestaña Pacientes.'::text, s.endpoint, s.p256dh, s.auth
  from pro p join public.push_subs s on s.user_id = p.user_id and s.enabled
  union all
  select vi.user_id, null::text, 'Ascenso · tu plan vence pronto'::text,
         'Tu acceso termina el ' || to_char(to_date(vi.day, 'YYYY-MM-DD'), 'DD/MM') || '. Renuévalo en Planes para no perder tu racha ni tu avance.'::text,
         s.endpoint, s.p256dh, s.auth
  from vins vi join public.push_subs s on s.user_id = vi.user_id and s.enabled
  union all
  select ri.user_id, null::text, 'Ascenso · tus ejercicios de hoy'::text,
         (select case when r.pend = 1 then 'Te queda 1 ejercicio de tu kinesiólogo por marcar hoy.' else 'Te quedan ' || r.pend || ' ejercicios de tu kinesiólogo por marcar hoy.' end from rxc r where r.uid = ri.user_id),
         s.endpoint, s.p256dh, s.auth
  from rxins ri join public.push_subs s on s.user_id = ri.user_id and s.enabled
$function$;
