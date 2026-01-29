'use client'

import { createContext, useContext, useState } from 'react'

// 선택된 폴더 컨텍스트 타입
interface FolderContextType {
  selectedFolderId: string | null
  selectedFolderName: string | null
  setSelectedFolder: (folderId: string | null, folderName: string | null) => void
  selectedTaskId: string | null
  setSelectedTaskId: (taskId: string | null) => void
}

const FolderContext = createContext<FolderContextType | undefined>(undefined)

export function useFolderContext() {
  const context = useContext(FolderContext)
  if (!context) {
    throw new Error('useFolderContext must be used within FolderProvider')
  }
  return context
}

// Provider 컴포넌트
export function FolderProvider({ children }: { children: React.ReactNode }) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const setSelectedFolder = (folderId: string | null, folderName: string | null) => {
    setSelectedFolderId(folderId)
    setSelectedFolderName(folderName)
    // 폴더 변경 시 Task 선택 해제
    setSelectedTaskId(null)
  }

  return (
    <FolderContext.Provider
      value={{
        selectedFolderId,
        selectedFolderName,
        setSelectedFolder,
        selectedTaskId,
        setSelectedTaskId,
      }}
    >
      {children}
    </FolderContext.Provider>
  )
}
