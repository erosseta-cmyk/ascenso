-- B2/B3 · Avisos con la app cerrada (preparado para revisión; NO aplicado).
-- Aplicar solo con aprobación de Esteban. Orden: 1) este archivo; 2) desplegar push-tick (llama a push_due_v3).
-- Mientras push-tick no se despliegue, producción sigue usando push_due_v2 sin cambios.
--
-- B2: cada aviso se decide con el estado vigente de su actividad al momento de emitirlo (también al vencer un «posponer»).
--     Si la hora programada (o el vencimiento del «posponer») cayó dentro de una pausa, el aviso se omite y no se recupera
--     cuando la pausa se levanta: queda marcado en push_log como 'omit:<id>' y sigue la próxima ocurrencia.
--     Con las reglas actuales, la pausa es del plan completo (cuestionario previo con alertas sin autorización del
--     kinesiólogo, o pausa por dolor alto o síntomas): alcanza a fuerza, caminata, otros hábitos físicos y la pauta del
--     kinesiólogo. Un hábito no físico (por ejemplo, tomar agua) conserva su aviso. «Mantener» no es pausa.
-- 19:00: cuenta solo ejercicios de la pauta que tocan hoy, siguen sin marcar y no están en pausa; si son 0, no se envía.
-- B3: título «Ascenso» y cuerpo «Tienes un recordatorio de Ascenso» en todos los avisos que salen del servidor.

create or replace function app.push_kind(p_name text) returns text
language sql immutable set search_path to '' as $$
  select case
    -- hábito físico predefinido del catálogo: se reconoce por su nombre exacto (no tiene otra marca)
    when lower(btrim(coalesce(p_name,''))) = 'hacer mi rutina de ascenso' then 'fuerza'
    when coalesce(p_name,'') !~* '(camin|trot|\ycorr(er|o|e)\y|bici|\ynad(ar|o)\y|ejercic|fuerza|sentadill|yoga|pilates|elong|estir|bail|gimnas|pesas|escaler|deport|entren|pausa activa|plancha|flexi[oó]n)' then 'otro'
    when p_name ~* '(camin|trot|\ycorr(er|o|e)\y)' then 'caminata'
    when p_name ~* '(fuerza|sentadill|pesas|plancha|flexi[oó]n|gimnas|entren)' then 'fuerza'
    else 'fisico' end
$$;

-- Réplica en el servidor de trainReady()/planPaused() de la app, usando las autorizaciones vigentes del kinesiólogo.
create or replace function app.push_paused_kinds(p_uid uuid, p_data jsonb, p_day text) returns text[]
language sql stable security definer set search_path to '' as $$
  with v as (
    select tr,
      coalesce((p_data->'onboard'->'health') = 'true'::jsonb, false) and jsonb_typeof(tr) = 'object' as base,
      jsonb_typeof(tr->'parq') = 'array' and jsonb_array_length(tr->'parq') = 10
        and (coalesce(tr->>'parqAt','') = '' or tr->>'parqAt' >= to_char(p_day::date - 365, 'YYYY-MM-DD')) as parq_ok,
      exists(select 1 from jsonb_array_elements(case when jsonb_typeof(tr->'parq') = 'array' then tr->'parq' else '[]'::jsonb end) e
             where e = 'true'::jsonb) as flags,
      coalesce(tr->>'parqTs', tr->>'parqAt') as pkey,
      case when jsonb_typeof(tr->'hold') = 'object' then tr->'hold' end as hold
    from (select p_data->'train' as tr) t
  ), c as (
    select v.*,
      (select c.parq_key from public.pro_clearances c join public.shares s on s.id = c.share_id and s.revoked_at is null
        where c.patient_id = p_uid and c.revoked_at is null and c.kind = 'parq' order by c.created_at desc limit 1) as clr_parq,
      (select c.parq_key from public.pro_clearances c join public.shares s on s.id = c.share_id and s.revoked_at is null
        where c.patient_id = p_uid and c.revoked_at is null and c.kind = 'hold' order by c.created_at desc limit 1) as clr_hold,
      exists(select 1 from jsonb_array_elements(case when jsonb_typeof(v.tr->'sessions') = 'array' then v.tr->'sessions' else '[]'::jsonb end) x
             where x->>'id' = v.hold->>'sid'
               and not coalesce(case when jsonb_typeof(x->'pain') = 'number' then (x->>'pain')::numeric >= 6 end, false)) as auto_lift
    from v
  )
  select case when base and parq_ok and (
      (flags and not (clr_parq is not null and clr_parq = pkey))
      or (hold is not null
          and not (hold->>'kind' = 'dolor' and auto_lift)
          and not (clr_hold is not null and clr_hold = hold->>'sid'))
    ) then array['fuerza','caminata','fisico','rx'] else array[]::text[] end
  from c
$$;

-- ¿Estaba el plan en pausa en el instante p_ts? Se usa para no recuperar un aviso cuya hora (o cuyo «posponer») venció
-- durante una pausa. Datos usados: inicio de la pausa vigente (hora de la sesión que la causó o del cuestionario),
-- pausas ya levantadas en la app (paused + resumedAt de la sesión) y autorizaciones del kinesiólogo aún no sincronizadas
-- (fecha de pro_clearances). Ver «Datos que faltan» en la entrega: corrección de dolor (autoLift) y sesión borrada no dejan hora.
create or replace function app.push_paused_at(p_uid uuid, p_data jsonb, p_day text, p_ts timestamptz) returns boolean
language sql stable security definer set search_path to '' as $$
  with v as (
    select tr, (extract(epoch from p_ts) * 1000)::numeric as ms,
      coalesce((p_data->'onboard'->'health') = 'true'::jsonb, false) and jsonb_typeof(tr) = 'object' as base,
      jsonb_typeof(tr->'parq') = 'array' and jsonb_array_length(tr->'parq') = 10
        and (coalesce(tr->>'parqAt','') = '' or tr->>'parqAt' >= to_char(p_day::date - 365, 'YYYY-MM-DD')) as parq_ok,
      exists(select 1 from jsonb_array_elements(case when jsonb_typeof(tr->'parq') = 'array' then tr->'parq' else '[]'::jsonb end) e
             where e = 'true'::jsonb) as flags,
      coalesce(tr->>'parqTs', tr->>'parqAt') as pkey,
      case when coalesce(tr->>'parqTs','') ~ '^[0-9]{10,16}$' then (tr->>'parqTs')::numeric end as pts,
      case when jsonb_typeof(tr->'hold') = 'object' then tr->'hold' end as hold,
      case when jsonb_typeof(tr->'sessions') = 'array' then tr->'sessions' else '[]'::jsonb end as ss
    from (select p_data->'train' as tr) t
  ), c as (
    select v.*,
      (select cl.parq_key from public.pro_clearances cl join public.shares s on s.id = cl.share_id and s.revoked_at is null
        where cl.patient_id = p_uid and cl.revoked_at is null and cl.kind = 'parq' order by cl.created_at desc limit 1) as clr_parq,
      (select cl.created_at from public.pro_clearances cl join public.shares s on s.id = cl.share_id and s.revoked_at is null
        where cl.patient_id = p_uid and cl.revoked_at is null and cl.kind = 'parq' order by cl.created_at desc limit 1) as clr_parq_at,
      (select cl.parq_key from public.pro_clearances cl join public.shares s on s.id = cl.share_id and s.revoked_at is null
        where cl.patient_id = p_uid and cl.revoked_at is null and cl.kind = 'hold' order by cl.created_at desc limit 1) as clr_hold,
      (select cl.created_at from public.pro_clearances cl join public.shares s on s.id = cl.share_id and s.revoked_at is null
        where cl.patient_id = p_uid and cl.revoked_at is null and cl.kind = 'hold' order by cl.created_at desc limit 1) as clr_hold_at,
      (select case when jsonb_typeof(x->'at') = 'number' then (x->>'at')::numeric end from jsonb_array_elements(v.ss) x
        where x->>'id' = v.hold->>'sid' limit 1) as hold_at
    from v
  )
  select base and (
      -- pausa vigente que ya había empezado a esa hora (si no se sabe cuándo empezó, se considera vigente)
      (('rx' = any(app.push_paused_kinds(p_uid, p_data, p_day)))
        and ((parq_ok and flags and not (clr_parq is not null and clr_parq = pkey) and coalesce(pts, 0) <= ms)
             or (hold is not null and coalesce(hold_at, 0) <= ms)))
      -- pausa levantada por el kinesiólogo después de esa hora, aún no sincronizada por la app
      or (hold is not null and clr_hold is not null and clr_hold = hold->>'sid' and clr_hold_at > p_ts and coalesce(hold_at, 0) <= ms)
      -- pausas ya levantadas en la app: la sesión guarda cuándo se reanudó
      or exists(select 1 from jsonb_array_elements(ss) x
                where jsonb_typeof(x->'paused') = 'string' and jsonb_typeof(x->'resumedAt') = 'number'
                  and (x->>'resumedAt')::numeric > ms
                  and coalesce(case when jsonb_typeof(x->'at') = 'number' then (x->>'at')::numeric end, 0) <= ms)
      -- cuestionario con alertas autorizado por el kinesiólogo después de esa hora
      or (flags and clr_parq is not null and clr_parq = pkey and clr_parq_at > p_ts and coalesce(pts, 0) <= ms)
    )
  from c
$$;

-- Ejercicios de la pauta pendientes hoy, contados como en «Mi día»: solo con consentimiento de salud, solo los que tocan hoy
-- (sin lista de días, lista vacía o los 7 días = todos los días), sin marcar y con la pauta no en pausa.
create or replace function app.push_rx_pending(p_uid uuid, p_data jsonb, p_now timestamptz) returns int
language sql stable security definer set search_path to '' as $$
  with d as (select to_char(p_now at time zone 'America/Santiago', 'YYYY-MM-DD') as day,
                    extract(dow from p_now at time zone 'America/Santiago')::int as dow)
  select case when (p_data->'onboard'->'health') = 'true'::jsonb
                and not ('rx' = any(app.push_paused_kinds(p_uid, p_data, d.day)))
         then (select count(*)::int
               from public.shares s cross join lateral jsonb_array_elements(case when jsonb_typeof(s.rx) = 'array' then s.rx else '[]'::jsonb end) x
               where s.patient_id = p_uid and s.revoked_at is null
                 and (not coalesce(jsonb_typeof(x.value->'days') = 'array' and jsonb_array_length(x.value->'days') between 1 and 6, false)
                      or (x.value->'days') @> to_jsonb(d.dow))
                 and not coalesce((p_data->'rxDone'->d.day) ? coalesce(nullif(x.value->>'ex', ''), 'c:' || left(coalesce(x.value->>'name', ''), 60)), false))
         else 0 end
  from d
$$;

create or replace function public.push_due_v3(p_now timestamptz default now())
returns table(user_id uuid, mission_id text, kind text, title text, body text, endpoint text, p256dh text, auth text)
language sql security definer set search_path to '' as $$
with utz as (
  select distinct on (s.user_id) s.user_id, s.tz from public.push_subs s where s.enabled order by s.user_id, s.updated_at desc
), st as (
  select u.user_id, u.tz, (p_now at time zone u.tz) as lnow, to_char(p_now at time zone u.tz, 'YYYY-MM-DD') as day, a.data,
         app.push_paused_kinds(u.user_id, a.data, to_char(p_now at time zone u.tz, 'YYYY-MM-DD')) as pk
  from utz u join public.app_state a on a.user_id = u.user_id
  where app.is_active(u.user_id)
), m as (
  select st.*, e.value as mj
  from st cross join lateral jsonb_array_elements(case when jsonb_typeof(st.data->'missions') = 'array' then st.data->'missions' else '[]'::jsonb end) e
), cand0 as (
  select m.user_id, m.mj->>'id' as mission_id, m.day,
         -- B2: en pausa ahora, o en pausa a la hora programada (no se recupera al levantarse la pausa)
         (app.push_kind(m.mj->>'name') = any(m.pk)
          or (app.push_kind(m.mj->>'name') <> 'otro'
              and app.push_paused_at(m.user_id, m.data, m.day, ((m.day || ' ' || (m.mj->>'time'))::timestamp at time zone m.tz)))) as blocked
  from m
  where (m.mj->>'time') ~ '^[0-2][0-9]:[0-5][0-9]$'
    and (m.mj->>'id') is not null
    and ((m.mj->>'archived') is null or (m.mj->>'archived') > m.day)
    and coalesce(m.mj->>'created', '0000-00-00') <= m.day
    and jsonb_typeof(m.mj->'days') = 'array'
    and (m.mj->'days') @> to_jsonb(extract(dow from m.lnow)::int)
    and (extract(hour from m.lnow)::int * 60 + extract(minute from m.lnow)::int)
        - (split_part(m.mj->>'time', ':', 1)::int * 60 + split_part(m.mj->>'time', ':', 2)::int) between 0 and 9
    and not (coalesce(m.data->'done'->m.day, '{}'::jsonb) ? (m.mj->>'id'))
), cand as (
  select c.user_id, c.mission_id, c.day from cand0 c
  where not c.blocked
    and not exists(select 1 from public.push_log l where l.user_id = c.user_id and l.mission_id = 'omit:' || c.mission_id and l.day = c.day)
), omit as (                                                     -- marca el aviso omitido para no enviarlo más tarde
  insert into public.push_log(user_id, mission_id, day)
  select c.user_id, 'omit:' || c.mission_id, c.day from cand0 c where c.blocked
  on conflict do nothing
  returning user_id
), ins as (
  insert into public.push_log(user_id, mission_id, day)
  select c.user_id, c.mission_id, c.day from cand c
  on conflict do nothing
  returning user_id, mission_id
), sn as (
  update public.push_snooze z set sent = true
  where not z.sent and z.fire_at <= p_now
  returning z.user_id, z.mission_id, z.fire_at
), sn_ok as (                                                    -- B2: al vencer el «posponer» se vuelve a comprobar
  select sn.user_id, sn.mission_id
  from sn join st on st.user_id = sn.user_id
  cross join lateral (select e.value as mj
                      from jsonb_array_elements(case when jsonb_typeof(st.data->'missions') = 'array' then st.data->'missions' else '[]'::jsonb end) e
                      where e.value->>'id' = sn.mission_id limit 1) mm
  where sn.fire_at > p_now - interval '30 minutes'
    and not (coalesce(st.data->'done'->st.day, '{}'::jsonb) ? sn.mission_id)
    and not (app.push_kind(mm.mj->>'name') = any(st.pk))
    and not (app.push_kind(mm.mj->>'name') <> 'otro' and app.push_paused_at(sn.user_id, st.data, st.day, sn.fire_at))
), mine as (
  select i.user_id, i.mission_id from ins i
  union all
  select s.user_id, s.mission_id from sn_ok s
), pcand as (
  select pu.id as pro_id, 'alert:' || (x.value->>'id') as mid, x.value->>'date' as day
  from public.shares s
  join auth.users pu on lower(pu.email) = s.pro_email and pu.email_confirmed_at is not null
  join public.app_state a on a.user_id = s.patient_id
  cross join lateral jsonb_array_elements((case when jsonb_typeof(a.data->'train'->'sessions') = 'array' then a.data->'train'->'sessions' else '[]'::jsonb end)
    || (select coalesce(jsonb_agg(jsonb_build_object('id', 'dia-' || f.key, 'date', f.key, 'pain', f.value->'pain')), '[]'::jsonb)
        from jsonb_each(case when jsonb_typeof(a.data->'dayFb') = 'object' then a.data->'dayFb' else '{}'::jsonb end) f
        where jsonb_typeof(f.value) = 'object' and jsonb_typeof(f.value->'pain') = 'number')) x
  where s.revoked_at is null
    and ((a.data->'onboard'->'health') = 'true'::jsonb)
    and (x.value->>'id') is not null
    and x.value->>'date' >= to_char(p_now - interval '2 days', 'YYYY-MM-DD')
    and (((x.value->'alert') = 'true'::jsonb)
         or coalesce(case when jsonb_typeof(x.value->'pain') = 'number' then (x.value->>'pain')::numeric end, 0) >= 5
         or (((x.value->'painNew') = 'true'::jsonb) and coalesce(case when jsonb_typeof(x.value->'pain') = 'number' then (x.value->>'pain')::numeric end, 0) >= 3))
    and exists(select 1 from public.push_subs ps where ps.user_id = pu.id and ps.enabled)
), pins as (
  insert into public.push_log(user_id, mission_id, day)
  select distinct c.pro_id, c.mid, c.day from pcand c
  on conflict do nothing
  returning user_id, mission_id
), pro as (
  select distinct i.user_id from pins i
), vence as (
  select mb.user_id, app.expiry(mb.user_id) as exp
  from public.memberships mb
  where not coalesce(mb.suspended, false)
    and extract(hour from p_now at time zone 'America/Santiago') between 9 and 20
    and app.expiry(mb.user_id) > p_now
    and app.expiry(mb.user_id) <= p_now + interval '48 hours'
    and exists(select 1 from public.push_subs ps where ps.user_id = mb.user_id and ps.enabled)
), vins as (
  insert into public.push_log(user_id, mission_id, day)
  select v.user_id, 'vence:' || to_char(v.exp at time zone 'UTC', 'YYYYMMDDHH24MI'), to_char(v.exp at time zone 'America/Santiago', 'YYYY-MM-DD')
  from vence v
  on conflict do nothing
  returning user_id, day
), rxc as (
  -- 19:00 de Chile: misma cuenta que «Mi día» (ver app.push_rx_pending).
  select a.user_id as uid, app.push_rx_pending(a.user_id, a.data, p_now) as pend
  from public.app_state a
  where extract(hour from p_now at time zone 'America/Santiago') = 19
    and exists(select 1 from public.shares s where s.patient_id = a.user_id and s.revoked_at is null and jsonb_typeof(s.rx) = 'array')
    and exists(select 1 from public.push_subs ps where ps.user_id = a.user_id and ps.enabled)
), rxins as (
  insert into public.push_log(user_id, mission_id, day)
  select r.uid, 'rx', to_char(p_now at time zone 'America/Santiago', 'YYYY-MM-DD') from rxc r where r.pend > 0
  on conflict do nothing
  returning user_id
), outq as (
  select x.user_id, x.mission_id, 'm'::text as kind from mine x
  union all select p.user_id, null::text, 'pro'::text from pro p
  union all select v.user_id, null::text, 'vence'::text from vins v
  union all select r.user_id, null::text, 'rx'::text from rxins r
)
select o.user_id, o.mission_id, o.kind, 'Ascenso'::text, 'Tienes un recordatorio de Ascenso'::text, s.endpoint, s.p256dh, s.auth
from outq o join public.push_subs s on s.user_id = o.user_id and s.enabled
$$;

revoke all on function public.push_due_v3(timestamptz) from public;
revoke all on function app.push_paused_kinds(uuid, jsonb, text) from public;
revoke all on function app.push_paused_at(uuid, jsonb, text, timestamptz) from public;
revoke all on function app.push_rx_pending(uuid, jsonb, timestamptz) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function public.push_due_v3(timestamptz) from anon, authenticated';
    execute 'revoke all on function app.push_paused_kinds(uuid, jsonb, text) from anon, authenticated';
    execute 'revoke all on function app.push_paused_at(uuid, jsonb, text, timestamptz) from anon, authenticated';
    execute 'revoke all on function app.push_rx_pending(uuid, jsonb, timestamptz) from anon, authenticated';
  end if;
end $$;
