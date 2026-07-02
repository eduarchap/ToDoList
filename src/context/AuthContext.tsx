import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isCloudConfigured, supabase } from '../lib/supabase'

type AuthStatus = 'loading' | 'local' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  cloudAvailable: boolean
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>
  signOut(): Promise<void>
  /** Continuar en modo local aunque la nube esté configurada. */
  useLocalMode(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const LOCAL_PREF_KEY = 'tareas.prefer-local'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Sin credenciales de nube → modo local directo.
    if (!isCloudConfigured || !supabase) {
      setStatus('local')
      return
    }
    // El usuario eligió expresamente modo local anteriormente.
    if (localStorage.getItem(LOCAL_PREF_KEY) === '1') {
      setStatus('local')
      return
    }

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      applySession(data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    function applySession(session: Session | null) {
      setUser(session?.user ?? null)
      setStatus(session?.user ? 'authenticated' : 'unauthenticated')
    }

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('La nube no está configurada')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    localStorage.removeItem(LOCAL_PREF_KEY)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('La nube no está configurada')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    localStorage.removeItem(LOCAL_PREF_KEY)
    // Si no hay sesión inmediata, requiere confirmar por email.
    return { needsConfirmation: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const useLocalMode = useCallback(() => {
    localStorage.setItem(LOCAL_PREF_KEY, '1')
    setStatus('local')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      cloudAvailable: isCloudConfigured,
      signIn,
      signUp,
      signOut,
      useLocalMode,
    }),
    [status, user, signIn, signUp, signOut, useLocalMode],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
