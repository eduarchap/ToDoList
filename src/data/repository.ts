import type { Board, BoardMember, NewNoteInput, Note } from '../types'

/**
 * Acceso a datos de NOTAS (dentro de un tablero). Dos implementaciones:
 *  - LocalRepository    (localStorage, un solo dispositivo)
 *  - SupabaseRepository (nube, sincroniza entre dispositivos)
 */
export interface NoteRepository {
  list(boardId: string): Promise<Note[]>
  create(input: NewNoteInput): Promise<Note>
  update(id: string, patch: Partial<Note>): Promise<Note>
  remove(id: string): Promise<void>
  /** Borra definitivamente las notas de la papelera de un tablero. Devuelve cuántas eliminó. */
  emptyTrash(boardId: string): Promise<number>
}

/** Acceso a datos de TABLEROS. */
export interface BoardRepository {
  listBoards(): Promise<Board[]>
  createBoard(name: string): Promise<Board>
  renameBoard(id: string, name: string): Promise<Board>
  deleteBoard(id: string): Promise<void>

  // --- Compartir (solo modo nube) ---
  /** Convierte invitaciones pendientes (por email) en membresías. Solo nube. */
  acceptInvites(): Promise<void>
  /** Miembros aceptados + invitaciones pendientes de un tablero. */
  listMembers(boardId: string): Promise<BoardMember[]>
  /** Invita a un email con un rol. */
  invite(boardId: string, email: string, role: 'editor' | 'viewer'): Promise<void>
  /** Revoca acceso: por userId (miembro) o por email (invitación pendiente). */
  removeMember(boardId: string, key: { userId?: string; email?: string }): Promise<void>
}
