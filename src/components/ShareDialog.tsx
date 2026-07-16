import { useEffect, useState, type FormEvent } from 'react'
import type { Board, BoardMember } from '../types'
import { useBoards } from '../context/BoardsContext'
import { errMessage } from '../lib/errors'
import { ShareIcon, TrashIcon, XIcon } from './icons'

interface Props {
  board: Board
  onClose: () => void
}

export function ShareDialog({ board, onClose }: Props) {
  const { listMembers, invite, removeMember } = useBoards()
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      setMembers(await listMembers(board.id))
      setError(null)
    } catch (e) {
      setError(errMessage(e, 'No se pudieron cargar los accesos'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!value) return
    setBusy(true)
    setError(null)
    try {
      await invite(board.id, value, role)
      setEmail('')
      await refresh()
    } catch (err) {
      setError(errMessage(err, 'No se pudo invitar'))
    } finally {
      setBusy(false)
    }
  }

  async function onRemove(m: BoardMember) {
    try {
      await removeMember(board.id, m.userId ? { userId: m.userId } : { email: m.email })
      await refresh()
    } catch (e) {
      setError(errMessage(e, 'No se pudo quitar el acceso'))
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl safe-bottom animate-slide-up sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <ShareIcon className="h-5 w-5 text-brand-400" />
          <h2 className="text-base font-semibold text-slate-100">Compartir «{board.name}»</h2>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Cerrar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Invita por correo. Esa persona verá el tablero al iniciar sesión con esa cuenta.
        </p>

        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="min-w-0 flex-1 rounded-lg bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
            className="rounded-lg bg-slate-800/60 px-2 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 [color-scheme:dark]"
          >
            <option value="editor">Puede editar</option>
            <option value="viewer">Solo lectura</option>
          </select>
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-brand-500 disabled:opacity-50"
          >
            Invitar
          </button>
        </form>

        {error && <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="mt-4">
          <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Con acceso
          </h3>
          {loading ? (
            <p className="px-1 py-3 text-sm text-slate-500">Cargando…</p>
          ) : members.length === 0 ? (
            <p className="px-1 py-3 text-sm text-slate-500">
              Aún no has compartido este tablero con nadie.
            </p>
          ) : (
            <ul className="space-y-1">
              {members.map((m) => (
                <li
                  key={(m.userId ?? 'pending') + m.email}
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-200">{m.email}</p>
                    <p className="text-xs text-slate-500">
                      {m.role === 'editor' ? 'Puede editar' : 'Solo lectura'}
                      {m.pending && ' · invitación pendiente'}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(m)}
                    title="Quitar acceso"
                    aria-label="Quitar acceso"
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-300"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
