/** 단일 페이지 (Notion 스타일 통합 엔티티) */
export interface Page {
  id: string
  user_id: string
  parent_id: string | null
  title: string
  icon: string | null
  content: unknown // JSON (Tiptap 문서 등)
  position: number
  created_at: string
  updated_at: string
}

/** 트리 노드: 자식 페이지 배열 포함 */
export interface PageNode extends Page {
  children: PageNode[]
}
