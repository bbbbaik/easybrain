'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, FileText } from 'lucide-react'
import { usePageContext } from '@/contexts/PageContext'
import type { PageNode } from '@/types/page'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  page: PageNode
  depth: number
}

export function SidebarItem({ page, depth }: SidebarItemProps) {
  const [expanded, setExpanded] = useState(false)
  const { selectedPageId, selectPage } = usePageContext()
  const isSelected = selectedPageId === page.id
  const hasChildren = page.children && page.children.length > 0

  // 동적 padding 계산 (depth에 따라 들여쓰기)
  const paddingLeft = 14 + depth * 18

  return (
    <div>
      {/* 페이지 아이템 */}
      <div
        className={cn(
          'flex items-center rounded-xl text-sm transition-colors',
          isSelected
            ? 'bg-card text-accent-blue font-semibold shadow-sm'
            : 'bg-transparent hover:bg-[rgba(0,0,0,0.04)] text-[#4E5968] hover:text-toss-text'
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {/* 접기/펼치기 버튼 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) {
              setExpanded(!expanded)
            }
          }}
          className={cn(
            'shrink-0 w-6 h-6 flex items-center justify-center rounded-xl transition-colors mr-0.5',
            hasChildren
              ? 'hover:bg-[rgba(0,0,0,0.04)] text-[#4E5968] cursor-pointer'
              : 'cursor-default opacity-0 pointer-events-none'
          )}
          aria-label={expanded ? '접기' : '펼치기'}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span className="w-3.5 block" />
          )}
        </button>

        {/* 페이지 제목 버튼 */}
        <button
          type="button"
          onClick={() => selectPage(page.id)}
          className="flex-1 flex items-center gap-2.5 px-3 py-3 rounded-xl text-left min-w-0"
        >
          {page.icon ? (
            <span className="text-base shrink-0">{page.icon}</span>
          ) : (
            <FileText size={14} className="shrink-0 text-[#4E5968]" />
          )}
          <span className="truncate flex-1">{page.title || '제목 없음'}</span>
        </button>
      </div>

      {/* 자식 페이지들 (재귀 렌더링) */}
      {expanded && hasChildren && (
        <div className="mt-0.5">
          {page.children.map((child) => (
            <SidebarItem key={child.id} page={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
