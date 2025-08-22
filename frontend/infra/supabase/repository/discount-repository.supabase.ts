// infra/supabase/discount-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/infra/supabase/shared/types';

import type { Id, Page, Sort } from '@/domain/shared/repository';
import type { DiscountRepository, DiscountFilter } from '@/domain/discount/discount.repository';
import { Discount } from '@/domain/discount/discount.entity';

type Row    = Tables<'discounts'>;
type Insert = TablesInsert<'discounts'>;
type Update = TablesUpdate<'discounts'>;

export class SupabaseDiscountRepository implements DiscountRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  // ---------- helpers ----------
  private toEntity = (r: Row): Discount =>
    Discount.create({
      id: r.id,
      discount_rate: r.discount_rate,
      remaining: r.remaining,
      created_at: r.created_at,
      menu_id: r.menu_id,
      is_active: r.is_active,
      final_price: r.final_price,
      event_id: r.event_id,
    });

  private applyFilter(q: ReturnType<SupabaseClient['from']> & any, f?: DiscountFilter) {
    if (!f) return q;
    if (f.eventId) q = q.eq('event_id', f.eventId);
    if (f.menuId)  q = q.eq('menu_id', f.menuId);
    if (typeof f.isActive === 'boolean') q = q.eq('is_active', f.isActive);

    if (typeof f.priceMin === 'number') q = q.gte('final_price', f.priceMin);
    if (typeof f.priceMax === 'number') q = q.lte('final_price', f.priceMax);

    if (typeof f.discountRateGte === 'number') q = q.gte('discount_rate', f.discountRateGte);
    if (typeof f.discountRateLte === 'number') q = q.lte('discount_rate', f.discountRateLte);

    if (typeof f.hasRemaining === 'boolean') {
      if (f.hasRemaining) q = q.gt('remaining', 0);
      else q = q.or('remaining.is.null,remaining.eq.0'); // 남은 수량 없음만 보고 싶다면
    }
    return q;
  }

  private applySort(q: ReturnType<SupabaseClient['from']> & any, sort?: Sort<'created_at'|'final_price'|'discount_rate'>) {
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
  async getById(id: Id): Promise<Discount | null> {
    const { data, error } = await this.sb
      .from('discounts')
      .select('*')
      .eq('id', id)
      .maybeSingle<Row>();
    if (error) throw error;
    return data ? this.toEntity(data) : null;
  }

  async list(
    filter?: DiscountFilter,
    page?: Page,
    sort?: Sort<'created_at' | 'final_price' | 'discount_rate'>
  ): Promise<Discount[]> {
    let q = this.sb.from('discounts').select('*') as any;
    q = this.applyFilter(q, filter);
    q = this.applySort(q, sort);
    q = this.applyPage(q, page);

    const { data, error } = (await q) as { data: Row[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async listByEvent(
    eventId: Id,
    page?: Page,
    sort?: Sort<'created_at' | 'final_price' | 'discount_rate'>,
    opt?: { onlyActive?: boolean; onlyInStock?: boolean }
  ): Promise<Discount[]> {
    const filter: DiscountFilter = {
      eventId,
      isActive: opt?.onlyActive,
      hasRemaining: opt?.onlyInStock,
    };
    return this.list(filter, page, sort);
  }

  async listByMenu(
    menuId: Id,
    page?: Page,
    sort?: Sort<'created_at' | 'final_price' | 'discount_rate'>,
    opt?: { onlyActive?: boolean; onlyInStock?: boolean }
  ): Promise<Discount[]> {
    const filter: DiscountFilter = {
      menuId,
      isActive: opt?.onlyActive,
      hasRemaining: opt?.onlyInStock,
    };
    return this.list(filter, page, sort);
  }

  async listByIds(ids: Id[]): Promise<Discount[]> {
    if (!ids.length) return [];
    const { data, error } = await this.sb
      .from('discounts')
      .select('*')
      .in('id', ids) as { data: Row[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async count(filter?: DiscountFilter): Promise<number> {
    let q = this.sb.from('discounts').select('*', { count: 'exact', head: true }) as any;
    q = this.applyFilter(q, filter);
    const { count, error } = (await q) as { count: number | null; error: any };
    if (error) throw error;
    return count ?? 0;
  }

  async save(discount: Discount): Promise<void> {
    const row = discount.toRow() as Insert;
    const { error } = await this.sb.from('discounts').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async setActive(id: Id, active: boolean): Promise<void> {
    const { error } = await this.sb
      .from('discounts')
      .update({ is_active: active } satisfies Partial<Update>)
      .eq('id', id);
    if (error) throw error;
  }

  /**
   * 남은 수량 원자적 감소 (권장: RPC)
   * SQL:
   * create or replace function public.decrement_discount_remaining(p_id uuid, p_by int)
   * returns void language sql as $$
   *   update public.discounts
   *   set remaining = greatest(0, coalesce(remaining,0) - p_by)
   *   where id = p_id;
   * $$ security definer;
   */
  async decrementRemaining(id: Id, by: number): Promise<void> {
    if (by <= 0) return;
    const { error } = await this.sb.rpc('decrement_discount_remaining', { p_id: id, p_by: by });
    if (error) throw error;
  }

  async delete(id: Id): Promise<void> {
    const { error } = await this.sb.from('discounts').delete().eq('id', id);
    if (error) throw error;
  }
}