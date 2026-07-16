import type { SupabaseClient } from '@supabase/supabase-js'
import type { Board, BoardMember, BoardRole } from '../types'
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
    // RLS devuelve los tableros accesibles (propios + compartidos conmigo).
    const { data, error } = await this.client
      .from('boards')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error

    // Roles de los tableros compartidos (los propios son 'owner').
    const { data: mem } = await this.client
      .from('board_members')
      .select('board_id, role')
      .eq('user_id', this.userId)
    const roleByBoard = new Map<string, BoardRole>()
    for (const m of (mem ?? []) as { board_id: string; role: BoardRole }[]) {
      roleByBoard.set(m.board_id, m.role)
    }

    return (data as BoardRow[]).map((r) => ({
      id: r.id,
      name: r.name,
      ownerId: r.owner_id,
      role: r.owner_id === this.userId ? 'owner' : (roleByBoard.get(r.id) ?? 'viewer'),
      createdAt: r.created_at,
    }))
  }

  async acceptInvites(): Promise<void> {
    const { error } = await this.client.rpc('accept_invites')
    if (error) throw error
  }

  async listMembers(boardId: string): Promise<BoardMember[]> {
    const [{ data: members, error: e1 }, { data: invites, error: e2 }] = await Promise.all([
      this.client.from('board_members').select('user_id, email, role').eq('board_id', boardId),
      this.client.from('board_invites').select('email, role').eq('board_id', boardId),
    ])
    if (e1) throw e1
    if (e2) throw e2
    const accepted: BoardMember[] = (members ?? []).map(
      (m: { user_id: string; email: string; role: 'editor' | 'viewer' }) => ({
        userId: m.user_id,
        email: m.email,
        role: m.role,
        pending: false,
      }),
    )
    const acceptedEmails = new Set(accepted.map((m) => m.email.toLowerCase()))
    const pending: BoardMember[] = (invites ?? [])
      .filter((i: { email: string }) => !acceptedEmails.has(i.email.toLowerCase()))
      .map((i: { email: string; role: 'editor' | 'viewer' }) => ({
        userId: null,
        email: i.email,
        role: i.role,
        pending: true,
      }))
    return [...accepted, ...pending]
  }

  async invite(boardId: string, email: string, role: 'editor' | 'viewer'): Promise<void> {
    const normalized = email.trim().toLowerCase()
    // Crea/actualiza la invitación pendiente.
    const { error } = await this.client
      .from('board_invites')
      .upsert({ board_id: boardId, email: normalized, role }, { onConflict: 'board_id,email' })
    if (error) throw error
    // Si esa persona ya era miembro, actualiza su rol también.
    await this.client
      .from('board_members')
      .update({ role })
      .eq('board_id', boardId)
      .eq('email', normalized)
  }

  async removeMember(boardId: string, key: { userId?: string; email?: string }): Promise<void> {
    if (key.userId) {
      const { error } = await this.client
        .from('board_members')
        .delete()
        .eq('board_id', boardId)
        .eq('user_id', key.userId)
      if (error) throw error
    }
    if (key.email) {
      const email = key.email.trim().toLowerCase()
      await this.client.from('board_invites').delete().eq('board_id', boardId).eq('email', email)
      await this.client.from('board_members').delete().eq('board_id', boardId).eq('email', email)
    }
  }

  async createBoard(name: string): Promise<Board> {
    // owner_id lo pone la BD con default auth.uid() (ver owner-defaults.sql),
    // así coincide siempre con auth.uid() y RLS no puede rechazarlo.
    const { data, error } = await this.client
      .from('boards')
      .insert({ name: name.trim() || 'Pizarra' })
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
