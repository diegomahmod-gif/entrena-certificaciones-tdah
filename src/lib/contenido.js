// Carga del contenido estático: index.json + import.meta.glob sobre src/content.
// Extensibilidad: añadir un examen = añadir su JSON + una entrada en index.json,
// sin tocar código.

import indice from '../content/index.json'

const modulos = import.meta.glob('../content/*.json', { eager: true })

function moduloPorArchivo(archivo) {
  const clave = `../content/${archivo}`
  return modulos[clave]?.default ?? modulos[clave]
}

/** Valida el esquema de un examen. Devuelve lista de errores (vacía si OK). */
export function validarExamen(examen, archivo) {
  const errores = []
  const err = (msg) => errores.push(`${archivo}: ${msg}`)
  if (!examen || typeof examen !== 'object') {
    err('el JSON no es un objeto')
    return errores
  }
  for (const campo of ['examen', 'nombre', 'dominios']) {
    if (!examen[campo]) err(`falta el campo "${campo}"`)
  }
  if (!Array.isArray(examen.dominios)) {
    err('"dominios" debe ser un array')
    return errores
  }
  examen.dominios.forEach((d, i) => {
    if (!d.id) err(`dominios[${i}] sin "id"`)
    if (!d.dominio) err(`dominios[${i}] sin "dominio"`)
    for (const f of d.flashcards || []) {
      if (!f.id || !f.concepto || !f.explicacion) err(`flashcard malformada en dominios[${i}]`)
    }
    for (const p of d.preguntas || []) {
      if (!p.id || !p.pregunta || !Array.isArray(p.opciones)) {
        err(`pregunta malformada en dominios[${i}]`)
      } else if (!p.opciones.some((o) => o.correcta)) {
        err(`pregunta ${p.id} sin opción correcta`)
      }
    }
    for (const e of d.escenarios || []) {
      if (!e.id || !e.situacion || !e.pregunta || !e.respuestaEsperada) {
        err(`escenario malformado en dominios[${i}]`)
      }
    }
  })
  return errores
}

/**
 * Carga todos los exámenes declarados en index.json.
 * En dev valida el esquema y lanza un error claro si algo está malformado.
 * @returns {Array<{ meta: object, datos: object }>}
 */
export function cargarExamenes() {
  const examenes = []
  const errores = []
  for (const meta of indice.examenes) {
    const datos = moduloPorArchivo(meta.archivo)
    if (!datos) {
      errores.push(`index.json referencia "${meta.archivo}" pero el archivo no existe en src/content/`)
      continue
    }
    if (import.meta.env.DEV) {
      errores.push(...validarExamen(datos, meta.archivo))
    }
    examenes.push({ meta, datos })
  }
  if (errores.length > 0 && import.meta.env.DEV) {
    throw new Error(`Contenido malformado:\n- ${errores.join('\n- ')}`)
  }
  return examenes
}

export function obtenerIndice() {
  return indice
}

/** Busca un item por id dentro de un examen. Devuelve { tipo, dominio, data } o null. */
export function buscarItem(examen, itemId) {
  for (const dominio of examen.dominios) {
    for (const f of dominio.flashcards || []) {
      if (f.id === itemId) return { tipo: 'flashcard', dominio, data: f }
    }
    for (const p of dominio.preguntas || []) {
      if (p.id === itemId) return { tipo: 'pregunta', dominio, data: p }
    }
    for (const e of dominio.escenarios || []) {
      if (e.id === itemId) return { tipo: 'escenario', dominio, data: e }
    }
  }
  return null
}
