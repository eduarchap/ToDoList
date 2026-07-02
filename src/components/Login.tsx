import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { CloudIcon, DeviceIcon } from './icons'

/** Pantalla de acceso cuando la nube está configurada. */
export function Login() {
  const { signIn, signUp, useLocalMode } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password)
      } else {
        const { needsConfirmation } = await signUp(email.trim(), password)
        if (needsConfirmation) {
          setInfo('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.')
          setMode('signin')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <CloudIcon className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Tareas</h1>
          <p className="mt-1 text-sm text-slate-400">
            {mode === 'signin' ? 'Inicia sesión para sincronizar tus tareas' : 'Crea tu cuenta gratuita'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg bg-slate-800/60 px-3 py-2.5 text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="w-full rounded-lg bg-slate-800/60 px-3 py-2.5 text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          {info && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-brand-500 disabled:opacity-50"
          >
            {busy ? 'Un momento…' : mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setInfo(null)
            }}
            className="w-full text-center text-sm text-slate-400 transition hover:text-slate-200"
          >
            {mode === 'signin' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </form>

        <button
          onClick={useLocalMode}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-200"
        >
          <DeviceIcon className="h-4 w-4" />
          Usar sin cuenta (solo este dispositivo)
        </button>
      </div>
    </div>
  )
}
