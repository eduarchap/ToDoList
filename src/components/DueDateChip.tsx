import { formatDueLabel, isDueToday, isOverdue } from '../lib/date'
import { CalendarIcon } from './icons'

interface Props {
  dueDate: string
  className?: string
}

/** Chip compacto con la fecha de vencimiento, coloreado según urgencia. */
export function DueDateChip({ dueDate, className }: Props) {
  const overdue = isOverdue(dueDate)
  const today = isDueToday(dueDate)
  const color = overdue
    ? 'text-red-400'
    : today
      ? 'text-emerald-400'
      : 'text-slate-400'

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color} ${className ?? ''}`}>
      <CalendarIcon className="h-3.5 w-3.5" />
      {formatDueLabel(dueDate)}
    </span>
  )
}
