import type { Task } from '../types'
import { PRIORITY_META } from '../lib/priority'
import { useTasks } from '../context/TasksContext'
import { DueDateChip } from './DueDateChip'
import { CheckIcon } from './icons'

interface Props {
  task: Task
  onOpen: (task: Task) => void
}

/** Fila de tarea: checkbox de completar + contenido clicable para editar. */
export function TaskItem({ task, onOpen }: Props) {
  const { toggleComplete } = useTasks()
  const meta = PRIORITY_META[task.priority]

  return (
    <div className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-900/60">
      <button
        type="button"
        onClick={() => toggleComplete(task.id)}
        aria-label={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
        className={[
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition',
          task.completed
            ? 'border-brand-500 bg-brand-600 text-white'
            : `${meta.color} border-current hover:bg-slate-800`,
        ].join(' ')}
      >
        {task.completed && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
      </button>

      <button
        type="button"
        onClick={() => onOpen(task)}
        className="min-w-0 flex-1 text-left"
      >
        <p
          className={[
            'break-words text-[15px] leading-snug',
            task.completed ? 'text-slate-500 line-through' : 'text-slate-100',
          ].join(' ')}
        >
          {task.title}
        </p>
        {task.notes && (
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{task.notes}</p>
        )}
        {task.dueDate && !task.completed && (
          <div className="mt-1">
            <DueDateChip dueDate={task.dueDate} />
          </div>
        )}
      </button>

      {!task.completed && task.priority < 4 && (
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`}
          title={meta.label}
        />
      )}
    </div>
  )
}
