# Technical Requirements Document (TRD)

## 1. Executive Technical Summary
- **프로젝트 개요**  
  위치 기반 모바일·웹 플랫폼으로 소상공인의 빈 시간대에 실시간 할인 슬롯을 등록·노출하여 매출을 창출하고, 소비자는 즉시 선결제 할인 기회를 이용할 수 있는 시스템입니다. Next.js SSR을 통한 웹·PWA 지원, React Native 모바일 앱, Supabase(Postgres) 기반 백엔드, Python AI 마이크로서비스로 구성합니다.
- **핵심 기술 스택**  
  - 프런트엔드(Web): Next.js (React, Tailwind CSS)  
  - 모바일 앱: React Native  
  - 백엔드/API: Next.js API Routes + Supabase (Auth, Postgres, Realtime)  
  - AI 마이크로서비스: Python (FastAPI, scikit-learn)  
  - 푸시·지오펜싱: Firebase Cloud Messaging + React Native Background Geolocation  
  - 결제 통합: Stripe (PCI-DSS 준수)  
  - 인프라: Docker, Kubernetes (EKS/GKE), GitHub Actions CI/CD  
- **주요 기술 목표**  
  - 서버 응답 시간 200ms 이내  
  - 동시 접속자 10만 이상 대응  
  - 결제 성공률 99% 이상  
  - 푸시 송신 지연 2초 이내  
- **핵심 기술 가정**  
  - Supabase Realtime이 WebSocket 기반 실시간 알림 처리 가능  
  - AI 모델 추론은 FastAPI 컨테이너로 수평 확장  
  - Firebase FCM을 통한 지오펜싱 푸시 신뢰도 확보  
  - Next.js ISR/SSR로 고성능 SEO 및 초기 로딩 성능 달성  

## 2. Tech Stack

| Category            | Technology / Library             | Reasoning (선택 이유)                               |
| ------------------- | -------------------------------- | -------------------------------------------------- |
| Frontend (Web)      | Next.js                          | SSR/ISR로 빠른 렌더링, SEO, PWA 지원               |
| UI Styling          | Tailwind CSS                     | 유연한 유틸리티 기반 스타일링, 낮은 러닝 커브      |
| Map SDK (Web)       | Next.js Map SDK                  | PRD 요구사항 준수, 지연 최소화                     |
| Mobile App          | React Native                     | iOS/Android 단일 코드베이스, 풍부한 생태계         |
| Map SDK (Mobile)    | react-native-maps                | 네이티브 지도 렌더링, 커스텀 마커 지원             |
| State Management    | React Query                      | 서버 상태 관리, 캐싱, 동기화 간소화                |
| Backend/API         | Next.js API Routes               | FE/BFF 통합, 빠른 개발 사이클                       |
| Database            | Supabase (Postgres)              | 관리형 Postgres + Auth + Realtime 통합 제공        |
| Realtime            | Supabase Realtime                | WebSocket 기반 실시간 데이터 업데이트              |
| AI Microservice     | Python + FastAPI                 | 머신러닝 모델 호스팅, 경량 API 서버 구축 용이       |
| Machine Learning    | scikit-learn, pandas             | 노쇼예측(RandomForest), 추천 점수, 베이지안 최적화 |
| Authentication      | Supabase Auth (JWT)              | 이메일/소셜 로그인, JWT 기반 간편 인증             |
| Payment Gateway     | Stripe                           | PCI-DSS 준수, 다양한 결제 수단 지원                |
| Push & Geofencing   | Firebase Cloud Messaging         | 안정적인 푸시, 지오펜싱 연동 지원                  |
| Containerization    | Docker                           | 마이크로서비스 패키징, 일관된 배포 환경 제공        |
| Orchestration       | Kubernetes (EKS/GKE)             | 오토스케일, 멀티테넌시 환경 대응                   |
| CI/CD               | GitHub Actions                   | 코드 빌드·테스트·배포 자동화                       |
| Monitoring & Metrics| Prometheus + Grafana             | 시스템 성능 모니터링, 시각화                       |
| CDN & Caching       | Cloudflare                       | 정적 자산 캐싱, 글로벌 엣지 네트워크 이용           |

## 3. System Architecture Design

### Top-Level Building Blocks
- **웹 프런트엔드 (Next.js)**  
  - SSR/ISR 페이지 렌더링  
  - 지도 UI, 검색·필터, 결제 화면  
- **모바일 앱 (React Native)**  
  - 지도, 지오펜싱, 푸시 알림, QR 바우처 스캔  
- **BFF/API 레이어 (Next.js API Routes)**  
  - 클라이언트 요청 인증·인가, 비즈니스 로직 오케스트레이션  
  - Supabase, AI 서비스, PG, 외부 API 연동  
- **데이터 저장소 (Supabase/Postgres)**  
  - 슬롯·유저·거래 로그 저장  
  - Realtime 채널을 통한 실시간 업데이트  
- **AI 마이크로서비스 (Python FastAPI)**  
  - 노쇼 예측, 추천 점수 계산, 할인율 최적화  
- **외부 통합 서비스**  
  - Google Calendar API (예약 캘린더 자동 감지)  
  - Stripe (결제)  
  - Firebase FCM (푸시)  
- **인프라 & 운영**  
  - Docker 컨테이너, Kubernetes 클러스터  
  - GitHub Actions CI/CD, Prometheus/Grafana 모니터링  

### Top-Level Component Interaction Diagram
```mermaid
graph TD
    WebApp[웹/모바일 앱] -->|API 요청| API[Next.js BFF]
    API -->|CRUD| DB[Supabase(Postgres)]
    API -->|실시간| RT[Supabase Realtime]
    API -->|AI 추론| AI[Python FastAPI 서비스]
    API -->|결제 처리| PG[Stripe]
    API -->|캘린더 조회| Cal[Google Calendar API]
    API -->|푸시 전송| FCM[Firebase Cloud Messaging]
    RT -->|업데이트| WebApp
```
- 웹/모바일 앱이 Next.js BFF로 모든 비즈니스 요청 전송  
- BFF는 Supabase DB와 Realtime 채널을 통해 CRUD 및 실시간 이벤트 처리  
- 할인 추천·노쇼 예측은 Python FastAPI 호출로 처리  
- 결제, 캘린더, 푸시는 각각 Stripe, Google Calendar API, Firebase FCM 연동  

### Code Organization & Convention

**도메인 기반 조직 전략**  
- **Domain Separation**: user, merchant, slot, payment, notification, ai, admin  
- **Layer-Based Architecture**: presentation(web/mobile), service, repository(data access), infra(external integration)  
- **Feature-Based Modules**: 각 도메인별 기능 모듈 단위로 그룹화  
- **Shared Components**: UI 컴포넌트, 유틸리티, 타입 정의는 libs 폴더에 분리  

**Universal File & Folder Structure**
```
/
├── apps
│   ├── web                # Next.js 웹 애플리케이션
│   └── mobile             # React Native 모바일 앱
├── services
│   ├── ai-service         # Python FastAPI 마이크로서비스
│   └── notification       # FCM 푸시/지오펜싱 백그라운드 워커
├── packages
│   ├── db                 # 공통 데이터베이스 스키마·ORM
│   ├── auth               # JWT 인증, 미들웨어
│   └── utils              # 유틸리티 함수
├── infra
│   ├── k8s                # Kubernetes 매니페스트
│   └── terraform          # 클라우드 인프라 정의
├── .github
│   └── workflows          # CI/CD 파이프라인
└── README.md
```

### Data Flow & Communication Patterns
- **Client-Server Communication**: RESTful API + WebSocket 기반 실시간 업데이트  
- **Database Interaction**: Supabase Postgres ORM(Query Builder) + 인덱싱  
- **External Service Integration**: Stripe SDK, Google Calendar API, Firebase Admin SDK  
- **Real-time Communication**: Supabase Realtime (Postgres Listen/Notify)  
- **Data Synchronization**: BFF에서 트랜잭션 처리 후 Realtime 채널 푸시로 클라이언트 동기화  

## 4. Performance & Optimization Strategy
- CDN 엣지 캐싱 및 Next.js ISR 적용으로 정적 자산·페이지 성능 최적화  
- Postgres 인덱스 설계 및 주요 쿼리 튜닝  
- Kubernetes HPA(Auto Scaling) 설정으로 동시 접속 부하 대응  
- React Query 캐싱·갱신 전략으로 불필요한 API 호출 최소화  

## 5. Implementation Roadmap & Milestones

### Phase 1: Foundation (MVP 구현, 6주)
- **Core Infrastructure**: Kubernetes 클러스터, Supabase 프로비저닝, CI/CD 파이프라인  
- **Essential Features**: 슬롯 등록/노출, 지도 탐색, 결제→QR 바우처, 지오푸시 기본  
- **Basic Security**: HTTPS, JWT 인증, Stripe PCI-DSS 연동  
- **Development Setup**: 로컬 개발 환경, 테스트 DB, PR 리뷰 프로세스  
- **Timeline**: 6주

### Phase 2: Feature Enhancement (4주)
- **Advanced Features**: 자동 캘린더 연동, AI 할인 추천, 브랜드 보호 배지  
- **Performance Optimization**: DB 인덱스, SSR 캐싱, HPA 튜닝  
- **Enhanced Security**: CSRF 방어, 입력 검증, 취약점 스캔  
- **Monitoring Implementation**: Prometheus 알림, Grafana 대시보드  
- **Timeline**: 4주

### Phase 3: Scaling & Optimization (12주)
- **Scalability Implementation**: 멀티 리전, 멀티테넌시 네임스페이스  
- **Advanced Integrations**: 카카오 예약 API, 기타 PG 연동  
- **Enterprise Features**: 관리자 대시보드, 리포트, 충실한 다국어 지원  
- **Compliance & Auditing**: PCI-DSS 심사, 로그 감사 시스템  
- **Timeline**: 12주

## 6. Risk Assessment & Mitigation Strategies

### Technical Risk Analysis
- **Technology Risks**: Supabase Realtime 한계 → WebSocket Fallback 또는 Redis Pub/Sub 도입  
- **Performance Risks**: Postgres 스케일링 병목 → Read Replica, 쿼리 분할  
- **Security Risks**: JWT 탈취·위조 → 토큰 서명 강화, 단기 유효 기간  
- **Integration Risks**: 외부 API 가용성 → 서킷 브레이커 패턴, 백오프 재시도  
- **Mitigation Strategies**: 장애 대응용 폴백 루트, 모니터링 알림, 정기 부하 테스트  

### Project Delivery Risks
- **Timeline Risks**: 외부 연동 지연 → 우선 순위 조정, Stub API 활용 paralelo 개발  
- **Resource Risks**: AI 모델 전문인력 부족 → 사전 PoC, 외부 컨설팅 활용  
- **Quality Risks**: 테스트 커버리지 부족 → E2E, 단위 테스트 스크립트 자동화  
- **Deployment Risks**: 프로덕션 환경 차이 → 카나리 배포, 블루-그린 전략  
- **Contingency Plans**: MVP 범위 축소, 단계별 출시 계획 조정  

