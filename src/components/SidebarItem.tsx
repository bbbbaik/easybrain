'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, FileText, Trash2 } from 'lucide-react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { usePageContext } from '@/contexts/PageContext'
import type { PageNode } from '@/types/page'
import { cn } from '@/lib/utils'

export const DROP_ZONE_ABOVE = ':above'
export const DROP_ZONE_NEST = ':nest'
export const DROP_ZONE_BELOW = ':below'

const ROW_HEIGHT_PX = 40

interface SidebarItemProps {
  page: PageNode
  depth: number
  activeId?: string | null
  overId?: string | null
  expandedIds?: Set<string>
  onDeletePage?: (pageId: string) => void | Promise<void>
}

export function SidebarItem({ page, depth, activeId = null, overId = null, expandedIds, onDeletePage }: SidebarItemProps) {
  const [expanded, setExpanded] = useState(false)
  const { selectedPageId, selectPage } = usePageContext()
  const isSelected = selectedPageId === page.id
  const hasChildren = page.children && page.children.length > 0

  useEffect(() => {
    if (expandedIds?.has(page.id)) setExpanded(true)
  }, [expandedIds, page.id])

  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({ id: page.id })
  const { setNodeRef: setTopRef } = useDroppable({ id: `${page.id}${DROP_ZONE_ABOVE}` })
  const { setNodeRef: setMidRef } = useDroppable({ id: `${page.id}${DROP_ZONE_NEST}` })
  const { setNodeRef: setBotRef } = useDroppable({ id: `${page.id}${DROP_ZONE_BELOW}` })

  const isDragging = activeId === page.id
  const overAbove = overId === `${page.id}${DROP_ZONE_ABOVE}`
  const overNest = overId === `${page.id}${DROP_ZONE_NEST}`
  const overBelow = overId === `${page.id}${DROP_ZONE_BELOW}`

  const paddingLeft = 14 + depth * 18
  // Exclusive zones: top 0–30% = Reorder Top, middle 30–70% = Nest, bottom 70–100% = Reorder Bottom
  const zoneTopH = Math.round(ROW_HEIGHT_PX * 0.3)
  const zoneBotH = Math.round(ROW_HEIGHT_PX * 0.3)
  const zoneMidH = ROW_HEIGHT_PX - zoneTopH - zoneBotH

  return (
    <div>
      <div
        className="relative flex flex-col rounded-xl text-sm transition-colors"
        style={{ height: ROW_HEIGHT_PX, paddingLeft: `${paddingLeft}px` }}
      >
        {/* Reorder: 선을 아이템 가장자리(border 위치)에만 표시 */}
        {overAbove && (
          <div className="absolute left-0 right-0 top-0 h-0.5 shrink-0 rounded-full bg-easy-blue z-20" aria-hidden />
        )}
        <div className="relative flex flex-1 items-center min-h-0">
          {/* 3-zone droppables: top 30%, middle 40%, bottom 30% (exclusive) */}
        <div
          ref={setTopRef}
          className="absolute left-0 right-0 rounded-t-xl pointer-events-none"
          style={{ top: 0, height: zoneTopH }}
          aria-hidden
        />
        <div
          ref={setMidRef}
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: zoneTopH, height: zoneMidH }}
          aria-hidden
        />
        <div
          ref={setBotRef}
          className="absolute left-0 right-0 rounded-b-xl pointer-events-none"
          style={{ top: zoneTopH + zoneMidH, height: zoneBotH }}
          aria-hidden
        />

        <div
          ref={setDragRef}
          className={cn(
            'group/item absolute inset-0 z-10 flex items-center w-full rounded-xl text-left transition-all duration-200 ease-smooth',
            isDragging && 'opacity-40',
            overNest && 'bg-easy-blue/10 rounded-xl',
            !overNest &&
              (isSelected
                ? 'bg-white shadow-sm text-[#3182F6] font-semibold rounded-lg'
                : 'bg-transparent text-gray-500 hover:bg-gray-100/50 rounded-lg')
          )}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (hasChildren) setExpanded((prev) => !prev)
            }}
            className={cn(
              'shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-colors mr-0.5',
              hasChildren
                ? 'hover:bg-slate-100 text-slate-500 cursor-pointer'
                : 'cursor-default opacity-0 pointer-events-none'
            )}
            aria-label={expanded ? '접기' : '펼치기'}
            disabled={!hasChildren}
          >
            {hasChildren ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3.5 block" />}
          </button>

          <button
            type="button"
            onClick={() => selectPage(page.id)}
            {...attributes}
            {...listeners}
            className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl min-w-0 cursor-grab active:cursor-grabbing h-10 text-[15px] leading-relaxed"
          >
            {page.icon ? (
              <span className="text-base shrink-0">{page.icon}</span>
            ) : (
              <FileText size={14} className="shrink-0 text-slate-500" />
            )}
            <span className="truncate flex-1">{page.title || '제목 없음'}</span>
          </button>
          {onDeletePage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDeletePage(page.id)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover/item:opacity-100 transition-opacity"
              aria-label="휴지통으로 이동"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        {overBelow && (
          <div className="absolute left-0 right-0 bottom-0 h-0.5 shrink-0 rounded-full bg-easy-blue z-20" aria-hidden />
        )}
        </div>
      </div>

      {expanded && (
        <div className="mt-0.5">
          {page.children.map((child) => (
            <SidebarItem
              key={child.id}
              page={child}
              depth={depth + 1}
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
