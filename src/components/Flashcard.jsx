// Flashcard: concepto → "Mostrar respuesta" → explicación + autoevaluación.
import { useState } from 'react'

export function BotonesAutoevaluacion({ onGrado }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Autoevaluación">
      <button
        className="rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
        onClick={() => onGrado('bien')}
      >
        Sí lo sabía
      </button>
      <button
        className="rounded-xl bg-amber-500 px-3 py-3 text-sm font-semibold text-white hover:bg-amber-400"
        onClick={() => onGrado('regular')}
      >
        Más o menos
      </button>
      <button
        className="rounded-xl bg-rose-600 px-3 py-3 text-sm font-semibold text-white hover:bg-rose-500"
        onClick={() => onGrado('mal')}
      >
        No
      </button>
    </div>
  )
}

export default function Flashcard({ data, onResuelto }) {
  const [revelado, setRevelado] = useState(false)

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">{data.concepto}</h2>
      {!revelado ? (
        <button className="btn-primario" onClick={() => setRevelado(true)}>
          Mostrar respuesta
        </button>
      ) : (
        <div>
          <p className="mb-6 rounded-xl bg-slate-100 p-4 text-base leading-relaxed dark:bg-slate-700/60">
            {data.explicacion}
          </p>
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">¿Lo sabías?</p>
          <BotonesAutoevaluacion onGrado={onResuelto} />
        </div>
      )}
    </div>
  )
}
