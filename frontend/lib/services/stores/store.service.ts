// frontend/lib/services/store.service.ts
import { StoreEntity } from '@/lib/entities/stores/store.entity';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

// Supabase raw data를 StoreEntity로 변환하는 헬퍼 함수
const mapRawToStoreEntity = (store: any): StoreEntity => {
  let maxDiscountRate: number | null = null;
  let maxDiscountEndTime: string | null = null;
  let maxPrice: number | null = null;
  let discountCount = 0;

  store.store_menus?.forEach((menu: any) => {
    menu.discounts?.forEach((discount: any) => {
      if (discount.is_active) {
        discountCount++;
        if (maxDiscountRate === null || discount.discount_rate > maxDiscountRate) {
          maxDiscountRate = discount.discount_rate;
          maxDiscountEndTime = discount.end_time;
          maxPrice = menu.price;
        }
      }
    });
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
    maxDiscountRate,
    maxDiscountEndTime, 
    maxPrice,
    discountCount,
  };
};

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
              id, name, address, lat, lng, phone, category, activated, store_thumbnail, owner_id,
              store_menus (
                price,
                discounts (
                  discount_rate, end_time, is_active
                )
              )
            `);

        if (error) {
            console.error('Error fetching stores:', error);
            throw new Error('Failed to fetch stores.');
        }

        return stores.map(mapRawToStoreEntity);
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
