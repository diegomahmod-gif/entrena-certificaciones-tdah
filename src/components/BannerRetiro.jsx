// Banner ámbar si el examen tiene fecha de retiro futura.
import { hoyISO } from '../lib/leitner.js'

export default function BannerRetiro({ examen }) {
  const fecha = examen?.vigencia?.retirementDate
  if (!fecha || fecha <= hoyISO()) return null
  return (
    <div
      className="mb-4 rounded-xl border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-200"
      role="note"
    >
      {examen.avisoRetiro ??
        `⚠️ Este examen se retira el ${fecha}${examen.vigencia?.sucesor ? ` (sucesor: ${examen.vigencia.sucesor})` : ''}.`}
    </div>
  )
}
