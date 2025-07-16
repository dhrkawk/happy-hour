# Happy Hour 프로젝트

## 1. 개요

**Happy Hour**는 소상공인의 노쇼 및 유휴 시간을 실시간 할인 슬롯으로 수익화하고, 소비자에게는 즉각적인 할인 기회를 제공하는 위치 기반 플랫폼입니다. 이 프로젝트는 "놓치면 후회한다(FOMO)"는 심리와 "전략적 타임 세일"을 결합하여 소상공인과 소비자 모두에게 가치를 제공하는 것을 목표로 합니다.

## 2. 기술 스택

본 프로젝트는 MVP(최소 기능 제품)의 빠른 개발과 데이터 기반 가설 검증에 최적화된 현대적인 기술 스택을 채택했습니다.

- **Frontend**: [Next.js](https://nextjs.org/) + [React Query](https://tanstack.com/query/latest) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database & Auth**: [Supabase](https://supabase.io/)
- **Deployment**: [Vercel](https://vercel.com/) (Frontend), [Fly.io](https://fly.io/) (Backend)
- **CI/CD**: [GitHub Actions](https://github.com/features/actions)

## 3. 프로젝트 구조

본 프로젝트는 코드의 재사용성과 유지보수성을 극대화하기 위해 **모노레포(Monorepo)** 구조를 채택했습니다. `apps`와 `packages` 두 개의 최상위 디렉토리로 구성됩니다.

```
/
├── apps/
│   ├── web/      # Next.js 프론트엔드 애플리케이션
│   └── api/      # FastAPI 백엔드 애플리케이션
├── packages/
│   ├── ui/       # 공통 React UI 컴포넌트
│   ├── db/       # 데이터베이스 스키마 및 클라이언트
│   ├── auth/     # 인증 관련 공통 로직
│   └── utils/    # 기타 공통 유틸리티
└── README.md
```

### 3.1. `apps`

실제로 배포되는 애플리케이션들이 위치하는 디렉토리입니다.

- **`apps/web`**: 사용자가 직접 상호작용하는 웹 애플리케이션입니다. Next.js를 사용하여 서버 사이드 렌더링(SSR)과 정적 사이트 생성(SSG)을 지원하며, React Query를 통해 서버 상태를 관리하고 Tailwind CSS로 스타일링합니다.
- **`apps/api`**: FastAPI를 사용하여 구현된 백엔드 API 서버입니다. 비동기 처리를 통해 높은 성능을 제공하며, Supabase와 연동하여 데이터베이스 및 인증을 처리합니다.

### 3.2. `packages`

여러 애플리케이션에서 공통으로 사용되는 코드들을 모아놓은 라이브러리(패키지) 디렉토리입니다.

- **`packages/ui`**: 버튼, 인풋, 카드 등 프로젝트 전반에서 사용되는 공통 UI 컴포넌트들을 포함합니다. 이를 통해 일관된 디자인 시스템을 유지하고 코드 중복을 줄입니다.
- **`packages/db`**: Supabase 데이터베이스 스키마 정의, 마이그레이션 스크립트, 데이터베이스 클라이언트 등을 관리합니다.
- **`packages/auth`**: Supabase Auth를 기반으로 한 로그인, 회원가입, 세션 관리 등 인증 관련 로직을 공통 모듈로 분리하여 `web`과 `api` 양쪽에서 모두 사용할 수 있도록 합니다.
- **`packages/utils`**: 날짜 포맷팅, 데이터 검증 등 특정 도메인에 종속되지 않는 순수 유틸리티 함수들을 포함합니다.

## 4. 설계 원칙

- **도메인 기반 분리 (Domain-Driven Design)**: 각 `package`는 명확한 책임(UI, DB, Auth 등)을 가집니다. 이를 통해 코드의 응집도를 높이고 결합도를 낮춥니다.
- **관심사 분리 (Separation of Concerns)**: 프론트엔드(`apps/web`)와 백엔드(`apps/api`)를 명확하게 분리하여 독립적인 개발 및 배포가 가능하도록 합니다.
- **재사용성 (Reusability)**: 공통 로직을 `packages`로 추출하여 여러 애플리케이션에서 쉽게 재사용하고, 코드 중복을 최소화합니다.
- **확장성 (Scalability)**: 모노레포 구조는 향후 새로운 애플리케이션(예: 어드민 대시보드, 모바일 앱)을 추가하거나, 새로운 공통 패키지를 도입하기에 용이합니다.

## 5. 시작하기

프로젝트를 로컬 환경에서 실행하기 위한 자세한 방법은 각 `apps` 및 `packages` 디렉토리의 README 파일을 참고하십시오. (추후 작성 예정)
