'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react'
import { usePageContext } from '@/contexts/PageContext'
import { deletePage } from '@/services/pageService'
import type { Page } from '@/types/page'
import { cn } from '@/lib/utils'

interface TrashSectionProps {
  pages: Page[]
  onRefresh: () => void
}

export function TrashSection({ pages, onRefresh }: TrashSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const { selectedPageId, selectPage } = usePageContext()

  const handleDelete = async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation()
    try {
      await deletePage(pageId)
      onRefresh()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-2 w-full text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-3 py-2 rounded-xl hover:bg-white hover:scale-[1.02] hover:shadow-elevation-flat transition-all duration-200 ease-smooth text-left leading-relaxed"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        🗑️ 휴지통 (Trash)
        {pages.length > 0 && (
          <span className="ml-1 text-[10px] font-normal text-slate-400">({pages.length})</span>
        )}
      </button>
      {expanded && (
        <div className="space-y-2">
          {pages.length === 0 ? (
            <div className="text-sm text-slate-500 px-3 py-2 leading-relaxed">휴지통이 비어 있습니다</div>
          ) : (
            pages.map((page) => {
              const isSelected = selectedPageId === page.id
              return (
                <div
                  key={page.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-xl transition-all duration-200 ease-smooth',
                    isSelected
                      ? 'bg-white shadow-sm text-[#3182F6] font-semibold rounded-lg'
                      : 'bg-transparent text-gray-500 hover:bg-gray-100/50 rounded-lg'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectPage(page.id)}
                    className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-left min-w-0 text-[15px] leading-relaxed"
                  >
                    <span className="text-base shrink-0">🗑️</span>
                    <span className="truncate flex-1">{page.title || '제목 없음'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, page.id)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="영구 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
