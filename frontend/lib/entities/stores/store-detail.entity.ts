export interface Discount {
  discount_rate: number;
  start_time: string;
  end_time: string;
  quantity: number;
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
}