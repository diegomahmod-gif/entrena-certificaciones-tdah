// Reglas de calidad para exámenes con "cobertura": "completa".
// Complementa a validarExamen (esquema mínimo que la app comprueba en dev).

export const MINIMOS_COMPLETA = { flashcards: 25, preguntas: 30, escenarios: 8 }

// Restos de plantilla que nunca deben llegar a la app.
const PROHIBIDAS = [/lorem/i, /TODO/, /ejemplo/i]

function* textos(valor) {
  if (typeof valor === 'string') yield valor
  else if (Array.isArray(valor)) for (const v of valor) yield* textos(v)
  else if (valor && typeof valor === 'object') for (const v of Object.values(valor)) yield* textos(v)
}

const vacio = (s) => typeof s !== 'string' || s.trim() === ''

/** Devuelve la lista de problemas (vacía si el examen cumple). */
export function problemasCoberturaCompleta(examen, minimos = MINIMOS_COMPLETA) {
  const problemas = []
  const ids = new Set()
  const registrarId = (id) => {
    if (ids.has(id)) problemas.push(`id duplicado: ${id}`)
    ids.add(id)
  }

  for (const d of examen.dominios) {
    const { flashcards = [], preguntas = [], escenarios = [] } = d
    if (flashcards.length < minimos.flashcards)
      problemas.push(`${d.id}: ${flashcards.length} flashcards (mínimo ${minimos.flashcards})`)
    if (preguntas.length < minimos.preguntas)
      problemas.push(`${d.id}: ${preguntas.length} preguntas (mínimo ${minimos.preguntas})`)
    if (escenarios.length < minimos.escenarios)
      problemas.push(`${d.id}: ${escenarios.length} escenarios (mínimo ${minimos.escenarios})`)

    for (const f of flashcards) {
      registrarId(f.id)
      if (!f.id.startsWith(`${d.id}-f`)) problemas.push(`${f.id}: no sigue el patrón ${d.id}-fNN`)
      if (vacio(f.concepto) || vacio(f.explicacion)) problemas.push(`${f.id}: flashcard incompleta`)
    }
    for (const p of preguntas) {
      registrarId(p.id)
      if (!p.id.startsWith(`${d.id}-q`)) problemas.push(`${p.id}: no sigue el patrón ${d.id}-qNN`)
      if (vacio(p.pregunta)) problemas.push(`${p.id}: sin enunciado`)
      if (p.opciones.length !== 4) problemas.push(`${p.id}: ${p.opciones.length} opciones (se esperan 4)`)
      const correctas = p.opciones.filter((o) => o.correcta === true).length
      if (correctas !== 1) problemas.push(`${p.id}: ${correctas} opciones correctas (se espera 1)`)
      p.opciones.forEach((o, i) => {
        if (vacio(o.texto)) problemas.push(`${p.id}: opción ${i + 1} sin texto`)
        if (vacio(o.explicacion)) problemas.push(`${p.id}: opción ${i + 1} sin explicación`)
      })
    }
    for (const e of escenarios) {
      registrarId(e.id)
      if (!e.id.startsWith(`${d.id}-s`)) problemas.push(`${e.id}: no sigue el patrón ${d.id}-sNN`)
      for (const campo of ['situacion', 'pregunta', 'respuestaEsperada', 'razonamiento']) {
        if (vacio(e[campo])) problemas.push(`${e.id}: falta "${campo}"`)
      }
    }
  }

  for (const t of textos(examen)) {
    for (const re of PROHIBIDAS) {
      if (re.test(t)) problemas.push(`texto con ${re}: "${t.slice(0, 60)}…"`)
    }
  }
  return problemas
}
