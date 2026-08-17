// RÁFAGA: 60 segundos, una pulsación para empezar, sin explicaciones durante la
// carrera. Todo el diseño está subordinado a dos cosas: coste de arranque cero
// y urgencia constante.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEstado } from '../estado.js'
import { sonido } from '../lib/sonido.js'
import {
  DURACION_S,
  BONUS_ACIERTO_S,
  PENALIZACION_FALLO_S,
  RATING_INICIAL,
  aplicarElo,
  construirCola,
  esJefe,
  multiplicador,
  puntos,
  rafagaInicial,
  reunirPreguntas,
  siguienteHito,
} from '../lib/rafaga.js'

function barajar(lista) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

export default function Rafaga() {
  const { estado, actualizar, examenActivo, navegar } = useEstado()
  const codigo = examenActivo?.meta?.codigo
  const guardado = estado.rafaga?.[codigo] ?? rafagaInicial()

  const [fase, setFase] = useState('inicio')
  const [cola, setCola] = useState([])
  const [indice, setIndice] = useState(0)
  const [msRestantes, setMsRestantes] = useState(DURACION_S * 1000)
  const [combo, setCombo] = useState(0)
  const [puntuacion, setPuntuacion] = useState(0)
  const [flash, setFlash] = useState(null)
  const [pop, setPop] = useState(null)
  const [resumen, setResumen] = useState(null)

  const acumulado = useRef({ aciertos: 0, fallos: 0, fallados: [], ratings: {}, rating: 0, maxCombo: 0, puntos: 0 })
  const finRef = useRef(0)
  const ultimoTic = useRef(null)
  const bloqueado = useRef(false)
  const faseRef = useRef('inicio')
  faseRef.current = fase

  const preguntas = useMemo(
    () => (examenActivo ? reunirPreguntas(examenActivo.datos) : []),
    [examenActivo],
  )

  const actual = cola[indice]
  const jefe = esJefe(indice)
  const opciones = useMemo(
    () => (actual ? barajar(actual.pregunta.opciones) : []),
    [actual?.pregunta?.id],
  )

  // Reloj. Intervalo corto para que el número se mueva de verdad.
  useEffect(() => {
    if (fase !== 'corriendo') return
    const id = setInterval(() => {
      const queda = Math.max(0, finRef.current - Date.now())
      setMsRestantes(queda)
      const seg = Math.ceil(queda / 1000)
      if (seg <= 10 && seg > 0 && ultimoTic.current !== seg) {
        ultimoTic.current = seg
        sonido.cuentaAtras()
      }
      if (queda <= 0) terminar()
    }, 80)
    return () => clearInterval(id)
  }, [fase])

  // Teclas 1-4: responder sin soltar el teclado es la mitad de la velocidad.
  useEffect(() => {
    if (fase !== 'corriendo') return
    const onKey = (e) => {
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= opciones.length) responder(opciones[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fase, opciones, indice, combo])

  function empezar() {
    const ratings = { ...(guardado.ratingsPregunta || {}) }
    setCola(construirCola(preguntas, guardado.rating, ratings))
    acumulado.current = {
      aciertos: 0,
      fallos: 0,
      fallados: [],
      ratings,
      rating: guardado.rating,
      maxCombo: 0,
      puntos: 0,
    }
    setIndice(0)
    setCombo(0)
    setPuntuacion(0)
    setResumen(null)
    setFlash(null)
    setPop(null)
    ultimoTic.current = null
    bloqueado.current = false
    finRef.current = Date.now() + DURACION_S * 1000
    setMsRestantes(DURACION_S * 1000)
    setFase('corriendo')
    sonido.acierto(0)
  }

  function responder(opcion) {
    if (bloqueado.current || faseRef.current !== 'corriendo' || !actual) return
    bloqueado.current = true

    const acierto = !!opcion.correcta
    const acc = acumulado.current
    const idPregunta = actual.pregunta.id
    const ratingPregunta = acc.ratings[idPregunta] ?? RATING_INICIAL
    const elo = aplicarElo(acc.rating, ratingPregunta, acierto)
    acc.rating = elo.jugador
    acc.ratings[idPregunta] = elo.pregunta

    if (acierto) {
      const nuevoCombo = combo + 1
      const gana = puntos(ratingPregunta, combo, jefe)
      acc.aciertos += 1
      acc.maxCombo = Math.max(acc.maxCombo, nuevoCombo)
      acc.puntos += gana
      setCombo(nuevoCombo)
      setPuntuacion(acc.puntos)
      setPop({ texto: '+' + gana, bueno: true, id: indice })
      setFlash('bien')
      finRef.current += BONUS_ACIERTO_S * 1000
      if (jefe) sonido.jefe()
      else if (nuevoCombo === 3 || nuevoCombo === 6 || nuevoCombo === 10) sonido.comboHito()
      else sonido.acierto(nuevoCombo)
    } else {
      acc.fallos += 1
      acc.fallados.push({ pregunta: actual.pregunta, elegida: opcion, dominio: actual.dominio })
      setCombo(0)
      setPop({ texto: '-' + PENALIZACION_FALLO_S + 's', bueno: false, id: indice })
      setFlash('mal')
      finRef.current -= PENALIZACION_FALLO_S * 1000
      sonido.fallo()
    }

    // Sin explicaciones aquí: cortan el ritmo. Van todas juntas al final.
    setTimeout(
      () => {
        setFlash(null)
        bloqueado.current = false
        if (Date.now() >= finRef.current) {
          terminar()
          return
        }
        setIndice((i) => (i + 1 < cola.length ? i + 1 : 0))
      },
      acierto ? 260 : 420,
    )
  }

  function terminar() {
    if (faseRef.current === 'fin') return
    faseRef.current = 'fin'
    const acc = acumulado.current
    const puntosFinales = acc.puntos
    const anterior = guardado
    const esRecord = puntosFinales > (anterior.record ?? 0)

    setFase('fin')
    setPuntuacion(puntosFinales)
    sonido.finCarrera(esRecord)

    actualizar((e) => {
      if (!e.rafaga) e.rafaga = {}
      const previo = e.rafaga[codigo] ?? rafagaInicial()
      e.rafaga[codigo] = {
        rating: acc.rating,
        record: Math.max(previo.record ?? 0, puntosFinales),
        carreras: (previo.carreras ?? 0) + 1,
        ratingsPregunta: acc.ratings,
        mejorCombo: Math.max(previo.mejorCombo ?? 0, acc.maxCombo),
      }
    })

    setResumen({
      puntuacion: puntosFinales,
      esRecord,
      recordPrevio: anterior.record ?? 0,
      ratingPrevio: anterior.rating,
      rating: acc.rating,
      aciertos: acc.aciertos,
      fallos: acc.fallos,
      maxCombo: acc.maxCombo,
      fallados: acc.fallados,
    })
  }

  if (!examenActivo) return <p>Elige un examen en Inicio.</p>

  if (preguntas.length < 5) {
    return (
      <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm dark:bg-amber-900/20">
        Este examen todavía no tiene preguntas suficientes para el modo Ráfaga.
      </div>
    )
  }

  // ---------- INICIO: una sola pulsación ----------
  if (fase === 'inicio') {
    return (
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-500">
          {codigo} · Ráfaga
        </p>
        <p className="mb-6 mt-1 text-sm text-slate-500 dark:text-slate-400">
          {DURACION_S} segundos. Acertar suma {BONUS_ACIERTO_S}s, fallar resta{' '}
          {PENALIZACION_FALLO_S}s.
        </p>

        <button
          className="mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
          onClick={empezar}
          autoFocus
        >
          EMPEZAR
        </button>

        <div className="mx-auto mt-8 grid max-w-sm grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold tabular-nums">{guardado.rating}</p>
            <p className="text-xs text-slate-500">rating</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{guardado.record}</p>
            <p className="text-xs text-slate-500">récord</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{guardado.carreras}</p>
            <p className="text-xs text-slate-500">carreras</p>
          </div>
        </div>
      </div>
    )
  }

  // ---------- CARRERA ----------
  if (fase === 'corriendo') {
    const seg = Math.ceil(msRestantes / 1000)
    const apurado = seg <= 10
    const mult = multiplicador(combo)
    const anchoBarra = Math.min(100, (msRestantes / (DURACION_S * 1000)) * 100)
    return (
      <div
        className={
          'relative rounded-xl transition-colors duration-150 ' +
          (flash === 'bien' ? 'bg-emerald-500/10' : flash === 'mal' ? 'bg-rose-500/15' : '')
        }
      >
        <div className="mb-4 flex items-center justify-between">
          <div
            className={
              'text-4xl font-black tabular-nums ' +
              (apurado ? 'animate-pulse text-rose-500' : 'text-slate-800 dark:text-white')
            }
          >
            {seg}
            <span className="text-base font-medium text-slate-400">s</span>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{puntuacion}</p>
            {combo >= 2 && (
              <p className="text-xs font-bold text-orange-500">
                🔥 {combo} seguidas {mult > 1 ? '· x' + mult : ''}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={
              'h-full transition-[width] duration-100 ' + (apurado ? 'bg-rose-500' : 'bg-sky-500')
            }
            style={{ width: anchoBarra + '%' }}
          />
        </div>

        {pop && (
          <p
            key={pop.id}
            className={
              'pointer-events-none absolute right-2 top-10 text-2xl font-black flotar ' +
              (pop.bueno ? 'text-emerald-500' : 'text-rose-500')
            }
          >
            {pop.texto}
          </p>
        )}

        {jefe && (
          <p className="mb-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-center text-xs font-black uppercase tracking-wider text-white">
            ⚡ Pregunta jefe · puntos x3
          </p>
        )}

        <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">{actual.dominio}</p>
        <h2 className="mb-4 text-lg font-semibold leading-snug">{actual.pregunta.pregunta}</h2>

        <div className="grid gap-2">
          {opciones.map((opcion, i) => (
            <button
              key={i}
              disabled={!!flash}
              className={
                'flex items-start gap-3 rounded-xl border-2 p-3 text-left text-sm transition-all ' +
                (flash && opcion.correcta
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                  : 'border-slate-300 hover:border-sky-400 hover:bg-sky-50 dark:border-slate-600 dark:hover:bg-slate-700')
              }
              onClick={() => responder(opcion)}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-600 dark:text-slate-200">
                {i + 1}
              </span>
              <span>{opcion.texto}</span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Teclas 1 a {opciones.length} para responder sin ratón
        </p>
      </div>
    )
  }

  // ---------- FIN ----------
  const hito = siguienteHito({
    rating: resumen.rating,
    puntuacion: resumen.puntuacion,
    record: resumen.recordPrevio,
  })
  const deltaRating = resumen.rating - resumen.ratingPrevio

  return (
    <div>
      <div className="mb-6 text-center">
        {resumen.esRecord && (
          <p className="mb-1 text-sm font-black uppercase tracking-widest text-amber-500">
            ★ Récord nuevo
          </p>
        )}
        <p className="text-6xl font-black tabular-nums">{resumen.puntuacion}</p>
        <p className="text-sm text-slate-500">
          {resumen.aciertos} aciertos · {resumen.fallos} fallos · mejor combo {resumen.maxCombo}
        </p>
        <p className="mt-3 text-lg font-bold tabular-nums">
          Rating {resumen.rating}{' '}
          <span className={deltaRating >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
            {deltaRating >= 0 ? '+' : ''}
            {deltaRating}
          </span>
        </p>
      </div>

      {hito && (
        <p className="mb-5 rounded-xl bg-sky-50 p-3 text-center text-sm font-medium text-sky-900 dark:bg-sky-900/30 dark:text-sky-200">
          Te faltan {hito.texto}.
        </p>
      )}

      <div className="mb-6 flex gap-2">
        <button className="btn-primario flex-1" onClick={empezar} autoFocus>
          Otra ({DURACION_S}s)
        </button>
        <button
          className="rounded-lg border border-slate-300 px-4 text-sm dark:border-slate-600"
          onClick={() => navegar('inicio')}
        >
          Salir
        </button>
      </div>

      {resumen.fallados.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Lo que fallaste ({resumen.fallados.length})
          </h3>
          <div className="space-y-4">
            {resumen.fallados.map((f, i) => {
              const correcta = f.pregunta.opciones.find((o) => o.correcta)
              return (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"
                >
                  <p className="mb-2 font-medium">{f.pregunta.pregunta}</p>
                  <p className="mb-2 rounded-lg bg-rose-50 p-2 dark:bg-rose-900/20">
                    <span className="font-semibold">Elegiste:</span> {f.elegida.texto}.{' '}
                    {f.elegida.explicacion}
                  </p>
                  <p className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
                    <span className="font-semibold">Era:</span> {correcta.texto}.{' '}
                    {correcta.explicacion}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
