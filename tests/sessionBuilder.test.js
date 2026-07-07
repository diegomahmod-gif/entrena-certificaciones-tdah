import { describe, it, expect } from 'vitest'
import {
  construirSesion,
  aplanarItems,
  mezclarTipos,
  MAX_ITEMS_SESION,
} from '../src/lib/sessionBuilder.js'
import { calificar } from '../src/lib/leitner.js'

const AHORA = new Date(2026, 6, 7)

/** Examen sintético con 2 dominios y muchos items. */
function examenFalso() {
  const dominio = (id, n) => ({
    id,
    dominio: `Dominio ${id}`,
    ponderacion: '50%',
    subtemas: [],
    flashcards: Array.from({ length: n }, (_, i) => ({
      id: `${id}-f${i}`,
      concepto: 'c',
      explicacion: 'e',
    })),
    preguntas: Array.from({ length: n }, (_, i) => ({
      id: `${id}-q${i}`,
      pregunta: 'p',
      opciones: [
        { texto: 'a', correcta: true, explicacion: 'x' },
        { texto: 'b', correcta: false, explicacion: 'y' },
      ],
    })),
    escenarios: Array.from({ length: n }, (_, i) => ({
      id: `${id}-s${i}`,
      situacion: 's',
      pregunta: 'p',
      respuestaEsperada: 'r',
      razonamiento: 'z',
    })),
  })
  return { examen: 'TEST-100', dominios: [dominio('d1', 10), dominio('d2', 10)] }
}

describe('sessionBuilder', () => {
  it('nunca genera más de 15 items, aunque se pida más', () => {
    const examen = examenFalso()
    for (const tamano of [5, 10, 15, 50, 999]) {
      const sesion = construirSesion({ examen, leitner: {}, tamano, ahora: AHORA })
      expect(sesion.items.length).toBeLessThanOrEqual(MAX_ITEMS_SESION)
    }
    const enorme = construirSesion({ examen, leitner: {}, tamano: 999, ahora: AHORA })
    expect(enorme.items.length).toBe(15)
  })

  it('respeta el tamaño pedido (5/10/15)', () => {
    const examen = examenFalso()
    expect(construirSesion({ examen, tamano: 5, ahora: AHORA }).items.length).toBe(5)
    expect(construirSesion({ examen, tamano: 10, ahora: AHORA }).items.length).toBe(10)
  })

  it('en modo dominio todos los items son del mismo dominio', () => {
    const examen = examenFalso()
    const sesion = construirSesion({ examen, leitner: {}, tamano: 15, ahora: AHORA })
    const dominios = new Set(sesion.items.map((it) => it.dominioId))
    expect(dominios.size).toBe(1)
    expect(sesion.dominioId).toBe('d1')
  })

  it('prioriza items vencidos sobre items nuevos', () => {
    const examen = examenFalso()
    // Fallamos dos items de d1: quedan vencidos hoy (box 1, intervalo 0).
    const leitner = {
      'd1-q0': calificar(undefined, 'd1-q0', 'mal', AHORA),
      'd1-f0': calificar(undefined, 'd1-f0', 'mal', AHORA),
    }
    const sesion = construirSesion({ examen, leitner, tamano: 5, ahora: AHORA })
    const ids = sesion.items.map((it) => it.id)
    expect(ids).toContain('d1-q0')
    expect(ids).toContain('d1-f0')
  })

  it('los items acertados hoy (no vencidos) no vuelven a entrar', () => {
    const examen = examenFalso()
    const leitner = { 'd1-f0': calificar(undefined, 'd1-f0', 'bien', AHORA) }
    const sesion = construirSesion({ examen, leitner, tamano: 15, ahora: AHORA })
    expect(sesion.items.map((it) => it.id)).not.toContain('d1-f0')
  })

  it('avanza al siguiente dominio cuando el actual está completo', () => {
    const examen = examenFalso()
    const leitner = {}
    // Todos los items de d1 dominados (box 5, revisión lejana).
    for (const it of aplanarItems(examen).filter((i) => i.dominioId === 'd1')) {
      leitner[it.id] = { itemId: it.id, box: 5, lapses: 0, nextReview: '2099-01-01', lastSeen: '2026-07-07' }
    }
    const sesion = construirSesion({ examen, leitner, tamano: 10, ahora: AHORA })
    expect(sesion.dominioId).toBe('d2')
  })

  it('modo repaso general puede mezclar dominios', () => {
    const examen = examenFalso()
    const leitner = {
      'd1-f0': calificar(undefined, 'd1-f0', 'mal', AHORA),
      'd2-f0': calificar(undefined, 'd2-f0', 'mal', AHORA),
    }
    const sesion = construirSesion({ examen, leitner, tamano: 5, modo: 'repaso', ahora: AHORA })
    const ids = sesion.items.map((it) => it.id)
    expect(ids).toContain('d1-f0')
    expect(ids).toContain('d2-f0')
  })

  it('mezcla tipos: no devuelve todos los tipos en bloque', () => {
    const examen = examenFalso()
    const sesion = construirSesion({ examen, leitner: {}, tamano: 15, ahora: AHORA })
    const tipos = sesion.items.slice(0, 3).map((it) => it.tipo)
    expect(new Set(tipos).size).toBeGreaterThan(1)
  })

  it('mezcla tipos aunque el dominio tenga muchos items seguidos del mismo tipo', () => {
    // 12 flashcards y solo 2 preguntas/2 escenarios: si el corte a N se hiciera
    // antes de mezclar, la sesión saldría solo de flashcards.
    const examen = {
      examen: 'TEST-200',
      dominios: [
        {
          id: 'd1',
          dominio: 'D1',
          ponderacion: '100%',
          subtemas: [],
          flashcards: Array.from({ length: 12 }, (_, i) => ({ id: `f${i}`, concepto: 'c', explicacion: 'e' })),
          preguntas: [
            { id: 'q0', pregunta: 'p', opciones: [{ texto: 'a', correcta: true, explicacion: 'x' }] },
            { id: 'q1', pregunta: 'p', opciones: [{ texto: 'a', correcta: true, explicacion: 'x' }] },
          ],
          escenarios: [
            { id: 's0', situacion: 's', pregunta: 'p', respuestaEsperada: 'r', razonamiento: 'z' },
            { id: 's1', situacion: 's', pregunta: 'p', respuestaEsperada: 'r', razonamiento: 'z' },
          ],
        },
      ],
    }
    const sesion = construirSesion({ examen, leitner: {}, tamano: 10, ahora: AHORA })
    const tipos = new Set(sesion.items.map((it) => it.tipo))
    expect(tipos.has('pregunta')).toBe(true)
    expect(tipos.has('escenario')).toBe(true)
  })

  it('mezclarTipos intercala round-robin', () => {
    const items = [
      { id: 1, tipo: 'flashcard' },
      { id: 2, tipo: 'flashcard' },
      { id: 3, tipo: 'pregunta' },
      { id: 4, tipo: 'escenario' },
    ]
    const mezcla = mezclarTipos(items)
    expect(mezcla.map((i) => i.tipo)).toEqual(['flashcard', 'pregunta', 'escenario', 'flashcard'])
  })

  it('examen sin items pendientes devuelve sesión vacía', () => {
    const examen = examenFalso()
    const leitner = {}
    for (const it of aplanarItems(examen)) {
      leitner[it.id] = { itemId: it.id, box: 5, lapses: 0, nextReview: '2099-01-01', lastSeen: '2026-07-07' }
    }
    const sesion = construirSesion({ examen, leitner, tamano: 10, ahora: AHORA })
    expect(sesion.items.length).toBe(0)
  })
})
