// frontend/lib/services/store.service.ts
import { StoreEntity } from '@/lib/entities/store.entity';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { StoreDetailEntity, StoreMenu, Discount } from '@/lib/entities/store-detail.entity'; // 실제 경로에 맞게 조정

const mapRawToStoreDetailEntity = (store: any): StoreDetailEntity => {
  const menus: StoreMenu[] = (store.store_menus || []).map((menu: any) => {
    const discountData = menu.discounts?.[0]; // 1:1 관계 가정
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

// Supabase raw data를 StoreEntity로 변환하는 헬퍼 함수
const mapRawToStoreEntity = (store: any): StoreEntity => {
  let maxDiscountRate: number | null = null;
  let maxDiscountEndTime: string | null = null;
  let maxPrice: number | null = null;
  
  store.store_menus?.forEach((menu: any) => {
    menu.discounts?.forEach((discount: any) => {
      // 여기에 현재 시간에 유효한 할인인지 체크하는 로직 추가 가능
      if (maxDiscountRate === null || discount.discount_rate > maxDiscountRate) {
        maxDiscountRate = discount.discount_rate;
        maxDiscountEndTime = discount.end_time;
        maxPrice = menu.price;
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
                  discount_rate, end_time
                )
              )
            `);

        if (error) {
            console.error('Error fetching stores:', error);
            throw new Error('Failed to fetch stores.');
        }

        return stores.map(mapRawToStoreEntity);
    }
}
