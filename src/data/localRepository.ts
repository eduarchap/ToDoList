import type { NewTaskInput, Task } from '../types'
import type { TaskRepository } from './repository'
import { uid } from '../lib/id'

const STORAGE_KEY = 'tareas.tasks.v1'

function nowISO(): string {
  return new Date().toISOString()
}

function load(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Task[]) : []
  } catch {
    return []
  }
}

function save(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

/** Persistencia en el navegador (sin cuenta, un solo dispositivo). */
export class LocalRepository implements TaskRepository {
  async list(): Promise<Task[]> {
    return load()
  }

  async create(input: NewTaskInput): Promise<Task> {
    const tasks = load()
    const ts = nowISO()
    const task: Task = {
      id: uid(),
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      dueDate: input.dueDate ?? null,
      priority: input.priority ?? 4,
      completed: false,
      completedAt: null,
      createdAt: ts,
      updatedAt: ts,
      sortOrder: tasks.length,
    }
    save([task, ...tasks])
    return task
  }

  async update(id: string, patch: Partial<Task>): Promise<Task> {
    const tasks = load()
    const idx = tasks.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error('Tarea no encontrada')
    const updated: Task = { ...tasks[idx], ...patch, id, updatedAt: nowISO() }
    tasks[idx] = updated
    save(tasks)
    return updated
  }

  async remove(id: string): Promise<void> {
    save(load().filter((t) => t.id !== id))
  }

  async clearCompleted(): Promise<number> {
    const tasks = load()
    const remaining = tasks.filter((t) => !t.completed)
    save(remaining)
    return tasks.length - remaining.length
  }
}
