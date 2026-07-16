import type { NewNoteInput, Note } from '../types'
import type { NoteRepository } from './repository'
import { uid } from '../lib/id'
import { DEFAULT_COLOR } from '../lib/colors'

const STORAGE_KEY = 'pizarra.notes.v1'

function nowISO(): string {
  return new Date().toISOString()
}

function load(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Note[]) : []
  } catch {
    return []
  }
}

function save(notes: Note[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

/** Persistencia en el navegador (sin cuenta, un solo dispositivo). */
export class LocalRepository implements NoteRepository {
  async list(): Promise<Note[]> {
    return load()
  }

  async create(input: NewNoteInput): Promise<Note> {
    const notes = load()
    const ts = nowISO()
    const note: Note = {
      id: uid(),
      text: input.text ?? '',
      color: input.color ?? DEFAULT_COLOR,
      x: input.x,
      y: input.y,
      z: input.z ?? notes.length + 1,
      dueDate: input.dueDate ?? null,
      trashed: false,
      trashedAt: null,
      createdAt: ts,
      updatedAt: ts,
    }
    save([...notes, note])
    return note
  }

  async update(id: string, patch: Partial<Note>): Promise<Note> {
    const notes = load()
    const idx = notes.findIndex((n) => n.id === id)
    if (idx === -1) throw new Error('Nota no encontrada')
    const updated: Note = { ...notes[idx], ...patch, id, updatedAt: nowISO() }
    notes[idx] = updated
    save(notes)
    return updated
  }

  async remove(id: string): Promise<void> {
    save(load().filter((n) => n.id !== id))
  }

  async emptyTrash(): Promise<number> {
    const notes = load()
    const remaining = notes.filter((n) => !n.trashed)
    save(remaining)
    return notes.length - remaining.length
  }
}
