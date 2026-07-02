import { useState } from 'react'
import type { TaskView } from './types'
import { useAuth } from './context/AuthContext'
import { TasksProvider, useTasks } from './context/TasksContext'
import { todayISO } from './lib/date'
import { Sidebar } from './components/Sidebar'
import { MobileNav } from './components/MobileNav'
import { Header } from './components/Header'
import { QuickAdd } from './components/QuickAdd'
import { TaskList } from './components/TaskList'
import { Login } from './components/Login'

function Shell() {
  const [view, setView] = useState<TaskView>('today')
  const { tasks, error } = useTasks()

  return (
    <div className="flex h-full">
      <Sidebar view={view} onChange={setView} tasks={tasks} />

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-24 pt-4 md:px-8 md:pb-8">
          <div className="mx-auto w-full max-w-2xl">
            <Header view={view} />

            {view !== 'completed' && (
              <div className="mb-5">
                <QuickAdd defaultDue={view === 'today' ? todayISO() : null} />
              </div>
            )}

            {error && (
              <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <TaskList view={view} />
          </div>
        </div>
      </main>

      <MobileNav view={view} onChange={setView} tasks={tasks} />
    </div>
  )
}

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
    <TasksProvider>
      <Shell />
    </TasksProvider>
  )
}
