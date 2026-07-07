// Progreso: detalle por examen/dominio y vista de cajas Leitner.
import { useState } from 'react'
import { useEstado } from '../estado.js'
import { progresoDominio, progresoExamen, cajasPorExamen } from '../lib/progreso.js'
import { BarraDominio, AnilloExamen } from '../components/ProgressBar.jsx'
import BannerRetiro from '../components/BannerRetiro.jsx'
import { nivelDesdeXp } from '../lib/xp.js'

const NOMBRES_CAJAS = ['Sin ver', 'Caja 1', 'Caja 2', 'Caja 3', 'Caja 4', 'Caja 5']

export default function Progress() {
  const { estado, examenes, examenActivo } = useEstado()
  const [codigo, setCodigo] = useState(examenActivo?.meta.codigo)

  const examen = examenes.find((e) => e.meta.codigo === codigo) ?? examenes[0]
  if (!examen) return <p>No hay exámenes cargados.</p>

  const datosExamen = estado.examenes[examen.meta.codigo] ?? { xp: 0, leitner: {} }
  const { nivel, xpEnNivel, xpParaSubir } = nivelDesdeXp(datosExamen.xp)
  const cajas = cajasPorExamen(examen.datos, datosExamen.leitner)

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Progreso</h1>
        <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          Examen:
          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            value={examen.meta.codigo}
            onChange={(e) => setCodigo(e.target.value)}
          >
            {examenes.map((ex) => (
              <option key={ex.meta.codigo} value={ex.meta.codigo}>
                {ex.meta.codigo}
              </option>
            ))}
          </select>
        </label>
      </div>

      <BannerRetiro examen={examen.datos} />

      <div className="tarjeta mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold">{examen.datos.nombre}</h2>
          <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">
            {examen.datos.certificacion} · cobertura {examen.meta.cobertura}
          </p>
          <p className="text-sm">
            Nivel <span className="font-bold">{nivel}</span>{' '}
            <span className="text-slate-500 dark:text-slate-400">
              ({xpEnNivel}/{xpParaSubir} XP para subir)
            </span>
          </p>
        </div>
        <AnilloExamen
          porcentaje={progresoExamen(examen.datos, datosExamen.leitner)}
          etiqueta="dominado"
        />
      </div>

      <div className="tarjeta mb-4">
        <h3 className="mb-3 font-semibold">Por dominio</h3>
        <div className="space-y-4">
          {examen.datos.dominios.map((d) => (
            <BarraDominio
              key={d.id}
              etiqueta={d.dominio}
              ponderacion={d.ponderacion}
              porcentaje={progresoDominio(d, datosExamen.leitner)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          El % de dominio = items en caja 4 o 5. El anillo pondera cada dominio con su peso
          oficial en el examen.
        </p>
      </div>

      <div className="tarjeta">
        <h3 className="mb-3 font-semibold">Cajas Leitner</h3>
        <div className="grid grid-cols-6 gap-2 text-center">
          {NOMBRES_CAJAS.map((nombre, caja) => (
            <div key={caja} className="rounded-xl bg-slate-100 p-2 dark:bg-slate-700/60">
              <p className="text-lg font-bold">{cajas[caja]}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{nombre}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Intervalos de repaso: 0, 1, 3, 7 y 21 días según la caja. Fallar devuelve el item a la
          caja 1.
        </p>
      </div>
    </div>
  )
}
