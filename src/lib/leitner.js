// Algoritmo de repetición espaciada tipo Leitner.
// Estado por item: { itemId, box: 1..5, nextReview: 'YYYY-MM-DD', lapses, lastSeen }.
// Los items nunca vistos no tienen entrada.

export const INTERVALOS_DIAS = [0, 1, 3, 7, 21]

/** Fecha local en formato YYYY-MM-DD. */
export function hoyISO(ahora = new Date()) {
  const y = ahora.getFullYear()
  const m = String(ahora.getMonth() + 1).padStart(2, '0')
  const d = String(ahora.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Suma días a una fecha YYYY-MM-DD y devuelve YYYY-MM-DD. */
export function sumarDias(fechaISO, dias) {
  const [y, m, d] = fechaISO.split('-').map(Number)
  const fecha = new Date(y, m - 1, d + dias)
  return hoyISO(fecha)
}

/** Días de diferencia entre dos fechas YYYY-MM-DD (b - a). */
export function diasEntre(a, b) {
  const [ya, ma, da] = a.split('-').map(Number)
  const [yb, mb, db] = b.split('-').map(Number)
  const ms = new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da)
  return Math.round(ms / 86400000)
}

/**
 * Aplica una calificación a un item y devuelve la nueva entrada Leitner.
 * @param {object|undefined} entrada - entrada existente o undefined si nunca visto
 * @param {string} itemId
 * @param {'bien'|'regular'|'mal'} grado - acierto/"Sí", "Más o menos", fallo/"No"
 * @param {Date} ahora
 */
export function calificar(entrada, itemId, grado, ahora = new Date()) {
  const base = entrada ?? { itemId, box: 1, lapses: 0, nextReview: null, lastSeen: null }
  let box
  if (grado === 'bien') box = Math.min(base.box + 1, 5)
  else if (grado === 'regular') box = base.box
  else box = 1
  const lapses = grado === 'mal' ? base.lapses + 1 : base.lapses
  const hoy = hoyISO(ahora)
  return {
    itemId,
    box,
    lapses,
    lastSeen: hoy,
    nextReview: sumarDias(hoy, INTERVALOS_DIAS[box - 1]),
  }
}

/** Un item está vencido si su nextReview es hoy o anterior. */
export function estaVencido(entrada, ahora = new Date()) {
  if (!entrada || !entrada.nextReview) return true
  return entrada.nextReview <= hoyISO(ahora)
}
