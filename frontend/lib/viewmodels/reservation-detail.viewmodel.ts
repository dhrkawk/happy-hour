// frontend/lib/viewmodels/reservation-detail.viewmodel.ts
import { ReservationEntity, ReservationItem } from "@/lib/entities/reservation.entity";

export interface ReservationDetailViewModel {
  id: string;
  bookingNumber: string;
  reservedTime: string;
  status: string;
  store: {
    name: string;
    address: string;
    phone: string;
  };
  items: ReservationItem[];
  totalAmount: number;
}

export function createReservationDetailViewModel(entity: ReservationEntity): ReservationDetailViewModel {
  const totalAmount = entity.reservationItems?.reduce((acc, item) => {
    const itemPrice = item.price * (1 - (item.discountRate || 0) / 100);
    return acc + itemPrice * item.quantity;
  }, 0) || 0;

  return {
    id: entity.id,
    bookingNumber: entity.id.substring(0, 8),
    reservedTime: entity.reservedTime,
    status: entity.status,
    store: {
      name: entity.storeName || "알 수 없는 가게",
      address: entity.storeAddress || "",
      phone: entity.storePhone || "",
    },
    items: entity.reservationItems || [],
    totalAmount,
  };
}
