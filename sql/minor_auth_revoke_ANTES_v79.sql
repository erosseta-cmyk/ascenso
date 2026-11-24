-- Versión vigente hasta el 24-11-2026 (para volver atrás)
CREATE OR REPLACE FUNCTION public.minor_auth_revoke(p_id bigint)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare v_uid uuid := auth.uid(); r record;
begin
  if v_uid is null then raise exception 'NO_AUTH'; end if;
  if p_id is null then
    update public.minor_auth set revoked_at = now(), revoked_by = 'titular' where minor_id = v_uid and revoked_at is null;
    update public.shares set minor_ok_at = null, minor_ok_by = null where patient_id = v_uid;
    return jsonb_build_object('ok', true);
  end if;
  select * into r from public.minor_auth where id = p_id and adult_id = v_uid and revoked_at is null for update;
  if not found then return jsonb_build_object('ok', false, 'msg', 'No se encontró esa autorización.'); end if;
  update public.minor_auth set revoked_at = now(), revoked_by = 'adulto' where id = r.id;
  if r.minor_id is not null then
    update public.shares set minor_ok_at = null, minor_ok_by = null where patient_id = r.minor_id;
    update public.app_state set data = jsonb_set(jsonb_set(data, '{minor}', '{"state":"pending"}'::jsonb), '{onboard,health}', 'false'::jsonb), rev = rev + 1, updated_at = now()
      where user_id = r.minor_id and jsonb_typeof(data->'onboard') = 'object';
    insert into public.audit_log(actor, target, action, detail) values (v_uid, r.minor_id, 'Autorización de menor retirada', 'por el adulto');
  end if;
  return jsonb_build_object('ok', true);
end $function$;
