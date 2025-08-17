// frontend/lib/viewmodels/reservation-detail.viewmodel.ts
import { ReservationEntity, ReservationItem } from "@/lib/entities/reservation.entity";

export interface ReservationDetailViewModel {
  id: string;
  bookingNumber: string;
  reservedTime: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  store: {
    name: string;
    address: string;
    phone: string;
  };
  items: ReservationItem[];
  totalAmount: number;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "pending": return { label: "예약대기", color: "bg-yellow-500 text-white" };
    case "confirmed": return { label: "예약확정", color: "bg-blue-500 text-white" };
    case "used": return { label: "방문완료", color: "bg-green-500 text-white" };
    case "cancelled": return { label: "예약취소", color: "bg-red-500 text-white" };
    default: return { label: "알 수 없음", color: "bg-gray-500 text-white" };
  }
};

export function createReservationDetailViewModel(entity: ReservationEntity): ReservationDetailViewModel {
  const totalAmount = entity.reservationItems?.reduce((acc, item) => {
    const priceToUse = item.final_price ?? item.price;
    return acc + priceToUse * item.quantity;
  }, 0) || 0;

  const statusInfo = getStatusInfo(entity.status);

  return {
    id: entity.id,
    bookingNumber: entity.id.substring(0, 8),
    reservedTime: entity.reservedTime,
    status: entity.status,
    statusLabel: statusInfo.label,
    statusColor: statusInfo.color,
    store: {
      name: entity.storeName || "알 수 없는 가게",
      address: entity.storeAddress || "",
      phone: entity.storePhone || "",
    },
    items: entity.reservationItems || [],
    totalAmount,
  };
}
