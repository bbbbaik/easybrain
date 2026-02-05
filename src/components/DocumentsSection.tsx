'use client'

import { usePageContext } from '@/contexts/PageContext'
import type { PageNode } from '@/types/page'
import { SidebarItem } from './SidebarItem'

interface DocumentsSectionProps {
  tree: PageNode[]
  isLoading: boolean
}

export function DocumentsSection({ tree, isLoading }: DocumentsSectionProps) {
  if (isLoading) {
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B95A1] mb-3 px-3">
          Documents
        </h3>
        <div className="text-xs text-toss-gray px-3">로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B95A1] mb-3 px-3">
        Documents
      </h3>
      {tree.length === 0 ? (
        <div className="text-xs text-toss-gray px-3">문서가 없습니다</div>
      ) : (
        <div className="space-y-0.5">
          {tree.map((page) => (
            <SidebarItem key={page.id} page={page} depth={0} />
          ))}
        </div>
      )}
    </div>
  )
}
