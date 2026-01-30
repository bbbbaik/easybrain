'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getPages, buildPageTree } from '@/lib/supabase/pages'
import type { Page } from '@/types/page.types'
import type { PageNode } from '@/types/page.types'

interface PageContextType {
  pages: Page[]
  pageTree: PageNode[]
  selectedPageId: string | null
  isLoading: boolean
  refreshPages: () => Promise<void>
  selectPage: (id: string | null) => void
}

const PageContext = createContext<PageContextType | undefined>(undefined)

export function usePageContext() {
  const context = useContext(PageContext)
  if (!context) {
    throw new Error('usePageContext must be used within PageProvider')
  }
  return context
}

/** usePageContext 의 별칭 (다른 컴포넌트에서 쉽게 사용) */
export const usePage = usePageContext

export function PageProvider({ children }: { children: React.ReactNode }) {
  const [pages, setPages] = useState<Page[]>([])
  const [pageTree, setPageTree] = useState<PageNode[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshPages = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await getPages()
      setPages(list)
      setPageTree(buildPageTree(list))
    } catch (error) {
      console.error('Error refreshing pages:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const selectPage = useCallback((id: string | null) => {
    setSelectedPageId(id)
  }, [])

  useEffect(() => {
    refreshPages()
  }, [refreshPages])

  return (
    <PageContext.Provider
      value={{
        pages,
        pageTree,
        selectedPageId,
        isLoading,
        refreshPages,
        selectPage,
      }}
    >
      {children}
    </PageContext.Provider>
  )
}
