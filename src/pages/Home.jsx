// Home: UN solo botón primario. La app decide qué toca.
import { useState } from 'react'
import { useEstado } from '../estado.js'
import { construirSesion } from '../lib/sessionBuilder.js'
import { nivelDesdeXp } from '../lib/xp.js'
import { rafagaInicial } from '../lib/rafaga.js'
import { progresoExamen } from '../lib/progreso.js'
import { AnilloExamen } from '../components/ProgressBar.jsx'
import BannerRetiro from '../components/BannerRetiro.jsx'

export default function Home() {
  const { estado, actualizar, examenes, examenActivo, navegar } = useEstado()
  const [aviso, setAviso] = useState(null)

  if (!examenActivo) return <p>No hay exámenes cargados.</p>

  const codigo = examenActivo.meta.codigo
  const datosExamen = estado.examenes[codigo] ?? { xp: 0, leitner: {} }
  const { nivel } = nivelDesdeXp(datosExamen.xp)
  const progreso = progresoExamen(examenActivo.datos, datosExamen.leitner)
  const rafaga = estado.rafaga?.[codigo] ?? rafagaInicial()

  const sesionPendiente =
    estado.sesion && !estado.sesion.terminada && estado.sesion.indice < estado.sesion.items.length
  const quedan = sesionPendiente
    ? estado.sesion.items.length - estado.sesion.indice
    : 0

  const iniciarSesion = (modo) => {
    const sesion = construirSesion({
      examen: examenActivo.datos,
      leitner: datosExamen.leitner,
      tamano: estado.ajustes.tamanoSesion,
      modo,
    })
    if (sesion.items.length === 0) {
      setAviso('No hay items pendientes hoy en este examen. Vuelve mañana o cambia de examen 🙂')
      return
    }
    actualizar((s) => {
      s.examenActivo = codigo
      s.sesion = {
        ...sesion,
        indice: 0,
        respondidos: 0,
        aciertos: 0,
        xpGanado: 0,
        terminada: false,
      }
    })
    navegar('sesion')
  }

  const accionPrimaria = () => {
    if (sesionPendiente) navegar('sesion')
    else iniciarSesion('dominio')
  }

  return (
    <div className="mx-auto max-w-xl">
      <BannerRetiro examen={examenActivo.datos} />

      <div className="tarjeta mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{examenActivo.meta.codigo}</h1>
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            {examenActivo.datos.nombre}
          </p>
          <p className="text-sm">
            Nivel <span className="font-bold">{nivel}</span> ·{' '}
            <span className="text-slate-500 dark:text-slate-400">{datosExamen.xp} XP</span>
          </p>
        </div>
        <AnilloExamen porcentaje={progreso} etiqueta="dominado" />
      </div>

      {/* Acción primaria: 60 segundos y cero decisiones. Lo que decide si se
          estudia o no es el coste de arrancar, así que esto va antes que nada. */}
      <button
        className="mb-3 flex w-full items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-5 text-left text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
        onClick={() => navegar('rafaga')}
      >
        <span>
          <span className="block text-xl font-black">RÁFAGA · 60s</span>
          <span className="block text-sm text-sky-100">Contrarreloj. Fallar cuesta tiempo.</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-2xl font-black tabular-nums">{rafaga.rating}</span>
          <span className="block text-xs text-sky-100">
            {rafaga.record > 0 ? `récord ${rafaga.record}` : 'rating'}
          </span>
        </span>
      </button>

      <button className="btn-secundario mb-3 w-full" onClick={accionPrimaria}>
        {sesionPendiente
          ? `Reanudar sesión (quedan ${quedan})`
          : 'Sesión de estudio (con explicaciones)'}
      </button>

      {aviso && (
        <p className="mb-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-800 dark:bg-sky-900/30 dark:text-sky-200" role="status">
          {aviso}
        </p>
      )}

      {/* Menú secundario: selección manual y repaso general */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          Examen:
          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            value={codigo}
            onChange={(e) => {
              setAviso(null)
              actualizar((s) => {
                s.examenActivo = e.target.value
              })
            }}
          >
            {examenes.map((ex) => (
              <option key={ex.meta.codigo} value={ex.meta.codigo}>
                {ex.meta.codigo} ({ex.meta.cobertura})
              </option>
            ))}
          </select>
        </label>
        <button className="enlace-discreto" onClick={() => iniciarSesion('repaso')}>
          Repaso general (mezcla dominios)
        </button>
      </div>
    </div>
  )
}
