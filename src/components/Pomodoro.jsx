// Pomodoro opcional y discreto en el header. Configurable (25/5 por defecto).
// Al terminar el bloque sugiere una pausa SIN interrumpir el item actual.
// Durante los items no se muestra el contador numérico (regla TDAH: nada de
// contadores de tiempo visibles mientras se estudia).
import { useEffect, useRef, useState } from 'react'
import { useEstado } from '../estado.js'

export default function Pomodoro({ ocultarContador = false }) {
  const { estado } = useEstado()
  const [fase, setFase] = useState(null) // null | 'trabajo' | 'descanso'
  const [restante, setRestante] = useState(0)
  const [sugerirPausa, setSugerirPausa] = useState(false)
  const intervalo = useRef(null)

  const minutosTrabajo = estado.ajustes.pomodoroTrabajo
  const minutosDescanso = estado.ajustes.pomodoroDescanso

  useEffect(() => {
    if (!fase) return undefined
    intervalo.current = setInterval(() => {
      setRestante((r) => {
        if (r > 1) return r - 1
        // Fin del bloque
        clearInterval(intervalo.current)
        if (fase === 'trabajo') setSugerirPausa(true)
        setFase(null)
        return 0
      })
    }, 1000)
    return () => clearInterval(intervalo.current)
  }, [fase])

  const iniciar = (nuevaFase) => {
    setSugerirPausa(false)
    setFase(nuevaFase)
    setRestante((nuevaFase === 'trabajo' ? minutosTrabajo : minutosDescanso) * 60)
  }

  const detener = () => {
    clearInterval(intervalo.current)
    setFase(null)
    setRestante(0)
    setSugerirPausa(false)
  }

  const mmss = `${String(Math.floor(restante / 60)).padStart(2, '0')}:${String(restante % 60).padStart(2, '0')}`

  return (
    <div className="relative flex items-center">
      {fase === null && !sugerirPausa && (
        <button
          className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={() => iniciar('trabajo')}
          title={`Iniciar pomodoro (${minutosTrabajo}/${minutosDescanso})`}
        >
          ⏱ Pomodoro
        </button>
      )}
      {fase !== null && (
        <button
          className="rounded-lg px-2 py-1 text-xs tabular-nums text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={detener}
          title="Detener pomodoro"
        >
          {ocultarContador ? (
            <span aria-label="Pomodoro en marcha">⏱ ●</span>
          ) : (
            <span>
              ⏱ {mmss} {fase === 'descanso' ? '(pausa)' : ''}
            </span>
          )}
        </button>
      )}
      {sugerirPausa && (
        <div
          className="absolute right-0 top-9 z-10 w-56 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 shadow-lg dark:border-amber-700 dark:bg-amber-900/90 dark:text-amber-100"
          role="status"
        >
          <p className="mb-2">Fin del bloque. Buen momento para una pausa 🙂</p>
          <div className="flex gap-2">
            <button className="btn-secundario !px-2 !py-1 !text-xs" onClick={() => iniciar('descanso')}>
              Pausa {minutosDescanso} min
            </button>
            <button className="btn-secundario !px-2 !py-1 !text-xs" onClick={detener}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
