// infra/supabase/gift-option-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/infra/supabase/shared/types';
import type { Id, Page } from '@/domain/shared/repository';
import type { GiftOptionRepository, GiftOptionFilter } from '@/domain/gift/gift-option-repository';
import { GiftOption } from '@/domain/gift/gift-option.entity';

type Row    = Tables<'gift_options'>;
type Insert = TablesInsert<'gift_options'>;
type Update = TablesUpdate<'gift_options'>;

export class SupabaseGiftOptionRepository implements GiftOptionRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  private toEntity = (r: Row): GiftOption =>
    GiftOption.create({
      id: r.id,
      gift_group_id: r.gift_group_id,
      menu_id: r.menu_id,
      remaining: r.remaining,
      is_active: r.is_active,
      created_at: r.created_at,
    });

  private applyFilter(q: ReturnType<SupabaseClient['from']> & any, filter?: GiftOptionFilter) {
    if (!filter) return q;
    if (filter.giftGroupId) q = q.eq('gift_group_id', filter.giftGroupId);
    if (filter.giftGroupIds?.length) q = q.in('gift_group_id', filter.giftGroupIds);
    if (filter.menuId) q = q.eq('menu_id', filter.menuId);
    if (typeof filter.isActive === 'boolean') q = q.eq('is_active', filter.isActive);
    return q;
  }

  private applyPage(q: ReturnType<SupabaseClient['from']> & any, page?: Page) {
    if (!page) return q;
    const limit = page.limit ?? 20;
    const offset = page.offset ?? 0;
    return q.range(offset, offset + limit - 1);
  }

  async getById(id: Id): Promise<GiftOption | null> {
    const { data, error } = await this.sb
      .from('gift_options')
      .select('*')
      .eq('id', id)
      .maybeSingle<Row>();
    if (error) throw error;
    return data ? this.toEntity(data) : null;
  }

  async list(filter?: GiftOptionFilter, page?: Page): Promise<GiftOption[]> {
    let q = this.sb.from('gift_options').select('*').order('created_at', { ascending: false }) as any;
    q = this.applyFilter(q, filter);
    q = this.applyPage(q, page);
    const { data, error } = (await q) as { data: Row[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async listByGroup(giftGroupId: Id, page?: Page): Promise<GiftOption[]> {
    return this.list({ giftGroupId }, page);
  }

  async listByGroupIds(giftGroupIds: Id[]): Promise<GiftOption[]> {
    if (!giftGroupIds.length) return [];
    const { data, error } = await this.sb
      .from('gift_options')
      .select('*')
      .in('gift_group_id', giftGroupIds)
      .order('created_at', { ascending: false }) as { data: Row[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async listByMenu(menuId: Id, page?: Page): Promise<GiftOption[]> {
    return this.list({ menuId }, page);
  }

  async count(filter?: GiftOptionFilter): Promise<number> {
    let q = this.sb.from('gift_options').select('*', { count: 'exact', head: true }) as any;
    q = this.applyFilter(q, filter);
    const { count, error } = (await q) as { count: number | null; error: any };
    if (error) throw error;
    return count ?? 0;
  }

  async save(option: GiftOption): Promise<void> {
    const row = option.toRow() as Insert;
    const { error } = await this.sb.from('gift_options').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async delete(id: Id): Promise<void> {
    const { error } = await this.sb.from('gift_options').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * 남은 수량 원자적 감소.
   * 권장: Postgres 함수(RPC)로 구현해서 경쟁조건 방지.
   *   SQL 예시:
   *   create or replace function public.decrement_gift_option_remaining(p_id uuid, p_by int)
   *   returns void language sql as $$
   *     update public.gift_options
   *     set remaining = greatest(0, coalesce(remaining, 0) - p_by)
   *     where id = p_id;
   *   $$ security definer;
   *
   *   TS:
   *   await sb.rpc('decrement_gift_option_remaining', { p_id: id, p_by: by });
   */
  async decrementRemaining(id: Id, by: number): Promise<void> {
    if (by <= 0) return;

    // // RPC 권장
    const { error } = await this.sb.rpc('decrement_gift_option_remaining', {
      p_option_id: id,
      p_by: by,
    });
    if (error) throw error;
  }
}