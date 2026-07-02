import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { NewTaskInput, Task } from '../types'
import type { TaskRepository } from '../data/repository'
import { LocalRepository } from '../data/localRepository'
import { SupabaseRepository } from '../data/supabaseRepository'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface TasksContextValue {
  tasks: Task[]
  loading: boolean
  error: string | null
  addTask(input: NewTaskInput): Promise<void>
  patchTask(id: string, patch: Partial<Task>): Promise<void>
  toggleComplete(id: string): Promise<void>
  deleteTask(id: string): Promise<void>
  clearCompleted(): Promise<void>
  reload(): Promise<void>
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selecciona el repositorio según el modo de autenticación.
  const repo = useMemo<TaskRepository | null>(() => {
    if (status === 'local') return new LocalRepository()
    if (status === 'authenticated' && user && supabase) {
      return new SupabaseRepository(supabase, user.id)
    }
    return null
  }, [status, user])

  const repoRef = useRef(repo)
  repoRef.current = repo

  const reload = useCallback(async () => {
    if (!repoRef.current) return
    setLoading(true)
    setError(null)
    try {
      const data = await repoRef.current.list()
      setTasks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar las tareas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!repo) {
      setTasks([])
      setLoading(status === 'loading')
      return
    }
    void reload()
  }, [repo, reload, status])

  const runMutation = useCallback(
    async (fn: (r: TaskRepository) => Promise<Task[] | void>) => {
      if (!repoRef.current) return
      setError(null)
      try {
        const result = await fn(repoRef.current)
        if (Array.isArray(result)) setTasks(result)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar')
        // Recargar para no dejar la UI en un estado inconsistente.
        void reload()
      }
    },
    [reload],
  )

  const addTask = useCallback(
    (input: NewTaskInput) =>
      runMutation(async (r) => {
        const created = await r.create(input)
        setTasks((prev) => [created, ...prev])
      }),
    [runMutation],
  )

  const patchTask = useCallback(
    (id: string, patch: Partial<Task>) =>
      runMutation(async (r) => {
        // Actualización optimista.
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
        await r.update(id, patch)
      }),
    [runMutation],
  )

  const toggleComplete = useCallback(
    (id: string) =>
      runMutation(async (r) => {
        const current = repoRef.current
        if (!current) return
        let next: Partial<Task> | null = null
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== id) return t
            const completed = !t.completed
            next = { completed, completedAt: completed ? new Date().toISOString() : null }
            return { ...t, ...next }
          }),
        )
        if (next) await r.update(id, next)
      }),
    [runMutation],
  )

  const deleteTask = useCallback(
    (id: string) =>
      runMutation(async (r) => {
        setTasks((prev) => prev.filter((t) => t.id !== id))
        await r.remove(id)
      }),
    [runMutation],
  )

  const clearCompleted = useCallback(
    () =>
      runMutation(async (r) => {
        setTasks((prev) => prev.filter((t) => !t.completed))
        await r.clearCompleted()
      }),
    [runMutation],
  )

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      loading,
      error,
      addTask,
      patchTask,
      toggleComplete,
      deleteTask,
      clearCompleted,
      reload,
    }),
    [tasks, loading, error, addTask, patchTask, toggleComplete, deleteTask, clearCompleted, reload],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks debe usarse dentro de <TasksProvider>')
  return ctx
}
