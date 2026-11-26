-- L1 · Solo adultos en el servidor. PENDIENTE: NO APLICAR hasta que Esteban apruebe publicar.
-- Motivo: la base es compartida con la app en producción (v78); aplicarlo antes rompe el flujo de menores de v78.
-- Conserva todos los datos existentes (no borra ni modifica minor_auth).
-- Para volver atrás: aplicar minor_auth_create/use desde git (versión anterior en este mismo repo, rama qa-tools, archivo sql/minor_auth_ANTES_L1.sql).
create or replace function public.minor_auth_create(p_name text, p_rel text)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
begin
  if auth.uid() is null then raise exception 'NO_AUTH'; end if;
  return jsonb_build_object('ok', false, 'msg', 'Por ahora, Ascenso es solo para personas de 18 años o más.');
end $function$;
create or replace function public.minor_auth_use(p_code text)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
begin
  if auth.uid() is null then raise exception 'NO_AUTH'; end if;
  return jsonb_build_object('ok', false, 'msg', 'Por ahora, Ascenso es solo para personas de 18 años o más.');
end $function$;
