import { useMemo, useState } from 'react'
import type { Task, TaskView } from '../types'
import { useTasks } from '../context/TasksContext'
import { buildSections } from '../lib/grouping'
import { formatSectionLabel } from '../lib/date'
import { TaskItem } from './TaskItem'
import { TaskEditModal } from './TaskEditModal'
import { EmptyState } from './EmptyState'

const EMPTY: Record<TaskView, { title: string; subtitle: string }> = {
  today: { title: 'Nada para hoy 🎉', subtitle: 'No tienes tareas vencidas ni para hoy. Disfruta.' },
  upcoming: { title: 'Sin tareas próximas', subtitle: 'Añade una tarea con fecha futura y aparecerá aquí.' },
  all: { title: 'Todo despejado', subtitle: 'Añade tu primera tarea con la barra de arriba.' },
  completed: { title: 'Aún nada completado', subtitle: 'Las tareas que termines aparecerán aquí.' },
}

/** Fechas ISO se muestran con formato legible; el resto de claves tal cual. */
function sectionTitle(view: TaskView, key: string, raw: string): string {
  if (view === 'upcoming') return formatSectionLabel(key)
  return raw
}

export function TaskList({ view }: { view: TaskView }) {
  const { tasks, loading } = useTasks()
  const [editing, setEditing] = useState<Task | null>(null)

  const sections = useMemo(() => buildSections(tasks, view), [tasks, view])

  if (loading) {
    return (
      <div className="space-y-2 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-900/60" />
        ))}
      </div>
    )
  }

  if (sections.length === 0) {
    return <EmptyState {...EMPTY[view]} />
  }

  return (
    <>
      <div className="space-y-6 pb-4">
        {sections.map((section) => (
          <section key={section.key}>
            <h3
              className={[
                'mb-1 px-2 text-xs font-semibold uppercase tracking-wide',
                section.tone === 'danger' ? 'text-red-400' : 'text-slate-400',
              ].join(' ')}
            >
              {sectionTitle(view, section.key, section.title)}
              <span className="ml-1.5 font-normal text-slate-600">{section.tasks.length}</span>
            </h3>
            <div className="divide-y divide-slate-800/60">
              {section.tasks.map((task) => (
                <TaskItem key={task.id} task={task} onOpen={setEditing} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <TaskEditModal task={editing} onClose={() => setEditing(null)} />
    </>
  )
}
