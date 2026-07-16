import { useEffect, useRef, useState } from 'react'
import type { Note } from '../types'
import { COLORS } from '../lib/colors'
import {
  BOARD_H,
  BOARD_W,
  NOTE_MAX_H,
  NOTE_MAX_W,
  NOTE_MIN_H,
  NOTE_MIN_W,
  clamp,
} from '../lib/board'
import { formatDueLabel, isOverdue } from '../lib/date'
import { useNotes } from '../context/NotesContext'
import { ColorMenu } from './ColorMenu'
import { CalendarIcon, GripIcon, PaletteIcon, TrashIcon, XIcon } from './icons'

interface Props {
  note: Note
  autoFocus: boolean
  /** Nivel de zoom actual del tablero (para convertir píxeles de pantalla a coordenadas del lienzo). */
  scale: number
  onBringToFront: (id: string) => void
  onDragStart: () => void
  onDragMove: (clientX: number, clientY: number) => void
  onDrop: (id: string, x: number, y: number, clientX: number, clientY: number) => void
}

export function StickyNote({
  note,
  autoFocus,
  scale,
  onBringToFront,
  onDragStart,
  onDragMove,
  onDrop,
}: Props) {
  const { patchNote, trashNote } = useNotes()
  const spec = COLORS[note.color]

  const rootRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const [pos, setPos] = useState({ x: note.x, y: note.y })
  const posRef = useRef(pos)
  const draggingRef = useRef(false)
  const dragOrigin = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)

  const [size, setSize] = useState({ w: note.w, h: note.h })
  const sizeRef = useRef(size)
  const resizingRef = useRef(false)
  const resizeOrigin = useRef<{ px: number; py: number; ow: number; oh: number } | null>(null)

  const [title, setTitle] = useState(note.title)
  const titleRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(note.text)
  const [colorOpen, setColorOpen] = useState(false)
  const [showDate, setShowDate] = useState(false)

  const autoHeight = size.h <= 0

  function setPosition(x: number, y: number) {
    posRef.current = { x, y }
    setPos({ x, y })
  }
  function setSizeBoth(w: number, h: number) {
    sizeRef.current = { w, h }
    setSize({ w, h })
  }

  // Sincroniza posición/tamaño si cambian desde fuera y no estamos interactuando.
  useEffect(() => {
    if (!draggingRef.current) setPosition(note.x, note.y)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.x, note.y])

  useEffect(() => {
    if (!resizingRef.current) setSizeBoth(note.w, note.h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.w, note.h])

  useEffect(() => {
    if (document.activeElement !== textRef.current) setText(note.text)
  }, [note.text])

  useEffect(() => {
    if (document.activeElement !== titleRef.current) setTitle(note.title)
  }, [note.title])

  // Altura del textarea: auto-crece con el texto solo si la nota no tiene altura fija.
  useEffect(() => {
    const el = textRef.current
    if (!el) return
    if (autoHeight) {
      el.style.height = 'auto'
      el.style.height = Math.max(48, el.scrollHeight) + 'px'
    } else {
      el.style.height = '' // el layout flex controla la altura
    }
  }, [text, autoHeight])

  useEffect(() => {
    if (autoFocus) textRef.current?.focus()
  }, [autoFocus])

  // ---- Arrastre de posición (cabecera) ----
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
    const dx = (e.clientX - dragOrigin.current.px) / scale
    const dy = (e.clientY - dragOrigin.current.py) / scale
    const nx = clamp(dragOrigin.current.ox + dx, 0, BOARD_W - sizeRef.current.w)
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

  // ---- Redimensionado (esquina inferior derecha) ----
  function onResizeDown(e: React.PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    resizingRef.current = true
    const startH = size.h > 0 ? size.h : rootRef.current?.offsetHeight ?? 120
    resizeOrigin.current = { px: e.clientX, py: e.clientY, ow: sizeRef.current.w, oh: startH }
    onBringToFront(note.id)
  }
  function onResizeMove(e: React.PointerEvent) {
    if (!resizingRef.current || !resizeOrigin.current) return
    const dw = (e.clientX - resizeOrigin.current.px) / scale
    const dh = (e.clientY - resizeOrigin.current.py) / scale
    setSizeBoth(
      clamp(resizeOrigin.current.ow + dw, NOTE_MIN_W, NOTE_MAX_W),
      clamp(resizeOrigin.current.oh + dh, NOTE_MIN_H, NOTE_MAX_H),
    )
  }
  function onResizeUp() {
    if (!resizingRef.current) return
    resizingRef.current = false
    resizeOrigin.current = null
    patchNote(note.id, { w: sizeRef.current.w, h: sizeRef.current.h })
  }

  function commitText() {
    if (text !== note.text) patchNote(note.id, { text })
  }
  function commitTitle() {
    if (title !== note.title) patchNote(note.id, { title })
  }

  const overdue = !note.trashed && isOverdue(note.dueDate)

  return (
    <div
      ref={rootRef}
      data-note
      className="absolute flex cursor-default select-none flex-col overflow-hidden rounded-lg shadow-xl ring-1 ring-black/10"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: autoHeight ? undefined : size.h,
        zIndex: note.z + 10,
        backgroundColor: spec.bg,
        color: spec.text,
      }}
    >
      {/* Cabecera = zona de arrastre */}
      <div
        className="relative flex shrink-0 items-center gap-1 px-1.5 py-1"
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
          <IconBtn label="Fecha" onClick={() => setShowDate((v) => !v)} color={spec.text}>
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

      {/* Título */}
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        placeholder="Título"
        className="w-full shrink-0 cursor-text border-b border-black/10 bg-transparent px-2.5 pb-1.5 pt-1.5 text-sm font-bold placeholder:font-medium placeholder:opacity-40 focus:outline-none"
        style={{ color: spec.text }}
      />

      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        placeholder="Escribe aquí…"
        rows={2}
        className={[
          'w-full cursor-text resize-none bg-transparent px-2.5 py-2 text-sm leading-snug placeholder:opacity-40 focus:outline-none',
          autoHeight ? '' : 'min-h-0 flex-1 overflow-auto',
        ].join(' ')}
        style={{ color: spec.text }}
      />

      {(showDate || note.dueDate) && (
        <div className="flex shrink-0 items-center gap-1.5 px-2.5 pb-2 text-xs" style={{ color: spec.text }}>
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

      {/* Tirador de redimensionado */}
      <div
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        onPointerCancel={onResizeUp}
        className="absolute bottom-0 right-0 flex h-5 w-5 items-end justify-end p-0.5"
        style={{ cursor: 'nwse-resize', touchAction: 'none' }}
        title="Redimensionar"
        aria-label="Redimensionar"
      >
        <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 opacity-40" style={{ color: spec.text }}>
          <path d="M9 1 1 9M9 5 5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </svg>
      </div>
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
