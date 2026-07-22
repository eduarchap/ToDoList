import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewNoteInput, Note, NoteColor } from '../types'
import type { NoteRepository } from './repository'
import { DEFAULT_COLOR } from '../lib/colors'
import { NOTE_W } from '../lib/board'

/** Fila tal como se guarda en la tabla `notes` de Supabase (snake_case). */
interface NoteRow {
  id: string
  user_id: string
  board_id: string
  title: string
  text: string
  html: string | null
  color: string
  x: number
  y: number
  z: number
  w: number
  h: number
  due_date: string | null
  trashed: boolean
  trashed_at: string | null
  created_at: string
  updated_at: string
}

function rowToNote(r: NoteRow): Note {
  return {
    id: r.id,
    boardId: r.board_id,
    title: r.title ?? '',
    text: r.text ?? '',
    html: r.html ?? null,
    color: (r.color as NoteColor) ?? DEFAULT_COLOR,
    x: Number(r.x) || 0,
    y: Number(r.y) || 0,
    z: r.z ?? 0,
    w: Number(r.w) || NOTE_W,
    h: Number(r.h) || 0,
    dueDate: r.due_date,
    trashed: r.trashed,
    trashedAt: r.trashed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

/** Traduce un patch de Note (camelCase) a columnas de BD (snake_case). */
function patchToRow(patch: Partial<Note>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if ('title' in patch) row.title = patch.title
  if ('text' in patch) row.text = patch.text
  if ('html' in patch) row.html = patch.html
  if ('color' in patch) row.color = patch.color
  if ('x' in patch) row.x = patch.x
  if ('y' in patch) row.y = patch.y
  if ('z' in patch) row.z = patch.z
  if ('w' in patch) row.w = patch.w
  if ('h' in patch) row.h = patch.h
  if ('dueDate' in patch) row.due_date = patch.dueDate
  if ('trashed' in patch) row.trashed = patch.trashed
  if ('trashedAt' in patch) row.trashed_at = patch.trashedAt
  row.updated_at = new Date().toISOString()
  return row
}

/** Persistencia en la nube con Supabase (sincroniza entre dispositivos). */
export class SupabaseRepository implements NoteRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(boardId: string): Promise<Note[]> {
    // El acceso lo garantiza RLS; filtramos por el tablero pedido.
    const { data, error } = await this.client
      .from('notes')
      .select('*')
      .eq('board_id', boardId)
      .order('z', { ascending: true })
    if (error) throw error
    return (data as NoteRow[]).map(rowToNote)
  }

  async create(input: NewNoteInput): Promise<Note> {
    const { data, error } = await this.client
      .from('notes')
      .insert({
        // user_id lo pone la BD con default auth.uid() (ver owner-defaults.sql).
        board_id: input.boardId,
        title: input.title ?? '',
        text: input.text ?? '',
        color: input.color ?? DEFAULT_COLOR,
        x: input.x,
        y: input.y,
        z: input.z ?? 0,
        due_date: input.dueDate ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return rowToNote(data as NoteRow)
  }

  async update(id: string, patch: Partial<Note>): Promise<Note> {
    // RLS decide si el usuario puede editar esta nota (propietario/editor del tablero).
    const { data, error } = await this.client
      .from('notes')
      .update(patchToRow(patch))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return rowToNote(data as NoteRow)
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('notes').delete().eq('id', id)
    if (error) throw error
  }

  async emptyTrash(boardId: string): Promise<number> {
    const { data, error } = await this.client
      .from('notes')
      .delete()
      .eq('board_id', boardId)
      .eq('trashed', true)
      .select('id')
    if (error) throw error
    return (data as { id: string }[]).length
  }
}
