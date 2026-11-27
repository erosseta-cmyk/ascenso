// push-tick v4.1 «solo B3» (PREPARADO, NO DESPLEGADO). Se despliega con el slug push-tick.
// Igual que la versión 4 desplegada (usa push_due_v2: misma selección y frecuencia de avisos que hoy),
// pero el contenido sale de core.mjs: título «Ascenso» y cuerpo «Tienes un recordatorio de Ascenso».
// No requiere cambios de SQL. Para volver atrás: desplegar push-tick-v4-desplegada/index.ts.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";
import { payloadFor } from "./core.mjs";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const SUBJECT = "https://erosseta-cmyk.github.io/ascenso/";
const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function cfg(): Promise<Record<string, string>> {
  const { data, error } = await sb.from("push_config").select("key,value");
  if (error) throw new Error("config: " + error.message);
  const m: Record<string, string> = {};
  for (const r of data ?? []) m[r.key] = r.value;
  return m;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch (_e) { body = {}; }
  try {
    // Posponer desde la notificacion: el dispositivo se identifica con su propio endpoint de push.
    if (body.action === "snooze") {
      const endpoint = String(body.endpoint ?? "");
      const mid = String(body.mission_id ?? "").slice(0, 80);
      if (!endpoint.startsWith("https://") || !mid) return json({ error: "bad_request" }, 400);
      const { data: sub } = await sb.from("push_subs").select("user_id").eq("endpoint", endpoint).eq("enabled", true).maybeSingle();
      if (!sub) return json({ error: "unknown_device" }, 404);
      const { count } = await sb.from("push_snooze").select("id", { count: "exact", head: true }).eq("user_id", sub.user_id).eq("sent", false);
      if ((count ?? 0) >= 20) return json({ error: "too_many" }, 429);
      const { error } = await sb.from("push_snooze").insert({ user_id: sub.user_id, mission_id: mid, fire_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
      if (error) return json({ error: "db" }, 500);
      return json({ ok: true });
    }

    let c = await cfg();
    if (!c.cron_secret || req.headers.get("x-cron-secret") !== c.cron_secret) return json({ error: "unauthorized" }, 401);

    if (!c.vapid_public || !c.vapid_private) {
      const k = webpush.generateVAPIDKeys();
      const { error } = await sb.from("push_config").upsert([{ key: "vapid_public", value: k.publicKey }, { key: "vapid_private", value: k.privateKey }]);
      if (error) return json({ error: "keys" }, 500);
      c = await cfg();
    }
    if (body.action === "init") return json({ ok: true, has_keys: !!c.vapid_public });

    webpush.setVapidDetails(SUBJECT, c.vapid_public, c.vapid_private);
    const { data: due, error } = await sb.rpc("push_due_v2");
    if (error) return json({ error: "due: " + error.message }, 500);
    let sent = 0, failed = 0, removed = 0;
    for (const d of due ?? []) {
      const payload = JSON.stringify(payloadFor(d));
      try {
        await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, payload, { TTL: 600, urgency: "high" });
        sent++;
      } catch (e) {
        failed++;
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) { await sb.from("push_subs").delete().eq("endpoint", d.endpoint); removed++; }
        else console.error("push error", code, String((e as Error).message).slice(0, 200));
      }
    }
    return json({ ok: true, due: (due ?? []).length, sent, failed, removed });
  } catch (e) {
    console.error("tick error", String((e as Error).message).slice(0, 300));
    return json({ error: "internal" }, 500);
  }
});
