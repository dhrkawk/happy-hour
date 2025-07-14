# Happy Hour

## 🚀 프로젝트 개요

Happy Hour는 소상공인의 노쇼 및 유휴 시간을 실시간 할인 슬롯으로 수익화하고, 소비자에게는 즉각적인 할인 기회를 제공하는 위치 기반 모바일/웹 플랫폼입니다. 'FOMO (Fear Of Missing Out)'와 '전략적 타임 세일'을 동시에 실현하는 것을 목표로 합니다.

## ✨ 주요 기능

-   **실시간 할인 검색 (소비자):** 지도 UI를 통해 주변 상점의 할인 슬롯을 검색하고, 거리, 카테고리, 가격 필터를 적용하여 원하는 할인을 찾을 수 있습니다. 슬롯 카드에는 서비스, 할인율, 남은 시간, FOMO 타이머가 표시됩니다.
-   **사업주 유휴 시간 등록:** 사업주는 서비스/상품, 할인율 (10~70%), 적용 시간, 노출 범위 (전체/단골), 슬롯 수량 등을 쉽게 설정하여 할인 슬롯을 등록할 수 있습니다.
-   **브랜드 보호:** 상점당 하루 2개의 'Happy Hour' 슬롯 제한, 'Special Time Deal' 배지, 정가 대비 할인율 표시 조절 등을 통해 사업주의 브랜드 가치를 보호합니다.

## 🛠️ 기술 스택

### 프론트엔드
-   **Next.js:** SSR (Server-Side Rendering) 및 PWA (Progressive Web App) 지원을 위한 React 프레임워크.
-   **React Query:** 데이터 페칭 및 상태 관리를 위한 라이브러리.
-   **Tailwind CSS:** 빠르고 유연한 UI 개발을 위한 유틸리티 우선 CSS 프레임워크.

### 백엔드
-   **FastAPI:** 경량 비동기 API 서버 구축을 위한 Python 웹 프레임워크.

### 데이터베이스 및 인증
-   **Supabase Postgres:** 관리형 PostgreSQL 데이터베이스.
-   **Supabase Auth:** JWT 기반의 간편한 사용자 인증 시스템.

### 배포
-   **Vercel (FE):** Next.js 애플리케이션의 빠르고 쉬운 배포.
-   **Fly.io (BE):** FastAPI 백엔드 애플리케이션 배포.

## ⚙️ 설치 및 실행

### 1. 환경 변수 설정

프로젝트 루트 디렉토리와 `frontend` 디렉토리에 `.env` 파일을 생성하고 Supabase 연결 정보를 추가해야 합니다.

**루트 디렉토리 (`/Users/m2nsteel/happy-hour/.env`)**
```env
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
```

**프론트엔드 디렉토리 (`/Users/m2nsteel/happy-hour/frontend/.env.local`)**
```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

`YOUR_SUPABASE_URL`과 `YOUR_SUPABASE_ANON_KEY`는 실제 Supabase 프로젝트의 URL과 Anon Key로 대체해야 합니다.

### 2. 백엔드 설정 및 실행

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. 프론트엔드 설정 및 실행

```bash
cd frontend
npm install
npm run dev
```

## 🚀 사용 방법

백엔드와 프론트엔드 서버가 모두 실행되면, 웹 브라우저에서 `http://localhost:3000` (프론트엔드 기본 포트)에 접속하여 애플리케이션을 사용할 수 있습니다.
