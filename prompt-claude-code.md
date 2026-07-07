# PROMPT PARA CLAUDE CODE — copiar y pegar completo

> Requisito previo: coloca los archivos `content/*.json` (entregados junto a este prompt) en la raíz del proyecto antes de ejecutar. Claude Code los moverá a `src/content/`.

---

Construye una web app estática de entrenamiento para certificaciones Microsoft, diseñada para un usuario con TDAH. Sigue esta especificación al pie de la letra.

## Stack y restricciones
- **React 18 + Vite + Tailwind CSS**. Sin backend, coste cero.
- Contenido en archivos JSON estáticos importados en build (`src/content/`).
- Todo el estado del usuario en `localStorage` (clave raíz `certtrainer.v1`), serializado como un único objeto versionado `{ schemaVersion, ... }` para poder migrar.
- Despliegue en **GitHub Pages** vía GitHub Actions. Configura `base` en `vite.config.js` con el nombre del repo.
- Sin analytics, sin fuentes externas, sin llamadas de red en runtime. PWA no requerida (opcional al final si todo lo demás pasa).
- Idioma de la UI: **español**.

## Contenido
Los JSON siguen este esquema (ya provisto, NO inventes contenido nuevo):

```
index.json: { version, examenes: [{ codigo, archivo, prioridad, cobertura, aviso? }] }
<examen>.json: { examen, nombre, certificacion, estado, avisoRetiro?, vigencia{retirementDate?...},
  cobertura, notaLegal, dominios: [{ id, dominio, ponderacion, subtemas[],
    flashcards:[{ id, concepto, explicacion }],
    preguntas:[{ id, pregunta, opciones:[{ texto, correcta, explicacion }] }],
    escenarios:[{ id, situacion, pregunta, respuestaEsperada, razonamiento }] }] }
```

Carga: importa `index.json` y haz `import.meta.glob` sobre `src/content/*.json`. **Extensibilidad:** añadir un examen = añadir su JSON + una entrada en `index.json`, sin tocar código. Valida el esquema al arrancar (dev only) y muestra error claro si un JSON está malformado. Baraja el orden de las opciones al renderizar cada pregunta (que la correcta no sea siempre la misma posición).

## Estructura de carpetas
```
src/
  content/            # JSON de contenido
  lib/
    leitner.js        # algoritmo de repetición espaciada
    sessionBuilder.js # compone la siguiente sesión
    storage.js        # capa localStorage (get/set/migrate/export/import)
    xp.js             # XP y niveles
  components/
    SessionCard.jsx   # contenedor de un item (uno por pantalla)
    Flashcard.jsx     # concepto → revelar → autoevaluación (Sí/Más o menos/No)
    Question.jsx      # MCQ con feedback inmediato por opción
    Scenario.jsx      # situación → pensar → revelar respuesta y razonamiento → autoevaluación
    ProgressBar.jsx   # por dominio y por examen (anillo)
    Pomodoro.jsx      # temporizador discreto en header
    StreakBadge.jsx   # racha "amable" (ver reglas abajo)
    SessionSummary.jsx
  pages/
    Home.jsx          # UN botón primario + progreso
    Session.jsx
    Progress.jsx      # detalle por examen/dominio, vista cajas Leitner
    Settings.jsx      # tamaño sesión, tema, pomodoro, export/import, reset
  App.jsx  main.jsx  index.css
```

## Lógica Leitner (lib/leitner.js)
- Estado por item: `{ itemId, box: 1..5, nextReview: ISOdate, lapses, lastSeen }`. Items nunca vistos no tienen entrada.
- Acierto (o "Sí" en autoevaluación): `box = min(box+1, 5)`. "Más o menos": mantiene box. Fallo/"No": `box = 1`, `lapses++`.
- Intervalos por caja: [0, 1, 3, 7, 21] días.
- `sessionBuilder`: tamaño N (por defecto 10, opciones 5/10/15). Prioridad: items vencidos del examen activo → items nuevos del dominio en curso (en orden del JSON) → refuerzo de cajas 1–2. Mezcla tipos (flashcards/preguntas/escenarios) pero **todos del mismo dominio** salvo en modo "repaso general".

## Reglas UX TDAH (obligatorias, serán verificadas)
1. **Un item por pantalla**, máximo 2 acciones visibles. Sin scroll dentro del item.
2. **Home = un solo botón primario** "Empezar siguiente sesión" (la app decide qué toca). Selección manual de examen/dominio en menú secundario. Si hay sesión a medias, el botón primario pasa a ser "Reanudar sesión (quedan N)".
3. **Feedback inmediato**: al elegir opción, marca correcta/incorrecta al instante con la explicación de la opción elegida y la de la correcta. Tono neutro, nunca punitivo.
4. **Persistencia total**: guarda en localStorage tras CADA interacción (respuesta, revelado, cambio de ajuste). Recargar en mitad de sesión nunca pierde más que el item en curso.
5. **Sesiones cortas**: nunca más de 15 items. Al terminar, `SessionSummary` con aciertos, XP ganado y CIERRE claro — el CTA de "otra sesión" debe ser discreto (link secundario), no un botón grande.
6. **Gamificación sana**: XP por item respondido (respondido, no acertado: +10; acierto: +5 extra). Niveles por examen (curva suave: nivel n cuesta 100·n XP). Racha = "días activos", se congela automáticamente hasta 2 días sin actividad y NUNCA muestra mensajes de culpa ni pérdida dramática. Prohibido: notificaciones de presión, recompensas aleatorias, comparación social, contadores de tiempo visibles durante los items.
7. **Modo oscuro por defecto** con toggle persistente; respeta `prefers-reduced-motion`.
8. **Pomodoro** opcional en el header: 25/5 configurable, discreto, al terminar el bloque sugiere pausa sin interrumpir el item actual.
9. **Barras de progreso**: por dominio (% items en box ≥ 4) y por examen (media ponderada usando la ponderación oficial del dominio — parsea "25-30%" tomando el punto medio).
10. **Avisos**: si `vigencia.retirementDate` existe y es futura, muestra un banner ámbar en la vista del examen (p. ej. AZ-500 se retira el 2026-08-31, sucesor SC-500). Muestra la `notaLegal` y la nota de honestidad en un footer/about: "Esta app entrena conocimiento y razonamiento; no reemplaza los labs reales de Azure/Power BI".

## Tipos de item
- **Flashcard**: muestra `concepto` → botón "Mostrar respuesta" → `explicacion` + autoevaluación (Sí lo sabía / Más o menos / No).
- **Pregunta**: enunciado + 4 opciones barajadas → selección → feedback inmediato → botón "Siguiente".
- **Escenario**: `situacion` + `pregunta` → el usuario piensa (opcional: textarea no persistida para apuntar su idea) → "Mostrar respuesta esperada" → `respuestaEsperada` + `razonamiento` + autoevaluación como flashcard.

## Settings
Tamaño de sesión (5/10/15), tema claro/oscuro, duración pomodoro, exportar progreso (descarga JSON), importar progreso (valida schemaVersion), reset con confirmación doble.

## Criterios de aceptación (verifícalos antes de dar por terminado)
1. `npm run build` termina sin errores y `npm run preview` sirve la app funcional.
2. Al recargar el navegador, el progreso (XP, cajas, sesión a medias) persiste. Test manual + unit test de `storage.js`.
3. Ninguna sesión generada por `sessionBuilder` supera 15 items (unit test).
4. Existe el botón "Reanudar sesión (quedan N items)" tras cerrar a mitad de sesión.
5. Un item fallado tiene `nextReview` hoy y reaparece antes que uno acertado (unit test de `leitner.js`).
6. En cada pregunta respondida se muestra explicación de la opción elegida Y de la correcta.
7. La home muestra exactamente un botón primario.
8. El banner de retiro aparece para AZ-500 y no para los demás.
9. Los 6 exámenes cargan desde JSON; añadir un séptimo JSON de prueba con 1 dominio funciona sin tocar código (demuéstralo y bórralo).
10. Modo oscuro por defecto; toggle persiste tras recarga.
11. Lighthouse accesibilidad ≥ 90 (contraste, focus visible, navegación por teclado en los items).
12. Unit tests de `leitner.js`, `sessionBuilder.js` y `storage.js` con Vitest, todos en verde.

## Build y deploy a GitHub Pages
1. `vite.config.js`: `base: '/<NOMBRE_REPO>/'`.
2. Workflow `.github/workflows/deploy.yml`: en push a `main` → `npm ci && npm run test -- --run && npm run build` → sube `dist/` con `actions/upload-pages-artifact` → `actions/deploy-pages`. Permisos `pages: write, id-token: write`.
3. Documenta en README.md (en español): requisitos, `npm run dev`, cómo añadir contenido nuevo (esquema JSON + entrada en index.json), cómo activar Pages (Settings → Pages → Source: GitHub Actions), y la nota de honestidad sobre labs.

Trabaja de forma incremental: primero lib/ con tests, luego componentes, luego páginas, luego deploy. No añadas features fuera de esta especificación.

---
*Fin del prompt para Claude Code.*
