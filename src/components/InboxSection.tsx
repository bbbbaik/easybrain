'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Trash2 } from 'lucide-react'
import { usePageContext } from '@/contexts/PageContext'
import type { Page } from '@/types/page'
import { cn } from '@/lib/utils'

interface InboxSectionProps {
  pages: Page[]
  isLoading: boolean
  activeId: string | null
  overId: string | null
  dropId: string
  onDeletePage?: (pageId: string) => void | Promise<void>
}

function InboxItem({
  page,
  isSelected,
  onSelect,
  isDragging,
  onDeletePage,
}: {
  page: Page
  isSelected: boolean
  onSelect: () => void
  isDragging: boolean
  onDeletePage?: (pageId: string) => void | Promise<void>
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: page.id })
  return (
    <div ref={setNodeRef} className="relative group/item flex items-center">
      <button
        type="button"
        onClick={onSelect}
        {...attributes}
        {...listeners}
        className={cn(
          'flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl min-w-0 text-left cursor-grab active:cursor-grabbing transition-all duration-200 ease-smooth text-[15px] leading-relaxed',
          isDragging && 'opacity-40',
          isSelected
            ? 'bg-white shadow-sm text-[#3182F6] font-semibold rounded-lg'
            : 'bg-transparent text-gray-500 hover:bg-gray-100/50 rounded-lg'
        )}
      >
        <span className="text-base shrink-0">📥</span>
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
  )
}

export function InboxSection({ pages, isLoading, activeId, overId, dropId, onDeletePage }: InboxSectionProps) {
  const { selectedPageId, selectPage } = usePageContext()
  const { setNodeRef, isOver } = useDroppable({ id: dropId })

  if (isLoading) {
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-3 leading-relaxed">
          Inbox
        </h3>
        <div className="text-sm text-slate-500 px-3 py-2 leading-relaxed">로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-3 leading-relaxed">
        Inbox
      </h3>
      {pages.length === 0 ? (
        <div
          ref={setNodeRef}
          className={cn(
            'min-h-[60px] rounded-xl transition-all duration-200',
            isOver ? 'bg-easy-blue/5 shadow-elevation-flat' : 'bg-transparent'
          )}
        />
      ) : (
        <div ref={setNodeRef} className="space-y-2">
          {isOver && overId === dropId && (
            <div className="h-0.5 w-full rounded-full bg-easy-blue mx-3" aria-hidden />
          )}
          {pages.map((page) => {
            const isSelected = selectedPageId === page.id
            const isOverItem = overId === page.id
            return (
              <div key={page.id}>
                {isOverItem && (
                  <div className="h-0.5 w-full rounded-full bg-easy-blue mx-3" aria-hidden />
                )}
                <InboxItem
                  page={page}
                  isSelected={isSelected}
                  onSelect={() => selectPage(page.id)}
                  isDragging={activeId === page.id}
                  onDeletePage={onDeletePage}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
