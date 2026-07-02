import type { ComponentType, SVGProps } from 'react'
import type { Task, TaskView } from '../types'
import { daysUntil, isOverdue } from '../lib/date'
import { CheckCircleIcon, InboxIcon, TodayIcon, UpcomingIcon } from './icons'

export interface NavItem {
  view: TaskView
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const NAV_ITEMS: NavItem[] = [
  { view: 'today', label: 'Hoy', icon: TodayIcon },
  { view: 'upcoming', label: 'Próximas', icon: UpcomingIcon },
  { view: 'all', label: 'Todas', icon: InboxIcon },
  { view: 'completed', label: 'Hechas', icon: CheckCircleIcon },
]

/** Contador que se muestra junto a cada vista (badge). */
export function countFor(view: TaskView, tasks: Task[]): number {
  const pending = tasks.filter((t) => !t.completed)
  switch (view) {
    case 'today':
      return pending.filter((t) => isOverdue(t.dueDate) || (t.dueDate && daysUntil(t.dueDate) === 0)).length
    case 'upcoming':
      return pending.filter((t) => t.dueDate && daysUntil(t.dueDate) > 0).length
    case 'all':
      return pending.length
    case 'completed':
      return tasks.filter((t) => t.completed).length
  }
}
