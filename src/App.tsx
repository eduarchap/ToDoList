import { useAuth } from './context/AuthContext'
import { NotesProvider } from './context/NotesContext'
import { Board } from './components/Board'
import { Login } from './components/Login'

export default function App() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Login />
  }

  return (
    <NotesProvider>
      <Board />
    </NotesProvider>
  )
}
