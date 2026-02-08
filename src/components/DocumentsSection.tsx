'use client'

import { useDroppable } from '@dnd-kit/core'
import { usePageContext } from '@/contexts/PageContext'
import type { PageNode } from '@/types/page'
import { SidebarItem } from './SidebarItem'
import { cn } from '@/lib/utils'

interface DocumentsSectionProps {
  tree: PageNode[]
  isLoading: boolean
  activeId: string | null
  overId: string | null
  documentsRootDropId: string
  expandedIds?: Set<string>
  onDeletePage?: (pageId: string) => void | Promise<void>
}

export function DocumentsSection({
  tree,
  isLoading,
  activeId,
  overId,
  documentsRootDropId,
  expandedIds,
  onDeletePage,
}: DocumentsSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: documentsRootDropId })

  if (isLoading) {
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-3 leading-relaxed">
          Documents
        </h3>
        <div className="text-sm text-slate-500 px-3 py-2 leading-relaxed">로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-3 leading-relaxed">
        Documents
      </h3>
      {tree.length === 0 ? (
        <div
          ref={setNodeRef}
          className={cn(
            'min-h-[60px] rounded-xl transition-all duration-200',
            isOver ? 'bg-easy-blue/5 shadow-elevation-flat' : 'bg-transparent'
          )}
        />
      ) : (
        <div ref={setNodeRef} className="space-y-2">
          {overId === documentsRootDropId && (
            <div className="h-0.5 w-full rounded-full bg-easy-blue mx-3" aria-hidden />
          )}
          {tree.map((page) => (
            <SidebarItem
              key={page.id}
              page={page}
              depth={0}
              activeId={activeId}
              overId={overId}
              expandedIds={expandedIds}
              onDeletePage={onDeletePage}
            />
          ))}
        </div>
      )}
    </div>
  )
}
