import { useState } from 'react'
import { useNotes } from '../context/NotesContext'
import { COLORS } from '../lib/colors'
import { RestoreIcon, TrashIcon, XIcon } from './icons'

interface Props {
  open: boolean
  onClose: () => void
}

export function TrashDrawer({ open, onClose }: Props) {
  const { notes, restoreNote, deleteNote, emptyTrash } = useNotes()
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const trashed = notes
    .filter((n) => n.trashed)
    .sort((a, b) => (b.trashedAt ?? '').localeCompare(a.trashedAt ?? ''))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-sm flex-col border-l border-slate-800 bg-slate-900 shadow-2xl safe-bottom animate-slide-up sm:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-800 p-4">
          <TrashIcon className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-100">Papelera</h2>
          <span className="text-sm text-slate-500">{trashed.length}</span>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Cerrar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {trashed.length === 0 ? (
            <p className="px-2 py-12 text-center text-sm text-slate-500">
              La papelera está vacía.
              <br />
              Arrastra una nota aquí o pulsa 🗑 para tirarla.
            </p>
          ) : (
            <ul className="space-y-2">
              {trashed.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-800/40 p-2.5"
                >
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[n.color].swatch }}
                  />
                  <p className="min-w-0 flex-1 break-words text-sm text-slate-200">
                    {n.text.trim() || <span className="italic text-slate-500">(sin texto)</span>}
                  </p>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => restoreNote(n.id)}
                      title="Restaurar"
                      aria-label="Restaurar"
                      className="rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-emerald-300"
                    >
                      <RestoreIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteNote(n.id)}
                      title="Eliminar definitivamente"
                      aria-label="Eliminar definitivamente"
                      className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-500/20 hover:text-red-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {trashed.length > 0 && (
          <div className="border-t border-slate-800 p-3">
            {confirmEmpty ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">¿Vaciar definitivamente?</span>
                <button
                  onClick={() => {
                    emptyTrash()
                    setConfirmEmpty(false)
                  }}
                  className="ml-auto rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
                >
                  Sí, vaciar
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmEmpty(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
              >
                <TrashIcon className="h-4 w-4" />
                Vaciar papelera ({trashed.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
