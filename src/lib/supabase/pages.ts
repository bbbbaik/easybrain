import { createClient } from '@/lib/supabase/client'
import type { Page } from '@/types/page.types'
import type { PageNode } from '@/types/page.types'

/** 평면 목록 조회 (parent_id 기준, null 이면 최상위) */
export async function getPages(parentId: string | null): Promise<Page[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('pages')
    .select('*')
    .eq('user_id', user.id)

  if (parentId === null) {
    query = query.is('parent_id', null)
  } else {
    query = query.eq('parent_id', parentId)
  }

  const { data, error } = await query.order('position', { ascending: true }).order('created_at', { ascending: true })
  if (error) {
    console.error('Error fetching pages:', error)
    return []
  }
  return (data || []) as Page[]
}

/** 사용자의 모든 페이지를 한 번에 조회 (트리 빌드용) */
export async function getAllPages(): Promise<Page[]> {
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
    console.error('Error fetching all pages:', error)
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

/** 트리에서 id 로 노드 찾기 */
export function findPageNode(nodes: PageNode[], id: string): PageNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    const found = findPageNode(n.children, id)
    if (found) return found
  }
  return null
}

/** droppableId 에 해당하는 목록의 ordered ids (DnD 시 사용) */
export function getOrderedIdsForDroppable(droppableId: string, rootNodes: PageNode[]): string[] {
  if (droppableId === 'root') return rootNodes.map((n) => n.id)
  const pageId = droppableId.replace(/^page-/, '')
  const node = findPageNode(rootNodes, pageId)
  return node ? node.children.map((c) => c.id) : []
}

/** 배열에서 fromIndex 항목을 toIndex 로 이동 */
export function arrayMove<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...arr]
  const [removed] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, removed)
  return next
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

/** 페이지 생성 */
export async function createPage(
  title: string,
  parentId: string | null = null,
  content: unknown = null
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
      content,
      position,
    })
    .select()
    .single()

  if (error) throw error
  return data as Page
}

/** 페이지 수정 (title, content, position, parent_id 등) */
export async function updatePage(
  pageId: string,
  updates: Partial<Pick<Page, 'title' | 'content' | 'icon' | 'position' | 'parent_id'>>
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

/** 같은 부모 내 순서 변경: orderedIds 순서대로 position 0,1,2,... */
export async function updatePagePositions(parentId: string | null, orderedIds: string[]): Promise<void> {
  const supabase = createClient()
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase.from('pages').update({ position: i }).eq('id', orderedIds[i])
    if (error) throw error
  }
}
