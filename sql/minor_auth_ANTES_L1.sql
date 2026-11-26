-- Versiones vigentes al 26-11-2026 (antes de L1). Para volver atrás.
CREATE OR REPLACE FUNCTION public.minor_auth_create(p_name text, p_rel text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare v_uid uuid := auth.uid(); v_age int; v_code text; v_n int; v_name text := btrim(coalesce(p_name,''));
begin
  if v_uid is null then raise exception 'NO_AUTH'; end if;
  if not exists(select 1 from auth.users u where u.id = v_uid and u.email_confirmed_at is not null) then
    return jsonb_build_object('ok', false, 'msg', 'Confirma tu correo antes de autorizar a un menor.'); end if;
  v_age := app.age_of(v_uid);
  if v_age is null or v_age < 18 then return jsonb_build_object('ok', false, 'msg', 'Solo una persona de 18 años o más, con su fecha de nacimiento registrada, puede autorizar a un menor.'); end if;
  if length(v_name) < 5 or v_name !~ '\s' or length(v_name) > 60 then return jsonb_build_object('ok', false, 'msg', 'Escribe tu nombre y apellido.'); end if;
  if p_rel not in ('Madre','Padre','Tutor legal') then return jsonb_build_object('ok', false, 'msg', 'Elige tu relación con el menor.'); end if;
  select count(*) into v_n from public.minor_auth where adult_id = v_uid and revoked_at is null and (used_at is not null or expires_at > now());
  if v_n >= 6 then return jsonb_build_object('ok', false, 'msg', 'Ya tienes varias autorizaciones activas. Retira alguna antes de crear otra.'); end if;
  loop
    v_code := lpad((floor(random() * 100000000))::bigint::text, 8, '0');
    exit when not exists(select 1 from public.minor_auth where code = v_code and used_at is null and revoked_at is null);
  end loop;
  insert into public.minor_auth(adult_id, adult_name, rel, code, expires_at) values (v_uid, v_name, p_rel, v_code, now() + interval '48 hours');
  insert into public.audit_log(actor, target, action, detail) values (v_uid, v_uid, 'Código de autorización de menor creado', p_rel);
  return jsonb_build_object('ok', true, 'code', v_code);
end $function$;
CREATE OR REPLACE FUNCTION public.minor_auth_use(p_code text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare v_uid uuid := auth.uid(); v_age int; r record; v_code text := regexp_replace(coalesce(p_code,''), '\D', '', 'g');
begin
  if v_uid is null then raise exception 'NO_AUTH'; end if;
  delete from app.minor_try where at < now() - interval '1 day';
  if (select count(*) from app.minor_try where user_id = v_uid and at > now() - interval '1 hour') >= 6 then
    return jsonb_build_object('ok', false, 'msg', 'Demasiados intentos. Espera una hora y pide un código nuevo.'); end if;
  insert into app.minor_try(user_id) values (v_uid);
  v_age := app.age_of(v_uid);
  if v_age is null or v_age >= 18 then return jsonb_build_object('ok', false, 'msg', 'Este paso es solo para cuentas de menores de 18 años.'); end if;
  if v_age < 14 then return jsonb_build_object('ok', false, 'msg', 'Ascenso es para personas de 14 años o más.'); end if;
  select * into r from public.minor_auth where code = v_code and used_at is null and revoked_at is null and expires_at > now() for update;
  if not found then return jsonb_build_object('ok', false, 'msg', 'El código no es válido o ya venció. Pídele uno nuevo a tu madre, padre o tutor.'); end if;
  if r.adult_id = v_uid then return jsonb_build_object('ok', false, 'msg', 'El código lo debe crear una persona adulta desde su propia cuenta.'); end if;
  update public.minor_auth set revoked_at = now(), revoked_by = 'reemplazada' where minor_id = v_uid and revoked_at is null;
  update public.minor_auth set minor_id = v_uid, used_at = now() where id = r.id;
  insert into public.audit_log(actor, target, action, detail) values (r.adult_id, v_uid, 'Menor autorizado por adulto', r.rel);
  return jsonb_build_object('ok', true, 'by', r.adult_name, 'rel', r.rel, 'at', (extract(epoch from now()) * 1000)::bigint);
end $function$;
