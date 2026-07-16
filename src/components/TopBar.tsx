import { useAuth } from '../context/AuthContext'
import { CloudIcon, DeviceIcon, LogOutIcon, TrashIcon } from './icons'

interface Props {
  trashCount: number
  onOpenTrash: () => void
}

export function TopBar({ trashCount, onOpenTrash }: Props) {
  const { status, user, signOut } = useAuth()
  const cloud = status === 'authenticated'

  return (
    <header className="z-40 flex items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M8 8h5M8 12h8M8 16h6" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-100">Pizarra</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={onOpenTrash}
          className="relative flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          title="Papelera"
        >
          <TrashIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Papelera</span>
          {trashCount > 0 && (
            <span className="min-w-4 rounded-full bg-slate-700 px-1 text-[10px] font-semibold leading-4 text-slate-200">
              {trashCount}
            </span>
          )}
        </button>

        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400"
          title={cloud ? (user?.email ?? 'Sincronizado en la nube') : 'Solo en este dispositivo'}
        >
          {cloud ? <CloudIcon className="h-5 w-5" /> : <DeviceIcon className="h-5 w-5" />}
        </span>

        {cloud && (
          <button
            onClick={signOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOutIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  )
}
