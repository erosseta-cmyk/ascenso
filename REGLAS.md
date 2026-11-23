# REGLAS ÚNICAS DE TRABAJO EN ASCENSO
Ritmo: semana en la copia de prueba, acta el domingo, publicación solo con el sí de Esteban.
 (fuente única; las tareas programadas solo apuntan aquí)

Proyecto: PWA https://erosseta-cmyk.github.io/ascenso/ · repo erosseta-cmyk/ascenso (main = publicado) · Supabase gtwqhrmobusntfsqebdc.
Doc de auditoría (calendario en sección 8, auditorías posteriores en sección 9): https://claude.ai/artifact/Fzs4fRxFgZFY1gpLEYJauV
Conversación de GPT para auditar: https://chatgpt.com/c/6afe0790-7794-83e8-85fa-d80359bf5607

## A. Antes de empezar
1. Si /home/claude/ascenso no existe: clonar el repo. Si /home/claude/qa no existe: clonar la rama qa-tools del mismo repo en /home/claude/qa.
2. Leer la última auditoría integral en el doc (sección 9). Regresiones o críticos pendientes van primero.
3. Hacer UNA cosa a la vez. Nunca varias llamadas que modifican cosas en paralelo.

## B. Cambiar, probar en la copia de prueba y publicar SOLO el domingo con el sí de Esteban (decisión del 22-11)
0. La app de los pacientes (main, /ascenso/) queda CONGELADA de lunes a sábado. Excepciones: pérdida de registros, riesgo clínico o que alguien no pueda entrar; en ese caso corregir, publicar y avisar de inmediato.
1. Durante la semana: rama propia desde main (nombre beta-AAAAMMDD), siguiente número de versión libre (sw.js `ascenso-vNN` y etiqueta del pie). Después de editar scripts: `python3 tools/csp.py index.html`.
2. Prueba nueva t_vNN.js que verifique cada cambio y regresión completa con `TZ=America/Santiago` (t_v54 y t_v60 fallan desde antes por reglas cambiadas; no son regresión). Además `BROOT` + t_beta.js para el aislamiento de la copia.
3. Compatibilidad: un teléfono con la versión anterior debe seguir funcionando; los datos viejos se leen igual.
4. Publicar en la COPIA DE PRUEBA: desde la rama, `python3 tools/beta_build.py` (genera beta/index.html desde el index.html de la rama) y subir SOLO beta/ a main (git checkout main && git checkout <rama> -- beta/index.html && commit && push). No tocar index.html ni sw.js de main. Verificar en vivo https://erosseta-cmyk.github.io/ascenso/beta/ (aviso rojo «COPIA DE PRUEBA»). beta/allow.json = cuentas de prueba autorizadas por Esteban; nunca agregar cuentas reales de pacientes.
5. Publicar a los pacientes: SOLO cuando Esteban diga sí en el chat al acta del domingo. Entonces: merge de la rama a main, verificar en vivo versión, caché y cambio, y dejar rama ref-vNN como punto de regreso.
6. Nunca decidir textos clínicos o legales, nunca firmar fichas, nunca liberar a todos sin el sí explícito de Esteban.

## C. Auditoría UX integral después de CADA publicación (pedido de Esteban, 22-11-2026)
1. `bash /home/claude/qa/ux_run.sh vNN` → páginas en /home/claude/ux_vNN/pages.
2. MIRAR cada captura antes de enviarla: que muestre lo que dice su título (formulario abierto, síntomas marcados, día completado, etc.). Si no, corregir el script, no enviar.
3. Publicar las páginas en revision/ux-vNN/ (main; solo esa carpeta) y esperar que carguen.
4. Enviar a GPT con el encargo de qa/ux_audit_prompt.md (versión, cambios desde la auditoría anterior). Si ChatGPT no tiene cupo: NO usar «Restablecer uso»; programar la auditoría con send_later +2 h.
5. Leer la respuesta COMPLETA (bloques de ~900 caracteres) y registrarla en la sección 9 del doc: dictamen, notas, seguimiento, hallazgos nuevos, regresiones.
6. Corregir de inmediato solo regresiones o críticos de esfuerzo S sin decisión clínica (de nuevo con B y C). Lo demás, a la sección 8 del calendario.

## D. Cerrar
1. Revisar conteos y textos antes de informar.
2. Marcar la sección 8 del doc.
3. Avisar a Esteban con SendUserMessage en 3-5 líneas: qué quedó en la copia de prueba, dictamen de GPT, qué necesita de él.

## E. Acta del domingo
1. Resumen de la semana: cambios en la copia de prueba, resultado de pruebas, dictamen de GPT y estado de los casos del instructivo dominical (6 casos de la pág. 2 cuando corresponda).
2. Escribirla como sección nueva del doc de auditoría («Acta AAAA-MM-DD»): versión, cambio, evidencia, riesgos, vía de regreso.
3. Preguntar a Esteban: publicar / aplazar / revertir. Sin su sí, no se publica.
