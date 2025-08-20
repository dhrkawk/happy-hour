import type { StoreDetailEntity } from '@/lib/entities/stores/store-detail.entity';
import { formatTimeLeft, calculateDistance } from '@/lib/utils';

export interface StoreGiftViewModel {
  id: string;
  giftQty: number;
  startAt: string;
  endAt: string;
  maxRedemptions: number | null;
  remaining: number | null;
  displayNote: string | null;
  menus: StoreMenuViewModel[];
}
export interface StoreMenuViewModel {
  id: string;
  name: string;
  originalPrice: number;
  discountPrice: number;
  description: string;
  thumbnail: string | "no-image.jpg"; // 기본 이미지 경로
  discountRate: number;
  category: string;
  discountDisplayText: string;
}

export interface StoreEventViewModel {
  id: string;
  title: string;
  description: string | null;
  start_date: Date;
  end_date: Date;
  happyhour_start_time: string | null;
  happyhour_end_time: string | null;
  weekdays: string[];
  is_active: boolean;
}

export interface StoreDetailViewModel {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  description: string | null; // 향후 DB에 추가될 수 있으므로 반영
  storeThumbnail: string | "no-image.jpg"; // 기본 이미지 경로
  lat: number;
  lng: number;
  menu_category: string[] | null;
  partnership: string | null;

  // 가공된 데이터
  distance: string;       // km 단위
  menu?: StoreMenuViewModel[];
  gifts?: StoreGiftViewModel[];
  events?: StoreEventViewModel[]; // 이벤트 정보 추가
}

// V2 - 새로운 함수: Service에서 계산된 값을 사용하는 수정된 로직
export function createStoreDetailViewModel(
  entity: StoreDetailEntity,
  userLocation: { lat: number; lng: number } | null
): StoreDetailViewModel {
  const distKm = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, entity.lat, entity.lng)
    : 0;

  const distanceText = distKm < 1
    ? `${Math.round(distKm * 1000)}m`
    : `${distKm.toFixed(1)}km`;

  // 메뉴 가공
  const processedMenus: StoreMenuViewModel[] = entity.menus.map((menu) => {
    const discount = menu.discount;
    // 개별 메뉴의 할인율은 활성 상태일 때만 표시합니다.
    const discountRate = (discount && discount.is_active) ? discount.discount_rate : 0;
    const finalPrice = (discount && discount.is_active) ? discount.final_price : null;

    return {
      id: menu.id,
      name: menu.name,
      originalPrice: menu.price,
      discountPrice: finalPrice ?? menu.price, // Use final_price if it exists
      description: menu.description ?? "",
      thumbnail: menu.thumbnail,
      discountRate: discountRate,
      category: menu.category,
      discountDisplayText: discountRate > 0 ? `${discountRate}% 할인` : '',
    };
  });

  // gift 가공
  const gifts: StoreGiftViewModel[] = entity.gifts.map((gift) => {
    // gift.option_menu_ids에 해당하는 메뉴만 필터링
    const giftMenus = processedMenus.filter((menu) =>
      gift.option_menu_ids.includes(menu.id)
    );

    return {
      id: gift.id,
      giftQty: gift.gift_qty,
      startAt: gift.start_at,
      endAt: gift.end_at,
      maxRedemptions: gift.max_redemptions,
      remaining: gift.remaining,
      displayNote: gift.display_note,
      menus: giftMenus,
    };
  });

  // 이벤트 정보 가공
  const events: StoreEventViewModel[] = (entity.events || []).map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    start_date: event.start_date,
    end_date: event.end_date,
    happyhour_start_time: event.happyhour_start_time ?? null,
    happyhour_end_time: event.happyhour_end_time ?? null,
    weekdays: event.weekdays ?? [],
    is_active: event.is_active,
  }));

  return {
    id: entity.id,
    name: entity.name,
    category: entity.category,
    address: entity.address,
    phone: entity.phone,
    description: "", // 향후 DB에 추가될 수 있으므로 반영
    storeThumbnail: entity.storeThumbnail,
    lat: entity.lat,
    lng: entity.lng,
    distance: distanceText,
    menu: processedMenus,
    menu_category: entity.menu_category,
    gifts: gifts.length > 0 ? gifts : undefined, // gifts가 없으면 null로 설정
    partnership: entity.partnership,
    events: events.length > 0 ? events : undefined, // events가 없으면 null로 설정
  };
}
