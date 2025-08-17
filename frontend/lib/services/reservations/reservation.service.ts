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
  storeAddress: raw.stores?.address || '',
  storePhone: raw.stores?.phone || '',
  userName: raw.user_profiles?.name || '',
  userPhone: raw.user_profiles?.phone_number || '',
  reservationItems: raw.reservation_items?.map((item: any) => ({
    menuName: item.menu_name,
    quantity: item.quantity,
    price: item.price,
    discountRate: item.discount_rate,
    final_price: item.final_price,
  })) || [],
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
            name, address, phone, store_thumbnail
          ),
          reservation_items (
            quantity
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

    async getReservationById(reservationId: string): Promise<ReservationEntity> {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }
      const userId = userData.user.id;

      const { data, error } = await this.supabase
        .from('reservations')
        .select(`
          id, store_id, user_id, reserved_time, status,
          stores (name, address, phone),
          reservation_items (
            menu_name,
            quantity,
            price,
            discount_rate,
            final_price
          )
        `)
        .eq('id', reservationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching reservation:', error);
        throw new Error('Failed to fetch reservation.');
      }

      return mapRawToReservationEntity(data);
    }

    async getReservationsByStoreId(storeId: string): Promise<ReservationEntity[]> {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }
      const userId = userData.user.id;

      // Verify that the user is the owner of the store
      const { data: storeData, error: storeError } = await this.supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (storeError || !storeData || storeData.owner_id !== userId) {
        throw new Error('Unauthorized: User is not the owner of this store.');
      }

      const { data: reservations, error } = await this.supabase
        .from('reservations')
        .select(`
          id, store_id, user_id, reserved_time, status,
          stores (name, address, phone, store_thumbnail),
          reservation_items (
            menu_name,
            quantity,
            price,
            discount_rate,
            final_price
          )
        `)
        .eq('store_id', storeId)
        .order('reserved_time', { ascending: false });

      if (error) {
        console.error('Error fetching store reservations:', error);
        throw new Error('Failed to fetch store reservations.');
      }

      return reservations.map(mapRawToReservationEntity);
    }

    async cancelReservation(reservationId: string, status: any): Promise<void> {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }
      const userId = userData.user.id;

      const { error } = await this.supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error canceling reservation:', error);
        throw new Error('Failed to cancel reservation.');
      }
    }

    async getReservationByIdForOwner(reservationId: string, storeId: string): Promise<ReservationEntity> {
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }
      const userId = userData.user.id;

      // Verify that the user is the owner of the store
      const { data: storeData, error: storeError } = await this.supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (storeError || !storeData || storeData.owner_id !== userId) {
        throw new Error('Unauthorized: User is not the owner of this store.');
      }

      const { data: reservationData, error: reservationError } = await this.supabase
        .from('reservations')
        .select(`
          id, store_id, user_id, reserved_time, status,
          stores (name, address, phone),
          reservation_items (
            menu_name,
            quantity,
            price,
            discount_rate,
            final_price
          )
        `)
        .eq('id', reservationId)
        .eq('store_id', storeId)
        .single();

      if (reservationError) {
        console.error('Error fetching reservation for owner:', reservationError);
        throw new Error('Failed to fetch reservation for owner.');
      }

      if (!reservationData) {
        throw new Error('Reservation not found.');
      }

      // Fetch user profile separately
      const { data: userProfileData, error: userProfileError } = await this.supabase
        .from('user_profiles')
        .select('name, phone_number')
        .eq('user_id', reservationData.user_id)
        .single();

      if (userProfileError) {
        console.error('Error fetching user profile:', userProfileError);
        // Optionally, you might not want to throw an error if user profile is just missing
        // but for now, we'll treat it as a critical error.
        throw new Error('Failed to fetch user profile.');
      }

      const combinedData = {
        ...reservationData,
        user_profiles: userProfileData,
      };

      return mapRawToReservationEntity(combinedData);
    }
  }