import { describe, it, expect } from 'vitest'
import examen from '../src/content/az-305.json'
import indice from '../src/content/index.json'
import { validarExamen } from '../src/lib/contenido.js'
import { problemasCoberturaCompleta } from './helpers/contenido.js'

describe('contenido AZ-305', () => {
  it('pasa el validador de esquema de la app', () => {
    expect(validarExamen(examen, 'az-305.json')).toEqual([])
  })

  it('tiene los 4 dominios de la guía oficial', () => {
    expect(examen.dominios.map((d) => d.id)).toEqual(['az305-d1', 'az305-d2', 'az305-d3', 'az305-d4'])
  })

  it('cumple mínimos y reglas de cobertura completa', () => {
    expect(problemasCoberturaCompleta(examen)).toEqual([])
  })

  it('index.json lo declara con cobertura completa', () => {
    const meta = indice.examenes.find((e) => e.codigo === 'AZ-305')
    expect(meta.cobertura).toBe('completa')
    expect(examen.cobertura).toBe('completa')
  })
})
