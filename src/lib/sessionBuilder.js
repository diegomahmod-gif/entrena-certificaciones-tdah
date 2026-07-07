// Compone la siguiente sesión de estudio.
// Prioridad: items vencidos del examen activo → items nuevos del dominio en
// curso (en orden del JSON) → refuerzo de cajas 1–2.
// Mezcla tipos, pero todos los items son del mismo dominio salvo en modo
// "repaso" (repaso general).

import { estaVencido } from './leitner.js'

export const MAX_ITEMS_SESION = 15
export const TAMANOS_VALIDOS = [5, 10, 15]

/** Aplana el examen a una lista de items en el orden del JSON. */
export function aplanarItems(examen) {
  const items = []
  for (const dominio of examen.dominios) {
    for (const f of dominio.flashcards || []) {
      items.push({ id: f.id, tipo: 'flashcard', dominioId: dominio.id })
    }
    for (const p of dominio.preguntas || []) {
      items.push({ id: p.id, tipo: 'pregunta', dominioId: dominio.id })
    }
    for (const e of dominio.escenarios || []) {
      items.push({ id: e.id, tipo: 'escenario', dominioId: dominio.id })
    }
  }
  return items
}

/** Intercala tipos (flashcard/pregunta/escenario) preservando el orden relativo. */
export function mezclarTipos(items) {
  const colas = new Map()
  for (const it of items) {
    if (!colas.has(it.tipo)) colas.set(it.tipo, [])
    colas.get(it.tipo).push(it)
  }
  const listas = [...colas.values()]
  const resultado = []
  let quedan = true
  while (quedan) {
    quedan = false
    for (const lista of listas) {
      if (lista.length) {
        resultado.push(lista.shift())
        quedan = true
      }
    }
  }
  return resultado
}

/**
 * Construye la siguiente sesión.
 * @param {object} opts
 * @param {object} opts.examen - JSON del examen activo
 * @param {object} opts.leitner - mapa { itemId: entradaLeitner } del examen
 * @param {number} opts.tamano - 5/10/15 (por defecto 10)
 * @param {'dominio'|'repaso'} opts.modo - 'repaso' = repaso general entre dominios
 * @param {Date} opts.ahora
 * @returns {{ examen, modo, dominioId, items: [{id,tipo,dominioId}] }}
 */
export function construirSesion({ examen, leitner = {}, tamano = 10, modo = 'dominio', ahora = new Date() }) {
  const n = Math.min(tamano, MAX_ITEMS_SESION)
  const todos = aplanarItems(examen)
  const entrada = (id) => leitner[id]

  const vencidos = todos.filter((it) => entrada(it.id) && estaVencido(entrada(it.id), ahora))
  const nuevos = todos.filter((it) => !entrada(it.id))
  const refuerzo = todos.filter(
    (it) => entrada(it.id) && !estaVencido(entrada(it.id), ahora) && entrada(it.id).box <= 2
  )

  let candidatos
  let dominioId = null

  // Se intercalan los tipos DENTRO de cada grupo de prioridad antes del corte
  // a N items: así la sesión mezcla tipos aunque el dominio tenga muchos
  // items seguidos del mismo tipo, sin romper la prioridad entre grupos.
  if (modo === 'repaso') {
    // Repaso general: cualquier dominio.
    candidatos = [...mezclarTipos(vencidos), ...mezclarTipos(nuevos), ...mezclarTipos(refuerzo)]
  } else {
    // Dominio foco: el primero (en orden del JSON) con vencidos; si no hay,
    // el primero con items nuevos (dominio en curso); si no, el primero con refuerzo.
    dominioId =
      vencidos[0]?.dominioId ?? nuevos[0]?.dominioId ?? refuerzo[0]?.dominioId ?? null
    if (dominioId === null) return { examen: examen.examen, modo, dominioId, items: [] }
    const delDominio = (lista) => lista.filter((it) => it.dominioId === dominioId)
    candidatos = [
      ...mezclarTipos(delDominio(vencidos)),
      ...mezclarTipos(delDominio(nuevos)),
      ...mezclarTipos(delDominio(refuerzo)),
    ]
  }

  return { examen: examen.examen, modo, dominioId, items: candidatos.slice(0, n) }
}
