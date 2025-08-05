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
    storeAddress?: string;
    storePhone?: string;
    userName?: string;
    userPhone?: string;
    reservationItems?: ReservationItem[];
  }

export interface ReservationItem {
    menuName: string;
    quantity: number;
    price: number;
    discountRate: number;
}