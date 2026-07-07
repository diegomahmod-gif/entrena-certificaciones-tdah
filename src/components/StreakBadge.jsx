// Racha "amable": solo cuenta días activos. Se congela hasta 2 días sin
// actividad y NUNCA muestra mensajes de culpa ni pérdida dramática.
export default function StreakBadge({ racha }) {
  if (!racha || racha.dias <= 0) return null
  return (
    <span
      className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
      title="Días activos (la racha se congela si descansas un par de días)"
    >
      🔥 {racha.dias} {racha.dias === 1 ? 'día' : 'días'}
    </span>
  )
}
