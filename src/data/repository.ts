import type { NewNoteInput, Note } from '../types'

/**
 * Contrato común de acceso a datos. Dos implementaciones lo cumplen:
 *  - LocalRepository    (localStorage, un solo dispositivo)
 *  - SupabaseRepository (nube, sincroniza entre dispositivos)
 * El resto de la app no sabe cuál está usando.
 */
export interface NoteRepository {
  list(): Promise<Note[]>
  create(input: NewNoteInput): Promise<Note>
  update(id: string, patch: Partial<Note>): Promise<Note>
  remove(id: string): Promise<void>
  /** Borra definitivamente todas las notas de la papelera. Devuelve cuántas eliminó. */
  emptyTrash(): Promise<number>
}
