import { useEffect, useRef, useState } from 'react'
import type { Note } from '../types'
import { COLORS } from '../lib/colors'
import { BOARD_H, BOARD_W, NOTE_W, clamp } from '../lib/board'
import { formatDueLabel, isOverdue } from '../lib/date'
import { useNotes } from '../context/NotesContext'
import { ColorMenu } from './ColorMenu'
import { CalendarIcon, GripIcon, PaletteIcon, TrashIcon, XIcon } from './icons'

interface Props {
  note: Note
  autoFocus: boolean
  onBringToFront: (id: string) => void
  onDragStart: () => void
  onDragMove: (clientX: number, clientY: number) => void
  onDrop: (id: string, x: number, y: number, clientX: number, clientY: number) => void
}

export function StickyNote({
  note,
  autoFocus,
  onBringToFront,
  onDragStart,
  onDragMove,
  onDrop,
}: Props) {
  const { patchNote, trashNote } = useNotes()
  const spec = COLORS[note.color]

  const [pos, setPos] = useState({ x: note.x, y: note.y })
  const posRef = useRef(pos)
  const draggingRef = useRef(false)
  const dragOrigin = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)

  const [text, setText] = useState(note.text)
  const [colorOpen, setColorOpen] = useState(false)
  const [showDate, setShowDate] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  function setPosition(x: number, y: number) {
    posRef.current = { x, y }
    setPos({ x, y })
  }

  // Sincroniza posición si cambia desde fuera (p. ej. otra pestaña) y no arrastramos.
  useEffect(() => {
    if (!draggingRef.current) setPosition(note.x, note.y)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.x, note.y])

  // Sincroniza texto si cambia desde fuera y no lo estamos editando.
  useEffect(() => {
    if (document.activeElement !== textRef.current) setText(note.text)
  }, [note.text])

  // Auto-crecer el textarea según el contenido.
  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.max(48, el.scrollHeight) + 'px'
  }, [text])

  useEffect(() => {
    if (autoFocus) textRef.current?.focus()
  }, [autoFocus])

  function onPointerDown(e: React.PointerEvent) {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    draggingRef.current = true
    dragOrigin.current = { px: e.clientX, py: e.clientY, ox: posRef.current.x, oy: posRef.current.y }
    onBringToFront(note.id)
    onDragStart()
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || !dragOrigin.current) return
    const dx = e.clientX - dragOrigin.current.px
    const dy = e.clientY - dragOrigin.current.py
    const nx = clamp(dragOrigin.current.ox + dx, 0, BOARD_W - NOTE_W)
    const ny = clamp(dragOrigin.current.oy + dy, 0, BOARD_H - 60)
    setPosition(nx, ny)
    onDragMove(e.clientX, e.clientY)
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!draggingRef.current) return
    draggingRef.current = false
    dragOrigin.current = null
    onDrop(note.id, posRef.current.x, posRef.current.y, e.clientX, e.clientY)
  }

  function commitText() {
    const t = text
    if (t !== note.text) patchNote(note.id, { text: t })
  }

  const overdue = !note.trashed && isOverdue(note.dueDate)

  return (
    <div
      className="absolute select-none rounded-lg shadow-xl ring-1 ring-black/10 transition-shadow"
      style={{ left: pos.x, top: pos.y, width: NOTE_W, zIndex: note.z + 10, backgroundColor: spec.bg, color: spec.text }}
    >
      {/* Cabecera = zona de arrastre */}
      <div
        className="relative flex items-center gap-1 rounded-t-lg px-1.5 py-1"
        style={{ backgroundColor: spec.header, touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <GripIcon className="h-4 w-4 opacity-50" />
        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn label="Color" onClick={() => setColorOpen((v) => !v)} color={spec.text}>
            <PaletteIcon className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            label="Fecha"
            onClick={() => {
              setShowDate((v) => !v)
            }}
            color={spec.text}
          >
            <CalendarIcon className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="A la papelera" onClick={() => trashNote(note.id)} color={spec.text}>
            <TrashIcon className="h-4 w-4" />
          </IconBtn>
        </div>

        {colorOpen && (
          <ColorMenu
            value={note.color}
            onSelect={(c) => patchNote(note.id, { color: c })}
            onClose={() => setColorOpen(false)}
          />
        )}
      </div>

      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        placeholder="Escribe aquí…"
        rows={2}
        className="w-full resize-none bg-transparent px-2.5 py-2 text-sm leading-snug placeholder:opacity-40 focus:outline-none"
        style={{ color: spec.text }}
      />

      {(showDate || note.dueDate) && (
        <div className="flex items-center gap-1.5 px-2.5 pb-2 text-xs" style={{ color: spec.text }}>
          <CalendarIcon className={`h-3.5 w-3.5 ${overdue ? 'text-red-700' : ''}`} />
          <input
            type="date"
            value={note.dueDate ?? ''}
            onChange={(e) => patchNote(note.id, { dueDate: e.target.value || null })}
            className={`bg-transparent text-xs focus:outline-none ${overdue ? 'font-bold text-red-800' : ''}`}
          />
          {note.dueDate && (
            <>
              <span className="font-medium">{formatDueLabel(note.dueDate)}</span>
              <button
                type="button"
                onClick={() => {
                  patchNote(note.id, { dueDate: null })
                  setShowDate(false)
                }}
                className="ml-auto rounded p-0.5 hover:bg-black/10"
                aria-label="Quitar fecha"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  color,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  color: string
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded p-1 transition hover:bg-black/10"
      style={{ color }}
    >
      {children}
    </button>
  )
}
