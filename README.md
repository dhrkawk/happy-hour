정확히 짚어줘서 고마워요.
그럼 Edge Function 제거된 기준으로 다시 정리한 README는 아래와 같습니다.

⸻

Happy Hour

🚀 프로젝트 개요

Happy Hour는 소상공인의 유휴 시간을 실시간 할인으로 수익화하고,
소비자에게는 즉시 할인 혜택을 제공하는 위치 기반 모바일/웹 플랫폼입니다.
FOMO(Fear of Missing Out)와 전략적 타임세일을 모두 만족시키는 것을 목표로 합니다.

⸻

✨ 주요 기능
	•	실시간 할인 검색 (소비자)
지도와 리스트를 통해 주변 할인 가게 탐색
거리순 / 카테고리 / 가격 필터 지원
남은 시간과 할인율을 실시간으로 확인 가능
	•	할인 슬롯 등록 (사업자)
서비스명, 할인율, 유효시간, 노출 대상(전체/단골), 수량 설정 가능
하루 2회 슬롯 제한으로 브랜드 가치 보호
	•	회원가입 및 온보딩
Supabase Auth 기반의 소셜 로그인 및 이메일 가입
최초 로그인 시 온보딩 페이지에서 사용자 정보 입력
프로필 정보는 클라이언트 사이드에서 Supabase로 직접 등록

⸻

🛠️ 기술 스택

프론트엔드
	•	Next.js App Router — 서버 컴포넌트 기반 React 프레임워크
	•	React Query (TanStack Query) — 클라이언트 API 데이터 관리
	•	Tailwind CSS — 유틸리티 기반 CSS 프레임워크
	•	Supabase JS Client — 인증 및 데이터 관리

백엔드 / 데이터 관리
	•	Supabase Postgres — RLS 기반 데이터베이스
	•	Supabase Auth — JWT 기반 인증 및 세션 관리
	•	Supabase Storage — 이미지 등 정적 자산 저장

⸻

🗂️ 프로젝트 구조

happy-hour/
├── app/                 # Next.js App Router 디렉토리
├── components/          # 재사용 가능한 컴포넌트
├── hooks/               # 커스텀 훅 모음
├── lib/                 # Supabase 클라이언트 및 유틸리티
├── public/              # 정적 자산
├── styles/              # 글로벌 스타일
├── supabase/            # Supabase 관련 설정
├── package.json
├── README.md
└── ...


⸻

⚙️ 환경 변수 설정

루트 디렉토리 .env.local

NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY


⸻

✅ 실행 방법

npm install
npm run dev


⸻

🔒 인증 및 보안 정책
	•	로그인 후 세션은 Supabase Auth로 자동 관리
	•	온보딩 페이지에서 프로필 정보 수집 후 DB에 직접 등록
	•	(Protected) 레이아웃에서 세션 및 프로필 유무 확인 후 접근 제어
	•	Row Level Security (RLS) 적용된 Supabase 테이블

⸻

📊 비용 최적화를 위한 전략
	•	Edge Function 사용 안함
	•	인증 요청 최소화 (SSR + 클라이언트 온보딩 체크 조합)
	•	Supabase API 호출 최적화

⸻

📈 향후 계획
	•	예약 시스템
	•	사업주 대시보드 기능
	•	클라이언트 사이드 캐싱 전략 보강

⸻

📝 참고사항

본 프로젝트는 Supabase 기반 BaaS로 운영됩니다.
클라이언트와 서버를 명확히 분리하여 관리하며,
Edge Function 없이 RLS + 온보딩 프로세스를 통해
인증과 사용자 데이터를 안전하게 처리합니다.

⸻