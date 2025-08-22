// infra/supabase/store-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tables, TablesInsert, TablesUpdate, Database } from '@/infra/supabase/shared/types';

import { StoreRepository, StoreFilter } from '@/domain/store/store-repository';
import { Store } from '@/domain/store/store.entity';
import type { Page, Sort, Id } from '@/domain/shared/repository';

type StoreRow    = Tables<'stores'>;
type StoreInsert = TablesInsert<'stores'>;
type StoreUpdate = TablesUpdate<'stores'>;

export class SupabaseStoreRepository implements StoreRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  // ---------- helpers ----------
  private toEntity = (r: StoreRow): Store =>
    Store.create({
      id: r.id,
      name: r.name,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      phone: r.phone,
      created_at: r.created_at,
      category: r.category ?? '',
      is_active: r.is_active ?? false,
      store_thumbnail: r.store_thumbnail,
      owner_id: r.owner_id,
      menu_category: r.menu_category ?? [],
      partnership: r.partnership ?? null,
    });

  private applyFilter(q: ReturnType<SupabaseClient['from']> & any, filter?: StoreFilter) {
    if (!filter) return q;
    if (filter.ownerId) q = q.eq('owner_id', filter.ownerId);
    if (typeof filter.isActive === 'boolean') q = q.eq('is_active', filter.isActive);
    if (filter.category) q = q.eq('category', filter.category);
    if (filter.searchName?.trim()) q = q.ilike('name', `%${filter.searchName.trim()}%`);
    return q;
  }

  private applySort(q: ReturnType<SupabaseClient['from']> & any, sort?: Sort<'created_at'|'name'>) {
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
  async getById(id: Id): Promise<Store | null> {
    const { data, error } = await this.sb
      .from('stores')
      .select('*')
      .eq('id', id)
      .maybeSingle<StoreRow>();
    if (error) throw error;
    return data ? this.toEntity(data) : null;
  }

  async list(filter?: StoreFilter, page?: Page, sort?: Sort<'created_at'|'name'>): Promise<Store[]> {
    let q = this.sb.from('stores').select('*') as any;
    q = this.applyFilter(q, filter);
    q = this.applySort(q, sort);
    q = this.applyPage(q, page);

    const { data, error } = (await q) as { data: StoreRow[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async listByIds(ids: Id[]): Promise<Store[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.sb.from('stores').select('*').in('id', ids) as { data: StoreRow[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async count(filter?: StoreFilter): Promise<number> {
    let q = this.sb.from('stores').select('*', { count: 'exact', head: true }) as any;
    q = this.applyFilter(q, filter);
    const { count, error } = (await q) as { count: number | null; error: any };
    if (error) throw error;
    return count ?? 0;
  }

  async findByOwner(ownerId: Id, page?: Page): Promise<Store[]> {
    return this.list({ ownerId }, page, { field: 'created_at', order: 'desc' });
  }

  async save(store: Store): Promise<void> {
    const row = store.toRow() as StoreInsert;
    const { error } = await this.sb.from('stores').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async delete(id: Id): Promise<void> {
    const { error } = await this.sb.from('stores').delete().eq('id', id);
    if (error) throw error;
  }
}