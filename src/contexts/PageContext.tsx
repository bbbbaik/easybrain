'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { Page } from '@/types/page.types'

interface PageContextType {
  selectedPageId: string | null
  setSelectedPageId: (pageId: string | null) => void
  /** 페이지 트리 갱신 요청 (Sidebar/PageTree에서 호출) */
  refreshPages: () => void
  refreshTrigger: number
}

const PageContext = createContext<PageContextType | undefined>(undefined)

export function usePageContext() {
  const context = useContext(PageContext)
  if (!context) {
    throw new Error('usePageContext must be used within PageProvider')
  }
  return context
}

export function PageProvider({ children }: { children: React.ReactNode }) {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshPages = useCallback(() => {
    setRefreshTrigger((n) => n + 1)
  }, [])

  return (
    <PageContext.Provider
      value={{
        selectedPageId,
        setSelectedPageId,
        refreshPages,
        refreshTrigger,
      }}
    >
      {children}
    </PageContext.Provider>
  )
}
