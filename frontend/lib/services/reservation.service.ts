// frontend/lib/services/reservation.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { ReservationEntity } from '@/lib/entities/reservation.entity';

const mapRawToReservationEntity = (raw: any): ReservationEntity => ({
  id: raw.id,
  storeId: raw.store_id,
  userId: raw.user_id,
  reservedTime: raw.reserved_time,
  status: raw.status,
  storeName: raw.stores?.name || '',
  storeThumbnail: raw.stores?.store_thumbnail || '',
  itemCount: raw.reservation_items?.length || 0,
});

export class ReservationService {
    private supabase: SupabaseClient<Database>;
  
    constructor(supabaseClient: SupabaseClient<Database>) {
      this.supabase = supabaseClient;
    }
  
    // 현재 로그인된 사용자의 모든 예약 조회
    async getMyReservations(): Promise<ReservationEntity[]> {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }
  
      const userId = userData.user.id;
  
      const { data: reservations, error } = await this.supabase
        .from('reservations')
        .select(`
          id, store_id, user_id, reserved_time, status,
          stores (
            name, store_thumbnail
          ),
          reservation_items (
            id
          )
        `)
        .eq('user_id', userId)
        .order('reserved_time', { ascending: false });
      if (error) {
        console.error('Error fetching reservations:', error);
        throw new Error('Failed to fetch reservations.');
      }
      return reservations.map(mapRawToReservationEntity);
    }

    // 예약 상세 정보 조회
    async getReservationDetails(reservationId: string): Promise<any> { // TODO: 타입 정의 필요
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('reservations')
        .select(`
          id,
          reserved_time,
          status,
          stores (name, address, phone),
          reservation_items (
            quantity,
            store_menus (name, price),
            discounts (discount_rate)
          )
        `)
        .eq('id', reservationId)
        .eq('user_id', userData.user.id)
        .single();

      if (error || !data) {
        throw new Error('예약 정보를 불러오지 못했습니다. 해당 예약이 없거나 접근 권한이 없습니다.');
      }

      let totalAmount = 0;
      data.reservation_items.forEach((item: any) => {
        const price = item.store_menus?.price || 0;
        const discountRate = item.discounts?.[0]?.discount_rate || 0; // discounts가 배열일 수 있으므로 첫 번째 요소 접근
        const discountedPrice = price * (1 - discountRate / 100);
        totalAmount += discountedPrice * item.quantity;
      });

      return {
        id: data.id,
        bookingNumber: data.id.substring(0, 8),
        reserved_time: data.reserved_time,
        status: data.status,
        store: Array.isArray(data.stores) ? data.stores[0] : data.stores,
        items: data.reservation_items.map((item: any) => ({
          quantity: item.quantity,
          menu: item.store_menus,
          discount: item.discounts?.[0], // discounts가 배열일 수 있으므로 첫 번째 요소 접근
        })),
        totalAmount: totalAmount,
      };
    }

    // 예약 취소
    async cancelReservation(reservationId: string): Promise<void> {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId)
        .eq('user_id', userData.user.id);

      if (error) {
        console.error('Error canceling reservation:', error);
        throw new Error('예약 취소에 실패했습니다.');
      }
    }
  }