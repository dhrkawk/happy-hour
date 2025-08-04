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
    statusLabel: string;
    statusColor: string;
    statusDescription: string;
    totalItems: number;
  }

const getStatusInfo = (status: string) => {
  switch (status) {
    case "pending": return { label: "예약대기", color: "bg-yellow-500 text-white", description: "예약 승인 대기중입니다." };
    case "confirmed": return { label: "예약확정", color: "bg-blue-500 text-white", description: "예약이 확정되었습니다." };
    case "used": return { label: "방문완료", color: "bg-green-500 text-white", description: "방문이 완료되었습니다." };
    case "cancelled": return { label: "예약취소", color: "bg-red-500 text-white", description: "예약이 취소되었습니다." };
    default: return { label: "알 수 없음", color: "bg-gray-500 text-white", description: "" };
  }
};
  
  export function createBookingCardViewModel(entity: ReservationEntity): BookingCardViewModel {
    const totalItems = entity.reservationItems?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) || 0;
    const statusInfo = getStatusInfo(entity.status);

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
      statusLabel: statusInfo.label,
      statusColor: statusInfo.color,
      statusDescription: statusInfo.description,
      totalItems,
    };
  }