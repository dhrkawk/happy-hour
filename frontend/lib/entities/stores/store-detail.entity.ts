export interface Discount {
  discount_rate: number;       // 할인율
  start_time: string;          // 시작 시각 (ISO string)
  end_time: string;            // 종료 시각
  quantity: number;            // 남은 수량
  is_active: boolean;          // 활성 상태
}

export interface StoreMenu {
  id: string;                  // 메뉴 ID
  name: string;                // 메뉴 이름
  price: number;               // 원래 가격
  description: string;         // 메뉴 설명
  thumbnail: string;           // 메뉴 이미지
  category: string;            // 메뉴 카테고리
  discount: Discount | null;   // 1:1 연결된 할인 정보
}

export interface StoreDetailEntity {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  category: string;
  activated: boolean;
  storeThumbnail: string | "no-image.jpg"; // 기본 이미지 경로
  ownerId: string;
  menu_category: string[] | null;

  menus: StoreMenu[];          // 전체 메뉴 목록

  // Service에서 계산될 대표 할인 정보
  representativeDiscountRate: number | null;
  representativeDiscountEndTime: string | null;
}