# 📦 해피아워 예약 플랫폼 DB 스키마 정리

---

## 📌 1. 테이블 구조 요약

### 1.1 user_profiles (사용자 프로필)

| 컬럼명         | 타입           | 설명 |
|----------------|----------------|------|
| user_id        | uuid (PK)      | 사용자 고유 ID (`auth.users.id` 참조) |
| email          | varchar        | 이메일 주소 |
| provider       | varchar        | 소셜 로그인 제공자 (예: google) |
| provider_id    | varchar        | 제공자별 고유 ID |
| name           | varchar        | 사용자 이름 |
| phone_number   | varchar        | 휴대폰 번호 |
| total_bookings | int4           | 총 예약 수 |
| total_savings  | int8           | 누적 절감액 |
| created_at     | timestamptz    | 생성일자 |
| updated_at     | timestamptz    | 수정일자 |
| role           | enum           | 사용자 역할 (customer, owner) |

---

### 1.2 stores (가게 정보)

| 컬럼명         | 타입        | 설명 |
|----------------|-------------|------|
| id             | uuid (PK)   | 가게 ID |
| name           | varchar     | 가게명 |
| address        | varchar     | 주소 |
| lat            | float8      | 위도 |
| lng            | float8      | 경도 |
| phone          | varchar     | 전화번호 |
| created_at     | timestamptz | 생성일자 |
| category       | varchar     | 업종 |
| activated      | boolean     | 활성화 여부 (지도에 노출 여부) |
| store_thumbnail| text        | 썸네일 이미지 URL |
| owner_id       | uuid        | 가게 소유자 ID (`auth.users.id` 참조) |
| menu_category  | ARRAY       | 메뉴 카테고리 목록 |
| partnership    | text        | 제휴 정보 |

---

### 1.3 store_menus (메뉴 정보)

| 컬럼명     | 타입      | 설명 |
|------------|-----------|------|
| id         | uuid (PK) | 메뉴 ID |
| store_id   | uuid      | 해당 가게 ID (`stores.id` 참조) |
| name       | varchar   | 메뉴명 |
| price      | int4      | 가격 |
| thumbnail  | text      | 이미지 URL |
| created_at | timestamptz | 생성일자 |
| description| text      | 메뉴 설명 |
| category   | text      | 메뉴 카테고리 |

---

### 1.4 discounts (할인 정보) ✅

| 컬럼명        | 타입         | 설명 |
|---------------|--------------|------|
| id            | uuid (PK)    | 할인 ID |
| discount_rate | int4         | 할인율 (%) |
| start_time    | timestamptz  | 할인 시작 시간 |
| end_time      | timestamptz  | 할인 종료 시간 |
| quantity      | int4         | 남은 수량 |
| created_at    | timestamptz  | 생성일자 |
| menu_id       | uuid         | 할인 적용 메뉴 ID (`store_menus.id` 참조) |
| is_active     | boolean      | 활성화 여부 |
| final_price   | int4         | 할인이 반영된 최종 가격 |
| event_id      | uuid         | 연결된 이벤트 ID (`events.id` 참조) |

---

### 1.5 reservations (예약 정보)

| 컬럼명        | 타입         | 설명 |
|---------------|--------------|------|
| id            | uuid (PK)    | 예약 ID |
| user_id       | uuid         | 예약자 ID (`auth.users.id` 참조) |
| store_id      | uuid         | 가게 ID (`stores.id` 참조) |
| reserved_time | timestamptz  | 예약 시각 |
| status        | enum         | 예약 상태 (pending, confirmed, cancelled 등) |
| created_at    | timestamptz  | 생성일자 |
| updated_at    | timestamptz  | 수정일자 |

---

### 1.6 reservation_items (예약된 메뉴 항목)

| 컬럼명        | 타입        | 설명 |
|---------------|-------------|------|
| id            | uuid (PK)   | 항목 ID |
| reservation_id| uuid        | 예약 ID (`reservations.id` 참조) |
| quantity      | int4        | 수량 |
| price         | int4        | 원 가격 |
| discount_rate | int4        | 할인율 |
| menu_name     | text        | 메뉴명 |
| is_free       | boolean     | 무료 여부 |
| final_price   | int4        | 최종 가격 |

---

### 1.7 store_gifts (가게 증정품 정보)

| 컬럼명           | 타입         | 설명 |
|------------------|--------------|------|
| id               | uuid (PK)    | 증정품 ID |
| store_id         | uuid         | 가게 ID (`stores.id` 참조) |
| gift_qty         | int4         | 증정 수량 |
| start_at         | timestamptz  | 시작 시간 |
| end_at           | timestamptz  | 종료 시간 |
| is_active        | boolean      | 활성화 여부 |
| max_redemptions  | int4         | 최대 사용 가능 횟수 |
| remaining        | int4         | 남은 수량 |
| display_note     | text         | 안내 문구 |
| created_at       | timestamptz  | 생성일자 |
| option_menu_ids  | ARRAY        | 선택 가능 메뉴 ID 목록 (`store_menus.id` 참조) |

---

### 1.8 events (이벤트 정보) ✅ **신규**

| 컬럼명               | 타입            | 설명 |
|-----------------------|------------------|------|
| id                    | uuid (PK)        | 이벤트 ID |
| store_id              | uuid             | 가게 ID (`stores.id` 참조) |
| start_date            | date             | 이벤트 시작일 |
| end_date              | date             | 이벤트 종료일 |
| happyhour_start_time  | time             | 하루 시작 시간 |
| happyhour_end_time    | time             | 하루 종료 시간 |
| weekdays              | weekday[] (ENUM) | 반복 요일 (`'mon'`, `'tue'` 등) |
| is_active             | boolean          | 활성화 여부 |
| description           | text             | 설명 |
| created_at            | timestamptz      | 생성일자 |
| max_discount_rate     | int4             | 포함된 최대 할인율 (캐시용) |

---

## 📌 2. 테이블 간 관계 요약

| 관계 | 설명 |
|------|------|
| auth.users 1:1 user_profiles | 인증 정보와 사용자 프로필 |
| auth.users 1:N stores | 사용자 1명이 여러 가게 운영 가능 |
| auth.users 1:N reservations | 사용자 1명이 여러 예약 가능 |
| stores 1:N store_menus | 가게 하나에 여러 메뉴 등록 가능 |
| stores 1:N discounts | 메뉴 → 할인 간접 관계 (menu_id) |
| stores 1:N store_gifts | 가게 1곳에 여러 증정품 등록 |
| stores 1:N reservations | 가게 1곳에 여러 예약 등록 |
| stores 1:N events | 가게 1곳에 여러 이벤트 등록 |
| store_menus 1:N discounts | 메뉴 1개에 여러 할인 등록 |
| events 1:N discounts | 이벤트 1개에 여러 할인 연결 |
| reservations 1:N reservation_items | 예약 1건에 여러 메뉴 항목 포함 |

---

## 📌 3. 기능 매핑 예시

| 기능 | 관련 테이블 |
|------|-------------|
| 소셜 로그인/회원가입 | user_profiles |
| 가게 등록/조회/수정 | stores, store_menus |
| 메뉴 할인 등록/조회 | discounts, store_menus |
| 이벤트 생성/조회 | events, discounts |
| 해피아워 시간별 노출 | events (max_discount_rate, time 필터) |
| 예약 생성/취소/조회 | reservations, reservation_items |
| 마이페이지 예약 내역 | reservations, user_profiles |
| 증정품 관리 | store_gifts |