// Función del servidor «sec-admin» (PENDIENTE de desplegar). Cambio de correo asistido cuando el paciente perdió su Gmail.
// Solo la administración, confirmada con llave + PIN (permiso 'pro' vigente en su sesión). Deja la cuenta suspendida
// y cierra todas las sesiones: el paciente entra con el correo nuevo y activa una llave con el código de la visita.
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": Deno.env.get("RP_ORIGIN") ?? "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!, key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: "Bearer " + jwt } } });
  const { data: ok } = await asUser.rpc("sec_admin_ok");            // admin + llave + PIN en esta sesión
  if (ok !== true) return new Response(JSON.stringify({ ok: false, msg: "Confirma con tu llave y PIN." }), { headers: cors });
  const { action, old_email, new_email } = await req.json();
  if (action !== "email_change") return new Response(JSON.stringify({ ok: false }), { headers: cors });
  const admin = createClient(url, key);
  const { data: pt } = await asUser.rpc("sec_admin_prepare_email_change", { p_old: old_email, p_new: new_email });
  if (!pt?.ok) return new Response(JSON.stringify(pt ?? { ok: false }), { headers: cors });
  const { error } = await admin.auth.admin.updateUserById(pt.uid, { email: new_email, email_confirm: true });
  if (error) return new Response(JSON.stringify({ ok: false, msg: "No se pudo cambiar el correo." }), { headers: cors });
  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
});
