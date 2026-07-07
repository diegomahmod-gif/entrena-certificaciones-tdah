// Cálculo de progreso por dominio y por examen.
import { aplanarItems } from './sessionBuilder.js'

/** Parsea "25-30%" o "20%" tomando el punto medio del rango. */
export function parsearPonderacion(texto) {
  if (!texto) return 0
  const nums = String(texto).match(/\d+(\.\d+)?/g)
  if (!nums || nums.length === 0) return 0
  if (nums.length === 1) return Number(nums[0])
  return (Number(nums[0]) + Number(nums[1])) / 2
}

/** % de items del dominio en box >= 4 (dominados). */
export function progresoDominio(dominio, leitner = {}) {
  const items = [
    ...(dominio.flashcards || []),
    ...(dominio.preguntas || []),
    ...(dominio.escenarios || []),
  ]
  if (items.length === 0) return 0
  const dominados = items.filter((it) => (leitner[it.id]?.box ?? 0) >= 4).length
  return Math.round((dominados / items.length) * 100)
}

/** Progreso del examen: media ponderada por la ponderación oficial de cada dominio. */
export function progresoExamen(examen, leitner = {}) {
  let sumaPesos = 0
  let suma = 0
  for (const dominio of examen.dominios) {
    const peso = parsearPonderacion(dominio.ponderacion)
    sumaPesos += peso
    suma += peso * progresoDominio(dominio, leitner)
  }
  if (sumaPesos === 0) return 0
  return Math.round(suma / sumaPesos)
}

/** Conteo de items por caja Leitner (0 = nunca vistos). */
export function cajasPorExamen(examen, leitner = {}) {
  const cajas = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const it of aplanarItems(examen)) {
    cajas[leitner[it.id]?.box ?? 0] += 1
  }
  return cajas
}
