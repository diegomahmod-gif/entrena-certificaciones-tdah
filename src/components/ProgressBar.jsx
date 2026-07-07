// Barras de progreso: lineal por dominio y anillo por examen.

export function BarraDominio({ etiqueta, porcentaje, ponderacion }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-medium">{etiqueta}</span>
        <span className="shrink-0 text-slate-500 dark:text-slate-400">
          {ponderacion ? `${ponderacion} · ` : ''}
          {porcentaje}%
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso de ${etiqueta}`}
      >
        <div
          className="h-full rounded-full bg-sky-500 transition-all"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}

export function AnilloExamen({ porcentaje, etiqueta, tamano = 120 }) {
  const radio = 52
  const circunferencia = 2 * Math.PI * radio
  const progreso = circunferencia * (1 - porcentaje / 100)
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Progreso del examen: ${porcentaje}%`}
    >
      <circle
        cx="60"
        cy="60"
        r={radio}
        fill="none"
        strokeWidth="10"
        className="stroke-slate-200 dark:stroke-slate-700"
      />
      <circle
        cx="60"
        cy="60"
        r={radio}
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circunferencia}
        strokeDashoffset={progreso}
        transform="rotate(-90 60 60)"
        className="stroke-sky-500 transition-all"
      />
      <text
        x="60"
        y="57"
        textAnchor="middle"
        className="fill-slate-900 text-xl font-bold dark:fill-white"
      >
        {porcentaje}%
      </text>
      {etiqueta && (
        <text
          x="60"
          y="76"
          textAnchor="middle"
          className="fill-slate-500 text-[11px] dark:fill-slate-400"
        >
          {etiqueta}
        </text>
      )}
    </svg>
  )
}
