// infra/supabase/store-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/infra/supabase/shared/types';

import type { Id } from '@/domain/shared/repository';
import type { StoreRepository } from '@/domain/repositories/store.repo';

import { Store, Event, StoreMenu, type StoreWithEventsAndMenus, type StoreWithEvents } from '@/domain/entities/entities';
import { StoreUpdateDTO, StoreInsertDTO } from '@/domain/schemas/schemas';

// Row 타입 별칭
type StoreRow = Tables<'stores'>;
type EventRow = Tables<'events'>;
type MenuRow  = Tables<'store_menus'>;
type RpcStoreWithEventsAndMenus =
  | { store: StoreRow; events: EventRow[]; menus: MenuRow[] }
  | null;

type StoreInsert = TablesInsert<'stores'>;
type StoreUpdate = TablesUpdate<'stores'>;

export class SupabaseStoreRepository implements StoreRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  /**
  * 모든 스토어 + 각 스토어의 이벤트 리스트
  * onlyActive=true면 이벤트에서 is_active=true만 포함
  * → RPC: public.stores_with_events(only_active_events boolean)
  */
  async getStoresWithEvents(onlyActive: boolean): Promise<Array<StoreWithEvents>> {
    const { data, error } = await this.sb.rpc('stores_with_events', {
      only_active_events: onlyActive,
    });
    if (error) throw error;
  
    // RPC jsonb 배열을 정확히 타이핑
    const rows = (data ?? []) as Array<{ store: StoreRow; events: EventRow[] }>;
    return rows.map<StoreWithEvents>((r) => ({
      store: Store.fromRow(r.store as StoreRow),
      events: (r.events ?? []).map((e) => Event.fromRow(e as EventRow)),
    }));
  }

  /**
   * 단일 스토어 + (옵션) 활성 이벤트만 or 전체 이벤트 + 메뉴
   */
  async getStoreWithEventsAndMenusByStoreId(
    id: Id,
    opts?: { onlyActiveEvents?: boolean }
  ): Promise<StoreWithEventsAndMenus> {
    const { data, error } = await this.sb
      .rpc('store_with_events_and_menus', {
        p_store_id: id,
        p_only_active_events: opts?.onlyActiveEvents ?? false,
      });

    if (error) throw error;

    const payload = data as RpcStoreWithEventsAndMenus;

    if (!payload || !payload.store) {
      throw new Error('Store not found');
    }
    
    const store  = Store.fromRow(payload.store);
    const events = (payload.events ?? []).map(Event.fromRow);
    const menus  = (payload.menus  ?? []).map(StoreMenu.fromRow);
    
    return { store, events, menus };
  }

  async createStore(dto: StoreInsertDTO): Promise<{ id: Id }> {
    const row: Omit<StoreInsert, 'id'> = {
      name: dto.name,
      address: dto.address,
      lat: dto.lat,
      lng: dto.lng,
      phone: dto.phone,
      category: dto.category ?? '',
      store_thumbnail: dto.store_thumbnail,
      owner_id: dto.owner_id,
      menu_category: dto.menu_category ?? null,
      partnership: dto.partnership ?? null,
      is_active: dto.is_active ?? true,
    };
  
    const { data, error } = await this.sb
      .from('stores')
      .insert(row)
      .select('id')
      .single();
  
    if (error) throw error;
    return { id: data!.id as Id };
  }  

  async updateStore(id: Id, dto: StoreUpdateDTO): Promise<void> {
    const row: Omit<StoreUpdate, 'id' | 'owner_id'> = {
      name: dto.name,
      address: dto.address,
      lat: dto.lat,
      lng: dto.lng,
      phone: dto.phone,
      category: dto.category,
      store_thumbnail: dto.store_thumbnail,
      menu_category: dto.menu_category ?? null,
      partnership: dto.partnership ?? null,
      is_active: dto.is_active,
    };
  
    const { error } = await this.sb
      .from('stores')
      .update(row)
      .eq('id', id);
  
    if (error) throw error;
  }

  async getMyStoreId(): Promise<Id | null> {
    const { data: { user }, error: userErr } = await this.sb.auth.getUser();
    if (userErr) throw userErr;
    if (!user) return null;
  
    const { data, error } = await this.sb
      .from('stores')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
  }
}