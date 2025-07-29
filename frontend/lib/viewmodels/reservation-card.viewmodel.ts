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
  
  export function createBookingCardViewModel(raw: any): BookingCardViewModel {
    const totalItems = raw.reservation_items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  
    return {
      id: raw.id,
      bookingNumber: raw.id.substring(0, 8),
      storeName: raw.stores?.name || "알 수 없는 가게",
      address: raw.stores?.address || "",
      phone: raw.stores?.phone || "",
      reservedTime: raw.reserved_time,
      visitTime: new Date(raw.reserved_time).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      status: raw.status,
      totalItems,
    };
  }