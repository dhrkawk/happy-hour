import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { StoreDetailEntity, StoreMenu, Discount, StoreGift } from '@/lib/entities/stores/store-detail.entity';

const mapRawToStoreDetailEntity = (store: any): StoreDetailEntity => {
  // 1. Raw data를 Entity에 맞게 매핑 (is_active 포함)
  const menus: StoreMenu[] = (store.store_menus || []).map((menu: any) => {
    const discountData = menu.discounts?.[0];

    const discount: Discount | null = discountData
      ? {
          discount_rate: discountData.discount_rate,
          start_time: discountData.start_time,
          end_time: discountData.end_time,
          quantity: discountData.quantity,
          is_active: discountData.is_active, // is_active 필드 추가
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

  const gifts: StoreGift[] = (store.store_gifts || []).map((gift: any) => {
    return {
      id: gift.id,
      gift_qty: gift.gift_qty,
      start_at: gift.start_at,
      end_at: gift.end_at,
      is_active: gift.is_active,
      max_redemptions: gift.max_redemptions ?? null,
      remaining: gift.remaining ?? null,
      display_note: gift.display_note ?? null,
      option_menu_ids: gift.option_menu_ids || [],
    };
  });

  // 2. 활성 할인 중 대표 할인 찾기
  let representativeDiscountRate: number | null = null;
  let representativeDiscountEndTime: string | null = null;

  const activeDiscounts = menus
    .map(menu => menu.discount)
    .filter((d): d is Discount => d !== null && d.is_active);

  if (activeDiscounts.length > 0) {
    const maxDiscount = activeDiscounts.reduce((max, current) => 
      current.discount_rate > max.discount_rate ? current : max
    );
    representativeDiscountRate = maxDiscount.discount_rate;
    representativeDiscountEndTime = maxDiscount.end_time;
  }

  // 3. 최종 Entity 반환
  return {
    id: store.id,
    name: store.name,
    address: store.address,
    lat: store.lat,
    lng: store.lng,
    phone: store.phone,
    category: store.category,
    activated: store.activated,
    storeThumbnail: store.store_thumbnail ?? 'no-image.jpg',
    ownerId: store.owner_id,
    menu_category: store.menu_category,
    menus,
    gifts,
    // 계산된 대표 할인 정보 추가
    representativeDiscountRate,
    representativeDiscountEndTime,
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
        store_gifts (*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error(`Error fetching store detail for ID ${id}:`, error);
      return null;
    }

    // 활성 gift만 남김
    data.store_gifts = (data.store_gifts || []).filter(
      (gift: any) =>
        gift.is_active &&
        gift.start_at <= now &&
        gift.end_at >= now
    );

    return mapRawToStoreDetailEntity(data);
  }
}