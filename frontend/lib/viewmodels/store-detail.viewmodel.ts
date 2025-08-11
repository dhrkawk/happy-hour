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
  discountId: string | null;
  discountRate: number;
  discountEndTime: string;
  category: string;
  discountDisplayText: string;
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

  // 가공된 데이터
  distance: string;       // km 단위
  discount: number;       // 대표 할인율 (예: 첫 번째 할인 메뉴 기준)
  timeLeft: string;       // "3시간 남음" 형태
  menu?: StoreMenuViewModel[];
  gifts?: StoreGiftViewModel[]; 
}

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
    const discountRate = discount?.discount_rate ?? 0;
    const discountDisplayText = discountRate > 0 ? `${discountRate}% 할인` : '';

    return {
      id: menu.id,
      name: menu.name,
      originalPrice: menu.price,
      discountPrice: discount
        ? Math.round(menu.price * (1 - discount.discount_rate / 100))
        : menu.price,
      description: menu.description ?? "",
      thumbnail: menu.thumbnail,
      discountId: discount ? `${discount.discount_rate}-${discount.end_time}` : null,
      discountRate: discountRate,
      discountEndTime: discount?.end_time ?? "",
      category: menu.category, // Add category here
      discountDisplayText: discountDisplayText,
    };
  });

  // Sort menus: discounted items first
  processedMenus.sort((a, b) => b.discountRate - a.discountRate);

  const representativeMenu = processedMenus[0];

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
    discount: representativeMenu?.discountRate ?? 0,
    timeLeft: representativeMenu?.discountEndTime
      ? formatTimeLeft(representativeMenu.discountEndTime)
      : "정보 없음",
    menu: processedMenus,
    menu_category: entity.menu_category,
    gifts: gifts.length > 0 ? gifts : undefined, // gifts가 없으면 null로 설정
  };
}