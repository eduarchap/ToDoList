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
import type { Board } from '../types'
import type { BoardRepository } from '../data/repository'
import { LocalBoardRepository } from '../data/localBoardRepository'
import { SupabaseBoardRepository } from '../data/supabaseBoardRepository'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface BoardsContextValue {
  boards: Board[]
  currentBoard: Board | null
  currentBoardId: string | null
  loading: boolean
  error: string | null
  selectBoard(id: string): void
  createBoard(name: string): Promise<Board | null>
  renameBoard(id: string, name: string): Promise<void>
  deleteBoard(id: string): Promise<void>
}

const BoardsContext = createContext<BoardsContextValue | null>(null)
const CURRENT_KEY = 'pizarra.current-board'

export function BoardsProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const repo = useMemo<BoardRepository | null>(() => {
    if (status === 'local') return new LocalBoardRepository()
    if (status === 'authenticated' && user && supabase) {
      return new SupabaseBoardRepository(supabase, user.id)
    }
    return null
  }, [status, user])

  const repoRef = useRef(repo)
  repoRef.current = repo

  const selectBoard = useCallback((id: string) => {
    setCurrentBoardId(id)
    try {
      localStorage.setItem(CURRENT_KEY, id)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!repo) {
      setBoards([])
      setCurrentBoardId(null)
      setLoading(status === 'loading')
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        let list = await repo.listBoards()
        // Nuevo usuario sin tableros → crea uno por defecto.
        if (list.length === 0) {
          const def = await repo.createBoard('Mi pizarra')
          list = [def]
        }
        if (!active) return
        setBoards(list)
        const stored = localStorage.getItem(CURRENT_KEY)
        const initial = list.find((b) => b.id === stored)?.id ?? list[0].id
        setCurrentBoardId(initial)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Error al cargar los tableros')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [repo, status])

  const createBoard = useCallback(
    async (name: string): Promise<Board | null> => {
      if (!repoRef.current) return null
      setError(null)
      try {
        const board = await repoRef.current.createBoard(name)
        setBoards((prev) => [...prev, board])
        selectBoard(board.id)
        return board
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo crear el tablero')
        return null
      }
    },
    [selectBoard],
  )

  const renameBoard = useCallback(async (id: string, name: string) => {
    if (!repoRef.current) return
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, name } : b)))
    try {
      await repoRef.current.renameBoard(id, name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo renombrar')
    }
  }, [])

  const deleteBoard = useCallback(
    async (id: string) => {
      if (!repoRef.current) return
      const remaining = boards.filter((b) => b.id !== id)
      try {
        await repoRef.current.deleteBoard(id)
        // Garantiza que siempre quede al menos un tablero.
        if (remaining.length === 0) {
          const def = await repoRef.current.createBoard('Mi pizarra')
          setBoards([def])
          selectBoard(def.id)
          return
        }
        setBoards(remaining)
        if (currentBoardId === id) selectBoard(remaining[0].id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo eliminar el tablero')
      }
    },
    [boards, currentBoardId, selectBoard],
  )

  const currentBoard = useMemo(
    () => boards.find((b) => b.id === currentBoardId) ?? null,
    [boards, currentBoardId],
  )

  const value = useMemo<BoardsContextValue>(
    () => ({
      boards,
      currentBoard,
      currentBoardId,
      loading,
      error,
      selectBoard,
      createBoard,
      renameBoard,
      deleteBoard,
    }),
    [boards, currentBoard, currentBoardId, loading, error, selectBoard, createBoard, renameBoard, deleteBoard],
  )

  return <BoardsContext.Provider value={value}>{children}</BoardsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBoards(): BoardsContextValue {
  const ctx = useContext(BoardsContext)
  if (!ctx) throw new Error('useBoards debe usarse dentro de <BoardsProvider>')
  return ctx
}
