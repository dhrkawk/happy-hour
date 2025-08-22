// infra/supabase/store-menu-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/infra/supabase/shared/types';

import type { Id, Page, Sort } from '@/domain/shared/repository';
import type { StoreMenuRepository, StoreMenuFilter } from '@/domain/menu/store-menu.repository';
import { StoreMenu } from '@/domain/menu/store-menu.entity';

// Supabase 타입 별칭
type Row    = Tables<'store_menus'>;
type Insert = TablesInsert<'store_menus'>;
type Update = TablesUpdate<'store_menus'>;

export class SupabaseStoreMenuRepository implements StoreMenuRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  // ---------- helpers ----------
  private toEntity = (r: Row): StoreMenu =>
    StoreMenu.create({
      id: r.id,
      store_id: r.store_id,
      name: r.name,
      price: r.price,
      thumbnail: r.thumbnail ?? null,
      created_at: r.created_at ?? new Date().toISOString(),
      description: r.description ?? null,
      category: r.category ?? null,
    });

  private applyFilter(q: ReturnType<SupabaseClient['from']> & any, filter?: StoreMenuFilter) {
    if (!filter) return q;
    if (filter.storeId) q = q.eq('store_id', filter.storeId);
    if (filter.category !== undefined) {
      // category=null도 허용할 수 있게 엄격 비교
      if (filter.category === null) q = q.is('category', null);
      else q = q.eq('category', filter.category);
    }
    if (filter.searchName?.trim()) q = q.ilike('name', `%${filter.searchName.trim()}%`);
    if (typeof filter.priceMin === 'number') q = q.gte('price', filter.priceMin);
    if (typeof filter.priceMax === 'number') q = q.lte('price', filter.priceMax);
    return q;
  }

  private applySort(
    q: ReturnType<SupabaseClient['from']> & any,
    sort?: Sort<'created_at' | 'name' | 'price'>
  ) {
    if (!sort) return q.order('created_at', { ascending: false });
    const { field, order = 'desc' } = sort;
    return q.order(field, { ascending: order === 'asc' });
  }

  private applyPage(q: ReturnType<SupabaseClient['from']> & any, page?: Page) {
    if (!page) return q;
    const limit = page.limit ?? 20;
    const offset = page.offset ?? 0;
    return q.range(offset, offset + limit - 1);
  }

  // ---------- queries ----------
  async getById(id: Id): Promise<StoreMenu | null> {
    const { data, error } = await this.sb
      .from('store_menus')
      .select('*')
      .eq('id', id)
      .maybeSingle<Row>();
    if (error) throw error;
    return data ? this.toEntity(data) : null;
  }

  async list(
    filter?: StoreMenuFilter,
    page?: Page,
    sort?: Sort<'created_at' | 'name' | 'price'>
  ): Promise<StoreMenu[]> {
    let q = this.sb.from('store_menus').select('*') as any;
    q = this.applyFilter(q, filter);
    q = this.applySort(q, sort);
    q = this.applyPage(q, page);

    const { data, error } = (await q) as { data: Row[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async listByStore(
    storeId: Id,
    page?: Page,
    sort?: Sort<'created_at' | 'name' | 'price'>
  ): Promise<StoreMenu[]> {
    return this.list({ storeId }, page, sort);
  }

  async listByIds(ids: Id[]): Promise<StoreMenu[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.sb
      .from('store_menus')
      .select('*')
      .in('id', ids) as { data: Row[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async count(filter?: StoreMenuFilter): Promise<number> {
    let q = this.sb.from('store_menus').select('*', { count: 'exact', head: true }) as any;
    q = this.applyFilter(q, filter);
    const { count, error } = (await q) as { count: number | null; error: any };
    if (error) throw error;
    return count ?? 0;
  }

  async existsByNameInStore(storeId: Id, name: string): Promise<boolean> {
    // 이름 완전 일치(대소문자 구분 없음으로 하고 싶으면 ilike + normalize)
    const { count, error } = await this.sb
      .from('store_menus')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('name', name);
    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async save(menu: StoreMenu): Promise<void> {
    const row = menu.toRow() as Insert; // 전체 저장 → upsert 통일
    const { error } = await this.sb.from('store_menus').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async delete(id: Id): Promise<void> {
    const { error } = await this.sb.from('store_menus').delete().eq('id', id);
    if (error) throw error;
  }
}