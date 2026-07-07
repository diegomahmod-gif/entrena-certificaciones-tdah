// Contenedor de un item: uno por pantalla, sin scroll interno.
export default function SessionCard({ posicion, total, tipo, children }) {
  const etiquetas = { flashcard: 'Flashcard', pregunta: 'Pregunta', escenario: 'Escenario' }
  return (
    <section className="tarjeta" aria-label={`Item ${posicion} de ${total}`}>
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium dark:bg-slate-700">
          {etiquetas[tipo] ?? tipo}
        </span>
        <span>
          {posicion} / {total}
        </span>
      </div>
      {children}
    </section>
  )
}
