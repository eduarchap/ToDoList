import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/** true si hay credenciales de Supabase configuradas (modo nube disponible). */
export const isCloudConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

// Diagnóstico temporal: ejecuta debugAuth() en la consola del navegador.
if (supabase && typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).sb = supabase
  ;(window as unknown as Record<string, unknown>).debugAuth = async () => {
    const { data } = await supabase!.auth.getSession()
    const s = data.session
    let sub: string | null = null
    try {
      sub = s ? (JSON.parse(atob(s.access_token.split('.')[1])).sub as string) : null
    } catch {
      /* ignore */
    }
    const now = Math.floor(Date.now() / 1000)
    const info = {
      hasToken: !!s?.access_token,
      subJWT: sub,
      userId: s?.user?.id ?? null,
      expiresAt: s?.expires_at ?? null,
      now,
      expired: s?.expires_at ? s.expires_at < now : null,
    }
    console.log('[debugAuth]', info)
    return info
  }
}
