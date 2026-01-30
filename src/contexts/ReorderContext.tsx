'use client'

import { createContext, useCallback, useContext, useRef } from 'react'

export type ReorderHandler = (fromIndex: number, toIndex: number) => void
export type AddTaskAtHandler = (taskId: string, index: number) => Promise<void>
export type RemoveTaskHandler = (taskId: string) => Promise<void>

export interface DroppableHandler {
  folderId: string | null
  reorder: ReorderHandler
  addTaskAt: AddTaskAtHandler
  removeTask: RemoveTaskHandler
}

interface ReorderHandlersContextType {
  register: (droppableId: string, handler: DroppableHandler) => void
  unregister: (droppableId: string) => void
  getHandler: (droppableId: string) => DroppableHandler | undefined
}

const ReorderHandlersContext = createContext<ReorderHandlersContextType | null>(null)

export function ReorderHandlersProvider({ children }: { children: React.ReactNode }) {
  const handlersRef = useRef<Map<string, DroppableHandler>>(new Map())

  const register = useCallback((droppableId: string, handler: DroppableHandler) => {
    handlersRef.current.set(droppableId, handler)
  }, [])

  const unregister = useCallback((droppableId: string) => {
    handlersRef.current.delete(droppableId)
  }, [])

  const getHandler = useCallback((droppableId: string) => {
    return handlersRef.current.get(droppableId)
  }, [])

  return (
    <ReorderHandlersContext.Provider value={{ register, unregister, getHandler }}>
      {children}
    </ReorderHandlersContext.Provider>
  )
}

export function useReorderHandlers() {
  const ctx = useContext(ReorderHandlersContext)
  if (!ctx) return null
  return ctx
}
