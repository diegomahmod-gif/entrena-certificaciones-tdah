// XP, niveles y racha "amable".
import { diasEntre } from './leitner.js'

/** XP por item: responder (sea como sea) +10; acierto +5 extra. */
export function xpPorRespuesta(acierto) {
  return 10 + (acierto ? 5 : 0)
}

/**
 * Curva suave de niveles: subir al nivel n+1 cuesta 100·n XP.
 * Devuelve { nivel, xpEnNivel, xpParaSubir }.
 */
export function nivelDesdeXp(xp) {
  let nivel = 1
  let resto = Math.max(0, xp)
  let coste = 100 * nivel
  while (resto >= coste) {
    resto -= coste
    nivel += 1
    coste = 100 * nivel
  }
  return { nivel, xpEnNivel: resto, xpParaSubir: coste }
}

/**
 * Racha = días activos. Se congela automáticamente hasta 2 días sin
 * actividad (no se pierde). Nunca genera mensajes de culpa: solo cuenta.
 */
export function actualizarRacha(racha, hoy) {
  if (!racha || !racha.ultimoDia) return { dias: 1, ultimoDia: hoy }
  const diff = diasEntre(racha.ultimoDia, hoy)
  if (diff <= 0) return racha
  // diff-1 días sin actividad; hasta 2 se congela y continúa.
  if (diff - 1 <= 2) return { dias: racha.dias + 1, ultimoDia: hoy }
  return { dias: 1, ultimoDia: hoy }
}
