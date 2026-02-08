-- ============================================================
-- Pages 테이블에 is_deleted 컬럼 추가 (Soft Delete / 휴지통)
-- ============================================================

-- is_deleted 컬럼 추가 (휴지통: true = 삭제됨, false = 정상)
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- 휴지통 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_pages_user_is_deleted
  ON public.pages (user_id, is_deleted);
