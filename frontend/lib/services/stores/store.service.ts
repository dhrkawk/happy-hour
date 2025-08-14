// frontend/lib/services/store.service.ts
import { StoreEntity } from '@/lib/entities/stores/store.entity';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

// raw data를 entity로 전환
const mapRawToStoreEntity = (store: any): StoreEntity => {
  let maxDiscountRate: number | null = null
  let maxDiscountEndTime: string | null = null
  let maxPrice: number | null = null
  let discountCount = 0

  store.store_menus?.forEach((menu: any) => {
    menu.discounts?.forEach((discount: any) => {
    if (
      discount.is_active &&
      new Date(discount.start_time) < new Date() &&
      new Date() < new Date(discount.end_time)
    ) {
        discountCount++
        if (maxDiscountRate === null || discount.discount_rate > maxDiscountRate) {
          maxDiscountRate = discount.discount_rate
          maxDiscountEndTime = discount.end_time
          maxPrice = menu.price
        }
      }
    })
  })

  const gifts = store.store_gifts ?? []
  const now = new Date()
  const hasActiveGift = gifts.some((g: any) => {
    if (!g.is_active) return false
    const start = new Date(g.start_at)
    const end = new Date(g.end_at)
    const inPeriod = start <= now && now < end
    const hasStock = g.remaining == null || g.remaining > 0
    return inPeriod && hasStock
  })

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
    partnership: store.partnership ?? null,

    maxDiscountRate,
    maxDiscountEndTime,
    maxPrice,
    discountCount,

    hasActiveGift,
  }
}

export class StoreService {
    private supabase: SupabaseClient<Database>;

    // 생성자에서 SupabaseClient 주입
    constructor(supabaseClient: SupabaseClient<Database>) {
        this.supabase = supabaseClient;
    }

    // 모든 가게 정보 조회
    async getAllStores(): Promise<StoreEntity[]> {
      const { data: stores, error } = await this.supabase
        .from('stores')
        .select(`
          id, name, address, lat, lng, phone, category, activated, store_thumbnail, owner_id, partnership,
          store_menus (
            price,
            discounts (
              discount_rate, start_time, end_time, is_active
            )
          ),
          store_gifts (
            id, is_active, start_at, end_at, remaining
          )
        `)

      if (error) {
        console.error('Error fetching stores:', error)
        throw new Error('Failed to fetch stores.')
      }

      return stores.map(mapRawToStoreEntity)
    }

    async getStoreById(storeId: string): Promise<StoreEntity> {
      const { data, error } = await this.supabase
        .from("stores")
        .select("name")
        .eq("id", storeId)
        .single();

      if (error) {
        console.error("Error fetching store:", error);
        throw new Error("가게 정보를 불러오는 데 실패했습니다.");
      }

      if (!data) {
        throw new Error("가게를 찾을 수 없습니다.");
      }
      return data as StoreEntity;
    }

    async isStoreOwner(storeId: string, userId: string): Promise<boolean> {
      const { data, error } = await this.supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      if (error) {
        console.error('Error checking store ownership:', error);
        return false;
      }

      return data?.owner_id === userId;
    }

    async getStoreMenuCategories(storeId: string): Promise<string[] | null> {
      const { data, error } = await this.supabase
        .from('stores')
        .select('menu_category')
        .eq('id', storeId)
        .single();

      if (error) {
        console.error('Error fetching store menu categories:', error);
        throw new Error(`Failed to fetch store menu categories: ${error.message}`);
      }

      return data?.menu_category || null;
    }

    async updateStoreMenuCategories(storeId: string, categories: string[]): Promise<string[]> {
      const { data, error } = await this.supabase
        .from('stores')
        .update({ menu_category: categories })
        .eq('id', storeId)
        .select('menu_category')
        .single();

      if (error) {
        console.error('Error updating store menu categories:', error);
        throw new Error(`Failed to update store menu categories: ${error.message}`);
      }

      return data.menu_category || [];
    }
}
