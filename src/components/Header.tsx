import type { TaskView } from '../types'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../context/TasksContext'
import { CloudIcon, DeviceIcon, LogOutIcon, TrashIcon } from './icons'

const TITLES: Record<TaskView, string> = {
  today: 'Hoy',
  upcoming: 'Próximas',
  all: 'Todas las tareas',
  completed: 'Completadas',
}

const SUBTITLE = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function Header({ view }: { view: TaskView }) {
  const { status, user, signOut } = useAuth()
  const { tasks, clearCompleted } = useTasks()
  const cloud = status === 'authenticated'
  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <header className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">{TITLES[view]}</h1>
        {view === 'today' && (
          <p className="mt-0.5 text-sm capitalize text-slate-500">{SUBTITLE.format(new Date())}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {view === 'completed' && completedCount > 0 && (
          <button
            onClick={clearCompleted}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-red-300"
          >
            <TrashIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Borrar completadas</span>
          </button>
        )}

        {/* Indicador de modo (visible en móvil, donde no hay sidebar). */}
        <div className="flex items-center gap-1.5 md:hidden">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400"
            title={cloud ? (user?.email ?? 'Sincronizado en la nube') : 'Solo en este dispositivo'}
          >
            {cloud ? <CloudIcon className="h-5 w-5" /> : <DeviceIcon className="h-5 w-5" />}
          </span>
          {cloud && (
            <button
              onClick={signOut}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition hover:text-slate-200"
              aria-label="Cerrar sesión"
            >
              <LogOutIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
