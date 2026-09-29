import { describe, it, expect } from 'vitest'
import examen from '../src/content/az-104.json'
import indice from '../src/content/index.json'
import { validarExamen } from '../src/lib/contenido.js'
import { problemasCoberturaCompleta } from './helpers/contenido.js'

describe('contenido AZ-104', () => {
  it('pasa el validador de esquema de la app', () => {
    expect(validarExamen(examen, 'az-104.json')).toEqual([])
  })

  it('tiene los 5 dominios de la guía oficial', () => {
    expect(examen.dominios.map((d) => d.id)).toEqual(['az104-d1', 'az104-d2', 'az104-d3', 'az104-d4', 'az104-d5'])
  })

  it('cumple mínimos y reglas de cobertura completa', () => {
    expect(problemasCoberturaCompleta(examen)).toEqual([])
  })

  it('index.json lo declara con cobertura completa', () => {
    const meta = indice.examenes.find((e) => e.codigo === 'AZ-104')
    expect(meta.cobertura).toBe('completa')
    expect(examen.cobertura).toBe('completa')
  })
})
