// infra/supabase/store-menu-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/infra/supabase/shared/types';

import type { Id } from '@/domain/shared/repository';
import type { StoreMenuRepository } from '@/domain/repositories/menu.repo';

import { StoreMenu } from '@/domain/entities/entities';
import type { StoreMenuInsertDTO, StoreMenuUpdateDTO } from '@/domain/schemas/schemas';

// ---- Row type aliases ----
type MenuRow    = Tables<'store_menus'>;
type MenuInsert = TablesInsert<'store_menus'>;
type MenuUpdate = TablesUpdate<'store_menus'>;

export class SupabaseStoreMenuRepository implements StoreMenuRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  /**
   * 메뉴들을 한 번에 생성 (Bulk)
   * - 선행된 RPC: public.bulk_insert_store_menus(p_rows jsonb)
   * - DTO는 DB 컬럼 스네이크 케이스와 동일하므로 그대로 전달 가능
   */
  async createMenus(rows: StoreMenuInsertDTO[]): Promise<void> {
    if (!rows?.length) return;

    const payload: Omit<MenuInsert, 'id' | 'created_at'>[] = rows.map((r) => ({
      store_id: r.store_id,
      name: r.name,
      price: r.price,
      thumbnail: r.thumbnail ?? null,
      description: r.description ?? null,
      category: r.category ?? '기타',
    }));
    const { error } = await this.sb.from('store_menus').insert(payload);
    if (error) throw error;
  }

  /**
   * 단일 메뉴 업데이트
   */
  async updateMenu(id: Id, dto: StoreMenuUpdateDTO): Promise<void> {
    const row: Omit<MenuUpdate, 'id' | 'store_id' | 'created_at'> = {
      name: dto.name,
      price: dto.price,
      thumbnail: dto.thumbnail ?? null,
      description: dto.description ?? null,
      category: dto.category ?? null,
    };

    const { error } = await this.sb
      .from('store_menus')
      .update(row)
      .eq('id', id);
    if (error) throw error;
  }

  /**
   * 단일 메뉴 삭제 (하드 삭제)
   * - 소프트 삭제 정책이면 is_active 컬럼 등으로 전환
   */
  async deleteMenu(id: Id): Promise<void> {
    const { error } = await this.sb
      .from('store_menus')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  /**
   * 스토어별 메뉴 조회
   */
  async getMenusByStoreId(storeId: Id): Promise<StoreMenu[]> {
    const { data, error } = await this.sb
      .from('store_menus')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return (data ?? []).map(StoreMenu.fromRow);
  }
}