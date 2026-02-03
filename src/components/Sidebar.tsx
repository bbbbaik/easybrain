'use client'

import { useCallback } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Brain, Plus } from 'lucide-react'
import { usePageContext } from '@/contexts/PageContext'
import {
  reorderPages,
  createPage,
  getOrderedIdsForDroppable,
  findPageNode,
  type ReorderUpdate,
} from '@/lib/supabase/pages'
import type { PageNode } from '@/types/page.types'
import { PageTree } from './PageTree'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

function arrayMove<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...arr]
  const [removed] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, removed)
  return next
}

export default function Sidebar() {
  const { pageTree, refreshPages, updatePageOptimistically } = usePageContext()

  /** 순환 참조 방지: targetId가 sourceId의 자손인지 확인 */
  const isDescendant = useCallback(
    (sourceId: string, targetId: string, nodes: PageNode[]): boolean => {
      const sourceNode = findPageNode(nodes, sourceId)
      if (!sourceNode) return false
      const check = (node: PageNode): boolean => {
        if (node.id === targetId) return true
        return node.children.some((child) => check(child))
      }
      return check(sourceNode)
    },
    []
  )

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId, combine } = result

      // 디버깅: result 객체 전체 확인
      console.log('[DnD] onDragEnd called:', {
        draggableId,
        combine: combine ? combine.draggableId : null,
        destination: destination ? `${destination.droppableId}[${destination.index}]` : null,
        source: `${source.droppableId}[${source.index}]`,
      })

      // ============================================
      // Case A: 합치기 (Combine) - 최우선 처리
      // ============================================
      // 중요: combine이 감지되면 reorderPages는 절대 실행하지 않고 즉시 return
      if (result.combine) {
        const targetPageId = result.combine.draggableId
        console.log('✅ Combine 성공!', {
          combine: result.combine,
          draggableId,
          targetPageId,
          source: source.droppableId,
        })

        // 유효성 검사
        if (draggableId === targetPageId) {
          console.warn('[DnD] Cannot combine page with itself')
          return
        }

        if (isDescendant(draggableId, targetPageId, pageTree)) {
          console.warn('[DnD] Cannot make a page a child of its own descendant')
          return
        }

        // Combine 로직: parent_id만 업데이트 (순서 변경 없음)
        const sourceDroppableId = source.droppableId
        const sourceParentId = sourceDroppableId === 'list-root' ? null : sourceDroppableId.replace(/^list-/, '')
        const sourceIds = getOrderedIdsForDroppable(sourceDroppableId, pageTree)
        const targetChildren = getOrderedIdsForDroppable(`list-${targetPageId}`, pageTree)

        const sourceWithout = sourceIds.filter((id) => id !== draggableId)
        const targetWith = [draggableId, ...targetChildren]

        const updates: ReorderUpdate[] = [
          ...sourceWithout.map((id, i) => ({ id, parent_id: sourceParentId, position: i })),
          ...targetWith.map((id, i) => ({ id, parent_id: targetPageId, position: i })),
        ]

        console.log('[DnD] Combine updates:', updates)

        // Optimistic Update
        updatePageOptimistically(updates)

        try {
          await reorderPages(updates)
          await refreshPages()
          console.log('✅ Combine 처리 완료!', result.combine)
        } catch (error) {
          console.error('[DnD] Error combining pages:', error)
          await refreshPages()
        }
        // 중요: Combine 처리 후 즉시 리턴 (순서 변경 로직 실행 방지)
        return
      }

      // ============================================
      // Case B: 순서 변경 (Reorder) - destination이 있을 때만 실행
      // ============================================
      // 중요: combine이 없을 때만 이 로직 실행됨
      if (!destination) {
        console.log('[DnD] No destination, drag cancelled')
        return
      }

      const sourceDroppableId = source.droppableId
      const destDroppableId = destination.droppableId

      console.log('[DnD] Reorder detected:', {
        draggableId,
        source: { droppableId: sourceDroppableId, index: source.index },
        destination: { droppableId: destDroppableId, index: destination.index },
      })

      let updates: ReorderUpdate[] = []

      if (destDroppableId.startsWith('page-')) {
        const targetPageId = destDroppableId.replace(/^page-/, '')
        if (draggableId === targetPageId) return
        if (isDescendant(draggableId, targetPageId, pageTree)) {
          console.warn('[DnD] Cannot make a page a child of its own descendant')
          return
        }
        const sourceParentId = sourceDroppableId === 'list-root' ? null : sourceDroppableId.replace(/^list-/, '')
        const sourceIds = getOrderedIdsForDroppable(sourceDroppableId, pageTree)
        const targetChildren = getOrderedIdsForDroppable(`list-${targetPageId}`, pageTree)
        const sourceWithout = sourceIds.filter((id) => id !== draggableId)
        const targetWith = [draggableId, ...targetChildren]
        updates = [
          ...sourceWithout.map((id, i) => ({ id, parent_id: sourceParentId, position: i })),
          ...targetWith.map((id, i) => ({ id, parent_id: targetPageId, position: i })),
        ]
      } else {
        const sourceParentId = sourceDroppableId === 'list-root' ? null : sourceDroppableId.replace(/^list-/, '')
        const destParentId = destDroppableId === 'list-root' ? null : destDroppableId.replace(/^list-/, '')
        const sourceIds = getOrderedIdsForDroppable(sourceDroppableId, pageTree)
        const destIds = getOrderedIdsForDroppable(destDroppableId, pageTree)

        if (sourceDroppableId === destDroppableId) {
          // 같은 목록 내에서 순서 변경
          const newOrder = arrayMove(sourceIds, source.index, destination.index)
          updates = newOrder.map((id, i) => ({
            id,
            parent_id: sourceParentId,
            position: i,
          }))
        } else {
          // 다른 목록으로 이동
          if (destParentId && isDescendant(draggableId, destParentId, pageTree)) {
            console.warn('[DnD] Cannot move a page into its own descendant')
            return
          }
          const sourceWithout = sourceIds.filter((id) => id !== draggableId)
          const destWith = [...destIds]
          destWith.splice(destination.index, 0, draggableId)
          updates = [
            ...sourceWithout.map((id, i) => ({ id, parent_id: sourceParentId, position: i })),
            ...destWith.map((id, i) => ({ id, parent_id: destParentId, position: i })),
          ]
        }
      }

      console.log('[DnD] Reorder updates:', updates)

      // Optimistic Update
      updatePageOptimistically(updates)

      try {
        await reorderPages(updates)
        await refreshPages()
        console.log('[DnD] Reorder successful')
      } catch (error) {
        console.error('[DnD] Error reordering pages:', error)
        await refreshPages() // 실패 시 원래 상태로 복구
      }
    },
    [pageTree, refreshPages, isDescendant, updatePageOptimistically]
  )

  const handleAddPage = useCallback(async () => {
    try {
      await createPage('제목 없음', null)
      await refreshPages()
    } catch (error) {
      console.error('Error creating page:', error)
    }
  }, [refreshPages])

  return (
    <aside className="w-[280px] flex flex-col h-full bg-transparent shrink-0">
      <div className="p-5 shrink-0">
        <div className="flex items-center gap-3">
          <Brain size={22} className="text-accent-blue shrink-0" />
          <h2 className="text-lg font-extrabold text-toss-text tracking-tight">EasyBrain</h2>
        </div>
      </div>

      <Separator className="bg-transparent h-px" />

      <ScrollArea className="flex-1 px-3 py-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B95A1] mb-3 px-3">
              페이지
            </h3>
            <PageTree pages={pageTree} parentId={null} depth={0} />
          </div>
        </DragDropContext>
      </ScrollArea>

      <Separator className="bg-transparent h-px" />

      <div className="p-4 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 rounded-xl py-3 text-[#8B95A1] hover:bg-[rgba(0,0,0,0.04)] hover:text-toss-text font-medium"
          onClick={handleAddPage}
        >
          <Plus size={18} />
          새 페이지 추가
        </Button>
      </div>
    </aside>
  )
}
