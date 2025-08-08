📌 1. 테이블 구조 요약

1.1 user_profiles (사용자 정보)

컬럼명	타입	설명
user_id	uuid (PK)	사용자 고유 ID (auth.users.id 참조)
email	varchar	이메일 주소
provider	varchar	소셜 로그인 제공자 (예: google)
provider_id	varchar	제공자별 고유 ID
name	varchar	사용자 이름
phone_number	varchar	휴대폰 번호
total_bookings	int4	총 예약 수
total_savings	int8	누적 절감액
created_at	timestamptz	생성일자
updated_at	timestamptz	수정일자
role	enum	사용자 역할 (optional)


⸻

1.2 stores (가게 정보)

컬럼명	타입	설명
id	uuid (PK)	가게 ID
name	varchar	가게명
address	varchar	주소
lat	float8	위도
lng	float8	경도
phone	varchar	전화번호
created_at	timestamptz	생성일자
category	varchar	업종
activated	boolean	활성화 여부 (지도에 노출 여부)
store_thumbnail	text	썸네일 이미지 URL
owner_id	uuid	가게 소유자 ID (user_profiles.user_id 참조)


⸻

1.3 store_menus (메뉴 정보)

컬럼명	타입	설명
id	uuid (PK)	메뉴 ID
store_id	uuid	해당 가게 ID
name	varchar	메뉴명
price	int4	가격
thumbnail	text	이미지 URL
created_at	timestamptz	생성일자
description	text 메뉴 설명

⸻

1.4 discounts (할인 정보)

컬럼명	타입	설명
id	uuid (PK)	할인 ID
discount_rate	int4	할인율 (%)
start_time	timestamptz	할인 시작 시간
end_time	timestamptz	할인 종료 시간
quantity	int4	남은 수량
created_at	timestamptz	생성일자
menu_id	uuid	할인 적용 메뉴 ID (store_menus.id 참조)
is_active   boolean    활성화 여부

⸻

1.5 reservations (예약 정보)

컬럼명	타입	설명
id	uuid (PK)	예약 ID
user_id	uuid	예약자 ID (user_profiles)
store_id	uuid	예약된 가게 ID
reserved_time	timestamptz	예약 시각
status	varchar	예약 상태 (active 등)
created_at	timestamptz	생성일자
updated_at	timestamptz	수정일자


⸻

1.6 reservation_items (예약된 메뉴 항목)

컬럼명	타입	설명
id	uuid (PK)	항목 ID
reservation_id	uuid	예약 ID (reservations.id 참조)
discount_rate	integer	 예약 당시 할인율
quantity	int4	수량
price       integer     예약 당시 원 가격 
menu_name   text    예약 당시 메뉴 이름


⸻

📌 2. 테이블 간 관계 요약

관계	설명
user_profiles 1:N reservations	사용자 1명이 여러 예약 가능
stores 1:N store_menus	가게 1곳에 여러 메뉴 등록 가능
stores 1:N discounts	가게 1곳에 여러 할인 등록 가능
store_menus 1:N discounts	메뉴 1개에 여러 할인 가능
reservations 1:N reservation_items	예약 1건에 여러 메뉴 항목 포함
store_menus 1:N reservation_items	메뉴가 여러 예약에 포함될 수 있음
discounts 1:N reservation_items	할인은 여러 예약 항목에 적용될 수 있음
stores 1:N reservations	가게는 여러 예약을 받을 수 있음


⸻

📌 3. 기능 매핑 예시

기능	관련 테이블
소셜 로그인/회원가입	user_profiles
가게 등록/조회/수정	stores, store_menus
할인 생성/조회	discounts, store_menus
예약 생성/취소/상세	reservations, reservation_items
마이페이지	reservations, user_profiles


⸻