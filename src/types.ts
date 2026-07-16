export type NoteColor =
  | 'yellow'
  | 'green'
  | 'blue'
  | 'pink'
  | 'orange'
  | 'purple'
  | 'gray'

/** Rol del usuario sobre un tablero. */
export type BoardRole = 'owner' | 'editor' | 'viewer'

export interface Board {
  id: string
  name: string
  ownerId: string
  /** Rol del usuario actual sobre este tablero. */
  role: BoardRole
  createdAt: string
}

/** Persona con acceso a un tablero (aceptada) o invitación pendiente. */
export interface BoardMember {
  /** id de usuario si ya aceptó; null si es invitación pendiente. */
  userId: string | null
  email: string
  role: 'editor' | 'viewer'
  pending: boolean
}

export interface Note {
  id: string
  /** Tablero al que pertenece la nota. */
  boardId: string
  /** Título opcional que se muestra en la cabecera. */
  title: string
  text: string
  color: NoteColor
  /** Posición en el lienzo (coordenadas de la pizarra, en px). */
  x: number
  y: number
  /** Orden de apilado: mayor = más al frente. */
  z: number
  /** Anchura de la nota en px (coordenadas del lienzo). */
  w: number
  /** Altura de la nota en px; 0 = automática (se ajusta al texto). */
  h: number
  /** Fecha opcional en formato ISO (YYYY-MM-DD) o null. */
  dueDate: string | null
  /** true si está en la papelera. */
  trashed: boolean
  trashedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NewNoteInput {
  boardId: string
  title?: string
  text?: string
  color?: NoteColor
  x: number
  y: number
  z?: number
  w?: number
  h?: number
  dueDate?: string | null
}
