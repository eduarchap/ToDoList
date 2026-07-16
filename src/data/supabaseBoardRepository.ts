import type { SupabaseClient } from '@supabase/supabase-js'
import type { Board, BoardRole } from '../types'
import type { BoardRepository } from './repository'

interface BoardRow {
  id: string
  owner_id: string
  name: string
  created_at: string
  /** Rol del usuario actual (lo aporta la vista/consulta en fase de compartición). */
  role?: string | null
}

export class SupabaseBoardRepository implements BoardRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  private toBoard = (r: BoardRow): Board => ({
    id: r.id,
    name: r.name,
    ownerId: r.owner_id,
    role: (r.role as BoardRole) ?? (r.owner_id === this.userId ? 'owner' : 'editor'),
    createdAt: r.created_at,
  })

  async listBoards(): Promise<Board[]> {
    // RLS devuelve solo los tableros accesibles (propios; y compartidos en fase 2).
    const { data, error } = await this.client
      .from('boards')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data as BoardRow[]).map(this.toBoard)
  }

  async createBoard(name: string): Promise<Board> {
    const { data, error } = await this.client
      .from('boards')
      .insert({ owner_id: this.userId, name: name.trim() || 'Pizarra' })
      .select()
      .single()
    if (error) throw error
    return this.toBoard(data as BoardRow)
  }

  async renameBoard(id: string, name: string): Promise<Board> {
    const { data, error } = await this.client
      .from('boards')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return this.toBoard(data as BoardRow)
  }

  async deleteBoard(id: string): Promise<void> {
    const { error } = await this.client.from('boards').delete().eq('id', id)
    if (error) throw error
  }
}
