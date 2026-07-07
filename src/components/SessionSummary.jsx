// Resumen de sesión: aciertos, XP ganado y un CIERRE claro.
// El CTA de "otra sesión" es discreto (enlace secundario), no un botón grande.
import { nivelDesdeXp } from '../lib/xp.js'

export default function SessionSummary({ sesion, xpTotal, onCerrar, onOtraSesion }) {
  const { nivel } = nivelDesdeXp(xpTotal)
  return (
    <section className="tarjeta text-center" aria-label="Resumen de la sesión">
      <h2 className="mb-2 text-2xl font-bold">Sesión completada 🎉</h2>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Buen trabajo. Esto ya quedó guardado.
      </p>
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-700/60">
          <p className="text-2xl font-bold">{sesion.aciertos}/{sesion.respondidos}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">aciertos</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-700/60">
          <p className="text-2xl font-bold">+{sesion.xpGanado}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">XP</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-700/60">
          <p className="text-2xl font-bold">{nivel}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">nivel</p>
        </div>
      </div>
      <button className="btn-primario mb-4" onClick={onCerrar}>
        Terminar por hoy
      </button>
      <p>
        <button className="enlace-discreto" onClick={onOtraSesion}>
          ¿Con ganas de más? Otra sesión corta
        </button>
      </p>
    </section>
  )
}
