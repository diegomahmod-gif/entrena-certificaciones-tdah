// Ajustes: tamaño de sesión, tema, pomodoro, export/import, reset doble.
import { useRef, useState } from 'react'
import { useEstado } from '../estado.js'
import { exportar, importar, reiniciar, estadoInicial } from '../lib/storage.js'
import { TAMANOS_VALIDOS } from '../lib/sessionBuilder.js'

export default function Settings() {
  const { estado, actualizar } = useEstado()
  const [mensaje, setMensaje] = useState(null)
  const [confirmandoReset, setConfirmandoReset] = useState(false)
  const inputArchivo = useRef(null)

  const descargarProgreso = () => {
    const blob = new Blob([exportar(estado)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certtrainer-progreso-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMensaje('Progreso exportado.')
  }

  const importarProgreso = async (evento) => {
    const archivo = evento.target.files?.[0]
    if (!archivo) return
    try {
      const texto = await archivo.text()
      const nuevo = importar(texto)
      actualizar(() => nuevo)
      setMensaje('Progreso importado correctamente.')
    } catch (e) {
      setMensaje(`No se pudo importar: ${e.message}`)
    } finally {
      evento.target.value = ''
    }
  }

  const resetear = () => {
    if (!confirmandoReset) {
      setConfirmandoReset(true)
      return
    }
    // Segunda confirmación explícita
    if (window.confirm('Última confirmación: se borrará TODO el progreso. ¿Continuar?')) {
      reiniciar()
      actualizar(() => estadoInicial())
      setMensaje('Progreso reiniciado.')
    }
    setConfirmandoReset(false)
  }

  const filaAjuste = 'flex items-center justify-between gap-4 py-3'

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-bold">Ajustes</h1>

      <div className="tarjeta mb-4 divide-y divide-slate-200 dark:divide-slate-700">
        <div className={filaAjuste}>
          <label htmlFor="tamano" className="text-sm font-medium">
            Tamaño de sesión
          </label>
          <select
            id="tamano"
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
            value={estado.ajustes.tamanoSesion}
            onChange={(e) =>
              actualizar((s) => {
                s.ajustes.tamanoSesion = Number(e.target.value)
              })
            }
          >
            {TAMANOS_VALIDOS.map((n) => (
              <option key={n} value={n}>
                {n} items
              </option>
            ))}
          </select>
        </div>

        <div className={filaAjuste}>
          <span className="text-sm font-medium">Tema</span>
          <button
            className="btn-secundario"
            aria-pressed={estado.ajustes.tema === 'oscuro'}
            onClick={() =>
              actualizar((s) => {
                s.ajustes.tema = s.ajustes.tema === 'oscuro' ? 'claro' : 'oscuro'
              })
            }
          >
            {estado.ajustes.tema === 'oscuro' ? '🌙 Oscuro' : '☀️ Claro'} — cambiar
          </button>
        </div>

        <div className={filaAjuste}>
          <label htmlFor="pomo-t" className="text-sm font-medium">
            Pomodoro (trabajo / descanso, min)
          </label>
          <span className="flex items-center gap-2">
            <input
              id="pomo-t"
              type="number"
              min="5"
              max="60"
              className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
              value={estado.ajustes.pomodoroTrabajo}
              onChange={(e) =>
                actualizar((s) => {
                  s.ajustes.pomodoroTrabajo = Math.max(1, Number(e.target.value) || 25)
                })
              }
            />
            <span aria-hidden="true">/</span>
            <input
              aria-label="Minutos de descanso del pomodoro"
              type="number"
              min="1"
              max="30"
              className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
              value={estado.ajustes.pomodoroDescanso}
              onChange={(e) =>
                actualizar((s) => {
                  s.ajustes.pomodoroDescanso = Math.max(1, Number(e.target.value) || 5)
                })
              }
            />
          </span>
        </div>
      </div>

      <div className="tarjeta mb-4">
        <h2 className="mb-3 font-semibold">Copia de seguridad</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secundario" onClick={descargarProgreso}>
            Exportar progreso (JSON)
          </button>
          <button className="btn-secundario" onClick={() => inputArchivo.current?.click()}>
            Importar progreso
          </button>
          <input
            ref={inputArchivo}
            type="file"
            accept="application/json"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={importarProgreso}
          />
        </div>
      </div>

      <div className="tarjeta">
        <h2 className="mb-3 font-semibold">Zona de riesgo</h2>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
            confirmandoReset ? 'bg-rose-700 hover:bg-rose-600' : 'bg-rose-600/80 hover:bg-rose-600'
          }`}
          onClick={resetear}
        >
          {confirmandoReset ? '¿Seguro? Pulsa otra vez para borrar todo' : 'Reiniciar todo el progreso'}
        </button>
        {confirmandoReset && (
          <button className="enlace-discreto ml-3" onClick={() => setConfirmandoReset(false)}>
            Cancelar
          </button>
        )}
      </div>

      {mensaje && (
        <p className="mt-4 rounded-lg bg-sky-50 p-3 text-sm text-sky-800 dark:bg-sky-900/30 dark:text-sky-200" role="status">
          {mensaje}
        </p>
      )}
    </div>
  )
}
