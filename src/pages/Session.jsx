// Sesión: un item por pantalla. Persiste tras cada respuesta.
import { useEstado } from '../estado.js'
import { buscarItem } from '../lib/contenido.js'
import { calificar, hoyISO } from '../lib/leitner.js'
import { xpPorRespuesta, actualizarRacha } from '../lib/xp.js'
import { construirSesion } from '../lib/sessionBuilder.js'
import SessionCard from '../components/SessionCard.jsx'
import Flashcard from '../components/Flashcard.jsx'
import Question from '../components/Question.jsx'
import Scenario from '../components/Scenario.jsx'
import SessionSummary from '../components/SessionSummary.jsx'

export default function Session() {
  const { estado, actualizar, examenes, navegar } = useEstado()
  const sesion = estado.sesion

  if (!sesion) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          No hay ninguna sesión en curso.
        </p>
        <button className="btn-primario" onClick={() => navegar('inicio')}>
          Ir al inicio
        </button>
      </div>
    )
  }

  const examen = examenes.find((e) => e.meta.codigo === sesion.examen)
  const datosExamen = estado.examenes[sesion.examen] ?? { xp: 0, leitner: {} }
  const terminada = sesion.terminada || sesion.indice >= sesion.items.length

  if (terminada) {
    const cerrar = () =>
      actualizar((s) => {
        s.sesion = null
        navegar('inicio')
      })
    const otra = () => {
      const nueva = construirSesion({
        examen: examen.datos,
        leitner: datosExamen.leitner,
        tamano: estado.ajustes.tamanoSesion,
        modo: sesion.modo,
      })
      if (nueva.items.length === 0) {
        cerrar()
        return
      }
      actualizar((s) => {
        s.sesion = { ...nueva, indice: 0, respondidos: 0, aciertos: 0, xpGanado: 0, terminada: false }
      })
    }
    return (
      <div className="mx-auto max-w-xl">
        <SessionSummary sesion={sesion} xpTotal={datosExamen.xp} onCerrar={cerrar} onOtraSesion={otra} />
      </div>
    )
  }

  const ref = sesion.items[sesion.indice]
  const item = examen ? buscarItem(examen.datos, ref.id) : null

  if (!item) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="mb-4 text-sm">Este item ya no existe en el contenido.</p>
        <button className="btn-primario" onClick={() => actualizar((s) => { s.sesion = null; navegar('inicio') })}>
          Volver al inicio
        </button>
      </div>
    )
  }

  // Guarda en localStorage tras CADA respuesta: recargar nunca pierde más
  // que el item en curso.
  const onResuelto = (grado) => {
    const acierto = grado === 'bien'
    actualizar((s) => {
      const codigo = s.sesion.examen
      if (!s.examenes[codigo]) s.examenes[codigo] = { xp: 0, leitner: {} }
      const ex = s.examenes[codigo]
      ex.leitner[ref.id] = calificar(ex.leitner[ref.id], ref.id, grado)
      const xp = xpPorRespuesta(acierto)
      ex.xp += xp
      s.racha = actualizarRacha(s.racha, hoyISO())
      s.sesion.respondidos += 1
      if (acierto) s.sesion.aciertos += 1
      s.sesion.xpGanado += xp
      s.sesion.indice += 1
      if (s.sesion.indice >= s.sesion.items.length) s.sesion.terminada = true
    })
  }

  const componentes = { flashcard: Flashcard, pregunta: Question, escenario: Scenario }
  const Componente = componentes[item.tipo]

  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-3 text-center text-xs text-slate-500 dark:text-slate-400">
        {sesion.examen} · {item.dominio.dominio}
      </p>
      <SessionCard posicion={sesion.indice + 1} total={sesion.items.length} tipo={item.tipo}>
        <Componente key={ref.id} data={item.data} onResuelto={onResuelto} />
      </SessionCard>
      <p className="mt-4 text-center">
        <button className="enlace-discreto" onClick={() => navegar('inicio')}>
          Pausar y volver al inicio (podrás reanudar)
        </button>
      </p>
    </div>
  )
}
