-- ============================================================
-- Pages 테이블: Notion 스타일 통합 페이지 (카테고리/폴더/태스크 통합)
-- parent_id = null 이면 최상위 페이지(구 카테고리)
-- 무한 뎁스: parent_id 로 다른 페이지를 부모로 지정 가능
-- ============================================================

-- 기존 categories, folders, tasks 는 유지하되 새 기능은 pages 로 구현
-- (선택사항: 기존 테이블 마이그레이션 후 삭제하려면 별도 마이그레이션에서 처리)

CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  icon TEXT DEFAULT NULL,
  content JSONB DEFAULT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스: 부모별 순서 조회, 사용자별 조회
CREATE INDEX IF NOT EXISTS idx_pages_user_parent_position
  ON public.pages (user_id, parent_id, position);

CREATE INDEX IF NOT EXISTS idx_pages_parent_id
  ON public.pages (parent_id);

-- RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- 정책: 자신의 페이지만 조회/삽입/수정/삭제
CREATE POLICY "Users can read own pages"
  ON public.pages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pages"
  ON public.pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pages"
  ON public.pages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pages"
  ON public.pages FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 갱신 (001_initial_schema.sql 에서 정의된 update_updated_at_column 사용)
DROP TRIGGER IF EXISTS update_pages_updated_at ON public.pages;
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
