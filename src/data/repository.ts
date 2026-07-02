import type { NewTaskInput, Task } from '../types'

/**
 * Contrato común de acceso a datos. Dos implementaciones lo cumplen:
 *  - LocalRepository   (localStorage, un solo dispositivo)
 *  - SupabaseRepository (nube, sincroniza entre dispositivos)
 * El resto de la app no sabe cuál está usando.
 */
export interface TaskRepository {
  list(): Promise<Task[]>
  create(input: NewTaskInput): Promise<Task>
  update(id: string, patch: Partial<Task>): Promise<Task>
  remove(id: string): Promise<void>
  /** Borra todas las tareas completadas. Devuelve cuántas eliminó. */
  clearCompleted(): Promise<number>
}
