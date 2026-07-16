import type { Board } from '../types'
import type { BoardRepository } from './repository'
import { uid } from '../lib/id'

const STORAGE_KEY = 'pizarra.boards.v1'

function load(): Board[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Board[]) : []
  } catch {
    return []
  }
}

function save(boards: Board[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards))
}

/** Tableros en el navegador (sin cuenta). El "propietario" es local. */
export class LocalBoardRepository implements BoardRepository {
  async listBoards(): Promise<Board[]> {
    const boards = load()
    if (boards.length === 0) {
      // Garantiza al menos un tablero por defecto.
      const def: Board = {
        id: uid(),
        name: 'Mi pizarra',
        ownerId: 'local',
        role: 'owner',
        createdAt: new Date().toISOString(),
      }
      save([def])
      return [def]
    }
    return boards
  }

  async createBoard(name: string): Promise<Board> {
    const boards = load()
    const board: Board = {
      id: uid(),
      name: name.trim() || 'Pizarra',
      ownerId: 'local',
      role: 'owner',
      createdAt: new Date().toISOString(),
    }
    save([...boards, board])
    return board
  }

  async renameBoard(id: string, name: string): Promise<Board> {
    const boards = load()
    const idx = boards.findIndex((b) => b.id === id)
    if (idx === -1) throw new Error('Tablero no encontrado')
    boards[idx] = { ...boards[idx], name: name.trim() || boards[idx].name }
    save(boards)
    return boards[idx]
  }

  async deleteBoard(id: string): Promise<void> {
    save(load().filter((b) => b.id !== id))
    // Borra también las notas de ese tablero.
    try {
      const raw = localStorage.getItem('pizarra.notes.v1')
      if (raw) {
        const notes = JSON.parse(raw)
        if (Array.isArray(notes)) {
          localStorage.setItem(
            'pizarra.notes.v1',
            JSON.stringify(notes.filter((n: { boardId?: string }) => n.boardId !== id)),
          )
        }
      }
    } catch {
      /* ignore */
    }
  }
}
