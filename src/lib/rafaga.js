// Modo Ráfaga: 60 segundos, una sola pulsación para empezar, sin explicaciones
// durante la carrera. El diseño imita a Lichess Puzzle Storm, no a una app de
// estudio: el objetivo es que el cerebro entre en foco por urgencia, no por
// disciplina.
//
// Piezas:
//  - Rating Elo por jugador Y por pregunta (auto-calibrante: lo que fallas se
//    vuelve más caro, y machacar preguntas fáciles deja de dar puntos).
//  - El tiempo es el recurso: acertar lo alarga, fallar lo acorta.
//  - Combo con multiplicador que se pierde entero al fallar (aversión a la
//    pérdida, que pesa el doble que la ganancia).

export const DURACION_S = 60
export const BONUS_ACIERTO_S = 2
export const PENALIZACION_FALLO_S = 5
export const RATING_INICIAL = 1000
export const RATING_MINIMO = 800
export const K_JUGADOR = 16
export const K_PREGUNTA = 8
/** 1 de cada N preguntas es "jefe": vale el triple y se anuncia antes. */
export const FRECUENCIA_JEFE = 7

/** Probabilidad de que A gane a B según Elo. */
export function esperado(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * Aplica el resultado de una pregunta al rating del jugador y al de la pregunta.
 * @returns {{ jugador: number, pregunta: number, delta: number }}
 */
export function aplicarElo(ratingJugador, ratingPregunta, acierto) {
  const p = esperado(ratingJugador, ratingPregunta)
  const r = acierto ? 1 : 0
  const delta = Math.round(K_JUGADOR * (r - p))
  return {
    jugador: Math.max(RATING_MINIMO, ratingJugador + delta),
    pregunta: Math.round(ratingPregunta + K_PREGUNTA * (p - r)),
    delta,
  }
}

/** Multiplicador por racha de aciertos consecutivos dentro de la carrera. */
export function multiplicador(combo) {
  if (combo >= 10) return 4
  if (combo >= 6) return 3
  if (combo >= 3) return 2
  return 1
}

/** Puntos de una pregunta acertada. Las difíciles valen más. */
export function puntos(ratingPregunta, combo, esJefe) {
  const base = 50 + Math.max(0, Math.round((ratingPregunta - 700) / 4))
  const total = base * multiplicador(combo) * (esJefe ? 3 : 1)
  return Math.round(total)
}

/** Todas las preguntas MCQ de un examen, con su dominio. */
export function reunirPreguntas(examen) {
  const fuera = []
  for (const dominio of examen?.dominios ?? []) {
    for (const p of dominio.preguntas ?? []) {
      fuera.push({ ...p, dominioId: dominio.id, dominio: dominio.dominio })
    }
  }
  return fuera
}

/**
 * Ordena la cola para que la dificultad suba de forma progresiva: empieza algo
 * por debajo del nivel del jugador y va escalando. Ni aburrimiento al principio
 * ni muro al primer intento.
 */
export function construirCola(preguntas, ratingJugador, ratingsPregunta = {}, aleatorio = Math.random) {
  const disponibles = preguntas.map((p) => ({
    pregunta: p,
    rating: ratingsPregunta[p.id] ?? RATING_INICIAL,
  }))
  const cola = []
  let i = 0
  while (disponibles.length > 0) {
    const objetivo = ratingJugador - 120 + i * 25
    // Un poco de ruido para que dos carreras seguidas no sean idénticas.
    const ruido = (aleatorio() - 0.5) * 120
    let mejor = 0
    let mejorDist = Infinity
    for (let j = 0; j < disponibles.length; j++) {
      const dist = Math.abs(disponibles[j].rating - (objetivo + ruido))
      if (dist < mejorDist) {
        mejorDist = dist
        mejor = j
      }
    }
    cola.push(disponibles.splice(mejor, 1)[0])
    i++
  }
  return cola
}

/** ¿Toca pregunta jefe? Se decide por posición para poder anunciarla antes. */
export function esJefe(indice) {
  return indice > 0 && indice % FRECUENCIA_JEFE === 0
}

/**
 * Qué falta para el siguiente hito. Se muestra SIEMPRE al terminar, aunque la
 * carrera haya ido mal: es el gancho que hace pulsar "otra" (efecto Zeigarnik).
 */
export function siguienteHito({ rating, puntuacion, record }) {
  const opciones = []
  const siguienteCien = Math.floor(rating / 100) * 100 + 100
  opciones.push({
    texto: `${siguienteCien - rating} puntos de rating para llegar a ${siguienteCien}`,
    distancia: siguienteCien - rating,
  })
  if (record > 0 && puntuacion <= record) {
    opciones.push({
      texto: `${record - puntuacion + 1} puntos para batir tu récord de ${record}`,
      distancia: Math.max(1, Math.round((record - puntuacion + 1) / 60)),
    })
  }
  opciones.sort((a, b) => a.distancia - b.distancia)
  return opciones[0]
}

/** Estado inicial que guarda el progreso de Ráfaga para un examen. */
export function rafagaInicial() {
  return { rating: RATING_INICIAL, record: 0, carreras: 0, ratingsPregunta: {}, mejorCombo: 0 }
}
