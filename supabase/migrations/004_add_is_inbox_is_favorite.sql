-- ============================================================
-- Pages 테이블에 is_inbox, is_favorite 컬럼 추가
-- ============================================================

-- is_inbox 컬럼 추가 (인박스 기능용)
ALTER TABLE public.pages 
  ADD COLUMN IF NOT EXISTS is_inbox BOOLEAN NOT NULL DEFAULT false;

-- is_favorite 컬럼 추가 (즐겨찾기 기능용)
ALTER TABLE public.pages 
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;

-- 인덱스 추가 (인박스 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_pages_user_is_inbox 
  ON public.pages (user_id, is_inbox);

-- 인덱스 추가 (즐겨찾기 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_pages_user_is_favorite 
  ON public.pages (user_id, is_favorite);
