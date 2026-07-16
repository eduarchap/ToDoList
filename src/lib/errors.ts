/**
 * Extrae un mensaje legible de cualquier error, incluidos los de Supabase
 * (PostgrestError), que NO son instancias de Error y por eso `e.message`
 * directo no los captura bien.
 */
export function errMessage(e: unknown, fallback = 'Error'): string {
  if (typeof e === 'string') return e
  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>
    const parts = [o.message, o.details, o.hint, o.code]
      .filter((p) => p != null && p !== '')
      .map(String)
    if (parts.length) return parts.join(' · ')
  }
  return e instanceof Error ? e.message : fallback
}
