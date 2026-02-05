import { createClient } from '@/lib/supabase/client'
import type { Page } from '@/types/page.types'
import type { PageNode } from '@/types/page.types'

/** 로그인한 유저의 모든 페이지 조회 (position 순 정렬) */
export async function getPages(): Promise<Page[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching pages:', error)
    return []
  }
  return (data || []) as Page[]
}

/** 평면 배열을 parent_id 기준 트리로 변환 */
export function buildPageTree(pages: Page[], parentId: string | null = null): PageNode[] {
  return pages
    .filter((p) => p.parent_id === parentId)
    .sort((a, b) => a.position - b.position)
    .map((page) => ({
      ...page,
      children: buildPageTree(pages, page.id),
    }))
}

/** 단일 페이지 조회 */
export async function getPage(pageId: string): Promise<Page | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data as Page
}

/** 새 페이지 생성 (icon 기본 null) */
export async function createPage(
  title: string,
  parentId: string | null = null,
  content: any = null
): Promise<Page> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: siblings } = await supabase
    .from('pages')
    .select('position')
    .eq('user_id', user.id)
    .is('parent_id', parentId)
    .order('position', { ascending: false })
    .limit(1)

  const position = (siblings?.[0]?.position ?? -1) + 1

  const { data, error } = await supabase
    .from('pages')
    .insert({
      user_id: user.id,
      parent_id: parentId,
      title: title || '제목 없음',
      icon: null,
      content,
      position,
    })
    .select()
    .single()

  if (error) throw error
  return data as Page
}

/** 페이지 수정 (title, icon, content 등) */
export async function updatePage(
  pageId: string,
  updates: Partial<Pick<Page, 'title' | 'icon' | 'content' | 'position' | 'parent_id'>>
): Promise<Page> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pages')
    .update(updates)
    .eq('id', pageId)
    .select()
    .single()

  if (error) throw error
  return data as Page
}

/** 페이지 삭제 */
export async function deletePage(pageId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('pages').delete().eq('id', pageId)
  if (error) throw error
}

/** 트리에서 id 로 노드 찾기 (DnD 시 부모/자식 목록 계산용) */
export function findPageNode(nodes: PageNode[], id: string): PageNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    const found = findPageNode(n.children, id)
    if (found) return found
  }
  return null
}

/** droppableId 에 해당하는 목록의 ordered ids (list-root 또는 list-{pageId}) */
export function getOrderedIdsForDroppable(droppableId: string, rootNodes: PageNode[]): string[] {
  if (droppableId === 'list-root') return rootNodes.map((n) => n.id)
  const pageId = droppableId.replace(/^list-/, '')
  const node = findPageNode(rootNodes, pageId)
  return node ? node.children.map((c) => c.id) : []
}

/** 드래그 앤 드롭 후 여러 페이지의 parent_id, position 한 번에 업데이트 */
export type ReorderUpdate = { id: string; parent_id: string | null; position: number }

export async function reorderPages(updates: ReorderUpdate[]): Promise<void> {
  const supabase = createClient()
  for (const u of updates) {
    const { error } = await supabase
      .from('pages')
      .update({ parent_id: u.parent_id, position: u.position })
      .eq('id', u.id)
    if (error) throw error
  }
}
