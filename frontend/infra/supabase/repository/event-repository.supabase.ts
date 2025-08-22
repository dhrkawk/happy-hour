// infra/supabase/event-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/infra/supabase/shared/types';

import type { Id, Page, Sort } from '@/domain/shared/repository';
import type { EventRepository, EventFilter } from '@/domain/event/event.repository';
import { Event } from '@/domain/event/event.entity';

type Row    = Tables<'events'>;
type Insert = TablesInsert<'events'>;
type Update = TablesUpdate<'events'>;

export class SupabaseEventRepository implements EventRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  // ---------- helpers ----------
  private toEntity = (r: Row): Event =>
    Event.create({
      id: r.id,
      store_id: r.store_id,
      start_date: r.start_date,
      end_date: r.end_date,
      happy_hour_start_time: r.happy_hour_start_time,
      happy_hour_end_time: r.happy_hour_end_time,
      weekdays: r.weekdays ?? [],
      is_active: r.is_active ?? true,
      description: r.description ?? null,
      created_at: r.created_at,
      max_discount_rate: r.max_discount_rate ?? null,
      title: r.title ?? '',
      max_final_price: r.max_final_price ?? null,
      max_original_price: r.max_original_price ?? null,
    });

  private applyFilter(q: ReturnType<SupabaseClient['from']> & any, f?: EventFilter) {
    if (!f) return q;
    if (f.storeId) q = q.eq('store_id', f.storeId);
    if (typeof f.isActive === 'boolean') q = q.eq('is_active', f.isActive);

    // 기간 겹침: start_date <= toDate AND end_date >= fromDate
    if (f.fromDate) q = q.gte('end_date', f.fromDate);
    if (f.toDate)   q = q.lte('start_date', f.toDate);

    // 요일 교집합(하나라도 겹치면): overlaps
    if (f.weekdays?.length) q = q.overlaps('weekdays', f.weekdays);

    return q;
  }

  private applySort(q: ReturnType<SupabaseClient['from']> & any, sort?: Sort<'created_at'|'start_date'|'end_date'|'title'>) {
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
  async getById(id: Id): Promise<Event | null> {
    const { data, error } = await this.sb
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle<Row>();
    if (error) throw error;
    return data ? this.toEntity(data) : null;
  }

  async list(
    filter?: EventFilter,
    page?: Page,
    sort?: Sort<'created_at' | 'start_date' | 'end_date' | 'title'>
  ): Promise<Event[]> {
    let q = this.sb.from('events').select('*') as any;
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
    sort?: Sort<'created_at' | 'start_date' | 'end_date' | 'title'>,
    opt?: { onlyActive?: boolean }
  ): Promise<Event[]> {
    const filter: EventFilter = { storeId, isActive: opt?.onlyActive };
    return this.list(filter, page, sort);
  }

  async listByIds(ids: Id[]): Promise<Event[]> {
    if (!ids.length) return [];
    const { data, error } = await this.sb
      .from('events')
      .select('*')
      .in('id', ids) as { data: Row[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async count(filter?: EventFilter): Promise<number> {
    let q = this.sb.from('events').select('*', { count: 'exact', head: true }) as any;
    q = this.applyFilter(q, filter);
    const { count, error } = (await q) as { count: number | null; error: any };
    if (error) throw error;
    return count ?? 0;
  }

  async save(event: Event): Promise<void> {
    const row = event.toRow() as Insert;
    const { error } = await this.sb.from('events').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async setActive(id: Id, active: boolean): Promise<void> {
    const { error } = await this.sb
      .from('events')
      .update({ is_active: active } satisfies Partial<Update>)
      .eq('id', id);
    if (error) throw error;
  }

  async delete(id: Id): Promise<void> {
    const { error } = await this.sb.from('events').delete().eq('id', id);
    if (error) throw error;
  }
}