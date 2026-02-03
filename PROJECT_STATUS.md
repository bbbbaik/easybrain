# EasyBrain 프로젝트 상태 요약

## 📁 폴더 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (PageProvider 포함)
│   ├── page.tsx            # 메인 대시보드 (Sidebar + PageEditor)
│   ├── login/page.tsx      # 로그인 페이지
│   ├── signup/page.tsx     # 회원가입 페이지
│   └── app/                # (레거시, 사용 안 함)
│
├── components/
│   ├── PageTree.tsx        # 재귀 페이지 트리 (DnD 지원)
│   ├── PageEditor.tsx      # Tiptap 기반 페이지 에디터 (Auto-save)
│   ├── Sidebar.tsx         # 사이드바 (페이지 트리 + 새 페이지 버튼)
│   ├── Providers.tsx       # PageProvider 래퍼
│   ├── CategoryTree.tsx    # (레거시, 사용 안 함)
│   ├── FolderTree.tsx      # (레거시, 사용 안 함)
│   ├── TaskList.tsx        # (레거시, 사용 안 함)
│   ├── TaskEditor.tsx      # (레거시, 사용 안 함)
│   └── ui/                 # Shadcn UI 컴포넌트
│       ├── button.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       └── ...
│
├── contexts/
│   ├── PageContext.tsx     # 페이지 전역 상태 (pages, pageTree, selectedPageId)
│   ├── FolderContext.tsx   # (레거시, 사용 안 함)
│   └── ReorderContext.tsx  # (레거시, 사용 안 함)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # 브라우저용 Supabase 클라이언트
│   │   ├── server.ts        # 서버용 Supabase 클라이언트
│   │   ├── pages.ts         # Pages CRUD API (getPages, createPage, updatePage, deletePage, reorderPages)
│   │   ├── tasks.ts         # (레거시, 사용 안 함)
│   │   └── categories-folders.ts  # (레거시, 사용 안 함)
│   ├── utils.ts            # 유틸리티 함수
│   ├── markdown.ts          # (미사용)
│   └── mentions.ts         # (미사용)
│
└── types/
    ├── page.types.ts       # Page, PageNode 인터페이스
    ├── category-folder.types.ts  # (레거시)
    └── database.types.ts   # (미사용)

supabase/migrations/
├── 001_initial_schema.sql  # 초기 스키마 (categories, folders, tasks 등)
├── 002_tasks_position.sql  # tasks 테이블에 position 컬럼 추가
└── 003_pages.sql           # pages 테이블 생성 (최신)
```

---

## 🛠 설치된 기술 스택

### 핵심 프레임워크
- **Next.js** `^14.2.0` (App Router)
- **React** `^18.3.0`
- **TypeScript** `^5.4.0`

### UI 라이브러리
- **Shadcn UI** (Radix UI 기반)
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-scroll-area`
  - `@radix-ui/react-separator`
- **Lucide React** `^0.344.0` (아이콘)
- **Tailwind CSS** `^3.4.1` (스타일링)

### 에디터
- **Tiptap** `^3.18.0`
  - `@tiptap/react`
  - `@tiptap/starter-kit`
  - `@tiptap/extension-placeholder`

### 드래그 앤 드롭
- **@hello-pangea/dnd** `^18.0.1` (react-beautiful-dnd 포크)

### 백엔드/데이터베이스
- **Supabase**
  - `@supabase/supabase-js` `^2.39.0`
  - `@supabase/ssr` `^0.1.0`
  - `@supabase/auth-helpers-nextjs` `^0.15.0`

### 상태 관리
- **React Context API** (PageContext)

### 기타
- **next-pwa** `^5.6.0` (PWA 지원)
- **zod** `^3.22.4` (스키마 검증)
- **class-variance-authority** (CVA, 스타일 변형)
- **tailwind-merge** (Tailwind 클래스 병합)

---

## 🗄 데이터베이스 스키마

### 주요 테이블

#### 1. `pages` (최신 - Notion 스타일 통합 엔티티)
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- parent_id: UUID (FK → pages, nullable) -- null이면 최상위
- title: TEXT
- icon: TEXT (nullable)
- content: JSONB (nullable) -- Tiptap 문서 저장
- position: INTEGER -- 순서
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**특징:**
- 무한 뎁스: `parent_id`로 재귀 구조
- RLS: 사용자는 자신의 페이지만 접근 가능
- 인덱스: `(user_id, parent_id, position)`, `(parent_id)`

#### 2. `categories` (레거시)
- 카테고리 관리 (name, color, icon, position)

#### 3. `folders` (레거시)
- 재귀 폴더 구조 (category_id 또는 parent_id)

#### 4. `tasks` (레거시)
- 태스크 관리 (title, content, folder_id, status, position 등)

**참고:** 현재는 `pages` 테이블만 사용 중. 기존 테이블은 유지되어 있으나 신규 기능은 모두 `pages`로 구현됨.

---

## 🔄 최근 변경사항

### 아키텍처 전면 리팩토링 (최근)

**Before:** `categories` → `folders` → `tasks` 3단 구조  
**After:** `pages` 단일 테이블 (Notion 스타일)

#### 주요 변경점:

1. **통합 엔티티 (`pages`)**
   - 카테고리/폴더/태스크 구분 제거
   - 모든 것을 "페이지"로 통합
   - `parent_id`로 무한 뎁스 지원

2. **컴포넌트 단순화**
   - `CategoryTree`, `FolderTree`, `TaskList` → `PageTree` (재귀 컴포넌트)
   - `TaskEditor` → `PageEditor` (Tiptap 기반)
   - `FolderContext`, `ReorderContext` → `PageContext` (단일 컨텍스트)

3. **DnD 로직 단순화**
   - 같은 타입(`PAGE`)으로 통일
   - `reorderPages()` API로 순서/이동 일괄 처리

4. **Auto-save**
   - 제목/본문 변경 시 1초 Debounce 후 자동 저장
   - 저장 상태 표시 ("저장 중...", "저장됨")

5. **UI/UX**
   - Notion 스타일 에디터 (큰 제목 + 본문)
   - 사이드바: 재귀 트리 + 드래그 앤 드롭
   - 페이지 선택 시 즉시 로드

---

## 📝 현재 사용 중인 주요 파일

### 활성화된 컴포넌트
- ✅ `PageTree.tsx` - 재귀 페이지 트리
- ✅ `PageEditor.tsx` - Tiptap 에디터 (Auto-save)
- ✅ `Sidebar.tsx` - 메인 사이드바
- ✅ `Providers.tsx` - PageProvider 래퍼

### 활성화된 Context
- ✅ `PageContext.tsx` - 페이지 전역 상태

### 활성화된 API
- ✅ `lib/supabase/pages.ts` - Pages CRUD

### 레거시 (사용 안 함, 추후 삭제 가능)
- ❌ `CategoryTree.tsx`, `FolderTree.tsx`, `TaskList.tsx`, `TaskEditor.tsx`
- ❌ `FolderContext.tsx`, `ReorderContext.tsx`
- ❌ `lib/supabase/tasks.ts`, `lib/supabase/categories-folders.ts`
- ❌ `types/category-folder.types.ts`

---

## 🎯 현재 기능

1. ✅ 사용자 인증 (Supabase Auth)
2. ✅ 페이지 생성/수정/삭제
3. ✅ 무한 뎁스 페이지 트리
4. ✅ 드래그 앤 드롭 (순서 변경, 이동)
5. ✅ Tiptap 에디터 (Rich Text)
6. ✅ Auto-save (Debounce 1초)
7. ✅ PWA 지원

---

## 🚀 다음 단계 (제안)

1. 레거시 코드 정리 (CategoryTree, FolderTree 등 삭제)
2. 기존 테이블 마이그레이션 (categories/folders/tasks → pages)
3. 검색 기능 추가
4. 페이지 공유 기능
5. 태그/메타데이터 추가
