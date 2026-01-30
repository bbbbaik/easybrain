'use client'

import { useCallback } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Brain, Plus } from 'lucide-react'
import { usePageContext } from '@/contexts/PageContext'
import {
  reorderPages,
  createPage,
  getOrderedIdsForDroppable,
  type ReorderUpdate,
} from '@/lib/supabase/pages'
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
  const { pageTree, refreshPages } = usePageContext()

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result
      if (!destination) return

      const sourceDroppableId = source.droppableId
      const destDroppableId = destination.droppableId
      const sourceParentId = sourceDroppableId === 'list-root' ? null : sourceDroppableId.replace(/^list-/, '')
      const destParentId = destDroppableId === 'list-root' ? null : destDroppableId.replace(/^list-/, '')

      const sourceIds = getOrderedIdsForDroppable(sourceDroppableId, pageTree)
      const destIds = getOrderedIdsForDroppable(destDroppableId, pageTree)

      let updates: ReorderUpdate[] = []

      if (sourceDroppableId === destDroppableId) {
        const newOrder = arrayMove(sourceIds, source.index, destination.index)
        updates = newOrder.map((id, i) => ({
          id,
          parent_id: sourceParentId,
          position: i,
        }))
      } else {
        const sourceWithout = sourceIds.filter((id) => id !== draggableId)
        const destWith = [...destIds]
        destWith.splice(destination.index, 0, draggableId)
        updates = [
          ...sourceWithout.map((id, i) => ({ id, parent_id: sourceParentId, position: i })),
          ...destWith.map((id, i) => ({ id, parent_id: destParentId, position: i })),
        ]
      }

      try {
        await reorderPages(updates)
        await refreshPages()
      } catch (error) {
        console.error('Error reordering pages:', error)
      }
    },
    [pageTree, refreshPages]
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
    <aside className="w-64 flex flex-col h-full bg-slate-50 border-r border-slate-200 rounded-r-lg shadow-sm">
      <div className="p-4 shrink-0">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-slate-700 shrink-0" />
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">EasyBrain</h2>
        </div>
      </div>

      <Separator className="bg-slate-200" />

      <ScrollArea className="flex-1 px-3 py-3">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-2">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2 px-2">
              페이지
            </h3>
            <PageTree pages={pageTree} parentId={null} depth={0} />
          </div>
        </DragDropContext>
      </ScrollArea>

      <Separator className="bg-slate-200" />

      <div className="p-3 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 rounded-lg text-slate-700 hover:bg-slate-100 border-slate-200"
          onClick={handleAddPage}
        >
          <Plus size={16} />
          새 페이지 추가
        </Button>
      </div>
    </aside>
  )
}
