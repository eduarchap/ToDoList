import { useEffect, useRef } from 'react'
import { COLORS, COLOR_ORDER, isCustomColor, resolveColor } from '../lib/colors'

interface Props {
  value: string
  onSelect: (c: string) => void
  onClose: () => void
}

/** Popover de color: presets + color personalizado (hex). */
export function ColorMenu({ value, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const custom = isCustomColor(value)

  useEffect(() => {
    function onDoc(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('pointerdown', onDoc), 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('pointerdown', onDoc)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-1/2 top-9 z-50 w-44 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl"
    >
      <div className="grid grid-cols-4 gap-1.5">
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

      <div className="my-2 border-t border-slate-800" />

      <label className="relative flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-800">
        <span
          className={`h-7 w-7 shrink-0 rounded-full ring-2 ${custom ? 'ring-white' : 'ring-transparent'}`}
          style={
            custom
              ? { backgroundColor: value }
              : {
                  background:
                    'conic-gradient(from 0deg, #f87171, #fbbf24, #4ade80, #60a5fa, #c084fc, #f472b6, #f87171)',
                }
          }
        />
        <span className="text-xs font-medium text-slate-300">Personalizado</span>
        <input
          type="color"
          value={resolveColor(value).swatch}
          onChange={(e) => onSelect(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Elegir color personalizado"
        />
      </label>
    </div>
  )
}
