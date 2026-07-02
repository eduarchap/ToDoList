import { useState, type FormEvent } from 'react'
import type { Priority } from '../types'
import { useTasks } from '../context/TasksContext'
import { todayISO } from '../lib/date'
import { PrioritySelect } from './PrioritySelect'
import { CalendarIcon, PlusIcon, XIcon } from './icons'
import { addDays, format } from 'date-fns'

interface Props {
  /** Fecha por defecto al añadir desde una vista concreta (p. ej. "Hoy"). */
  defaultDue?: string | null
}

/** Barra de alta rápida: escribe, (opcional) pon fecha y prioridad, y Enter. */
export function QuickAdd({ defaultDue = null }: Props) {
  const { addTask } = useTasks()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState<string | null>(defaultDue)
  const [priority, setPriority] = useState<Priority>(4)
  const [expanded, setExpanded] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    await addTask({ title: trimmed, dueDate, priority })
    setTitle('')
    setDueDate(defaultDue)
    setPriority(4)
  }

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 shadow-lg shadow-black/20 backdrop-blur"
    >
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition enabled:hover:bg-brand-500 disabled:opacity-40"
          aria-label="Añadir tarea"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Añadir una tarea…"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
          enterKeyHint="done"
        />
      </div>

      {expanded && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-2 animate-slide-up">
          {/* Atajos de fecha */}
          <div className="flex items-center gap-1">
            <QuickDateBtn label="Hoy" active={dueDate === todayISO()} onClick={() => setDueDate(todayISO())} />
            <QuickDateBtn label="Mañana" active={dueDate === tomorrow} onClick={() => setDueDate(tomorrow)} />
          </div>

          {/* Fecha exacta */}
          <label className="flex items-center gap-1.5 rounded-lg bg-slate-800/70 px-2 py-1.5 text-sm text-slate-300">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={dueDate ?? ''}
              onChange={(e) => setDueDate(e.target.value || null)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none [color-scheme:dark]"
            />
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate(null)}
                className="text-slate-500 hover:text-slate-300"
                aria-label="Quitar fecha"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          <div className="ml-auto">
            <PrioritySelect value={priority} onChange={setPriority} compact />
          </div>
        </div>
      )}
    </form>
  )
}

function QuickDateBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg px-2.5 py-1.5 text-sm font-medium transition',
        active ? 'bg-brand-600 text-white' : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
