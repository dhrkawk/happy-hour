# 🎓 아워캠퍼스(OurCampus)

아워캠퍼스는 대학생을 중심으로 교내 매장, 지역 상권, 학생회 혜택을 통합 제공하는 O2O 플랫폼입니다. 재학생 인증을 통해 전용 혜택을 누리고, 상점은 대학생 고객 확보와 매출 증대를, 학교·학생회는 복지 확대와 지역 연계를 실현합니다.

- **[아키텍쳐 설명서 보기](../아키텍쳐설명.pdf)**
- **[사업 계획서 보기](../사업계획서.pdf)**
- **MVP에선 시간 할인 기능인 Happy-Hour 기능만 구현**

## ✨ Core Features

- **학생(Users)**: 재학생 인증, 학교별 전용 혜택 페이지, 위치 기반 매장 탐색, 시간 한정/이벤트성 혜택 사용, 쿠폰 발급/활성화/소진.
- **상점(Store Owners)**: 이벤트/할인/증정(기프트) 등록 및 관리, 재고 기반 할인(remaining) 설정, 썸네일 업로드.
- **학교·학생회(Admin)**: 축제·시험기간 등 특정 기간 혜택 운영 및 홍보.

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js (App Router), React
- **UI**: Tailwind CSS, shadcn/ui, Lucide React
- **Data**: TanStack Query(React Query)
- **Validation**: Zod (공용 DTO/폼 스키마)
- **VM 레이어**: `lib/vm`에서 UI 친화 데이터 생성(select/useMemo)

### Backend & Platform

- **Platform**: Supabase (Postgres + RLS, Auth, Storage)
- **RPC**: 복합 조회/트랜잭션은 DB RPC로 처리 → 네트워크 최소화/원자성 보장
- **Auth/SSR**: `@supabase/ssr`를 통한 서버/클라이언트 세션 연동

## 🚀 Getting Started

### Prerequisites

- Node.js (v22+)
- pnpm

### 1. Clone the repository

```bash
git clone https://github.com/your-repo/happy-hour.git
cd happy-hour/frontend
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

`frontend` 디렉토리에 `.env.local`(또는 `.env`) 파일을 만들고 Supabase 키를 설정합니다.

```plaintext
# .env.local
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 4. Run the development server

```bash
pnpm run dev
```

브라우저에서 http://localhost:3000 으로 접속하세요.

## 🗂️ Project Structure

```
happy-hour/
├── frontend/
│   ├── app/
│   │   ├── (auth)/               # 로그인/회원가입 등
│   │   ├── (protected)/          # 인증 필요한 페이지들
│   │   └── api/                  # Next.js API Routes
│   ├── components/
│   │   ├── ui/
│   │   └── map/
│   ├── contexts/                 # 전역 상태(App/Cart)
│   ├── domain/
│   │   ├── entities/             # 엔티티 & 빌더
│   │   ├── repositories/         # Repo 인터페이스(포트)
│   │   └── schemas/              # 공용 Zod DTO
│   ├── infra/
│   │   └── supabase/
│   │       ├── repository/       # Repo 구현체(어댑터, RPC 호출)
│   │       └── shared/           # client/server/types(RPC 시그니처 포함)
│   ├── hooks/
│   │   └── usecases/             # React Query 훅 + VM select/useMemo
│   ├── lib/
│   │   └── vm/                   # ViewModel 빌더(+utils)
│   ├── middleware.ts
│   ├── next.config.mjs
│   └── tsconfig.json
└── backend/
    └── app/migrations/           # (선택) SQL 마이그레이션 샘플
```

## 🧱 Architecture (현재 구조)

- **Usecase 훅 = 무엇(호출+VM)**: `hooks/usecases/*.usecase.ts`에서 API 호출 후 `select/useMemo`로 VM 가공
- **API Route = 입구**: 파라미터 파싱/간단 검증(Zod) 후 Repo 구현체 호출
- **Repo 구현체 = 무엇+어떻게**: `infra/supabase/repository/*`가 RPC 호출 + Row→Entity 매핑
- **DB/RPC = 성능/원자성**: 복합 조회/다중 쓰기를 RPC 한 번으로 처리, 네트워크 최소화 및 트랜잭션 보장
- **VM 레이어**: `lib/vm/*`에서 UI 친화 데이터(거리/포맷/파생값) 생성

데이터 흐름(READ)
UI → Usecase 훅 → API Route → Repo(RPC) → DB → Repo(Entity) → API JSON → 훅 select/useMemo → VM

데이터 흐름(WRITE)
UI → useMutation → API Route(Zod DTO) → Repo(RPC 트랜잭션) → DB

## 🔐 Authentication

- **Session**: `infra/supabase/shared/{server,client}.ts`로 SSR/CSR 세션 일관 처리
- **Protected Routes**: `frontend/middleware.ts`에서 인증 가드로 `(protected)` 접근 제어
- **RLS**: Postgres RLS 정책으로 테이블 접근 제어, RPC와 결합해 보안 강화
