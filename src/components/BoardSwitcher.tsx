import { useEffect, useRef, useState } from 'react'
import { useBoards } from '../context/BoardsContext'
import { BoardIcon, CheckIcon, ChevronDownIcon, PencilIcon, PlusIcon, TrashIcon } from './icons'

export function BoardSwitcher() {
  const { boards, currentBoard, currentBoardId, selectBoard, createBoard, renameBoard, deleteBoard } =
    useBoards()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const t = setTimeout(() => document.addEventListener('pointerdown', onDoc), 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('pointerdown', onDoc)
    }
  }, [open])

  function close() {
    setOpen(false)
    setCreating(false)
    setRenaming(false)
    setConfirmDelete(false)
    setName('')
  }

  async function submitCreate() {
    const n = name.trim()
    if (!n) return
    await createBoard(n)
    close()
  }
  async function submitRename() {
    const n = name.trim()
    if (!n || !currentBoardId) return
    await renameBoard(currentBoardId, n)
    setRenaming(false)
    setName('')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => (open ? close() : setOpen(true))}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-800"
      >
        <span className="max-w-[40vw] truncate text-lg font-bold tracking-tight text-slate-100 sm:max-w-xs">
          {currentBoard?.name ?? 'Pizarra'}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-64 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl">
          <div className="max-h-64 overflow-y-auto">
            {boards.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  selectBoard(b.id)
                  close()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-slate-800"
              >
                <BoardIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-slate-200">{b.name}</span>
                {b.role !== 'owner' && (
                  <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                    compartido
                  </span>
                )}
                {b.id === currentBoardId && <CheckIcon className="h-4 w-4 shrink-0 text-brand-400" />}
              </button>
            ))}
          </div>

          <div className="my-1 border-t border-slate-800" />

          {creating ? (
            <div className="flex items-center gap-1 p-1">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitCreate()}
                placeholder="Nombre del tablero"
                className="min-w-0 flex-1 rounded-lg bg-slate-800 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button onClick={submitCreate} className="rounded-lg bg-brand-600 px-2 py-1.5 text-sm font-semibold text-white hover:bg-brand-500">
                Crear
              </button>
            </div>
          ) : renaming ? (
            <div className="flex items-center gap-1 p-1">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitRename()}
                placeholder="Nuevo nombre"
                className="min-w-0 flex-1 rounded-lg bg-slate-800 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button onClick={submitRename} className="rounded-lg bg-brand-600 px-2 py-1.5 text-sm font-semibold text-white hover:bg-brand-500">
                OK
              </button>
            </div>
          ) : confirmDelete ? (
            <div className="flex items-center gap-1 p-1.5 text-sm">
              <span className="flex-1 text-slate-300">¿Eliminar «{currentBoard?.name}»?</span>
              <button
                onClick={async () => {
                  if (currentBoardId) await deleteBoard(currentBoardId)
                  close()
                }}
                className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500"
              >
                Sí
              </button>
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">
                No
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              <MenuItem onClick={() => { setCreating(true); setName('') }} icon={<PlusIcon className="h-4 w-4" />}>
                Nueva pizarra
              </MenuItem>
              {currentBoard?.role === 'owner' && (
                <>
                  <MenuItem onClick={() => { setRenaming(true); setName(currentBoard?.name ?? '') }} icon={<PencilIcon className="h-4 w-4" />}>
                    Renombrar «{currentBoard?.name}»
                  </MenuItem>
                  <MenuItem onClick={() => setConfirmDelete(true)} icon={<TrashIcon className="h-4 w-4" />} danger>
                    Eliminar «{currentBoard?.name}»
                  </MenuItem>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MenuItem({
  children,
  icon,
  onClick,
  danger,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-slate-800',
        danger ? 'text-red-300' : 'text-slate-200',
      ].join(' ')}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  )
}
