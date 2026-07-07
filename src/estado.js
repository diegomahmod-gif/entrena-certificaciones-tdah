// Contexto global de estado + navegación.
import { createContext, useContext } from 'react'

export const EstadoContexto = createContext(null)

/**
 * Devuelve { estado, actualizar, examenes, vista, navegar }.
 * `actualizar(fn)` muta una copia del estado, la persiste en localStorage
 * y re-renderiza. Se llama tras CADA interacción.
 */
export function useEstado() {
  return useContext(EstadoContexto)
}
