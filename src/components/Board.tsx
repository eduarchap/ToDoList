import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNotes } from '../context/NotesContext'
import { useBoards } from '../context/BoardsContext'
import { BOARD_H, BOARD_W, MAX_SCALE, MIN_SCALE, NOTE_W, clamp } from '../lib/board'
import { StickyNote } from './StickyNote'
import { TopBar } from './TopBar'
import { TrashDrawer } from './TrashDrawer'
import { PlusIcon, TrashIcon } from './icons'

export function Board() {
  const { notes, loading, error, maxZ, addNote, patchNote, trashNote } = useNotes()
  const { error: boardsError, currentBoard } = useBoards()
  const readOnly = currentBoard?.role === 'viewer'

  const viewportRef = useRef<HTMLDivElement>(null)
  const trashZoneRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [overTrash, setOverTrash] = useState(false)
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null)
  const [trashOpen, setTrashOpen] = useState(false)

  const [scale, setScale] = useState(1)
  const scaleRef = useRef(scale)
  scaleRef.current = scale
  // Posición de scroll a aplicar tras un cambio de zoom (para mantener el punto bajo el cursor).
  const scrollTargetRef = useRef<{ left: number; top: number } | null>(null)
  const [panning, setPanning] = useState(false)
  const panRef = useRef<{ x: number; y: number; sl: number; st: number } | null>(null)

  // Seguimiento de dedos activos para el pellizco (pinch-to-zoom) en táctil.
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)
  const [pinching, setPinching] = useState(false)

  const visible = notes.filter((n) => !n.trashed)
  const trashCount = notes.length - visible.length

  // Centrar la vista del lienzo al entrar.
  useLayoutEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    vp.scrollLeft = (BOARD_W - vp.clientWidth) / 2
    vp.scrollTop = Math.max(0, BOARD_H / 6)
  }, [])

  // Aplica el reposicionamiento de scroll después de que el lienzo se reescale.
  useLayoutEffect(() => {
    const vp = viewportRef.current
    if (vp && scrollTargetRef.current) {
      vp.scrollLeft = scrollTargetRef.current.left
      vp.scrollTop = scrollTargetRef.current.top
      scrollTargetRef.current = null
    }
  }, [scale])

  /** Aplica un nuevo zoom manteniendo fijo el punto (cx, cy) medido desde la esquina del viewport. */
  const zoomTo = useCallback((next: number, cx: number, cy: number) => {
    const vp = viewportRef.current
    if (!vp) return
    const old = scaleRef.current
    const clamped = clamp(next, MIN_SCALE, MAX_SCALE)
    if (clamped === old) return
    const bx = (vp.scrollLeft + cx) / old
    const by = (vp.scrollTop + cy) / old
    scrollTargetRef.current = { left: bx * clamped - cx, top: by * clamped - cy }
    setScale(clamped)
  }, [])

  // Zoom con la rueda (listener nativo no pasivo para poder hacer preventDefault).
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    function onWheel(e: WheelEvent) {
      // Si el cursor está dentro de una nota, deja el scroll interno nativo (no zoom).
      if ((e.target as HTMLElement)?.closest('[data-note]')) return
      e.preventDefault()
      const rect = vp!.getBoundingClientRect()
      const factor = Math.exp(-e.deltaY * 0.0015)
      zoomTo(scaleRef.current * factor, e.clientX - rect.left, e.clientY - rect.top)
    }
    vp.addEventListener('wheel', onWheel, { passive: false })
    return () => vp.removeEventListener('wheel', onWheel)
  }, [zoomTo])

  function zoomButton(factor: number) {
    const vp = viewportRef.current
    if (!vp) return
    zoomTo(scaleRef.current * factor, vp.clientWidth / 2, vp.clientHeight / 2)
  }

  function resetZoom() {
    const vp = viewportRef.current
    if (!vp) return
    zoomTo(1, vp.clientWidth / 2, vp.clientHeight / 2)
  }

  function twoTouchDistance() {
    const pts = [...pointersRef.current.values()]
    if (pts.length < 2) return 0
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
  }

  function onPointerDown(e: React.PointerEvent) {
    // Táctil: registra el dedo; con dos dedos empieza el pellizco (zoom).
    if (e.pointerType === 'touch') {
      if ((e.target as HTMLElement).closest('[data-note]')) return // no interferir al mover/editar notas
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointersRef.current.size === 2) {
        pinchRef.current = { dist: twoTouchDistance(), scale: scaleRef.current }
        setPinching(true)
      }
      return
    }
    // Ratón: pan con clic izquierdo sostenido en zona vacía.
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-note]')) return
    const vp = viewportRef.current
    if (!vp) return
    panRef.current = { x: e.clientX, y: e.clientY, sl: vp.scrollLeft, st: vp.scrollTop }
    setPanning(true)
    vp.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (e.pointerType === 'touch') {
      if (!pointersRef.current.has(e.pointerId)) return
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointersRef.current.size === 2 && pinchRef.current) {
        const vp = viewportRef.current
        if (!vp) return
        const pts = [...pointersRef.current.values()]
        const rect = vp.getBoundingClientRect()
        const midX = (pts[0].x + pts[1].x) / 2 - rect.left
        const midY = (pts[0].y + pts[1].y) / 2 - rect.top
        const ratio = twoTouchDistance() / (pinchRef.current.dist || 1)
        zoomTo(pinchRef.current.scale * ratio, midX, midY)
      }
      return
    }
    if (!panRef.current) return
    const vp = viewportRef.current
    if (!vp) return
    vp.scrollLeft = panRef.current.sl - (e.clientX - panRef.current.x)
    vp.scrollTop = panRef.current.st - (e.clientY - panRef.current.y)
  }

  function endPan(e: React.PointerEvent) {
    if (e.pointerType === 'touch') {
      pointersRef.current.delete(e.pointerId)
      if (pointersRef.current.size < 2) {
        pinchRef.current = null
        setPinching(false)
      }
      return
    }
    if (!panRef.current) return
    panRef.current = null
    setPanning(false)
    viewportRef.current?.releasePointerCapture(e.pointerId)
  }

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
    const s = scaleRef.current
    const jitter = () => Math.round(Math.random() * 40 - 20)
    let x = BOARD_W / 2 - NOTE_W / 2
    let y = BOARD_H / 6
    if (vp) {
      x = (vp.scrollLeft + vp.clientWidth / 2) / s - NOTE_W / 2 + jitter()
      y = (vp.scrollTop + vp.clientHeight / 3) / s + jitter()
    }
    const created = await addNote({
      x: clamp(x, 0, BOARD_W - NOTE_W),
      y: clamp(y, 0, BOARD_H - 120),
      z: maxZ + 1,
    })
    if (created) setAutoFocusId(created.id)
  }

  useEffect(() => {
    if (!autoFocusId) return
    const t = setTimeout(() => setAutoFocusId(null), 400)
    return () => clearTimeout(t)
  }, [autoFocusId])

  return (
    <div className="flex h-full flex-col">
      <TopBar trashCount={trashCount} onOpenTrash={() => setTrashOpen(true)} />

      {(boardsError || error) && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {boardsError || error}
        </div>
      )}

      <div
        ref={viewportRef}
        className={`relative min-h-0 flex-1 overflow-auto bg-slate-950 ${panning ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        style={{ touchAction: dragging || pinching ? 'none' : 'auto' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        {/* Sizer: ocupa el tamaño escalado para que el scroll (pan) tenga el rango correcto. */}
        <div style={{ width: BOARD_W * scale, height: BOARD_H * scale }}>
          <div
            className="relative origin-top-left"
            style={{
              width: BOARD_W,
              height: BOARD_H,
              transform: `scale(${scale})`,
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
                scale={scale}
                readOnly={readOnly}
                onBringToFront={bringToFront}
                onDragStart={() => setDragging(true)}
                onDragMove={handleDragMove}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </div>

        {!loading && visible.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-lg font-medium text-slate-400">
              {readOnly ? 'Este tablero está vacío' : 'Tu pizarra está vacía'}
            </p>
            {!readOnly && (
              <p className="mt-1 text-sm text-slate-500">Pulsa el botón + para crear tu primera nota.</p>
            )}
          </div>
        )}
      </div>

      {/* Controles de zoom */}
      <div className="fixed bottom-6 left-4 z-40 flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1 shadow-lg backdrop-blur" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
        <ZoomBtn label="Alejar" onClick={() => zoomButton(1 / 1.2)}>−</ZoomBtn>
        <button
          onClick={resetZoom}
          className="min-w-12 rounded-lg px-1 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
          title="Restablecer zoom"
        >
          {Math.round(scale * 100)}%
        </button>
        <ZoomBtn label="Acercar" onClick={() => zoomButton(1.2)}>+</ZoomBtn>
      </div>

      {/* Botón flotante para añadir nota (oculto en solo lectura) */}
      {!readOnly && (
        <button
          onClick={handleAdd}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-500 active:scale-95"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Añadir nota"
        >
          <PlusIcon className="h-7 w-7" />
        </button>
      )}

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

function ZoomBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-xl font-semibold text-slate-200 transition hover:bg-slate-800"
    >
      {children}
    </button>
  )
}
