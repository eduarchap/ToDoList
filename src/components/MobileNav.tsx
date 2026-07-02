import type { Task, TaskView } from '../types'
import { NAV_ITEMS, countFor } from './nav'

interface Props {
  view: TaskView
  onChange: (v: TaskView) => void
  tasks: Task[]
}

/** Barra de navegación inferior fija (móvil). */
export function MobileNav({ view, onChange, tasks }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 backdrop-blur safe-bottom md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const active = view === item.view
          const count = countFor(item.view, tasks)
          return (
            <button
              key={item.view}
              onClick={() => onChange(item.view)}
              className={[
                'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition',
                active ? 'text-brand-400' : 'text-slate-500',
              ].join(' ')}
            >
              <span className="relative">
                <item.icon className="h-6 w-6" />
                {count > 0 && (
                  <span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-brand-600 px-1 text-[10px] font-semibold leading-4 text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </span>
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
