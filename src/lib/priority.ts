import type { Priority, Task } from '../types'
import { daysUntil } from './date'

export const PRIORITY_META: Record<
  Priority,
  { label: string; short: string; color: string; ring: string; dot: string }
> = {
  1: { label: 'Prioridad 1', short: 'P1', color: 'text-red-500', ring: 'ring-red-500/40', dot: 'bg-red-500' },
  2: { label: 'Prioridad 2', short: 'P2', color: 'text-orange-500', ring: 'ring-orange-500/40', dot: 'bg-orange-500' },
  3: { label: 'Prioridad 3', short: 'P3', color: 'text-blue-500', ring: 'ring-blue-500/40', dot: 'bg-blue-500' },
  4: { label: 'Prioridad 4', short: 'P4', color: 'text-slate-400', ring: 'ring-slate-400/30', dot: 'bg-slate-400' },
}

/**
 * Score de urgencia (AUTOMATISMO principal).
 * Cuanto MÁS ALTO, más arriba aparece la tarea. Combina:
 *  - Prioridad explícita (P1..P4)
 *  - Cercanía / superación del vencimiento (vencidas > hoy > próximas)
 *  - Las tareas sin fecha pesan menos que las que tienen plazo.
 */
export function urgencyScore(task: Task): number {
  // Peso de prioridad: P1=400, P2=300, P3=200, P4=100
  const priorityWeight = (5 - task.priority) * 100

  let dateWeight = 0
  if (task.dueDate) {
    const d = daysUntil(task.dueDate)
    if (d < 0) {
      // Vencida: cuanto más días de retraso, más urgente (tope razonable).
      dateWeight = 1000 + Math.min(-d, 60) * 10
    } else if (d === 0) {
      dateWeight = 900 // Hoy
    } else if (d <= 2) {
      dateWeight = 700 - d * 50 // Muy próxima
    } else if (d <= 7) {
      dateWeight = 500 - d * 20 // Esta semana
    } else {
      dateWeight = Math.max(50, 300 - d * 5) // Lejana
    }
  } else {
    dateWeight = 40 // Sin fecha
  }

  return priorityWeight + dateWeight
}

/** Orden por urgencia descendente; desempata por prioridad y fecha de creación. */
export function compareByUrgency(a: Task, b: Task): number {
  const diff = urgencyScore(b) - urgencyScore(a)
  if (diff !== 0) return diff
  if (a.priority !== b.priority) return a.priority - b.priority
  return a.createdAt.localeCompare(b.createdAt)
}
