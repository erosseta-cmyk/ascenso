// Verificación de la llave (WebAuthn) de Ascenso. La misma lógica corre en la función del servidor
// (index.ts, Deno) y en el servidor de pruebas local. El servidor de la base de datos decide si se
// puede registrar o usar una llave (sec.svc_*); esta función solo comprueba la firma del teléfono.
const enc = (u8) => { let s = ""; for (const b of u8) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const dec = (s) => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const b = atob(s); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };
export async function handle(action, body, ctx) {
  // ctx: { uid, sid, email, origin, rpID, svc(name, args) -> Promise<any>, wa: @simplewebauthn/server }
  const { uid, sid, origin, rpID, svc, wa } = ctx;
  if (!uid || !sid) return { ok: false, msg: "Sin sesión" };
  if (action === "reg_options") {
    const why = await svc("svc_can_register", { p_uid: uid, p_sid: sid });
    if (!why || why === "suspendida") return { ok: false, code: "no_puede_registrar", msg: "Este teléfono todavía no puede crear una llave." };
    const existing = (await svc("svc_key_list", { p_uid: uid })) || [];
    const options = await wa.generateRegistrationOptions({
      rpName: "Ascenso", rpID, userName: ctx.email || uid, userDisplayName: ctx.email || "Ascenso",
      userID: new TextEncoder().encode(uid), attestationType: "none", timeout: 120000,
      excludeCredentials: existing.map((id) => ({ id })),
      authenticatorSelection: { residentKey: "preferred", userVerification: "required" },
    });
    const chId = await svc("svc_challenge", { p_uid: uid, p_sid: sid, p_kind: "reg", p_ch: options.challenge });
    return { ok: true, chId, options };
  }
  if (action === "reg_verify") {
    const ch = await svc("svc_take_challenge", { p_id: body.chId, p_uid: uid, p_sid: sid, p_kind: "reg" });
    if (!ch) return { ok: false, msg: "La solicitud venció. Intenta de nuevo." };
    let v;
    try { v = await wa.verifyRegistrationResponse({ response: body.credential, expectedChallenge: ch, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true }); }
    catch (e) { return { ok: false, msg: "No se pudo verificar la llave." }; }
    if (!v.verified) return { ok: false, msg: "No se pudo verificar la llave." };
    const c = v.registrationInfo.credential;
    return await svc("svc_key_add", { p_uid: uid, p_sid: sid, p_cred: c.id, p_pub: enc(c.publicKey), p_counter: c.counter || 0, p_label: String(body.label || "Teléfono").slice(0, 60) });
  }
  if (action === "auth_options") {
    const list = (await svc("svc_key_list", { p_uid: uid })) || [];
    if (!list.length) return { ok: false, code: "sin_llave", msg: "Tu cuenta no tiene llaves activas." };
    const options = await wa.generateAuthenticationOptions({ rpID, allowCredentials: list.map((id) => ({ id })), userVerification: "required", timeout: 120000 });
    const chId = await svc("svc_challenge", { p_uid: uid, p_sid: sid, p_kind: "auth", p_ch: options.challenge });
    return { ok: true, chId, options };
  }
  if (action === "auth_verify") {
    const ch = await svc("svc_take_challenge", { p_id: body.chId, p_uid: uid, p_sid: sid, p_kind: "auth" });
    if (!ch) return { ok: false, msg: "La solicitud venció. Intenta de nuevo." };
    const k = await svc("svc_key_get", { p_uid: uid, p_cred: body.credential && body.credential.id });
    if (!k) return { ok: false, code: "llave_desconocida", msg: "Esta llave no está activa en tu cuenta." };
    let v;
    try { v = await wa.verifyAuthenticationResponse({ response: body.credential, expectedChallenge: ch, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true,
      credential: { id: body.credential.id, publicKey: dec(k.pubkey), counter: Number(k.counter) || 0 } }); }
    catch (e) { return { ok: false, msg: "No se pudo verificar la llave." }; }
    if (!v.verified) return { ok: false, msg: "No se pudo verificar la llave." };
    return await svc("svc_assert_ok", { p_uid: uid, p_sid: sid, p_cred: body.credential.id, p_counter: v.authenticationInfo.newCounter || 0 });
  }
  return { ok: false, msg: "Acción desconocida" };
}
