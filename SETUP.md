# EasyBrain 설정 가이드

## 1. 패키지 설치

네트워크 연결이 안정적인 환경에서 다음 명령어를 실행하세요:

```bash
npm install
```

## 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성하세요.
2. 프로젝트 설정에서 다음 정보를 확인하세요:
   - Project URL
   - Anon (public) key
   - Service Role key (서버 사이드에서만 사용)

## 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 4. 데이터베이스 마이그레이션

Supabase Dashboard의 SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 파일의 내용을 실행하세요.

이 SQL 파일은 다음을 포함합니다:
- 모든 테이블 생성 (categories, folders, tasks, tags, task_tags, task_attachments, task_reminders, task_links)
- 인덱스 생성 (성능 최적화)
- RLS (Row Level Security) 정책 설정
- 트리거 함수 (updated_at 자동 업데이트)

## 5. Storage 버킷 설정 (선택사항)

이미지 첨부 기능을 사용하려면 Supabase Storage에 버킷을 생성하세요:

1. Supabase Dashboard > Storage
2. 새 버킷 생성: `task-attachments`
3. Public access 설정 (또는 RLS 정책 설정)

## 6. PWA 아이콘 추가

`public/` 폴더에 다음 아이콘 파일을 추가하세요:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

온라인 도구를 사용하여 아이콘을 생성할 수 있습니다:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## 7. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 8. 프로덕션 빌드

```bash
npm run build
npm start
```

## 문제 해결

### PWA가 작동하지 않는 경우

- `next.config.js`에서 `disable: process.env.NODE_ENV === 'development'`로 설정되어 있어 개발 모드에서는 PWA가 비활성화됩니다.
- 프로덕션 빌드에서만 PWA가 활성화됩니다.

### 인증이 작동하지 않는 경우

- `.env.local` 파일의 Supabase URL과 키가 올바른지 확인하세요.
- Supabase Dashboard에서 Authentication > Providers에서 Email provider가 활성화되어 있는지 확인하세요.

### RLS 정책 오류

- Supabase Dashboard > Authentication > Policies에서 RLS가 활성화되어 있는지 확인하세요.
- 마이그레이션 SQL이 올바르게 실행되었는지 확인하세요.

## 다음 단계

프로젝트가 정상적으로 실행되면 다음 기능을 구현할 수 있습니다:

1. **Task CRUD**: Task 생성, 읽기, 수정, 삭제
2. **Folder 트리**: 재귀적 폴더 구조 UI
3. **Markdown 에디터**: Task 내용 편집
4. **@멘션 기능**: Task 간 링크 생성
5. **백링크 표시**: 연결된 Task 표시
6. **Import/Export**: Markdown 형식으로 데이터 내보내기/가져오기
7. **무한 스크롤**: 대용량 데이터 처리
