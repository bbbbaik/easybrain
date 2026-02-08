/**
 * Page 타입 정의
 * pages 테이블 스키마에 맞춘 TypeScript 인터페이스
 */

/** 전체 조회용 Page 타입 (DB에서 가져온 전체 데이터) */
export interface Page {
  id: string
  user_id: string
  parent_id: string | null
  title: string
  icon: string | null
  content: any // JSONB (Tiptap 문서 등)
  position: number
  is_inbox: boolean
  is_favorite: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  /** UI: 재귀 트리 렌더링용 자식 페이지 (옵셔널) */
  children?: Page[]
  /** UI: 들여쓰기용 깊이 (옵셔널) */
  depth?: number
}

/** 페이지 생성용 타입 (Insert) */
export interface PageInsert {
  parent_id?: string | null
  title: string
  icon?: string | null
  content?: any
  position?: number
  is_inbox?: boolean
  is_favorite?: boolean
}

/** 페이지 수정용 타입 (Update) */
export interface PageUpdate {
  parent_id?: string | null
  title?: string
  icon?: string | null
  content?: any
  position?: number
  is_inbox?: boolean
  is_favorite?: boolean
  is_deleted?: boolean
}

/** 트리 노드: children 필수 (재귀 구조) */
export interface PageNode extends Page {
  children: PageNode[]
}
