# REGLAS ÚNICAS DE TRABAJO EN ASCENSO (fuente única; las tareas programadas solo apuntan aquí)

Proyecto: PWA https://erosseta-cmyk.github.io/ascenso/ · repo erosseta-cmyk/ascenso (main = publicado) · Supabase gtwqhrmobusntfsqebdc.
Doc de auditoría (calendario en sección 8, auditorías posteriores en sección 9): https://claude.ai/artifact/Fzs4fRxFgZFY1gpLEYJauV
Conversación de GPT para auditar: https://chatgpt.com/c/6afe0790-7794-83e8-85fa-d80359bf5607

## A. Antes de empezar
1. Si /home/claude/ascenso no existe: clonar el repo. Si /home/claude/qa no existe: clonar la rama qa-tools del mismo repo en /home/claude/qa.
2. Leer la última auditoría integral en el doc (sección 9). Regresiones o críticos pendientes van primero.
3. Hacer UNA cosa a la vez. Nunca varias llamadas que modifican cosas en paralelo.

## B. Cambiar y publicar
1. Rama propia desde main actualizado. Siguiente número de versión libre (sw.js `ascenso-vNN` y etiqueta del pie).
2. Después de editar scripts: `python3 tools/csp.py index.html`.
3. Prueba nueva t_vNN.js que verifique cada cambio, y regresión completa con `TZ=America/Santiago` (t_v54 y t_v60 fallan desde antes por reglas cambiadas; no son regresión).
4. Compatibilidad: un teléfono con la versión anterior debe seguir funcionando; los datos viejos se leen igual.
5. Publicar solo después de las 21:00 (hora de Chile) y solo si todo pasa. Verificar en vivo versión, caché y el cambio.
6. Nunca decidir textos clínicos o legales, nunca firmar fichas, nunca liberar betas a todos sin aprobación explícita de Esteban en el chat. Si algo lo requiere: dejarlo preparado y preguntarle.

## C. Auditoría UX integral después de CADA publicación (pedido de Esteban, 22-11-2026)
1. `bash /home/claude/qa/ux_run.sh vNN` → páginas en /home/claude/ux_vNN/pages.
2. MIRAR cada captura antes de enviarla: que muestre lo que dice su título (formulario abierto, síntomas marcados, día completado, etc.). Si no, corregir el script, no enviar.
3. Publicar las páginas en revision/ux-vNN/ (main) y esperar que carguen.
4. Enviar a GPT con el encargo de qa/ux_audit_prompt.md (versión, cambios desde la auditoría anterior). Si ChatGPT no tiene cupo: NO usar «Restablecer uso»; programar la auditoría con send_later +2 h.
5. Leer la respuesta COMPLETA (bloques de ~900 caracteres) y registrarla en la sección 9 del doc: dictamen, notas, seguimiento, hallazgos nuevos, regresiones.
6. Corregir de inmediato solo regresiones o críticos de esfuerzo S sin decisión clínica (de nuevo con B y C). Lo demás, a la sección 8 del calendario.

## D. Cerrar
1. Revisar conteos y textos antes de informar.
2. Marcar la sección 8 del doc.
3. Avisar a Esteban con SendUserMessage en 3-5 líneas: qué se publicó, dictamen de GPT, qué necesita de él.
