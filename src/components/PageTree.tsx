'use client'

import React, { useState } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { ChevronRight, ChevronDown, FileText } from 'lucide-react'
import { usePageContext } from '@/contexts/PageContext'
import type { PageNode } from '@/types/page.types'

const DROPPABLE_TYPE = 'PAGE'

interface PageTreeProps {
  pages: PageNode[]
  parentId: string | null
  depth?: number
}

export function PageTree({ pages, parentId, depth = 0 }: PageTreeProps) {
  const { selectedPageId, selectPage } = usePageContext()
  const droppableId = `list-${parentId ?? 'root'}`

  if (pages.length === 0) {
    return (
      <Droppable droppableId={droppableId} type={DROPPABLE_TYPE} isDropDisabled={false}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[24px]">
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    )
  }

  return (
    <Droppable droppableId={droppableId} type={DROPPABLE_TYPE} isDropDisabled={false}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`min-h-[24px] rounded-md transition-colors ${
            snapshot.isDraggingOver ? 'bg-slate-100/80 ring-1 ring-slate-200 ring-inset' : ''
          }`}
        >
          {pages.map((page, index) => (
            <PageRow key={page.id} page={page} index={index} depth={depth} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}

interface PageRowProps {
  page: PageNode
  index: number
  depth: number
}

function PageRow({ page, index, depth }: PageRowProps) {
  const [expanded, setExpanded] = useState(false)
  const { selectedPageId, selectPage } = usePageContext()
  const isSelected = selectedPageId === page.id
  const hasChildren = page.children && page.children.length > 0

  return (
    <div className="mb-0.5">
      <Draggable draggableId={page.id} index={index} type={DROPPABLE_TYPE}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={snapshot.isDragging ? 'opacity-90 shadow-md rounded-md' : ''}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => selectPage(page.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectPage(page.id)}
              className={`
                flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm select-none transition-colors
                ${isSelected ? 'bg-white shadow-sm border border-slate-200/80 font-medium text-slate-900' : 'hover:bg-slate-100 text-slate-700'}
              `}
              style={{ paddingLeft: `${12 + depth * 14}px` }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded((e_) => !e_)
                }}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200/80 text-slate-500"
                aria-label={expanded ? '접기' : '펼치기'}
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
              <FileText size={14} className="shrink-0 text-slate-500" />
              <span className="truncate flex-1">{page.title || '제목 없음'}</span>
            </div>
          </div>
        )}
      </Draggable>

      {expanded && hasChildren && (
        <div className="mt-0.5">
          <PageTree pages={page.children} parentId={page.id} depth={depth + 1} />
        </div>
      )}
    </div>
  )
}
