// B3: contenido de cada aviso que sale del servidor. Nunca incluye el nombre del hábito, la dosis, el dolor ni datos del paciente,
// aunque la consulta entregue otros campos. El detalle se muestra al abrir Ascenso.
export const NT = "Ascenso", NB = "Tienes un recordatorio de Ascenso";
export function payloadFor(d) {
  const mid = d && d.mission_id ? String(d.mission_id).slice(0, 80) : null;
  const k = mid ? "m" : (["rx", "vence", "pro"].includes(d && d.kind) ? d.kind : "x");
  return { title: NT, body: NB, tag: mid ? "m-" + mid : "a-" + k, mid, k };
}
