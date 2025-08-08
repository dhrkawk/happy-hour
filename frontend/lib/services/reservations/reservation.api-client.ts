import { Cart } from '@/contexts/app-context'; // 장바구니 타입을 가져옵니다.

export type ReservationFormViewModel = Cart;

interface ReservationCreationResponse {
  reservation_id: string;
}

export class ReservationApiClient {
    private baseUrl: string = '/api/reservations';

    /**
     * 장바구니 정보를 바탕으로 새로운 예약을 등록합니다.
     * @param reservationData - 예약 생성을 위한 데이터 (Cart 객체)
     * @returns 생성된 예약 정보 (예: 예약 ID 포함)
     */
    async registerReservation(reservationData: ReservationFormViewModel): Promise<ReservationCreationResponse> {
      const payload = {
        store_id: reservationData.storeId,
        reserved_time: new Date().toISOString(),
        items: reservationData.items.map(item => ({
          menu_name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount_rate: Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100),
        })),
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '알 수 없는 오류로 예약에 실패했습니다.');
      }

      return result;
    }
}