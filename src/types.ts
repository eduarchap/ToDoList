// Prioridad estilo Todoist: 1 = máxima (P1), 4 = mínima (P4).
export type Priority = 1 | 2 | 3 | 4

export interface Task {
  id: string
  title: string
  notes: string | null
  /** Fecha de vencimiento en formato ISO (YYYY-MM-DD) o null si no tiene plazo. */
  dueDate: string | null
  priority: Priority
  completed: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
  /** Orden manual dentro de una lista (para futuros reordenamientos). */
  sortOrder: number
}

/** Datos necesarios para crear una tarea nueva. */
export interface NewTaskInput {
  title: string
  notes?: string | null
  dueDate?: string | null
  priority?: Priority
}

export type TaskView = 'today' | 'upcoming' | 'all' | 'completed'
