// Función del servidor «sec-llave» (PENDIENTE de desplegar; requiere aprobación).
// Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (automáticas), RP_ID (ej. erosseta-cmyk.github.io), RP_ORIGIN (ej. https://erosseta-cmyk.github.io)
import * as wa from "npm:@simplewebauthn/server@13";
import { createClient } from "npm:@supabase/supabase-js@2";
import { handle } from "./core.mjs";
const cors = { "Access-Control-Allow-Origin": Deno.env.get("RP_ORIGIN") ?? "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { db: { schema: "sec" } });
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { data: u } = await admin.auth.getUser(jwt);           // comprueba la firma y que el usuario exista
  if (!u?.user) return new Response(JSON.stringify({ ok: false, msg: "Sin sesión" }), { status: 401, headers: cors });
  const claims = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  const svc = async (name: string, args: Record<string, unknown>) => { const { data, error } = await admin.rpc(name, args); if (error) throw new Error(error.message); return data; };
  const { action, ...body } = await req.json();
  try {
    const out = await handle(action, body, { uid: u.user.id, sid: claims.session_id, email: u.user.email, origin: Deno.env.get("RP_ORIGIN")!, rpID: Deno.env.get("RP_ID")!, svc, wa });
    return new Response(JSON.stringify(out), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    const m = String((e as Error).message); const k = (m.match(/SEC:([a-z_]+)/) || [])[1];
    return new Response(JSON.stringify({ ok: false, sec: k ?? null, msg: k ? "No permitido en este momento." : "Error" }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
