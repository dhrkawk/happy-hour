// frontend/lib/services/store.service.ts
import { StoreEntity } from '@/lib/entities/stores/store.entity';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

// raw data를 entity로 전환
const mapRawToStoreEntity = (store: any): StoreEntity => {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // 유효한 이벤트만 필터링
  const validEvents = (store.events ?? []).filter((event: any) => {
    return (
      event.is_active &&
      event.start_date <= today &&
      event.end_date >= today
    )
  })

  const maxDiscountRate = validEvents.length > 0 ? Math.max(...validEvents.map((e: any) => e.max_discount_rate ?? 0)) : null
  const maxDiscountEndTime = validEvents.length > 0 ? validEvents.find((e: any) => e.max_discount_rate === maxDiscountRate)?.end_date ?? null : null
  const maxPrice = validEvents.length > 0 ? Math.max(...validEvents.map((e: any) => e.max_original_price ?? 0)) : null
  const maxDiscountFinalPrice = validEvents.length > 0 ? Math.min(...validEvents.map((e: any) => e.max_final_price ?? 0)) : null
  const discountCount = validEvents.length

  const gifts = store.store_gifts ?? []
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
    maxDiscountFinalPrice,
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
          id, name, address, lat, lng, phone, category, store_thumbnail,
          events (
            id, title, start_date, end_date, is_active,
            max_discount_rate,
            max_final_price,
            max_original_price
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
