import { describe, it, expect } from 'vitest'
import {
  calificar,
  estaVencido,
  hoyISO,
  sumarDias,
  diasEntre,
  INTERVALOS_DIAS,
} from '../src/lib/leitner.js'

const AHORA = new Date(2026, 6, 7) // 2026-07-07

describe('leitner', () => {
  it('un item nuevo acertado sube a box 2 con revisión mañana', () => {
    const e = calificar(undefined, 'x1', 'bien', AHORA)
    expect(e.box).toBe(2)
    expect(e.nextReview).toBe('2026-07-08')
    expect(e.lapses).toBe(0)
  })

  it('un item fallado vuelve a box 1 con nextReview HOY e incrementa lapses', () => {
    const previo = { itemId: 'x1', box: 4, lapses: 0, nextReview: '2026-07-07', lastSeen: null }
    const e = calificar(previo, 'x1', 'mal', AHORA)
    expect(e.box).toBe(1)
    expect(e.lapses).toBe(1)
    expect(e.nextReview).toBe(hoyISO(AHORA))
    expect(estaVencido(e, AHORA)).toBe(true)
  })

  it('un item fallado reaparece antes que uno acertado', () => {
    const fallado = calificar(undefined, 'a', 'mal', AHORA)
    const acertado = calificar(undefined, 'b', 'bien', AHORA)
    expect(fallado.nextReview < acertado.nextReview).toBe(true)
    expect(estaVencido(fallado, AHORA)).toBe(true)
    expect(estaVencido(acertado, AHORA)).toBe(false)
  })

  it('"regular" mantiene la caja', () => {
    const previo = { itemId: 'x', box: 3, lapses: 0, nextReview: '2026-07-07', lastSeen: null }
    const e = calificar(previo, 'x', 'regular', AHORA)
    expect(e.box).toBe(3)
    expect(e.nextReview).toBe(sumarDias(hoyISO(AHORA), INTERVALOS_DIAS[2]))
  })

  it('la caja no pasa de 5', () => {
    const previo = { itemId: 'x', box: 5, lapses: 0, nextReview: '2026-07-07', lastSeen: null }
    const e = calificar(previo, 'x', 'bien', AHORA)
    expect(e.box).toBe(5)
    expect(e.nextReview).toBe(sumarDias(hoyISO(AHORA), 21))
  })

  it('intervalos por caja: [0, 1, 3, 7, 21] días', () => {
    expect(INTERVALOS_DIAS).toEqual([0, 1, 3, 7, 21])
  })

  it('utilidades de fecha', () => {
    expect(sumarDias('2026-07-30', 3)).toBe('2026-08-02')
    expect(diasEntre('2026-07-01', '2026-07-07')).toBe(6)
  })
})
