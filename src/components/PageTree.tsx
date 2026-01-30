'use client'

import React, { useState } from 'react'
import { Droppable, Draggable, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { ChevronRight, ChevronDown, FileText } from 'lucide-react'
import { usePageContext } from '@/contexts/PageContext'
import type { PageNode } from '@/types/page.types'

const DROPPABLE_TYPE = 'TASK'

interface PageTreeRowProps {
  node: PageNode
  level: number
}

/** 한 페이지: Droppable 하나(행 + 자식 목록) */
function PageTreeRow({ node, level }: PageTreeRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { selectedPageId, setSelectedPageId } = usePageContext()
  const isSelected = selectedPageId === node.id
  const dropZoneId = `page-${node.id}`

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen((o) => !o)
  }

  const handleClick = () => {
    setSelectedPageId(node.id)
  }

  return (
    <Droppable droppableId={dropZoneId} type={DROPPABLE_TYPE} isDropDisabled={false}>
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`rounded-md transition-colors min-h-[28px] ${
            snapshot.isDraggingOver ? 'bg-blue-100 ring-2 ring-blue-300' : ''
          }`}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
            className={`
              flex items-center px-2 py-1.5 rounded-md cursor-pointer text-sm select-none transition-colors
              ${isSelected ? 'bg-white shadow-sm border border-slate-200/80 font-medium' : 'hover:bg-slate-100'}
              text-slate-700
            `}
            style={{ marginLeft: `${level * 14}px` }}
          >
            <span
              className="mr-1 text-slate-400 cursor-pointer shrink-0"
              onClick={toggleOpen}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleOpen(e as unknown as React.MouseEvent)}
              role="button"
              tabIndex={0}
            >
              {node.children.length > 0 ? (
                isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              ) : (
                <span className="w-3.5 inline-block" />
              )}
            </span>
            <FileText size={14} className="mr-2 shrink-0 text-slate-500" />
            <span className="truncate flex-1">{node.title || '제목 없음'}</span>
          </div>

          {isOpen && node.children.length > 0 && (
            <div className="mt-0.5 pl-1">
              {node.children.map((child, index) => (
                <Draggable key={child.id} draggableId={child.id} index={index} type={DROPPABLE_TYPE}>
                  {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={snapshot.isDragging ? 'opacity-90 shadow-md rounded-md' : ''}
                    >
                      <PageTreeRow node={child} level={level + 1} />
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
          )}

          <div className="w-0 h-0 overflow-hidden opacity-0">{provided.placeholder}</div>
        </div>
      )}
    </Droppable>
  )
}

/** 루트 페이지 목록 (Droppable "root") */
export function PageTreeRoot({ nodes }: { nodes: PageNode[] }) {
  return (
    <Droppable droppableId="root" type={DROPPABLE_TYPE} isDropDisabled={false}>
      {(provided: DroppableProvided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-0.5">
          {nodes.map((node, index) => (
            <Draggable key={node.id} draggableId={node.id} index={index} type={DROPPABLE_TYPE}>
              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={snapshot.isDragging ? 'opacity-90 shadow-md rounded-md' : ''}
                >
                  <PageTreeRow node={node} level={0} />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}
