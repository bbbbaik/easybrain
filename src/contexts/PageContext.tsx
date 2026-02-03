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
  updatePageOptimistically: (updates: Array<{ id: string; parent_id: string | null; position: number }>) => void
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

  const updatePageOptimistically = useCallback(
    (updates: Array<{ id: string; parent_id: string | null; position: number }>) => {
      setPages((prevPages) => {
        const updated = prevPages.map((page) => {
          const update = updates.find((u) => u.id === page.id)
          if (update) {
            return { ...page, parent_id: update.parent_id, position: update.position }
          }
          return page
        })
        // 페이지를 parent_id와 position으로 정렬
        const sorted = updated.sort((a, b) => {
          if (a.parent_id !== b.parent_id) {
            const aParent = a.parent_id || ''
            const bParent = b.parent_id || ''
            return aParent.localeCompare(bParent)
          }
          return a.position - b.position
        })
        // 트리 구조 업데이트
        setPageTree(buildPageTree(sorted))
        return sorted
      })
    },
    []
  )

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
        updatePageOptimistically,
      }}
    >
      {children}
    </PageContext.Provider>
  )
}
