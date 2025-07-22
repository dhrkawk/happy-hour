# 🕒 Happy Hour

Happy Hour는 소상공인의 유휴 시간을 실시간 할인으로 전환하여 수익을 증대시키고, 소비자에게는 주변 가게의 즉석 할인 혜택을 제공하는 위치 기반 서비스입니다.

## ✨ Core Features

- **사장님 (Store Owners)**
  - 간편한 할인 등록: 몇 번의 클릭만으로 할인율, 수량, 유효 시간을 설정하여 '해피아워'를 등록할 수 있습니다.
  - 브랜드 가치 보호: 하루에 등록할 수 있는 횟수를 제한하여 무분별한 할인을 방지합니다.
- **고객 (Customers)**
  - 실시간 주변 할인 검색: 지도를 통해 내 주변에서 진행 중인 해피아워를 실시간으로 찾아볼 수 있습니다.
  - 다양한 필터 옵션: 카테고리, 거리, 가격 등 원하는 조건으로 가게를 필터링합니다.
  - 즉각적인 혜택: 남은 시간과 수량을 확인하고 즉시 할인을 이용할 수 있습니다.

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn/ui](https://ui.shadcn.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **State Management**: Next.js RSC, Server Actions, and Client-side fetching
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & Platform

- **Platform**: [Supabase](https://supabase.com/)
- **Database**: Supabase Postgres with RLS
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

## 🚀 Getting Started

### Prerequisites

- Node.js (v22.x or higher)
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

프로젝트 루트의 `frontend` 디렉토리에 `.env.local` 파일을 생성하고 Supabase 프로젝트의 키를 추가하세요.

```plaintext
# .env.local

NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 4. Run the development server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗂️ Project Structure

```
happy-hour/
├── frontend/
│   ├── app/
│   │   ├── (auth)/         # Auth pages (Login, Signup)
│   │   ├── (protected)/    # Pages requiring authentication
│   │   ├── api/            # API Routes
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main landing page
│   ├── components/
│   │   ├── ui/             # Reusable UI components from Shadcn/ui
│   │   └── ...             # Custom components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/
│   │   ├── supabase/       # Supabase client instances (client, server, middleware)
│   │   └── utils.ts        # Utility functions
│   ├── public/             # Static assets
│   ├── styles/             # Global styles
│   ├── middleware.ts       # Next.js middleware for auth redirection
│   ├── next.config.mjs     # Next.js configuration
│   ├── package.json
│   └── tsconfig.json
└── ...
```

## 🔐 Authentication

- **Session Management**: 인증은 `@supabase/ssr` 패키지를 사용하여 서버 사이드와 클라이언트 사이드에서 안전하게 처리됩니다.
- **Protected Routes**: `middleware.ts` 파일은 사용자가 로그인하지 않았을 경우 보호된 페이지(`(protected)` 레이아웃) 접근을 막고 로그인 페이지로 리디렉션합니다.
- **Row Level Security (RLS)**: 데이터베이스는 RLS 정책을 통해 보호됩니다. 사용자는 자신의 데이터에만 접근할 수 있으며, 정책은 Supabase 대시보드에서 관리됩니다.
