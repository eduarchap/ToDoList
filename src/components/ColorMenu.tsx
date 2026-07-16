import { useEffect, useRef } from 'react'
import type { NoteColor } from '../types'
import { COLORS, COLOR_ORDER } from '../lib/colors'

interface Props {
  value: NoteColor
  onSelect: (c: NoteColor) => void
  onClose: () => void
}

/** Pequeño popover con las muestras de color. */
export function ColorMenu({ value, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    // Diferido para no capturar el mismo click que lo abrió.
    const t = setTimeout(() => document.addEventListener('pointerdown', onDoc), 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('pointerdown', onDoc)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-1/2 top-9 z-50 grid -translate-x-1/2 grid-cols-4 gap-1.5 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl"
    >
      {COLOR_ORDER.map((c) => (
        <button
          key={c}
          type="button"
          title={COLORS[c].label}
          aria-label={COLORS[c].label}
          onClick={() => {
            onSelect(c)
            onClose()
          }}
          className={[
            'h-7 w-7 rounded-full ring-2 transition',
            value === c ? 'ring-white' : 'ring-transparent hover:ring-slate-500',
          ].join(' ')}
          style={{ backgroundColor: COLORS[c].swatch }}
        />
      ))}
    </div>
  )
}
