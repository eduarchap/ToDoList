import type { Priority } from '../types'
import { PRIORITY_META } from '../lib/priority'
import { FlagIcon } from './icons'

interface Props {
  value: Priority
  onChange: (p: Priority) => void
  compact?: boolean
}

const ORDER: Priority[] = [1, 2, 3, 4]

/** Selector de prioridad P1–P4 con banderas de color. */
export function PrioritySelect({ value, onChange, compact }: Props) {
  return (
    <div className="flex items-center gap-1">
      {ORDER.map((p) => {
        const meta = PRIORITY_META[p]
        const active = value === p
        return (
          <button
            key={p}
            type="button"
            title={meta.label}
            aria-label={meta.label}
            aria-pressed={active}
            onClick={() => onChange(p)}
            className={[
              'flex items-center justify-center rounded-md transition',
              compact ? 'h-8 w-8' : 'h-9 w-9',
              active ? `bg-slate-800 ring-1 ${meta.ring}` : 'hover:bg-slate-800/60',
            ].join(' ')}
          >
            <FlagIcon className={`h-4 w-4 ${meta.color}`} />
          </button>
        )
      })}
    </div>
  )
}
