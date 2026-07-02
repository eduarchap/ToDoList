import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewTaskInput, Priority, Task } from '../types'
import type { TaskRepository } from './repository'

/** Fila tal como se guarda en la tabla `tasks` de Supabase (snake_case). */
interface TaskRow {
  id: string
  user_id: string
  title: string
  notes: string | null
  due_date: string | null
  priority: number
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
  sort_order: number
}

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    notes: r.notes,
    dueDate: r.due_date,
    priority: (r.priority as Priority) ?? 4,
    completed: r.completed,
    completedAt: r.completed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    sortOrder: r.sort_order ?? 0,
  }
}

/** Traduce un patch de Task (camelCase) a columnas de BD (snake_case). */
function patchToRow(patch: Partial<Task>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if ('title' in patch) row.title = patch.title
  if ('notes' in patch) row.notes = patch.notes
  if ('dueDate' in patch) row.due_date = patch.dueDate
  if ('priority' in patch) row.priority = patch.priority
  if ('completed' in patch) row.completed = patch.completed
  if ('completedAt' in patch) row.completed_at = patch.completedAt
  if ('sortOrder' in patch) row.sort_order = patch.sortOrder
  row.updated_at = new Date().toISOString()
  return row
}

/** Persistencia en la nube con Supabase (sincroniza entre dispositivos). */
export class SupabaseRepository implements TaskRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async list(): Promise<Task[]> {
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as TaskRow[]).map(rowToTask)
  }

  async create(input: NewTaskInput): Promise<Task> {
    const { data, error } = await this.client
      .from('tasks')
      .insert({
        user_id: this.userId,
        title: input.title.trim(),
        notes: input.notes?.trim() || null,
        due_date: input.dueDate ?? null,
        priority: input.priority ?? 4,
        completed: false,
      })
      .select()
      .single()
    if (error) throw error
    return rowToTask(data as TaskRow)
  }

  async update(id: string, patch: Partial<Task>): Promise<Task> {
    const { data, error } = await this.client
      .from('tasks')
      .update(patchToRow(patch))
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single()
    if (error) throw error
    return rowToTask(data as TaskRow)
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId)
    if (error) throw error
  }

  async clearCompleted(): Promise<number> {
    const { data, error } = await this.client
      .from('tasks')
      .delete()
      .eq('user_id', this.userId)
      .eq('completed', true)
      .select('id')
    if (error) throw error
    return (data as { id: string }[]).length
  }
}
