'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { Brain, Plus, LogOut } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { usePageContext } from '@/contexts/PageContext'
import { createClient } from '@/lib/supabase/client'
import {
  getInboxPages,
  getSidebarTree,
  getTrashPages,
  createPage as createPageService,
  updatePage,
  deletePage,
} from '@/services/pageService'
import type { Page, PageNode } from '@/types/page'
import { InboxSection } from './InboxSection'
import { DocumentsSection } from './DocumentsSection'
import { TrashSection } from './TrashSection'
import { DROP_ZONE_ABOVE, DROP_ZONE_NEST, DROP_ZONE_BELOW } from './SidebarItem'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'

const INBOX_DROP_ID = 'inbox'
const DOCUMENTS_ROOT_DROP_ID = 'documents-root'

/** 트리에서 노드 제거 (해당 id만 제거, 자식은 유지하지 않음 - 이동이므로) */
function removePageFromTree(nodes: PageNode[], pageId: string): PageNode[] {
  return nodes
    .filter((n) => n.id !== pageId)
    .map((n) => ({ ...n, children: removePageFromTree(n.children, pageId) }))
}

/** 트리에 노드 추가 (parentId가 null이면 루트, 아니면 해당 부모의 자식으로) */
function addPageToTree(
  nodes: PageNode[],
  page: Page & { children?: PageNode[] },
  parentId: string | null,
  index: number
): PageNode[] {
  const node: PageNode = { ...page, children: page.children ?? [] }
  if (parentId === null) {
    const next = [...nodes]
    next.splice(index, 0, node)
    return next
  }
  return nodes.map((n) => {
    if (n.id !== parentId) return { ...n, children: addPageToTree(n.children, page, parentId, index) }
    const next = [...n.children]
    next.splice(index, 0, node)
    return { ...n, children: next }
  })
}

/** 트리 평면화 (id -> { node, parentId, index }) */
function flattenTree(nodes: PageNode[], parentId: string | null = null): Map<string, { node: PageNode; parentId: string | null; index: number }> {
  const map = new Map<string, { node: PageNode; parentId: string | null; index: number }>()
  nodes.forEach((node, index) => {
    map.set(node.id, { node, parentId, index })
    flattenTree(node.children, node.id).forEach((v, k) => map.set(k, v))
  })
  return map
}


export default function Sidebar() {
  const { selectPage, refreshPages } = usePageContext()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [inboxPages, setInboxPages] = useState<Page[]>([])
  const [folderTree, setFolderTree] = useState<PageNode[]>([])
  const [trashPages, setTrashPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const docMapRef = useRef<Map<string, { node: PageNode; parentId: string | null; index: number }>>(new Map())
  useEffect(() => {
    docMapRef.current = flattenTree(folderTree)
  }, [folderTree])

  const getPageById = useCallback(
    (id: string): Page | null => {
      const fromInbox = inboxPages.find((p) => p.id === id)
      if (fromInbox) return fromInbox
      const fromDoc = docMapRef.current.get(id)
      return fromDoc ? fromDoc.node : null
    },
    [inboxPages]
  )

  // 목록 불러오기 함수
  // silent === true: 배경 갱신(기존 리스트 유지, 로딩 UI 없음). false/미지정: 초기 로딩처럼 isLoading 제어.
  const fetchPages = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserEmail(user?.email || null)

      const [inbox, tree, trash] = await Promise.all([
        getInboxPages(),
        getSidebarTree(),
        getTrashPages(),
      ])
      setInboxPages(inbox)
      setFolderTree(tree)
      setTrashPages(trash)
    } catch (error) {
      console.error('Error loading sidebar data:', error)
      setInboxPages([])
      setFolderTree([])
      setTrashPages([])
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [supabase.auth])

  // 사용자 정보 및 페이지 데이터 초기 로드 + Auth state 변경 감지
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUserEmail(user?.email || null)
        const [inbox, tree, trash] = await Promise.all([
          getInboxPages(),
          getSidebarTree(),
          getTrashPages(),
        ])
        setInboxPages(inbox)
        setFolderTree(tree)
        setTrashPages(trash)
      } catch (error) {
        console.error('Error loading sidebar data:', error)
        setInboxPages([])
        setFolderTree([])
        setTrashPages([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUserEmail(session?.user?.email || null)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        const [inbox, tree, trash] = await Promise.all([
          getInboxPages(),
          getSidebarTree(),
          getTrashPages(),
        ])
        setInboxPages(inbox)
        setFolderTree(tree)
        setTrashPages(trash)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // QuickCapture 저장 성공 시 목록 자동 갱신 (Silent: 로딩 UI 없이 데이터만 갱신)
  const fetchPagesRef = useRef(fetchPages)
  fetchPagesRef.current = fetchPages
  useEffect(() => {
    const handleRefreshPages = () => {
      fetchPagesRef.current(true) // silent refresh → 깜빡임 없음
      refreshPages()
    }
    window.addEventListener('refresh-pages', handleRefreshPages)
    return () => {
      window.removeEventListener('refresh-pages', handleRefreshPages)
    }
  }, [refreshPages])

  // 로그아웃 핸들러 (보안: 하드 리프레시로 메모리 초기화)
  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        alert(error.message)
        return
      }
      // window.location.href를 사용하여 하드 리프레시로 페이지 이동
      // 이렇게 하면 클라이언트 상태(Context 등)가 완전히 초기화되어 보안상 안전함
      window.location.href = '/login'
    } catch (error: any) {
      alert(error.message || '로그아웃에 실패했습니다.')
    }
  }, [supabase.auth])

  const handleDeletePage = useCallback(async (pageId: string) => {
    try {
      await deletePage(pageId)
      fetchPagesRef.current?.(true)
      refreshPages()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('삭제에 실패했습니다.')
    }
  }, [refreshPages])

  const handleAddPage = useCallback(async () => {
    try {
      await createPageService({ title: '제목 없음', is_inbox: false })
      // 데이터 새로고침
      const [inbox, tree] = await Promise.all([
        getInboxPages(),
        getSidebarTree(),
      ])
      setInboxPages(inbox)
      setFolderTree(tree)
      await refreshPages() // PageContext도 업데이트
    } catch (error) {
      console.error('Error creating page:', error)
    }
  }, [refreshPages])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback((event: { over: { id: string } | null }) => {
    setOverId(event.over?.id ?? null)
  }, [])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setOverId(null)
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      setOverId(null)
      if (!over || !active?.id) return
      const activeId = active.id as string
      const overId = over.id as string
      const page = getPageById(activeId)
      if (!page) return

      const inInbox = inboxPages.some((p) => p.id === activeId)
      const docMap = docMapRef.current

      type DropTarget =
        | { type: 'inbox'; index: number }
        | { type: 'documents-root'; index: number }
        | { type: 'folder'; parentId: string; index: number }
        | { type: 'reorder-inbox'; index: number }
        | { type: 'reorder-docs'; parentId: string | null; index: number }

      let target: DropTarget | null = null
      if (overId === INBOX_DROP_ID) {
        target = { type: 'inbox', index: inboxPages.length }
      } else if (overId === DOCUMENTS_ROOT_DROP_ID) {
        target = { type: 'documents-root', index: folderTree.length }
      } else if (inboxPages.some((p) => p.id === overId)) {
        const idx = inboxPages.findIndex((p) => p.id === overId)
        target = { type: 'reorder-inbox', index: idx }
      } else if (overId.endsWith(DROP_ZONE_NEST)) {
        const parentId = overId.slice(0, -DROP_ZONE_NEST.length)
        if (docMap.has(parentId) && parentId !== activeId) {
          target = { type: 'folder', parentId, index: 0 }
        }
      } else if (overId.endsWith(DROP_ZONE_ABOVE)) {
        const pageId = overId.slice(0, -DROP_ZONE_ABOVE.length)
        const info = docMap.get(pageId)
        if (info != null) {
          target = { type: 'reorder-docs', parentId: info.parentId, index: info.index }
        }
      } else if (overId.endsWith(DROP_ZONE_BELOW)) {
        const pageId = overId.slice(0, -DROP_ZONE_BELOW.length)
        const info = docMap.get(pageId)
        if (info != null) {
          target = { type: 'reorder-docs', parentId: info.parentId, index: info.index + 1 }
        }
      }
      if (!target) return

      const updated: Page = { ...page, is_inbox: false, parent_id: null, position: 0 }
      let nextInbox = [...inboxPages]
      let nextTree = [...folderTree]

      if (target.type === 'inbox') {
        updated.is_inbox = true
        updated.parent_id = null
        updated.position = target.index
        if (inInbox) {
          nextInbox = nextInbox.filter((p) => p.id !== activeId)
          nextInbox.splice(target.index, 0, updated)
        } else {
          nextTree = removePageFromTree(nextTree, activeId)
          nextInbox = [...nextInbox]
          nextInbox.splice(target.index, 0, updated)
        }
      } else if (target.type === 'documents-root') {
        updated.is_inbox = false
        updated.parent_id = null
        updated.position = target.index
        if (inInbox) {
          nextInbox = nextInbox.filter((p) => p.id !== activeId)
          nextTree = addPageToTree(nextTree, updated, null, target.index)
        } else {
          nextTree = removePageFromTree(nextTree, activeId)
          nextTree = addPageToTree(nextTree, updated, null, target.index)
        }
      } else if (target.type === 'folder') {
        updated.is_inbox = false
        updated.parent_id = target.parentId
        updated.position = target.index
        if (inInbox) {
          nextInbox = nextInbox.filter((p) => p.id !== activeId)
          nextTree = addPageToTree(nextTree, updated, target.parentId, target.index)
        } else {
          nextTree = removePageFromTree(nextTree, activeId)
          const parentNode = docMap.get(target.parentId)?.node
          const childCount = parentNode?.children?.length ?? 0
          nextTree = addPageToTree(nextTree, updated, target.parentId, Math.min(target.index, childCount))
        }
      } else if (target.type === 'reorder-inbox') {
        nextInbox = nextInbox.filter((p) => p.id !== activeId)
        nextInbox.splice(target.index, 0, { ...page, position: target.index })
        nextInbox = nextInbox.map((p, i) => ({ ...p, position: i }))
      } else {
        const siblings = target.parentId === null ? folderTree : (docMap.get(target.parentId)?.node.children ?? [])
        const movedNode = docMap.get(activeId)!.node
        const without = siblings.filter((n) => n.id !== activeId)
        const reordered = [...without]
        reordered.splice(target.index, 0, { ...movedNode, parent_id: target.parentId, position: target.index })
        const withNewPositions = reordered.map((n, i) => ({ ...n, position: i }))
        const setChildren = (nodes: PageNode[], parentId: string | null, children: PageNode[]): PageNode[] => {
          if (parentId === null) return children
          return nodes.map((n) => (n.id === parentId ? { ...n, children } : { ...n, children: setChildren(n.children, parentId, n.children) }))
        }
        nextTree = removePageFromTree(nextTree, activeId)
        nextTree = setChildren(nextTree, target.parentId, withNewPositions)
      }

      setInboxPages(nextInbox)
      setFolderTree(nextTree)
      if (target.type === 'folder') {
        setExpandedIds((prev) => new Set(prev).add(target.parentId))
      }

      try {
        if (target.type === 'inbox') {
          await updatePage(activeId, { is_inbox: true, parent_id: null, position: target.index })
          await Promise.all(nextInbox.map((p, i) => updatePage(p.id, { position: i })))
        } else if (target.type === 'documents-root') {
          await updatePage(activeId, { is_inbox: false, parent_id: null, position: target.index })
        } else if (target.type === 'folder') {
          await updatePage(activeId, { is_inbox: false, parent_id: target.parentId, position: target.index })
        } else if (target.type === 'reorder-inbox') {
          await Promise.all(nextInbox.map((p, i) => updatePage(p.id, { position: i })))
        } else {
          const findChildrenOf = (nodes: PageNode[], parentId: string): PageNode[] | null => {
            for (const n of nodes) {
              if (n.id === parentId) return n.children
              const found = findChildrenOf(n.children, parentId)
              if (found !== null) return found
            }
            return null
          }
          const siblings = target.parentId === null ? nextTree : (findChildrenOf(nextTree, target.parentId) ?? [])
          await Promise.all(siblings.map((node, i) => updatePage(node.id, { parent_id: target.parentId, position: i })))
        }
        fetchPagesRef.current?.(true)
        refreshPages()
      } catch (err) {
        console.error('DnD update failed:', err)
        fetchPagesRef.current?.(true)
      }
    },
    [getPageById, inboxPages, folderTree, refreshPages]
  )

  return (
    <aside className="w-[280px] flex flex-col h-full bg-off-white shrink-0">
      <div className="px-3 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <Brain size={22} className="text-easy-blue shrink-0" />
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">EasyBrain</h2>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6 pb-4">
            <InboxSection
              pages={inboxPages}
              isLoading={isLoading}
              activeId={activeId}
              overId={overId}
              dropId={INBOX_DROP_ID}
              onDeletePage={handleDeletePage}
            />
            <DocumentsSection
              tree={folderTree}
              isLoading={isLoading}
              activeId={activeId}
              overId={overId}
              documentsRootDropId={DOCUMENTS_ROOT_DROP_ID}
              expandedIds={expandedIds}
              onDeletePage={handleDeletePage}
            />
            <TrashSection pages={trashPages} onRefresh={() => fetchPagesRef.current?.(true)} />
          </div>
        </ScrollArea>

        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm bg-white shadow-elevation-floating opacity-95 cursor-grabbing leading-relaxed">
              <span className="text-base shrink-0">📄</span>
              <span className="truncate">{getPageById(activeId)?.title || '제목 없음'}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="px-3 py-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 rounded-xl py-2.5 text-slate-600 hover:bg-white hover:text-slate-900 hover:scale-[1.02] hover:shadow-elevation-flat transition-all duration-200 ease-smooth font-medium text-[15px] leading-relaxed"
          onClick={handleAddPage}
        >
          <Plus size={18} />
          새 페이지 추가
        </Button>
      </div>

      {/* User Profile Section — no border, atmospheric spacing */}
      <div className="mt-auto px-3 py-4 shrink-0">
        {userEmail ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 truncate leading-relaxed">{userEmail}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 rounded-xl py-2 text-slate-600 hover:bg-white hover:text-slate-900 hover:scale-[1.02] hover:shadow-elevation-flat transition-all duration-200 ease-smooth text-xs leading-relaxed"
            >
              <LogOut size={14} />
              로그아웃
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 leading-relaxed">로그인 필요</p>
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 rounded-xl py-2 text-easy-blue hover:bg-white hover:scale-[1.02] hover:shadow-elevation-flat transition-all duration-200 ease-smooth text-xs leading-relaxed"
              >
                로그인
              </Button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
