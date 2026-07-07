import { describe, it, expect, beforeEach } from 'vitest'

// Mock mínimo de localStorage para entorno node.
function crearLocalStorage() {
  const mapa = new Map()
  return {
    getItem: (k) => (mapa.has(k) ? mapa.get(k) : null),
    setItem: (k, v) => mapa.set(k, String(v)),
    removeItem: (k) => mapa.delete(k),
    clear: () => mapa.clear(),
  }
}
globalThis.localStorage = crearLocalStorage()

const {
  cargar,
  guardar,
  exportar,
  importar,
  reiniciar,
  estadoInicial,
  migrar,
  SCHEMA_VERSION,
  CLAVE_RAIZ,
} = await import('../src/lib/storage.js')

describe('storage', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
  })

  it('sin datos previos devuelve el estado inicial', () => {
    const estado = cargar()
    expect(estado.schemaVersion).toBe(SCHEMA_VERSION)
    expect(estado.sesion).toBeNull()
    expect(estado.ajustes.tema).toBe('oscuro')
    expect(estado.ajustes.tamanoSesion).toBe(10)
  })

  it('guardar y cargar es un roundtrip fiel (persistencia tras recarga)', () => {
    const estado = estadoInicial()
    estado.examenActivo = 'PL-300'
    estado.examenes['PL-300'] = { xp: 125, leitner: { 'pl300-d1-f01': { box: 3 } } }
    estado.sesion = { examen: 'PL-300', indice: 4, items: [{ id: 'a' }] }
    guardar(estado)
    const recargado = cargar()
    expect(recargado.examenActivo).toBe('PL-300')
    expect(recargado.examenes['PL-300'].xp).toBe(125)
    expect(recargado.examenes['PL-300'].leitner['pl300-d1-f01'].box).toBe(3)
    expect(recargado.sesion.indice).toBe(4)
  })

  it('todo se guarda bajo una única clave raíz versionada', () => {
    guardar(estadoInicial())
    expect(globalThis.localStorage.getItem(CLAVE_RAIZ)).toBeTruthy()
  })

  it('datos corruptos no rompen: devuelve estado inicial', () => {
    globalThis.localStorage.setItem(CLAVE_RAIZ, '{esto no es json')
    expect(cargar().schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('migrar rellena claves que falten con los defaults', () => {
    const migrado = migrar({ schemaVersion: SCHEMA_VERSION, examenActivo: 'AZ-900' })
    expect(migrado.examenActivo).toBe('AZ-900')
    expect(migrado.ajustes.tamanoSesion).toBe(10)
    expect(migrado.racha.dias).toBe(0)
  })

  it('exportar/importar es un roundtrip válido', () => {
    const estado = estadoInicial()
    estado.examenes['AZ-900'] = { xp: 50, leitner: {} }
    const texto = exportar(estado)
    const importado = importar(texto)
    expect(importado.examenes['AZ-900'].xp).toBe(50)
  })

  it('importar rechaza schemaVersion incompatible', () => {
    expect(() => importar(JSON.stringify({ schemaVersion: 99 }))).toThrow(/schemaVersion/)
  })

  it('importar rechaza JSON inválido', () => {
    expect(() => importar('no-json')).toThrow(/JSON/)
  })

  it('reiniciar borra el progreso', () => {
    const estado = estadoInicial()
    estado.examenActivo = 'PL-300'
    guardar(estado)
    reiniciar()
    expect(cargar().examenActivo).toBeNull()
  })
})
