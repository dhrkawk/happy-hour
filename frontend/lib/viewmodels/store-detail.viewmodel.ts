import type { StoreDetailEntity } from '@/lib/entities/stores/store-detail.entity';
import { formatTimeLeft, calculateDistance } from '@/lib/utils';

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

  const processedMenus: StoreMenuViewModel[] = entity.menus.map((menu) => {
    const discount = menu.discount;

    return {
      id: menu.id, // 명시적 변환 (key 중복 방지 목적도 포함)
      name: menu.name,
      originalPrice: menu.price,
      discountPrice: discount
        ? Math.round(menu.price * (1 - discount.discount_rate / 100))
        : menu.price,
      description: menu.description ?? "", // 누락 방지
      thumbnail: menu.thumbnail,
      discountId: discount ? `${discount.discount_rate}-${discount.end_time}` : null,
      discountRate: discount?.discount_rate ?? 0,
      discountEndTime: discount?.end_time ?? "",
      category: menu.category, // Add category here
    };
  });

  const representativeMenu = processedMenus[0]; // 기준: 첫 번째 메뉴

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
  };
}