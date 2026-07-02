import type { Task, TaskView } from '../types'
import { compareByUrgency } from './priority'
import { daysUntil, isOverdue } from './date'

export interface TaskSection {
  key: string
  title: string
  tasks: Task[]
  /** Resalta la sección (p. ej. vencidas en rojo). */
  tone?: 'danger' | 'default'
}

/**
 * Filtra y agrupa las tareas según la vista activa.
 * El orden dentro de cada sección lo marca el score de urgencia (automatismo).
 */
export function buildSections(tasks: Task[], view: TaskView): TaskSection[] {
  if (view === 'completed') {
    const done = tasks
      .filter((t) => t.completed)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    return done.length ? [{ key: 'done', title: 'Completadas', tasks: done }] : []
  }

  const pending = tasks.filter((t) => !t.completed)

  if (view === 'today') {
    // Vencidas + las de hoy.
    const overdue = pending.filter((t) => isOverdue(t.dueDate)).sort(compareByUrgency)
    const today = pending
      .filter((t) => t.dueDate && daysUntil(t.dueDate) === 0)
      .sort(compareByUrgency)
    const sections: TaskSection[] = []
    if (overdue.length) sections.push({ key: 'overdue', title: 'Vencidas', tasks: overdue, tone: 'danger' })
    if (today.length) sections.push({ key: 'today', title: 'Hoy', tasks: today })
    return sections
  }

  if (view === 'upcoming') {
    // Solo futuras (después de hoy), agrupadas por fecha.
    const future = pending
      .filter((t) => t.dueDate && daysUntil(t.dueDate) > 0)
      .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!) || compareByUrgency(a, b))
    const byDate = new Map<string, Task[]>()
    for (const t of future) {
      const list = byDate.get(t.dueDate!) ?? []
      list.push(t)
      byDate.set(t.dueDate!, list)
    }
    return [...byDate.entries()].map(([date, list]) => ({
      key: date,
      title: date, // La cabecera formatea la fecha.
      tasks: list,
    }))
  }

  // view === 'all': todo lo pendiente ordenado por urgencia, en secciones lógicas.
  const overdue = pending.filter((t) => isOverdue(t.dueDate)).sort(compareByUrgency)
  const today = pending.filter((t) => t.dueDate && daysUntil(t.dueDate) === 0).sort(compareByUrgency)
  const upcoming = pending.filter((t) => t.dueDate && daysUntil(t.dueDate) > 0).sort(compareByUrgency)
  const noDate = pending.filter((t) => !t.dueDate).sort(compareByUrgency)

  const sections: TaskSection[] = []
  if (overdue.length) sections.push({ key: 'overdue', title: 'Vencidas', tasks: overdue, tone: 'danger' })
  if (today.length) sections.push({ key: 'today', title: 'Hoy', tasks: today })
  if (upcoming.length) sections.push({ key: 'upcoming', title: 'Próximas', tasks: upcoming })
  if (noDate.length) sections.push({ key: 'nodate', title: 'Sin fecha', tasks: noDate })
  return sections
}
