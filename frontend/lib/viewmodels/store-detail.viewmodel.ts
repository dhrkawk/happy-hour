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

  // 메뉴 목록에 표시될 개별 메뉴 아이템들을 가공합니다.
  const processedMenus: StoreMenuViewModel[] = entity.menus.map((menu) => {
    const discount = menu.discount;
    // 개별 메뉴의 할인율은 활성 상태일 때만 표시합니다.
    const discountRate = (discount && discount.is_active) ? discount.discount_rate : 0;

    return {
      id: menu.id,
      name: menu.name,
      originalPrice: menu.price,
      discountPrice: discountRate > 0
        ? Math.round(menu.price * (1 - discountRate / 100))
        : menu.price,
      description: menu.description ?? "",
      thumbnail: menu.thumbnail,
      discountId: discount ? `${discount.discount_rate}-${discount.end_time}` : null,
      discountRate: discountRate,
      discountEndTime: discount?.end_time ?? "",
      category: menu.category,
      discountDisplayText: discountRate > 0 ? `${discountRate}% 할인` : '',
    };
  });

  // Service에서 미리 계산한 대표 할인 정보를 사용합니다.
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
    discount: entity.representativeDiscountRate ?? 0,
    timeLeft: entity.representativeDiscountEndTime
      ? formatTimeLeft(entity.representativeDiscountEndTime)
      : "정보 없음",
    menu: processedMenus,
    menu_category: entity.menu_category,
  };
}
