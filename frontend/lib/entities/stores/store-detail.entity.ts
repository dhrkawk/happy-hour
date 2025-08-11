export interface Discount {
  discount_rate: number;       // 할인율
  start_time: string;          // 시작 시각 (ISO string)
  end_time: string;            // 종료 시각
  quantity: number;            // 남은 수량
  is_active: boolean;          // 활성 상태
}

export interface StoreMenu {
  id: string;
  name: string;
  price: number;
  description: string;
  thumbnail: string;
  category: string;
  discount: Discount | null;
}

export interface StoreGift {
  id: string;
  gift_qty: number;
  start_at: string;
  end_at: string;
  is_active: boolean;
  max_redemptions: number | null;
  remaining: number | null;
  display_note: string | null;
  option_menu_ids: string[]; // menu_id 배열
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
  storeThumbnail: string | 'no-image.jpg';
  ownerId: string;
  menu_category: string[] | null;
  menus: StoreMenu[];
  gifts: StoreGift[];

  // Service에서 계산될 대표 할인 정보
  representativeDiscountRate: number | null;
  representativeDiscountEndTime: string | null;
}