import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { StoreDetailEntity, StoreMenu, Discount, StoreGift } from '@/lib/entities/stores/store-detail.entity';
import { EventEntity } from '@/lib/entities/events/event.entity';

const mapRawToStoreDetailEntity = (store: any): StoreDetailEntity => {
  const menus: StoreMenu[] = (store.store_menus || []).map((menu: any) => {
    const discountData = menu.discounts?.[0];

    const discount: Discount | null = discountData
      ? {
          discount_rate: discountData.discount_rate,
          final_price: discountData.final_price,
          start_time: discountData.start_time,
          end_time: discountData.end_time,
          quantity: discountData.quantity,
          is_active: discountData.is_active,
        }
      : null;

    return {
      id: menu.id,
      name: menu.name,
      price: menu.price,
      description: menu.description,
      thumbnail: menu.thumbnail,
      category: menu.category,
      discount,
    };
  });

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // 유효한 gift만 필터링
  const validGifts = (store.store_gifts || []).filter(
      (gift: any) =>
        gift.is_active &&
        gift.start_at <= now &&
        gift.end_at >= now
    );

  const gifts: StoreGift[] = (validGifts || []).map((gift: any) => ({
    id: gift.id,
    gift_qty: gift.gift_qty,
    start_at: gift.start_at,
    end_at: gift.end_at,
    is_active: gift.is_active,
    max_redemptions: gift.max_redemptions ?? null,
    remaining: gift.remaining ?? null,
    display_note: gift.display_note ?? null,
    option_menu_ids: gift.option_menu_ids || [],
  }));

  // 유효한 이벤트만 필터링
  const validEvents = (store.events ?? []).filter((event: any) => {
    return (
      event.is_active &&
      event.start_date <= today &&
      event.end_date >= today
    )
  })

  const events: EventEntity[] = validEvents.map((event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    start_date: event.start_date,
    end_date: event.end_date,
    happyhour_start_time: event.happyhour_start_time,
    happyhour_end_time: event.happyhour_end_time,
    weekdays: event.weekdays,
  }));

  return {
    id: store.id,
    name: store.name,
    address: store.address,
    lat: store.lat,
    lng: store.lng,
    phone: store.phone,
    category: store.category,
    menu_category: store.menu_category || null,
    activated: store.activated,
    storeThumbnail: store.store_thumbnail,
    ownerId: store.owner_id,
    partnership: store.partnership ?? null,

    menus,
    gifts,
    events, // ✅ 추가
  };
};

export class StoreDetailService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  /**
   * 특정 가게 ID로 상세 정보 조회
   */
  async getStoreDetailById(id: string): Promise<StoreDetailEntity | null> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('stores')
      .select(`
        *,
        store_menus (
          *,
          discounts (*)
        ),
        store_gifts (*),
        events (
          id,
          title,
          description,
          start_date,
          end_date,
          happyhour_start_time,
          happyhour_end_time,
          weekdays,
          is_active
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error(`Error fetching store detail for ID ${id}:`, error);
      return null;
    }

    return mapRawToStoreDetailEntity(data);
  }
}