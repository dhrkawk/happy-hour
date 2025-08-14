// frontend/lib/viewmodels/store.viewmodel.ts
import { StoreEntity } from '@/lib/entities/stores/store.entity';
import { calculateDistance, formatTimeLeft } from '@/lib/utils'; // 유틸리티 함수 임포트

// 가게 목록 카드에 필요한 데이터 (가격 필드 추가)
export class StoreCardViewModel {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  maxDiscountRate: number;
  timeLeftText: string;
  distance: number;
  originalPrice: number;
  discountPrice: number;
  distanceText: string;
  lat: number;
  lng: number;
  discountDisplay: string;
  hasActiveGift: boolean;
  partnership: string | null;

  constructor(props: {
    id: string;
    name: string;
    category: string;
    thumbnailUrl: string;
    distance: number;
    maxDiscountRate: number;
    timeLeftText: string;
    originalPrice: number;
    discountPrice: number;
    distanceText: string;
    lat: number;
    lng: number;
    discountDisplay: string;
    hasActiveGift: boolean;
    partnership: string | null;
  }) {
    this.id = props.id;
    this.name = props.name;
    this.category = props.category;
    this.thumbnailUrl = props.thumbnailUrl;
    this.distance = props.distance;
    this.maxDiscountRate = props.maxDiscountRate;
    this.timeLeftText = props.timeLeftText;
    this.distanceText = props.distanceText;
    this.originalPrice = props.originalPrice;
    this.discountPrice = props.discountPrice;
    this.lat = props.lat;
    this.lng = props.lng;
    this.discountDisplay = props.discountDisplay;
    this.hasActiveGift = props.hasActiveGift;
    this.partnership = props.partnership;
  }

    // 카테고리로 필터링
    static filterByCategory(viewModels: StoreCardViewModel[], category: string): StoreCardViewModel[] {
      if (category === "전체") return viewModels;
      return viewModels.filter((vm) => vm.category === category);
    }
  
    // distance로 정렬
    static sortByDistance(
      viewModels: StoreCardViewModel[],
    ): StoreCardViewModel[] {
      return [...viewModels].sort((a, b) => {
        return a.distance - b.distance;
      });
    }
  
    // discount로 정렬
    static sortByDiscount(
      viewModels: StoreCardViewModel[],
    ): StoreCardViewModel[] {
      return [...viewModels].sort((a, b) => {
        return b.maxDiscountRate - a.maxDiscountRate;
      });
    }

    // 할인이 있는 것만 필터링
    static filterByDiscount(viewModels: StoreCardViewModel[]): StoreCardViewModel[] {
      return viewModels.filter((vm) => vm.maxDiscountRate > 0);
    }

    // 제휴가 있는 것만 필터링
    static filterByPartnership(viewModels: StoreCardViewModel[]): StoreCardViewModel[] {
      return viewModels.filter((vm) => vm.partnership !== null);
    }
}

// ViewModel을 생성하는 팩토리 함수 (로직 구현)
export function createStoreCardViewModel(
  entity: StoreEntity,
  userLocation: { lat: number; lng: number } | null
): StoreCardViewModel {
  // 1. 거리 계산 및 포맷팅
  const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, entity.lat, entity.lng) : 0;
  const distanceText = distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;

  // 2. 할인 표시 텍스트 생성
  let discountDisplay = '';
  if (entity.maxDiscountRate) {
    if (entity.discountCount > 1) {
      discountDisplay = `최대 ${entity.maxDiscountRate}% 할인`;
    } else {
      discountDisplay = `${entity.maxDiscountRate}% 할인`;
    }
  }

  return new StoreCardViewModel({
    id: entity.id,
    name: entity.name,
    category: entity.category,
    thumbnailUrl: entity.storeThumbnail || '/no-image.jpg',
    maxDiscountRate: entity.maxDiscountRate ? entity.maxDiscountRate : 0,
    timeLeftText: entity.maxDiscountEndTime ? formatTimeLeft(entity.maxDiscountEndTime) : "할인 종료",
    distance: distance,
    distanceText: distanceText,
    originalPrice: entity.maxPrice ? entity.maxPrice : 0,
    discountPrice: entity.maxPrice ? entity.maxPrice * (1 - (entity.maxDiscountRate || 0) / 100) : 0,
    lat: entity.lat,
    lng: entity.lng,
    discountDisplay: discountDisplay,
    hasActiveGift: entity.hasActiveGift,
    partnership: entity.partnership
  });
}
