// frontend/lib/viewmodels/store.viewmodel.ts
import { StoreEntity } from '@/lib/entities/store.entity';
import { calculateDistance, formatTimeLeft } from '@/lib/utils'; // 유틸리티 함수 임포트

// 가게 목록 카드에 필요한 데이터 (가격 필드 추가)
export interface StoreCardViewModel {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  maxDiscountRate: number | null;
  timeLeftText: string;
  distance: string; // "500m" 또는 "1.2km"
  originalPrice: number | null;
  discountPrice: number | null;
}

// ViewModel을 생성하는 팩토리 함수 (로직 구현)
export function createStoreCardViewModel(
  entity: StoreEntity,
  userLocation: { lat: number; lng: number } | null
): StoreCardViewModel {
  // 1. 거리 계산 및 포맷팅
  const distKm = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, entity.lat, entity.lng) : 0;
  const distanceText = distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`;

  return {
    id: entity.id,
    name: entity.name,
    category: entity.category,
    thumbnailUrl: entity.storeThumbnail || '/no-image.jpg',
    maxDiscountRate: entity.maxDiscountRate,
    timeLeftText: entity.maxDiscountEndTime ? formatTimeLeft(entity.maxDiscountEndTime) : "할인 종료",
    distance: distanceText,
    originalPrice: entity.maxPrice, // 예시로 고정된 가격 사용
    discountPrice: entity.maxPrice ? entity.maxPrice * (1 - entity.maxDiscountRate! / 100) : null,
  };
}