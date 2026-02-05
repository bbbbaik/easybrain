/**
 * Page Service Layer
 * 
 * 컴포넌트에서 직접 Supabase를 호출하지 않고, 이 서비스를 통해서만 데이터를 주고받도록 추상화합니다.
 * DB 구조가 변경되어도 이 파일만 수정하면 UI에는 영향이 없도록 설계되었습니다.
 */

import { createClient } from '@/lib/supabase/client'
import type { Page, PageInsert, PageUpdate, PageNode } from '@/types/page'

/**
 * Inbox 페이지 목록 조회 (is_inbox = true인 페이지들만 최신순으로)
 */
export async function getInboxPages(): Promise<Page[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_inbox', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching inbox pages:', error)
    return []
  }
  return (data || []) as Page[]
}

/**
 * Sidebar용 트리 구조 조회 (is_inbox = false인 페이지들을 계층형 구조로 변환)
 * parent_id를 기준으로 재귀적으로 트리 구조를 만듭니다.
 */
export async function getSidebarTree(): Promise<PageNode[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_inbox', false)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching sidebar pages:', error)
    return []
  }

  const pages = (data || []) as Page[]
  return buildPageTree(pages)
}

/**
 * 평면 배열을 parent_id 기준 트리로 변환 (재귀 함수)
 */
function buildPageTree(pages: Page[], parentId: string | null = null): PageNode[] {
  return pages
    .filter((p) => p.parent_id === parentId)
    .sort((a, b) => a.position - b.position)
    .map((page) => ({
      ...page,
      children: buildPageTree(pages, page.id),
    }))
}

/**
 * 새 페이지 생성
 * 기본값 처리: is_inbox = false, is_favorite = false, position 자동 계산
 */
export async function createPage(data: PageInsert): Promise<Page> {
  const supabase = createClient()
  
  // 사용자 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('로그인이 풀렸습니다. 다시 로그인해주세요.')
  }

  // 같은 부모를 가진 형제 페이지들의 최대 position 찾기
  const { data: siblings } = await supabase
    .from('pages')
    .select('position')
    .eq('user_id', user.id)
    .is('parent_id', data.parent_id ?? null)
    .order('position', { ascending: false })
    .limit(1)

  const position = (siblings?.[0]?.position ?? -1) + 1

  // 기본값 설정 (명시적으로 모든 필드 포함)
  const insertData = {
    user_id: user.id, // 명시적으로 user_id 포함
    parent_id: data.parent_id ?? null,
    title: data.title || '제목 없음',
    icon: data.icon ?? null,
    content: data.content ?? null,
    position: data.position ?? position,
    is_inbox: data.is_inbox !== undefined ? data.is_inbox : false,
    is_favorite: data.is_favorite ?? false,
  }

  // insert 요청 (select().single()로 결과를 바로 받아옴)
  const { data: newPage, error } = await supabase
    .from('pages')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    // 상세한 에러 로깅
    console.error('Save Error Details:', {
      message: error.message,
      details: (error as any).details,
      hint: (error as any).hint,
      code: (error as any).code,
    })
    
    throw error
  }

  if (!newPage) {
    throw new Error('페이지 생성에 실패했습니다. 데이터를 받아오지 못했습니다.')
  }

  return newPage as Page
}

/**
 * 페이지 수정
 */
export async function updatePage(pageId: string, data: PageUpdate): Promise<Page> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: updatedPage, error } = await supabase
    .from('pages')
    .update(data)
    .eq('id', pageId)
    .eq('user_id', user.id) // 보안: 자신의 페이지만 수정 가능
    .select()
    .single()

  if (error) throw error
  return updatedPage as Page
}

/**
 * 페이지 삭제 (하위 페이지도 함께 삭제)
 * 
 * 참고: DB의 ON DELETE CASCADE 설정에 따라 자동으로 하위 페이지가 삭제됩니다.
 * 하지만 명시적으로 확인하고 처리하는 것이 더 안전합니다.
 */
export async function deletePage(pageId: string): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // 하위 페이지 확인 (선택사항: 삭제 전 확인)
  const { data: children } = await supabase
    .from('pages')
    .select('id')
    .eq('parent_id', pageId)
    .eq('user_id', user.id)

  if (children && children.length > 0) {
    console.warn(`Deleting page ${pageId} with ${children.length} child pages`)
    // DB의 CASCADE 설정에 따라 자동 삭제되지만, 필요시 여기서 명시적으로 삭제할 수 있습니다.
  }

  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', pageId)
    .eq('user_id', user.id) // 보안: 자신의 페이지만 삭제 가능

  if (error) throw error
}

/**
 * 단일 페이지 조회
 */
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

/**
 * 모든 페이지 조회 (평면 배열)
 */
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
