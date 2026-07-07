// Capa localStorage: todo el estado del usuario vive bajo una única clave
// versionada para poder migrar en el futuro.

export const CLAVE_RAIZ = 'certtrainer.v1'
export const SCHEMA_VERSION = 1

function almacen() {
  return globalThis.localStorage
}

/** Estado inicial por defecto. */
export function estadoInicial() {
  return {
    schemaVersion: SCHEMA_VERSION,
    ajustes: {
      tamanoSesion: 10,
      tema: 'oscuro',
      pomodoroTrabajo: 25,
      pomodoroDescanso: 5,
    },
    examenActivo: null,
    // { [codigo]: { xp: number, leitner: { [itemId]: entradaLeitner } } }
    examenes: {},
    // Sesión en curso o null. Persistida para poder reanudar tras recargar.
    sesion: null,
    racha: { dias: 0, ultimoDia: null },
  }
}

/** Migra un objeto crudo leído de localStorage al esquema actual. */
export function migrar(crudo) {
  if (!crudo || typeof crudo !== 'object') return estadoInicial()
  if (crudo.schemaVersion === SCHEMA_VERSION) {
    // Merge superficial con los defaults para tolerar claves nuevas.
    const base = estadoInicial()
    return {
      ...base,
      ...crudo,
      ajustes: { ...base.ajustes, ...(crudo.ajustes || {}) },
      racha: { ...base.racha, ...(crudo.racha || {}) },
    }
  }
  // Versión desconocida (futura o corrupta): no arriesgamos, estado limpio.
  return estadoInicial()
}

/** Carga el estado desde localStorage (o el inicial si no existe/está corrupto). */
export function cargar() {
  try {
    const texto = almacen().getItem(CLAVE_RAIZ)
    if (!texto) return estadoInicial()
    return migrar(JSON.parse(texto))
  } catch {
    return estadoInicial()
  }
}

/** Guarda el estado completo. Se llama tras CADA interacción. */
export function guardar(estado) {
  almacen().setItem(CLAVE_RAIZ, JSON.stringify(estado))
}

/** Serializa el estado para descarga (export de progreso). */
export function exportar(estado) {
  return JSON.stringify(estado, null, 2)
}

/**
 * Valida e importa un progreso exportado.
 * @throws {Error} si el JSON es inválido o el schemaVersion no es compatible
 */
export function importar(texto) {
  let obj
  try {
    obj = JSON.parse(texto)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  if (!obj || obj.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`schemaVersion incompatible: se esperaba ${SCHEMA_VERSION}.`)
  }
  return migrar(obj)
}

/** Borra todo el progreso. */
export function reiniciar() {
  almacen().removeItem(CLAVE_RAIZ)
  return estadoInicial()
}
