import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { NewNoteInput, Note } from '../types'
import type { NoteRepository } from '../data/repository'
import { LocalRepository } from '../data/localRepository'
import { SupabaseRepository } from '../data/supabaseRepository'
import { supabase } from '../lib/supabase'
import { errMessage } from '../lib/errors'
import { useAuth } from './AuthContext'
import { useBoards } from './BoardsContext'

/** Datos de una nota nueva, sin el tablero (lo inyecta el contexto). */
type AddNoteInput = Omit<NewNoteInput, 'boardId'>

interface NotesContextValue {
  notes: Note[]
  loading: boolean
  error: string | null
  maxZ: number
  addNote(input: AddNoteInput): Promise<Note | null>
  patchNote(id: string, patch: Partial<Note>): Promise<void>
  trashNote(id: string): Promise<void>
  restoreNote(id: string): Promise<void>
  deleteNote(id: string): Promise<void>
  emptyTrash(): Promise<void>
  reload(): Promise<void>
}

const NotesContext = createContext<NotesContextValue | null>(null)

export function NotesProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const { currentBoardId } = useBoards()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const repo = useMemo<NoteRepository | null>(() => {
    if (status === 'local') return new LocalRepository()
    if (status === 'authenticated' && user && supabase) {
      return new SupabaseRepository(supabase)
    }
    return null
  }, [status, user])

  const repoRef = useRef(repo)
  repoRef.current = repo
  const boardIdRef = useRef(currentBoardId)
  boardIdRef.current = currentBoardId

  const reload = useCallback(async () => {
    if (!repoRef.current || !boardIdRef.current) return
    setLoading(true)
    setError(null)
    try {
      setNotes(await repoRef.current.list(boardIdRef.current))
    } catch (e) {
      setError(errMessage(e, 'Error al cargar las notas'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!repo || !currentBoardId) {
      setNotes([])
      setLoading(status === 'loading' || (!!repo && !currentBoardId))
      return
    }
    void reload()
  }, [repo, currentBoardId, reload, status])

  const maxZ = useMemo(() => notes.reduce((m, n) => Math.max(m, n.z), 0), [notes])

  const addNote = useCallback(async (input: AddNoteInput): Promise<Note | null> => {
    if (!repoRef.current || !boardIdRef.current) return null
    setError(null)
    try {
      const created = await repoRef.current.create({ ...input, boardId: boardIdRef.current })
      setNotes((prev) => [...prev, created])
      return created
    } catch (e) {
      setError(errMessage(e, 'No se pudo crear la nota'))
      return null
    }
  }, [])

  const patchNote = useCallback(async (id: string, patch: Partial<Note>) => {
    if (!repoRef.current) return
    // Actualización optimista.
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))
    try {
      await repoRef.current.update(id, patch)
    } catch (e) {
      // NO recargamos: así un fallo de guardado no borra lo que el usuario escribió.
      // El cambio queda en pantalla y se muestra el error para reintentar.
      setError(errMessage(e, 'No se pudo guardar el cambio'))
    }
  }, [])

  const trashNote = useCallback(
    (id: string) => patchNote(id, { trashed: true, trashedAt: new Date().toISOString() }),
    [patchNote],
  )

  const restoreNote = useCallback(
    (id: string) => patchNote(id, { trashed: false, trashedAt: null }),
    [patchNote],
  )

  const deleteNote = useCallback(async (id: string) => {
    if (!repoRef.current) return
    setNotes((prev) => prev.filter((n) => n.id !== id))
    try {
      await repoRef.current.remove(id)
    } catch (e) {
      setError(errMessage(e, 'No se pudo eliminar'))
      void reload()
    }
  }, [reload])

  const emptyTrash = useCallback(async () => {
    if (!repoRef.current || !boardIdRef.current) return
    setNotes((prev) => prev.filter((n) => !n.trashed))
    try {
      await repoRef.current.emptyTrash(boardIdRef.current)
    } catch (e) {
      setError(errMessage(e, 'No se pudo vaciar la papelera'))
      void reload()
    }
  }, [reload])

  const value = useMemo<NotesContextValue>(
    () => ({
      notes,
      loading,
      error,
      maxZ,
      addNote,
      patchNote,
      trashNote,
      restoreNote,
      deleteNote,
      emptyTrash,
      reload,
    }),
    [notes, loading, error, maxZ, addNote, patchNote, trashNote, restoreNote, deleteNote, emptyTrash, reload],
  )

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotes debe usarse dentro de <NotesProvider>')
  return ctx
}
