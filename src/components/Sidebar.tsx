'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { usePageContext } from '@/contexts/PageContext'
import {
  getAllPages,
  buildPageTree,
  getOrderedIdsForDroppable,
  arrayMove,
  updatePage,
  updatePagePositions,
} from '@/lib/supabase/pages'
import type { PageNode } from '@/types/page.types'
import { PageTreeRoot } from './PageTree'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export default function Sidebar() {
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [rootNodes, setRootNodes] = useState<PageNode[]>([])
  const { refreshPages, refreshTrigger } = usePageContext()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const u = async () => {
      const { data: { user: uu } } = await supabase.auth.getUser()
      setUser(uu ?? null)
    }
    u()
  }, [supabase])

  useEffect(() => {
    const load = async () => {
      const pages = await getAllPages()
      const tree = buildPageTree(pages)
      setRootNodes(tree)
    }
    load()
  }, [refreshTrigger])

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result
      if (!destination) return

      const sourceParentId = source.droppableId === 'root' ? null : source.droppableId.replace(/^page-/, '')
      const destParentId = destination.droppableId === 'root' ? null : destination.droppableId.replace(/^page-/, '')

      const sourceIds = getOrderedIdsForDroppable(source.droppableId, rootNodes)
      const destIds = getOrderedIdsForDroppable(destination.droppableId, rootNodes)

      if (source.droppableId === destination.droppableId) {
        const newOrder = arrayMove(sourceIds, source.index, destination.index)
        await updatePagePositions(sourceParentId, newOrder)
      } else {
        await updatePage(draggableId, { parent_id: destParentId })
        const sourceWithout = sourceIds.filter((id) => id !== draggableId)
        const destWith = [...destIds]
        destWith.splice(destination.index, 0, draggableId)
        await updatePagePositions(sourceParentId, sourceWithout)
        await updatePagePositions(destParentId, destWith)
      }
      refreshPages()
    },
    [rootNodes, refreshPages]
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-64 flex flex-col h-full bg-slate-50 border-r border-slate-200 rounded-r-lg shadow-sm">
      <div className="p-4 shrink-0">
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">EasyBrain</h2>
        {user && <p className="text-xs text-slate-500 mt-1 truncate">{user.email}</p>}
      </div>

      <Separator className="bg-slate-200" />

      <ScrollArea className="flex-1 px-3 py-3">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-2">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2 px-2">
              페이지
            </h3>
            <PageTreeRoot nodes={rootNodes} />
          </div>
        </DragDropContext>
      </ScrollArea>

      <Separator className="bg-slate-200" />

      <div className="p-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          onClick={handleLogout}
        >
          로그아웃
        </Button>
      </div>
    </aside>
  )
}
