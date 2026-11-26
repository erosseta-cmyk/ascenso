-- =====================================================================
-- Ascenso · CORTE DE PUBLICACIÓN de la seguridad v79. PENDIENTE: solo el día en que Esteban apruebe publicar v79.
-- Orden: 1) aplicar sec.sql  2) desplegar sec-llave y sec-admin  3) publicar v79  4) correr ESTE archivo.
-- Sin este corte, quien tenga una sesión (por ejemplo tras restablecer la contraseña) puede seguir leyendo
-- los datos con las funciones antiguas aunque la app ya no las use.
-- Reversible: el bloque final comentado lo deshace.
-- =====================================================================
revoke execute on function public.get_state_v2() from authenticated, anon, public;
revoke execute on function public.save_state_v2(jsonb, bigint) from authenticated, anon, public;
revoke execute on function public.pro_patients() from authenticated, anon, public;
revoke execute on function public.get_state() from authenticated, anon, public;
revoke execute on function public.save_state(jsonb) from authenticated, anon, public;
drop policy if exists app_state_own_select on public.app_state;
-- Arranque de la cuenta profesional (Esteban la corre en el editor SQL de Supabase, una vez, y usa el código en la app):
-- insert into sec.activation(user_id, hash, kind, issued_by, expires_at)
--   select id, sec.hash('<8 dígitos que elijas>'), 'visita', id, now() + interval '30 minutes' from auth.users where email = 'kinerecupera@gmail.com';
-- Deshacer:
-- grant execute on function public.get_state_v2(), public.save_state_v2(jsonb,bigint), public.pro_patients(), public.get_state(), public.save_state(jsonb) to authenticated;
-- create policy app_state_own_select on public.app_state for select using (auth.uid() = user_id);
