export type NoteColor =
  | 'yellow'
  | 'green'
  | 'blue'
  | 'pink'
  | 'orange'
  | 'purple'
  | 'gray'

export interface Note {
  id: string
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
  text?: string
  color?: NoteColor
  x: number
  y: number
  z?: number
  w?: number
  h?: number
  dueDate?: string | null
}
