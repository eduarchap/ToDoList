import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNotes } from '../context/NotesContext'
import { BOARD_H, BOARD_W, NOTE_W, clamp } from '../lib/board'
import { StickyNote } from './StickyNote'
import { TopBar } from './TopBar'
import { TrashDrawer } from './TrashDrawer'
import { PlusIcon, TrashIcon } from './icons'

export function Board() {
  const { notes, loading, error, maxZ, addNote, patchNote, trashNote } = useNotes()

  const viewportRef = useRef<HTMLDivElement>(null)
  const trashZoneRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [overTrash, setOverTrash] = useState(false)
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null)
  const [trashOpen, setTrashOpen] = useState(false)

  const visible = notes.filter((n) => !n.trashed)
  const trashCount = notes.length - visible.length

  // Centrar la vista del lienzo al entrar.
  useLayoutEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    vp.scrollLeft = (BOARD_W - vp.clientWidth) / 2
    vp.scrollTop = Math.max(0, BOARD_H / 6)
  }, [])

  const isOverZone = useCallback((cx: number, cy: number) => {
    const r = trashZoneRef.current?.getBoundingClientRect()
    if (!r) return false
    return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom
  }, [])

  const bringToFront = useCallback(
    (id: string) => {
      const note = notes.find((n) => n.id === id)
      if (note && note.z <= maxZ) patchNote(id, { z: maxZ + 1 })
    },
    [notes, maxZ, patchNote],
  )

  const handleDragMove = useCallback(
    (cx: number, cy: number) => setOverTrash(isOverZone(cx, cy)),
    [isOverZone],
  )

  const handleDrop = useCallback(
    (id: string, x: number, y: number, cx: number, cy: number) => {
      const droppedOnTrash = isOverZone(cx, cy)
      setDragging(false)
      setOverTrash(false)
      if (droppedOnTrash) trashNote(id)
      else patchNote(id, { x, y })
    },
    [isOverZone, trashNote, patchNote],
  )

  async function handleAdd() {
    const vp = viewportRef.current
    const jitter = () => Math.round(Math.random() * 40 - 20)
    let x = BOARD_W / 2 - NOTE_W / 2
    let y = BOARD_H / 6
    if (vp) {
      x = vp.scrollLeft + vp.clientWidth / 2 - NOTE_W / 2 + jitter()
      y = vp.scrollTop + vp.clientHeight / 3 + jitter()
    }
    const created = await addNote({
      x: clamp(x, 0, BOARD_W - NOTE_W),
      y: clamp(y, 0, BOARD_H - 120),
      z: maxZ + 1,
    })
    if (created) setAutoFocusId(created.id)
  }

  // Limpia el autofocus tras aplicarse.
  useEffect(() => {
    if (!autoFocusId) return
    const t = setTimeout(() => setAutoFocusId(null), 400)
    return () => clearTimeout(t)
  }, [autoFocusId])

  return (
    <div className="flex h-full flex-col">
      <TopBar trashCount={trashCount} onOpenTrash={() => setTrashOpen(true)} />

      {error && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 overflow-auto bg-slate-950"
        style={{ touchAction: dragging ? 'none' : 'auto' }}
      >
        <div
          className="relative"
          style={{
            width: BOARD_W,
            height: BOARD_H,
            backgroundImage:
              'radial-gradient(circle, rgba(148,163,184,0.15) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        >
          {visible.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              autoFocus={note.id === autoFocusId}
              onBringToFront={bringToFront}
              onDragStart={() => setDragging(true)}
              onDragMove={handleDragMove}
              onDrop={handleDrop}
            />
          ))}
        </div>

        {!loading && visible.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-lg font-medium text-slate-400">Tu pizarra está vacía</p>
            <p className="mt-1 text-sm text-slate-500">Pulsa el botón + para crear tu primera nota.</p>
          </div>
        )}
      </div>

      {/* Botón flotante para añadir nota */}
      <button
        onClick={handleAdd}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-500 active:scale-95"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Añadir nota"
      >
        <PlusIcon className="h-7 w-7" />
      </button>

      {/* Zona para soltar en la papelera (aparece al arrastrar) */}
      {dragging && (
        <div
          ref={trashZoneRef}
          className={[
            'pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-1 rounded-2xl border-2 border-dashed px-8 py-4 transition',
            overTrash
              ? 'scale-110 border-red-400 bg-red-500/25 text-red-200'
              : 'border-slate-600 bg-slate-900/80 text-slate-400',
          ].join(' ')}
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <TrashIcon className="h-7 w-7" />
          <span className="text-xs font-medium">
            {overTrash ? 'Suelta para tirar' : 'Arrastra aquí para tirar'}
          </span>
        </div>
      )}

      <TrashDrawer open={trashOpen} onClose={() => setTrashOpen(false)} />
    </div>
  )
}
