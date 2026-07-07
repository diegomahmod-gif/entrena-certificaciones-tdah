import { useEffect, useMemo, useState } from 'react'
import { EstadoContexto } from './estado.js'
import { cargar, guardar } from './lib/storage.js'
import { cargarExamenes, obtenerIndice } from './lib/contenido.js'
import Home from './pages/Home.jsx'
import Session from './pages/Session.jsx'
import Progress from './pages/Progress.jsx'
import Settings from './pages/Settings.jsx'
import Pomodoro from './components/Pomodoro.jsx'
import StreakBadge from './components/StreakBadge.jsx'

export default function App() {
  const [estado, setEstado] = useState(() => cargar())
  const [vista, setVista] = useState('inicio')

  const carga = useMemo(() => {
    try {
      return { examenes: cargarExamenes(), error: null }
    } catch (e) {
      return { examenes: [], error: e.message }
    }
  }, [])

  // Persiste tras cada interacción y re-renderiza.
  const actualizar = (fn) => {
    setEstado((prev) => {
      const copia = structuredClone(prev)
      const resultado = fn(copia) ?? copia
      guardar(resultado)
      return resultado
    })
  }

  // Tema oscuro por defecto, con toggle persistente.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', estado.ajustes.tema === 'oscuro')
  }, [estado.ajustes.tema])

  if (carga.error) {
    return (
      <main className="mx-auto max-w-xl p-8" role="alert">
        <h1 className="mb-4 text-xl font-bold text-red-600 dark:text-red-400">
          Error al cargar el contenido
        </h1>
        <pre className="whitespace-pre-wrap rounded-lg bg-slate-800 p-4 text-sm text-red-200">
          {carga.error}
        </pre>
      </main>
    )
  }

  const codigoActivo = estado.examenActivo ?? obtenerIndice().examenes[0]?.codigo
  const examenActivo = carga.examenes.find((e) => e.meta.codigo === codigoActivo)
  const enItem =
    vista === 'sesion' && estado.sesion && !estado.sesion.terminada

  const contexto = {
    estado,
    actualizar,
    examenes: carga.examenes,
    examenActivo,
    vista,
    navegar: setVista,
  }

  const navBoton = (id, etiqueta) => (
    <button
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        vista === id
          ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
      }`}
      aria-current={vista === id ? 'page' : undefined}
      onClick={() => setVista(id)}
    >
      {etiqueta}
    </button>
  )

  return (
    <EstadoContexto.Provider value={contexto}>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
            <button
              className="text-base font-bold text-slate-900 dark:text-white"
              onClick={() => setVista('inicio')}
            >
              Entrena<span className="text-sky-500">Cert</span>
            </button>
            <nav className="flex items-center gap-1" aria-label="Navegación principal">
              {navBoton('inicio', 'Inicio')}
              {navBoton('progreso', 'Progreso')}
              {navBoton('ajustes', 'Ajustes')}
            </nav>
            <div className="flex items-center gap-3">
              <StreakBadge racha={estado.racha} />
              <Pomodoro ocultarContador={enItem} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
          {vista === 'inicio' && <Home />}
          {vista === 'sesion' && <Session />}
          {vista === 'progreso' && <Progress />}
          {vista === 'ajustes' && <Settings />}
        </main>

        <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <p className="mx-auto max-w-2xl">
            {examenActivo?.datos?.notaLegal}
          </p>
          <p className="mx-auto mt-2 max-w-2xl font-medium">
            Esta app entrena conocimiento y razonamiento; no reemplaza los labs reales de
            Azure/Power BI.
          </p>
        </footer>
      </div>
    </EstadoContexto.Provider>
  )
}
