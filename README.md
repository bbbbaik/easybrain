# EasyBrain - 세컨드 브레인 Task 관리 서비스

확장성과 멀티 플랫폼(Web + App) 사용성을 갖춘 Task 관리 서비스입니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **PWA**: next-pwa
- **Language**: TypeScript

## 주요 기능

- ✅ 사용자 인증 (이메일 가입/로그인)
- ✅ RLS(Row Level Security) 기반 데이터 보안
- ✅ PWA 지원 (데스크탑/모바일 앱 설치)
- ✅ 오프라인 지원
- ✅ Markdown Import/Export
- ✅ 무한 스크롤/페이지네이션
- ✅ 계층적 구조: Category > Folder (무한 뎁스) > Task
- ✅ Task 간 양방향 링크 (@멘션, 백링크)

## 시작하기

### 1. 환경 변수 설정

`.env.local.example`을 참고하여 `.env.local` 파일을 생성하고 Supabase 프로젝트 정보를 입력하세요.

```bash
cp .env.local.example .env.local
```

### 2. 패키지 설치

```bash
npm install
```

### 3. Supabase 데이터베이스 설정

`supabase/migrations/001_initial_schema.sql` 파일의 SQL을 Supabase Dashboard의 SQL Editor에서 실행하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
├── src/
│   ├── app/              # Next.js App Router 페이지
│   ├── components/       # React 컴포넌트
│   ├── lib/             # 유틸리티 및 Supabase 클라이언트
│   └── types/           # TypeScript 타입 정의
├── supabase/
│   └── migrations/      # Supabase 마이그레이션 SQL
└── public/              # 정적 파일 (PWA 매니페스트 포함)
```

## 배포

프로덕션 빌드:

```bash
npm run build
npm start
```

## 라이선스

MIT
