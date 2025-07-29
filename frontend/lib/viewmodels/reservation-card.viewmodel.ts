import { ReservationEntity } from "@/lib/entities/reservation.entity";

export interface BookingCardViewModel {
    id: string;
    bookingNumber: string;
    storeName: string;
    address: string;
    phone: string;
    reservedTime: string;
    visitTime: string;
    status: string;
    totalItems: number;
  }
  
  export function createBookingCardViewModel(entity: ReservationEntity): BookingCardViewModel {
    const totalItems = entity.reservationItems?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) || 0;
  
    return {
      id: entity.id,
      bookingNumber: entity.id.substring(0, 8),
      storeName: entity.storeName || "알 수 없는 가게",
      address: entity.storeAddress || "",
      phone: entity.storePhone || "",
      reservedTime: entity.reservedTime,
      visitTime: new Date(entity.reservedTime).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      status: entity.status,
      totalItems,
    };
  }