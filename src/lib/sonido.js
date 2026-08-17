// Sonido generado con Web Audio: sin archivos, sin descargas, funciona offline.
// El "juice" (respuesta audiovisual inmediata y desproporcionada) es la mitad de
// por qué un juego se siente bien. Una app silenciosa se siente a deberes.

let ctx = null

function contexto() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  // Los navegadores lo suspenden hasta que hay un gesto del usuario.
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tono(frecuencia, inicio, duracion, volumen = 0.18, forma = 'sine') {
  const c = contexto()
  if (!c) return
  const osc = c.createOscillator()
  const gan = c.createGain()
  osc.type = forma
  osc.frequency.setValueAtTime(frecuencia, c.currentTime + inicio)
  gan.gain.setValueAtTime(0, c.currentTime + inicio)
  gan.gain.linearRampToValueAtTime(volumen, c.currentTime + inicio + 0.01)
  gan.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + inicio + duracion)
  osc.connect(gan)
  gan.connect(c.destination)
  osc.start(c.currentTime + inicio)
  osc.stop(c.currentTime + inicio + duracion + 0.02)
}

export const sonido = {
  activo: true,

  acierto(combo = 0) {
    if (!this.activo) return
    // La nota sube con el combo: el oído nota que estás encadenando.
    const base = 520 + Math.min(combo, 12) * 28
    tono(base, 0, 0.09)
    tono(base * 1.5, 0.06, 0.1)
  },

  fallo() {
    if (!this.activo) return
    tono(180, 0, 0.16, 0.22, 'square')
    tono(120, 0.08, 0.2, 0.18, 'square')
  },

  jefe() {
    if (!this.activo) return
    tono(300, 0, 0.1, 0.2, 'sawtooth')
    tono(400, 0.09, 0.1, 0.2, 'sawtooth')
    tono(500, 0.18, 0.16, 0.2, 'sawtooth')
  },

  comboHito() {
    if (!this.activo) return
    ;[523, 659, 784, 1047].forEach((f, i) => tono(f, i * 0.06, 0.14, 0.16))
  },

  finCarrera(mejorRecord) {
    if (!this.activo) return
    if (mejorRecord) {
      ;[523, 659, 784, 1047, 1319].forEach((f, i) => tono(f, i * 0.09, 0.28, 0.2))
    } else {
      ;[420, 340, 260].forEach((f, i) => tono(f, i * 0.1, 0.2, 0.14))
    }
  },

  cuentaAtras() {
    if (!this.activo) return
    tono(880, 0, 0.06, 0.12)
  },
}
