import type { Task, TaskView } from '../types'
import { useAuth } from '../context/AuthContext'
import { NAV_ITEMS, countFor } from './nav'
import { CloudIcon, DeviceIcon, LogOutIcon } from './icons'

interface Props {
  view: TaskView
  onChange: (v: TaskView) => void
  tasks: Task[]
}

/** Barra lateral de navegación (escritorio / tablet). */
export function Sidebar({ view, onChange, tasks }: Props) {
  const { status, user, signOut } = useAuth()
  const cloud = status === 'authenticated'

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/40 p-3 md:flex">
      <div className="mb-4 flex items-center gap-2 px-2 pt-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-100">Tareas</span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = view === item.view
          const count = countFor(item.view, tasks)
          return (
            <button
              key={item.view}
              onClick={() => onChange(item.view)}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                active ? 'bg-brand-600/15 text-brand-300' : 'text-slate-300 hover:bg-slate-800/60',
              ].join(' ')}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {count > 0 && (
                <span className={active ? 'text-xs text-brand-300' : 'text-xs text-slate-500'}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800 pt-3">
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
          {cloud ? <CloudIcon className="h-4 w-4" /> : <DeviceIcon className="h-4 w-4" />}
          <span className="truncate">
            {cloud ? user?.email ?? 'Sincronizado' : 'Solo en este dispositivo'}
          </span>
        </div>
        {cloud && (
          <button
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-200"
          >
            <LogOutIcon className="h-4 w-4" />
            Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  )
}
