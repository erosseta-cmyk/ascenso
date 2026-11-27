// B3: contenido de cada aviso que sale del servidor. Nunca incluye el nombre del hábito, la dosis, el dolor ni datos del paciente,
// aunque la consulta entregue otros campos. El detalle se muestra al abrir Ascenso.
export const NT = "Ascenso", NB = "Tienes un recordatorio de Ascenso";
export function payloadFor(d) {
  const mid = d && d.mission_id ? String(d.mission_id).slice(0, 80) : null;
  // push_due_v3 entrega «kind»; push_due_v2 (versión anterior) no: se deduce de su título, que nunca se reenvía.
  const t = String((d && d.title) || "");
  const kind = d && d.kind ? d.kind : /paciente/i.test(t) ? "pro" : /vence/i.test(t) ? "vence" : /ejercicios/i.test(t) ? "rx" : "x";
  const k = mid ? "m" : (["rx", "vence", "pro"].includes(kind) ? kind : "x");
  return { title: NT, body: NB, tag: mid ? "m-" + mid : "a-" + k, mid, k };
}
