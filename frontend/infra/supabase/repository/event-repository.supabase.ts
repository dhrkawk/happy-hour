// infra/supabase/event-aggregate-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/infra/supabase/shared/types';

import type { Id, Page, Sort } from '@/domain/shared/repository';
import type {
  EventRepository,
  EventAggregate,
  EventFilter,
} from '@/domain/event/event.repository';
import { Event } from '@/domain/event/event.entity';
import { Discount } from '@/domain/discount/discount.entity';
import { GiftGroup } from '@/domain/gift/gift-group.entity';
import { GiftOption } from '@/domain/gift/gift-option.entity';

// ========== Supabase 타입 별칭 ==========
type EventRow      = Tables<'events'>;
type EventInsert   = TablesInsert<'events'>;
type EventUpdate   = TablesUpdate<'events'>;

type DiscountRow   = Tables<'discounts'>;
type DiscountInsert= TablesInsert<'discounts'>;
type DiscountUpdate= TablesUpdate<'discounts'>;

type GroupRow      = Tables<'gift_groups'>;
type GroupInsert   = TablesInsert<'gift_groups'>;
type GroupUpdate   = TablesUpdate<'gift_groups'>;

type OptionRow     = Tables<'gift_options'>;
type OptionInsert  = TablesInsert<'gift_options'>;
type OptionUpdate  = TablesUpdate<'gift_options'>;

export class SupabaseEventAggregateRepository implements EventRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  // ========== mappers ==========
  private toEvent = (r: EventRow): Event =>
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

  private toDiscount = (r: DiscountRow): Discount =>
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

  private toGroup = (r: GroupRow): GiftGroup =>
    GiftGroup.create({
      id: r.id,
      event_id: r.event_id,
      created_at: r.created_at,
    });

  private toOption = (r: OptionRow): GiftOption =>
    GiftOption.create({
      id: r.id,
      gift_group_id: r.gift_group_id,
      menu_id: r.menu_id,
      remaining: r.remaining,
      is_active: r.is_active,
      created_at: r.created_at,
    });

  // ========== query helpers ==========
  private applyEventFilter(q: ReturnType<SupabaseClient['from']> & any, filter?: EventFilter) {
    if (!filter) return q;
    if (typeof filter.isActive === 'boolean') q = q.eq('is_active', filter.isActive);
    if (filter.fromDate) q = q.gte('end_date', filter.fromDate);   // 기간 겹침
    if (filter.toDate)   q = q.lte('start_date', filter.toDate);
    if (filter.weekdays?.length) q = q.overlaps('weekdays', filter.weekdays);
    return q;
  }
  private applySort(q: any, sort?: Sort<'created_at'|'start_date'|'end_date'|'title'>) {
    if (!sort) return q.order('created_at', { ascending: false });
    const { field, order = 'desc' } = sort;
    return q.order(field, { ascending: order === 'asc' });
  }
  private applyPage(q: any, page?: Page) {
    if (!page) return q;
    const limit = page.limit ?? 20;
    const offset = page.offset ?? 0;
    return q.range(offset, offset + limit - 1);
  }

  // ========== Commands (트랜잭션 경계) ==========
  /**
   * 권장: Postgres RPC `create_event_aggregate`
   *  - 입력: event(EventInsert), discounts(DiscountInsert[]), groups(GroupInsert[]), options(OptionInsert[])
   *  - 내부에서 FK/불변조건 검증 후 원자적 insert
   */
  async create(aggregate: EventAggregate): Promise<void> {
    const e: EventInsert = aggregate.event.toRow() as EventInsert;
    const ds: DiscountInsert[] = aggregate.discounts.map(d => d.toRow() as DiscountInsert);
    const groups: GroupInsert[] = aggregate.giftGroups.map(g => g.group.toRow() as GroupInsert);
    const options: OptionInsert[] = aggregate.giftGroups.flatMap(g => g.options.map(o => o.toRow() as OptionInsert));

    const { error } = await this.sb.rpc('create_event_aggregate', {
      p_event: e,
      p_discounts: ds,
      p_gift_groups: groups,
      p_gift_options: options,
    });
    if (error) throw error;
  }

  async updateEvent(event: Event): Promise<void> {
    const row = event.toRow() as EventInsert;
    const { error } = await this.sb.from('events').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async setActive(eventId: Id, active: boolean): Promise<void> {
    const { error } = await this.sb.from('events').update({ is_active: active } as Partial<EventUpdate>).eq('id', eventId);
    if (error) throw error;
  }

  /**
   * 전량 교체(동기화). 권장: RPC `replace_event_discounts`
   *  - 내부: 해당 event_id의 discounts 삭제 후 새 rows 삽입(원자적)
   */
  async replaceDiscounts(eventId: Id, discounts: Discount[]): Promise<void> {
    const rows: DiscountInsert[] = discounts.map(d => {
      const r = d.toRow() as DiscountInsert;
      r.event_id = eventId;
      return r;
    });
    const { error } = await this.sb.rpc('replace_event_discounts', { p_event_id: eventId, p_discounts: rows });
    if (error) throw error;
  }

  /** 점진적 추가/수정(upsert). onConflict: 'id' */
  async upsertDiscounts(eventId: Id, discounts: Discount[]): Promise<void> {
    if (!discounts.length) return;
    const rows: DiscountInsert[] = discounts.map(d => {
      const r = d.toRow() as DiscountInsert;
      (r as any).event_id = eventId;
      return r;
    });
    const { error } = await this.sb.from('discounts').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  }

  /**
   * 기프트 그룹/옵션 일괄 upsert. 권장: RPC `upsert_event_gifts`
   *  - groups: 추가/수정
   *  - options: 각 그룹별 추가/수정
   */
  async upsertGiftGroupsWithOptions(
    eventId: Id,
    groups: Array<{ group: GiftGroup; options: GiftOption[] }>
  ): Promise<void> {
    const gRows: (GroupInsert|GroupUpdate)[] = groups.map(g => {
      const row = g.group.toRow() as GroupInsert|GroupUpdate;
      (row as any).event_id = eventId;
      return row;
    });
    const oRows: (OptionInsert|OptionUpdate)[] = groups.flatMap(g =>
      g.options.map(o => o.toRow() as OptionInsert|OptionUpdate)
    );

    const { error } = await this.sb.rpc('upsert_event_gifts', {
      p_event_id: eventId,
      p_groups: gRows,
      p_options: oRows,
    });
    if (error) throw error;
  }

  async removeGiftGroup(groupId: Id): Promise<void> {
    // 권장: RPC에서 options까지 함께 삭제
    const { error } = await this.sb.rpc('delete_gift_group_cascade', { p_group_id: groupId });
    if (error) throw error;
  }

  async removeGiftOption(optionId: Id): Promise<void> {
    const { error } = await this.sb.from('gift_options').delete().eq('id', optionId);
    if (error) throw error;
  }

  /** 이벤트 전체 삭제 (discounts, gift_groups, gift_options 포함) */
  async deleteCascade(eventId: Id): Promise<void> {
    const { error } = await this.sb.rpc('delete_event_cascade', { p_event_id: eventId });
    if (error) throw error;
  }

  // ========== Queries ==========
  async getAggregate(eventId: Id): Promise<EventAggregate | null> {
    const { data: e, error: e1 } = await this.sb.from('events').select('*').eq('id', eventId).maybeSingle<EventRow>();
    if (e1) throw e1;
    if (!e) return null;

    const [{ data: dRows, error: e2 }, { data: gRows, error: e3 }] = await Promise.all([
      this.sb.from('discounts').select('*').eq('event_id', eventId),
      this.sb.from('gift_groups').select('*').eq('event_id', eventId),
    ]);
    if (e2) throw e2;
    if (e3) throw e3;

    const groupIds = (gRows ?? []).map(g => g.id);
    const { data: oRows, error: e4 } = groupIds.length
      ? await this.sb.from('gift_options').select('*').in('gift_group_id', groupIds) as { data: OptionRow[] | null; error: any }
      : { data: [] as OptionRow[], error: null };
    if (e4) throw e4;

    const discounts = (dRows ?? []).map(this.toDiscount);
    const giftGroups = (gRows ?? []).map(g => ({
      group: this.toGroup(g),
      options: (oRows ?? []).filter(o => o.gift_group_id === g.id).map(this.toOption),
    }));

    return { event: this.toEvent(e), discounts, giftGroups };
  }

  async listEventsByStore(
    storeId: Id,
    page?: Page,
    sort?: Sort<'created_at' | 'start_date' | 'end_date' | 'title'>,
    filter?: EventFilter
  ): Promise<Event[]> {
    let q = this.sb.from('events').select('*').eq('store_id', storeId) as any;
    q = this.applyEventFilter(q, filter);
    q = this.applySort(q, sort);
    q = this.applyPage(q, page);

    const { data, error } = (await q) as { data: EventRow[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEvent);
  }

  async listEventsByStoreIds(
    storeIds: Id[],
    sort?: Sort<'created_at' | 'start_date' | 'end_date' | 'title'>,
    filter?: { isActive?: boolean }
  ): Promise<{ storeId: Id; events: Event[] }[]> {
    if (!storeIds.length) return [];

    let q = this.sb.from('events').select('*').in('store_id', storeIds) as any;
    if (typeof filter?.isActive === 'boolean') {
      q = q.eq('is_active', filter.isActive);
    }
    // 정렬 기본값
    if (sort) {
      q = q.order(sort.field, { ascending: sort.order === 'asc' });
    } else {
      q = q.order('created_at', { ascending: false });
    }

    const { data, error } = await q as { data: EventRow[] | null; error: any };
    if (error) throw error;

    // 그룹핑
    const map = new Map<string, Event[]>();
    for (const r of data ?? []) {
      const arr = map.get(r.store_id) ?? [];
      arr.push(this.toEvent(r));
      map.set(r.store_id, arr);
    }

    return storeIds.map((id) => ({ storeId: id, events: map.get(id) ?? [] }));
  }

  async countEventsByStore(storeId: Id, filter?: EventFilter): Promise<number> {
    let q = this.sb.from('events').select('*', { count: 'exact', head: true }).eq('store_id', storeId) as any;
    q = this.applyEventFilter(q, filter);
    const { count, error } = (await q) as { count: number | null; error: any };
    if (error) throw error;
    return count ?? 0;
  }

  /**
   * 무거운 조회: 스토어 단위로 Aggregate를 페이지네이션해서 전부 조립
   * (목록에서 바로 상세가 필요한 화면에서만 사용 권장)
   */
  async listAggregatesByStore(
    storeId: Id,
    page?: Page,
    sort?: Sort<'created_at' | 'start_date' | 'end_date' | 'title'>,
    filter?: EventFilter
  ): Promise<EventAggregate[]> {
    const events = await this.listEventsByStore(storeId, page, sort, filter);
    if (!events.length) return [];

    const eventIds = events.map(e => e.id);
    const [{ data: dRows, error: e1 }, { data: gRows, error: e2 }] = await Promise.all([
      this.sb.from('discounts').select('*').in('event_id', eventIds),
      this.sb.from('gift_groups').select('*').in('event_id', eventIds),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;

    const groupIds = (gRows ?? []).map(g => g.id);
    const { data: oRows, error: e3 } = groupIds.length
      ? await this.sb.from('gift_options').select('*').in('gift_group_id', groupIds) as { data: OptionRow[] | null; error: any }
      : { data: [] as OptionRow[], error: null };
    if (e3) throw e3;

    // 조립
    const discountsByEvent = new Map<string, Discount[]>();
    (dRows ?? []).forEach(r => {
      const list = discountsByEvent.get(r.event_id) ?? [];
      list.push(this.toDiscount(r));
      discountsByEvent.set(r.event_id, list);
    });

    const optionsByGroup = new Map<string, GiftOption[]>();
    (oRows ?? []).forEach(r => {
      const list = optionsByGroup.get(r.gift_group_id) ?? [];
      list.push(this.toOption(r));
      optionsByGroup.set(r.gift_group_id, list);
    });

    const groupsByEvent = new Map<string, Array<{ group: GiftGroup; options: GiftOption[] }>>();
    (gRows ?? []).forEach(r => {
      const pair = { group: this.toGroup(r), options: optionsByGroup.get(r.id) ?? [] };
      const list = groupsByEvent.get(r.event_id) ?? [];
      list.push(pair);
      groupsByEvent.set(r.event_id, list);
    });

    return events.map(ev => ({
      event: ev,
      discounts: discountsByEvent.get(ev.id) ?? [],
      giftGroups: groupsByEvent.get(ev.id) ?? [],
    }));
  }

  /** 특정 날짜에 유효한 활성 이벤트 */
  async listActiveOnDate(storeId: Id, ymd: string, weekdays?: string[]): Promise<Event[]> {
    let q = this.sb
      .from('events')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .lte('start_date', ymd)  // start_date <= ymd
      .gte('end_date', ymd);   // end_date >= ymd
    if (weekdays?.length) q = (q as any).overlaps('weekdays', weekdays);

    const { data, error } = await q as { data: EventRow[] | null; error: any };
    if (error) throw error;
    return (data ?? []).map(this.toEvent);
  }
}