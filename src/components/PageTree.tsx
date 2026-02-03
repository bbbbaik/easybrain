'use client'

import React, { useState } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { ChevronRight, ChevronDown, FileText } from 'lucide-react'
import { usePageContext } from '@/contexts/PageContext'
import { cn } from '@/lib/utils'
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
      <Droppable
        droppableId={droppableId}
        type={DROPPABLE_TYPE}
        isDropDisabled={false}
        isCombineEnabled={true}
      >
        {(provided, snapshot) => {
          // Combine 중인지 확인
          const isCombineMode = snapshot.combineTargetFor !== null
          const isReorderMode = snapshot.isDraggingOver && !isCombineMode

          return (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'min-h-[10px] border border-red-500 bg-red-50/10',
                isCombineMode && 'bg-blue-50 border-blue-400'
              )}
            >
              {/* Placeholder는 항상 렌더링되어야 함 */}
              <div className={isCombineMode ? 'hidden' : 'min-h-[4px]'}>
                {provided.placeholder}
              </div>
            </div>
          )
        }}
      </Droppable>
    )
  }

  return (
    <Droppable
      droppableId={droppableId}
      type={DROPPABLE_TYPE}
      isDropDisabled={false}
      isCombineEnabled={true}
    >
      {(provided, snapshot) => {
        // Combine 중인지 확인 (combineTargetFor가 있으면 Combine 모드)
        const isCombineMode = snapshot.combineTargetFor !== null
        const isReorderMode = snapshot.isDraggingOver && !isCombineMode

        // 리스트 컨테이너 스타일 (순서 변경 모드일 때만 하이라이트)
        const listContainerStyle = isReorderMode
          ? 'bg-slate-100/80 ring-1 ring-slate-200 ring-inset'
          : ''

        return (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'min-h-[10px] border border-red-500 bg-red-50/10 rounded-md transition-colors',
              listContainerStyle,
              isCombineMode && 'bg-blue-50 border-blue-400'
            )}
          >
            {pages.map((page, index) => (
              <PageRow key={page.id} page={page} index={index} depth={depth} />
            ))}
            {/* Placeholder는 항상 렌더링되어야 함 */}
            <div className={isCombineMode ? 'hidden' : 'min-h-[4px]'}>
              {provided.placeholder}
            </div>
          </div>
        )
      }}
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
  const pageDroppableId = `page-${page.id}`

  return (
    <Draggable draggableId={page.id} index={index} type={DROPPABLE_TYPE}>
      {(provided, snapshot) => {
        // State B: 드래그 중인 놈
        const isDragging = snapshot.isDragging
        const isBeingCombined = snapshot.combineWith !== null

        // State C: 합치기 대상이 된 놈
        const isHoveredForCombine = !!snapshot.combineTargetFor

        // 디버깅 로그 추가
        if (snapshot.combineTargetFor) {
          console.log(`🔥 Combine 감지됨! 타겟: ${page.title}`, {
            draggableCombineTarget: snapshot.combineTargetFor,
            isDragging,
          })
        }

        // State A, B, C (토스증권 PC: 평소 회색·배경없음, 호버 rgba(0,0,0,0.04), 선택=흰 카드)
        let itemStyle = ''
        if (isHoveredForCombine) {
          itemStyle = 'bg-blue-50 border-2 border-accent-blue z-50 text-accent-blue'
        } else if (isSelected) {
          itemStyle = 'bg-card text-accent-blue font-semibold shadow-sm'
        } else {
          itemStyle = 'bg-transparent hover:bg-[rgba(0,0,0,0.04)] text-[#4E5968] hover:text-toss-text'
        }

        // State B: 드래그 중인 놈은 pointer-events-none과 opacity 적용
        const dragStyle = cn(
          isDragging && 'pointer-events-none opacity-50',
          snapshot.isDragging && 'shadow-md rounded-md'
        )
        const combineStyle = isBeingCombined ? 'opacity-60' : ''

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn('mb-0.5', dragStyle)}
          >
            {/* 1. 페이지 제목/내용 (여기에 dragHandleProps 적용) */}
            <div
              {...provided.dragHandleProps}
              role="button"
              tabIndex={0}
              onClick={() => selectPage(page.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectPage(page.id)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-3 rounded-xl cursor-pointer text-sm select-none transition-colors',
                itemStyle,
                combineStyle
              )}
              style={{ paddingLeft: `${14 + depth * 18}px` }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded((e_) => !e_)
                }}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-xl hover:bg-[rgba(0,0,0,0.04)] text-[#4E5968]"
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
              {page.icon ? (
                <span className="text-base shrink-0">{page.icon}</span>
              ) : (
                <FileText size={14} className="shrink-0 text-[#4E5968]" />
              )}
              <span className="truncate flex-1">{page.title || '제목 없음'}</span>
            </div>

            {/* 2. 자식 페이지들이 들어갈 Droppable 영역 (별도 div로 감싸기) */}
            {/* 자식 영역은 드래그 핸들에 포함되면 안 됨 */}
            {expanded && hasChildren && (
              <div className="pl-4 mt-0.5">
                <Droppable
                  droppableId={pageDroppableId}
                  type={DROPPABLE_TYPE}
                  isDropDisabled={false}
                  isCombineEnabled={true}
                >
                  {(pageProvided, pageSnapshot) => {
                    const isDraggingOver = pageSnapshot.isDraggingOver
                    const isReorderMode = isDraggingOver && pageSnapshot.combineTargetFor === null
                    const isDroppableCombineTarget = pageSnapshot.combineTargetFor === page.id

                    return (
                      <div
                        ref={pageProvided.innerRef}
                        {...pageProvided.droppableProps}
                        className={cn(
                          'min-h-[10px] border border-red-500 bg-red-50/10 rounded-md transition-all',
                          isDroppableCombineTarget && 'bg-blue-50 border-blue-400'
                        )}
                      >
                        <PageTree pages={page.children} parentId={page.id} depth={depth + 1} />
                        {/* Placeholder는 항상 렌더링되어야 함 */}
                        <div className={isReorderMode ? 'min-h-[4px]' : 'hidden'}>
                          {pageProvided.placeholder}
                        </div>
                      </div>
                    )
                  }}
                </Droppable>
              </div>
            )}
          </div>
        )
      }}
    </Draggable>
  )
}
