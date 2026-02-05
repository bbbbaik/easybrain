/** pages 테이블 스키마에 맞춘 단일 페이지 */
export interface Page {
  id: string
  user_id: string
  parent_id: string | null
  title: string
  icon: string | null
  content: any // JSON (Tiptap 문서 등)
  position: number
  is_inbox: boolean
  is_favorite: boolean
  created_at: string
  updated_at: string
  /** UI: 재귀 트리 렌더링용 자식 페이지 (옵셔널) */
  children?: Page[]
  /** UI: 들여쓰기용 깊이 (옵셔널) */
  depth?: number
}

/** 트리 노드: children 필수 (PageNode[]) */
export interface PageNode extends Page {
  children: PageNode[]
}
