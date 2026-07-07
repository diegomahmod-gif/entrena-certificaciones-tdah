// Pregunta MCQ: opciones barajadas, feedback inmediato al elegir (explicación
// de la opción elegida Y de la correcta, en tono neutro), luego "Siguiente".
import { useMemo, useState } from 'react'

function barajar(lista) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

export default function Question({ data, onResuelto }) {
  // Baraja una vez por item para que la correcta no esté siempre en la misma posición.
  const opciones = useMemo(() => barajar(data.opciones), [data.id])
  const [elegida, setElegida] = useState(null)

  const correcta = opciones.find((o) => o.correcta)
  const respondida = elegida !== null
  const acerto = respondida && elegida.correcta

  const claseOpcion = (opcion) => {
    if (!respondida)
      return 'border-slate-300 hover:border-sky-400 hover:bg-sky-50 dark:border-slate-600 dark:hover:border-sky-500 dark:hover:bg-slate-700'
    if (opcion.correcta)
      return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-500'
    if (opcion === elegida)
      return 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 dark:border-rose-500'
    return 'border-slate-200 opacity-60 dark:border-slate-700'
  }

  return (
    <div>
      <h2 className="mb-5 text-lg font-semibold leading-snug">{data.pregunta}</h2>

      {!respondida ? (
        <div className="grid gap-2" role="group" aria-label="Opciones de respuesta">
          {opciones.map((opcion, i) => (
            <button
              key={i}
              className={`rounded-xl border-2 p-3 text-left text-sm transition-colors ${claseOpcion(opcion)}`}
              onClick={() => setElegida(opcion)}
            >
              {opcion.texto}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="mb-4 grid gap-2">
            {opciones.map((opcion, i) => (
              <div key={i} className={`rounded-xl border-2 p-3 text-sm ${claseOpcion(opcion)}`}>
                <p>
                  {opcion.correcta ? '✔ ' : opcion === elegida ? '✘ ' : ''}
                  {opcion.texto}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-5 space-y-3 text-sm" role="status">
            <p
              className={`font-medium ${acerto ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
            >
              {acerto ? 'Correcto.' : 'Esta vez no era esa opción. Así se entiende mejor:'}
            </p>
            {!acerto && (
              <p className="rounded-lg bg-rose-50 p-3 dark:bg-rose-900/20">
                <span className="font-semibold">Tu elección:</span> {elegida.explicacion}
              </p>
            )}
            <p className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <span className="font-semibold">La correcta:</span> {correcta.explicacion}
            </p>
          </div>

          <button className="btn-primario" onClick={() => onResuelto(acerto ? 'bien' : 'mal')}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
