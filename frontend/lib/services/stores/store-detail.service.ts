import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { StoreDetailEntity, StoreMenu, Discount } from '@/lib/entities/store-detail.entity';

const mapRawToStoreDetailEntity = (store: any): StoreDetailEntity => {
  const menus: StoreMenu[] = (store.store_menus || []).map((menu: any) => {
    const discountData = menu.discounts?.[0]; // 메뉴당 하나의 할인만 존재한다고 가정

    const discount: Discount | null = discountData
      ? {
          discount_rate: discountData.discount_rate,
          start_time: discountData.start_time,
          end_time: discountData.end_time,
          quantity: discountData.quantity,
        }
      : null;

    return {
      id: menu.id,
      name: menu.name,
      price: menu.price,
      description: menu.description,
      thumbnail: menu.thumbnail,
      discount,
    };
  });

  return {
    id: store.id,
    name: store.name,
    address: store.address,
    lat: store.lat,
    lng: store.lng,
    phone: store.phone,
    category: store.category,
    activated: store.activated,
    storeThumbnail: store.store_thumbnail,
    ownerId: store.owner_id,
    menus,
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
    const { data, error } = await this.supabase
      .from('stores')
      .select(`
        *,
        store_menus (
          *,
          discounts (*)
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