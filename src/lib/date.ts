import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  parseISO,
  differenceInCalendarDays,
  startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'

/** Devuelve la fecha de hoy en formato ISO YYYY-MM-DD (hora local). */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Convierte "YYYY-MM-DD" a un Date en hora local (evita el desfase UTC de parseISO). */
export function parseDueDate(iso: string): Date {
  return startOfDay(parseISO(iso))
}

/** Días naturales desde hoy hasta la fecha (negativo = pasado, 0 = hoy). */
export function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseDueDate(iso), startOfDay(new Date()))
}

export function isOverdue(iso: string | null): boolean {
  if (!iso) return false
  const d = parseDueDate(iso)
  return isPast(d) && !isToday(d)
}

export function isDueToday(iso: string | null): boolean {
  return !!iso && isToday(parseDueDate(iso))
}

/** Etiqueta legible y compacta para chips ("Hoy", "Mañana", "Ayer", "15 mar"). */
export function formatDueLabel(iso: string): string {
  const d = parseDueDate(iso)
  if (isToday(d)) return 'Hoy'
  if (isTomorrow(d)) return 'Mañana'
  if (isYesterday(d)) return 'Ayer'
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return format(d, sameYear ? "d 'de' MMM" : "d MMM yyyy", { locale: es })
}

/** Encabezado de sección de fecha. */
export function formatSectionLabel(iso: string): string {
  const d = parseDueDate(iso)
  return format(d, "EEEE d 'de' MMMM", { locale: es })
}
