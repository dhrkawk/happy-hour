// frontend/lib/entities/reservation.entity.ts
export interface ReservationEntity {
    id: string;
    storeId: string;
    userId: string;
    reservedTime: string;
    status: string;
  
    // 확장: 함께 가져올 수 있는 정보들
    storeName?: string;
    storeThumbnail?: string;
    storeAddress?: string; // 추가
    storePhone?: string; // 추가
    reservationItems?: { quantity: number; }[]; // 추가: 뷰모델에서 totalItems 계산용
  }