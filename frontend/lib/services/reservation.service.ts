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
      console.log(reservations)
      return reservations.map(mapRawToReservationEntity);
    }
  }