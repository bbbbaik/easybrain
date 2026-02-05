'use client'

import { usePageContext } from '@/contexts/PageContext'
import type { Page } from '@/types/page'
import { cn } from '@/lib/utils'

interface InboxSectionProps {
  pages: Page[]
  isLoading: boolean
}

export function InboxSection({ pages, isLoading }: InboxSectionProps) {
  const { selectedPageId, selectPage } = usePageContext()

  if (isLoading) {
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B95A1] mb-3 px-3">
          Inbox
        </h3>
        <div className="text-xs text-toss-gray px-3">로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B95A1] mb-3 px-3">
        Inbox
      </h3>
      {pages.length === 0 ? (
        <div className="text-xs text-toss-gray px-3">인박스가 비어있습니다</div>
      ) : (
        <div className="space-y-0.5">
          {pages.map((page) => {
            const isSelected = selectedPageId === page.id
            return (
              <button
                key={page.id}
                type="button"
                onClick={() => selectPage(page.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm transition-colors text-left',
                  isSelected
                    ? 'bg-card text-accent-blue font-semibold shadow-sm'
                    : 'bg-transparent hover:bg-[rgba(0,0,0,0.04)] text-[#4E5968] hover:text-toss-text'
                )}
              >
                <span className="text-base shrink-0">📥</span>
                <span className="truncate flex-1">{page.title || '제목 없음'}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
