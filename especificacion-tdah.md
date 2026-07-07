# Especificación de contenido y diseño pedagógico para TDAH
**App de entrenamiento para certificaciones Microsoft** — v1.0, 2026-07-07

## 1. Resumen de investigación (Fase 1)

Vigencia verificada el 2026-07-07 contra las guías oficiales de Microsoft Learn:

| Examen | Nombre | Estado | Skills measured desde | Dominios (ponderación) |
|---|---|---|---|---|
| PL-300 | Power BI Data Analyst | ✅ Activo | 2026-04-20 | Prepare the data (25–30%) · Model the data (25–30%) · Visualize and analyze (25–30%) · Manage and secure Power BI (15–20%) |
| AZ-900 | Azure Fundamentals | ✅ Activo | 2026-07-20 | Cloud concepts (25–30%) · Architecture and services (35–40%) · Management and governance (30–35%) |
| AZ-104 | Azure Administrator | ✅ Activo | 2026-04-17 | Identities/governance (20–25%) · Storage (15–20%) · Compute (20–25%) · Networking (15–20%) · Monitor/maintain (10–15%) |
| AZ-305 | Designing Azure Infrastructure Solutions | ✅ Activo | 2026-04-17 | Identity/governance/monitoring (25–30%) · Data storage (20–25%) · Business continuity (15–20%) · Infrastructure (30–35%) |
| AZ-500 | Azure Security Technologies | ⚠️ **Se retira el 2026-08-31** (sucesor: SC-500) | 2026-01-22 | Identity/access (15–20%) · Networking (20–25%) · Compute/storage/DB (20–25%) · Defender/Sentinel (30–35%) |
| AZ-800 | Windows Server Hybrid Core Infrastructure | ✅ Activo (la certificación requiere también AZ-801) | 2026-01-21 | AD DS (30–35%) · Hybrid management (10–15%) · VMs/containers (15–20%) · Networking (15–20%) · Storage/file services (15–20%) |

Fuentes: `learn.microsoft.com/credentials/certifications/resources/study-guides/<examen>`. Todos los exámenes requieren 700/1000 para aprobar.

**Nota de honestidad (obligatoria en la app):** la app entrena conocimiento y razonamiento tipo examen. NO sustituye los labs prácticos en Azure/Power BI ni la experiencia real. Para AZ-104/305/500/800 la práctica hands-on es imprescindible.

## 2. Modelo de contenido (Fase 2)

Todo el contenido vive en `content/*.json`, uno por examen, más `index.json` como catálogo. Esquema por examen:

```
{ examen, nombre, certificacion, estado, vigencia{...}, cobertura, notaLegal,
  dominios: [ { id, dominio, ponderacion, subtemas[],
    flashcards:  [{ id, concepto, explicacion }],
    preguntas:   [{ id, pregunta, opciones: [{ texto, correcta, explicacion }] }],
    escenarios:  [{ id, situacion, pregunta, respuestaEsperada, razonamiento }] } ] }
```

Reglas del contenido: 100% original (cero texto de Microsoft, cero preguntas reales de examen); español con términos técnicos en inglés tal como aparecen en el examen; cada opción de pregunta lleva SU explicación (por qué es correcta o por qué no); los escenarios imitan el razonamiento de labs sin copiar instrucciones. PL-300 y AZ-900 tienen cobertura completa; los otros cuatro, estructura de dominios con items de muestra extensibles.

## 3. Principios pedagógicos TDAH y su implementación (Fase 3)

Este es el diferenciador de la app. Cada principio se mapea a un mecanismo concreto y verificable.

### 3.1 Micro-sesiones (5–15 min, UN concepto a la vez)
- Una sesión = máx. 15 items (configurable 5/10/15), estimando ~45 s por item.
- Un solo item visible por pantalla. Nunca listas de preguntas, nunca scroll infinito.
- Cada sesión se centra en un dominio; la mezcla entre dominios solo aparece en el modo "repaso general" explícito.
- Al terminar: pantalla de cierre con resumen breve y salida clara ("Hecho por hoy" es un final legítimo y celebrado).

### 3.2 Recall activo primero (nunca lectura pasiva)
- Las flashcards muestran SOLO el concepto; el usuario intenta recordar y luego revela la explicación ("¿Lo sabías?" → Sí/Más o menos/No alimenta el algoritmo).
- Las preguntas aparecen antes que cualquier teoría: la explicación llega como feedback, no como lectura previa.
- No existe un "modo lectura" de teoría: la teoría vive dentro del feedback de cada item.

### 3.3 Repetición espaciada — algoritmo Leitner (5 cajas)
- Cada item tiene `box` (1–5) y `nextReview`. Acierto → sube de caja; fallo → vuelve a caja 1.
- Intervalos: caja 1 = hoy, 2 = 1 día, 3 = 3 días, 4 = 7 días, 5 = 21 días.
- La sesión se compone priorizando: (1) items vencidos (nextReview ≤ hoy), (2) items nuevos del dominio activo, (3) refuerzo de cajas bajas. Se eligió Leitner sobre SM-2 por transparencia: el usuario puede VER sus cajas, lo que da sensación de control (importante en TDAH). SM-2 puede sustituirlo después sin cambiar el esquema de datos.

### 3.4 Feedback inmediato
- Al responder: correcto/incorrecto al instante (color + icono + explicación de la opción elegida y de la correcta).
- Sin penalizaciones acumulativas visibles ni "puntuación final de examen" en sesiones normales: cada item cierra su ciclo.
- El feedback negativo es informativo y neutro ("Esta opción confunde X con Y"), nunca punitivo.

### 3.5 Gamificación sana y no adictiva
- **Sí:** XP por item respondido (independiente de acierto, para premiar el esfuerzo), niveles por examen, barra de progreso por dominio y examen, racha de días estudiados.
- **No (anti-dark-patterns):** la racha NUNCA se pierde de forma dramática — se muestra "días activos esta semana" y una racha que se "congela" automáticamente 2 días sin culpabilizar; sin notificaciones de presión; sin recompensas variables tipo tragaperras; sin comparación social; sin contadores de tiempo en pantalla durante los items; sin "una más y ya" al final de la sesión (la pantalla final NO ofrece encadenar otra sesión con un botón grande — solo una opción discreta).
- Objetivo declarado en la UI: aprender y aprobar, no maximizar tiempo en la app.

### 3.6 Guardado de estado y "reanudar donde quedaste"
- TODO el estado (progreso Leitner, sesión en curso, item actual, XP, configuración) se persiste en `localStorage` en cada interacción.
- Si el usuario cierra a mitad de sesión, al volver ve UN botón primario: "Reanudar sesión (quedan N items)".
- Exportar/importar progreso como archivo JSON (backup manual, sin backend).

### 3.7 UI mínima y sin distracciones
- Una columna, tipografía grande, máx. 2 acciones visibles por pantalla.
- Modo oscuro por defecto (toggle persistente), animaciones sutiles y desactivables ("reduced motion").
- Sin banners, sin feed, sin novedades: la home es el botón de empezar + progreso.

### 3.8 Pomodoro integrado (body doubling)
- Temporizador opcional 25/5 (configurable) que corre discretamente en el header; al acabar el bloque sugiere pausa SIN cortar el item actual.
- Pensado como ancla de foco: iniciarlo es parte del ritual de "empezar sesión".

### 3.9 Un solo botón para empezar
- La home tiene UN botón primario: "Empezar siguiente sesión". La app decide qué toca (items vencidos → dominio en curso → siguiente dominio) usando Leitner + ponderaciones del examen.
- Elegir examen/dominio manualmente existe, pero está un nivel por debajo (menú secundario). Cero fatiga de decisión en el camino feliz.

### 3.10 Progreso visible
- Barra por dominio (items dominados = caja ≥ 4 / total) y anillo por examen (media ponderada por el % oficial del dominio).
- Vista "cajas Leitner" opcional para quien quiera el detalle.

## 4. Criterios de aceptación pedagógicos
1. Ninguna sesión supera 15 items ni ~15 minutos estimados.
2. Cada pantalla de estudio muestra exactamente un item.
3. Un item fallado reaparece antes que uno acertado (verificable en el estado Leitner).
4. Al recargar el navegador a mitad de sesión, existe "Reanudar" y restaura el item exacto.
5. La racha no genera mensajes de culpa; congelación automática documentada.
6. El feedback aparece en <100 ms tras responder, con explicación de la opción elegida.
7. Toda la teoría es accesible únicamente vía recall (flashcard/pregunta), no como documento.
8. La app muestra la nota de honestidad sobre labs reales y el aviso de retiro de AZ-500.
