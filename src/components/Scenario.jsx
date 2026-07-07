// Escenario: situación + pregunta → pensar (textarea opcional, NO persistida)
// → revelar respuesta esperada y razonamiento → autoevaluación.
import { useState } from 'react'
import { BotonesAutoevaluacion } from './Flashcard.jsx'

export default function Scenario({ data, onResuelto }) {
  const [revelado, setRevelado] = useState(false)
  const [apunte, setApunte] = useState('')

  return (
    <div>
      <p className="mb-3 rounded-xl bg-slate-100 p-4 text-sm leading-relaxed dark:bg-slate-700/60">
        {data.situacion}
      </p>
      <h2 className="mb-4 text-lg font-semibold leading-snug">{data.pregunta}</h2>

      {!revelado ? (
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="apunte">
            Apunta tu idea si quieres (no se guarda):
          </label>
          <textarea
            id="apunte"
            className="mb-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-slate-600 dark:bg-slate-900"
            rows={3}
            value={apunte}
            onChange={(e) => setApunte(e.target.value)}
          />
          <button className="btn-primario" onClick={() => setRevelado(true)}>
            Mostrar respuesta esperada
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-5 space-y-3 text-sm">
            <p className="rounded-lg bg-emerald-50 p-3 leading-relaxed dark:bg-emerald-900/20">
              <span className="font-semibold">Respuesta esperada:</span> {data.respuestaEsperada}
            </p>
            <p className="rounded-lg bg-sky-50 p-3 leading-relaxed dark:bg-sky-900/20">
              <span className="font-semibold">Razonamiento:</span> {data.razonamiento}
            </p>
          </div>
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            ¿Tu respuesta iba por ahí?
          </p>
          <BotonesAutoevaluacion onGrado={onResuelto} />
        </div>
      )}
    </div>
  )
}
