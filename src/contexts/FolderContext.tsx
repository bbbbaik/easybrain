'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { Task } from '@/lib/supabase/tasks'

function folderKey(folderId: string | null): string {
  return folderId ?? 'inbox'
}

interface FolderContextType {
  selectedFolderId: string | null
  selectedFolderName: string | null
  setSelectedFolder: (folderId: string | null, folderName: string | null) => void
  selectedTaskId: string | null
  setSelectedTaskId: (taskId: string | null) => void
  /** 폴더별 Task 목록 (key: folderId 또는 'inbox'). undefined = 아직 로드 전 */
  tasksByFolder: Record<string, Task[] | undefined>
  setTasksForFolder: (key: string, tasks: Task[] | undefined) => void
  /** 새 Task를 해당 폴더 목록에 즉시 반영 (낙관적 업데이트) */
  addTaskToFolder: (key: string, task: Task) => void
}

const FolderContext = createContext<FolderContextType | undefined>(undefined)

export function useFolderContext() {
  const context = useContext(FolderContext)
  if (!context) {
    throw new Error('useFolderContext must be used within FolderProvider')
  }
  return context
}

export { folderKey }

export function FolderProvider({ children }: { children: React.ReactNode }) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [tasksByFolder, setTasksByFolder] = useState<Record<string, Task[] | undefined>>({})

  const setSelectedFolder = useCallback((folderId: string | null, folderName: string | null) => {
    setSelectedFolderId(folderId)
    setSelectedFolderName(folderName)
    setSelectedTaskId(null)
  }, [])

  const setTasksForFolder = useCallback((key: string, tasks: Task[] | undefined) => {
    setTasksByFolder((prev) => ({ ...prev, [key]: tasks }))
  }, [])

  const addTaskToFolder = useCallback((key: string, task: Task) => {
    setTasksByFolder((prev) => ({
      ...prev,
      [key]: [task, ...(prev[key] ?? [])],
    }))
  }, [])

  return (
    <FolderContext.Provider
      value={{
        selectedFolderId,
        selectedFolderName,
        setSelectedFolder,
        selectedTaskId,
        setSelectedTaskId,
        tasksByFolder,
        setTasksForFolder,
        addTaskToFolder,
      }}
    >
      {children}
    </FolderContext.Provider>
  )
}
