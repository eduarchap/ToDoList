import { useEffect, useState } from 'react'
import type { Priority, Task } from '../types'
import { useTasks } from '../context/TasksContext'
import { PrioritySelect } from './PrioritySelect'
import { CalendarIcon, TrashIcon, XIcon } from './icons'

interface Props {
  task: Task | null
  onClose: () => void
}

/** Panel de edición completa de una tarea (título, notas, fecha, prioridad). */
export function TaskEditModal({ task, onClose }: Props) {
  const { patchTask, deleteTask } = useTasks()
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [priority, setPriority] = useState<Priority>(4)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setNotes(task.notes ?? '')
      setDueDate(task.dueDate)
      setPriority(task.priority)
    }
  }, [task])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (task) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [task, onClose])

  if (!task) return null

  async function save() {
    if (!task) return
    const trimmed = title.trim()
    if (!trimmed) return
    await patchTask(task.id, {
      title: trimmed,
      notes: notes.trim() || null,
      dueDate,
      priority,
    })
    onClose()
  }

  async function onDelete() {
    if (!task) return
    await deleteTask(task.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl safe-bottom animate-slide-up sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400">Editar tarea</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Cerrar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la tarea"
          autoFocus
          className="w-full rounded-lg bg-slate-800/60 px-3 py-2.5 text-[15px] font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas (opcional)"
          rows={3}
          className="mt-2 w-full resize-none rounded-lg bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
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
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Prioridad</span>
            <PrioritySelect value={priority} onChange={setPriority} compact />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            <TrashIcon className="h-4 w-4" />
            Eliminar
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!title.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:bg-brand-500 disabled:opacity-40"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
