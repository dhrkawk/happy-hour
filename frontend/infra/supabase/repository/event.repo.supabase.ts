// infra/supabase/event-repository.supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/infra/supabase/shared/types';

import type { Id } from '@/domain/shared/repository';
import type { EventRepository } from '@/domain/repositories/event.repo';

import {
  Event,
  Discount,
  GiftGroup,
  GiftOption,
  type EventWithDiscountsAndGifts,
} from '@/domain/entities/entities';

import { toEventCreatePayload, toEventUpdatePayload } from '../shared/utils';
import { CreateEventWithDiscountsAndGiftsDTO, UpdateEventWithDiscountsAndGiftsDTO } from '@/domain/schemas/schemas';

// ---- DB row shorthand types ----
type EventRow       = Tables<'events'>;
type DiscountRow    = Tables<'discounts'>;
type GiftGroupRow   = Tables<'gift_groups'>;
type GiftOptionRow  = Tables<'gift_options'>;

// RPC payload/result shapes (jsonb)
type RpcEventDetail =
  | {
      event: EventRow;
      discounts: DiscountRow[];
      gift_groups: Array<{
        group: GiftGroupRow;
        options: GiftOptionRow[];
      }>;
    }
  | null;

export class SupabaseEventRepository implements EventRepository {
  constructor(private readonly sb: SupabaseClient<Database>) {}

  /**
   * 단일 이벤트 + (옵션) 활성 discount/gift만 포함해서 상세 조회
   * RPC: public.event_with_discounts_and_gifts(p_event_id uuid, p_only_active boolean)
   */
  async getEventWithDiscountsAndGiftsById(
    id: Id,
    opts?: { onlyActive?: boolean }
  ): Promise<EventWithDiscountsAndGifts> {
    const { data, error } = await this.sb.rpc('event_with_discounts_and_gifts', {
      p_event_id: id,
      p_only_active: opts?.onlyActive ?? false,
    });
    if (error) throw error;

    const payload = data as unknown as RpcEventDetail;
    if (!payload || !payload.event) {
      throw new Error('Event not found');
    }

    const ev = Event.fromRow(payload.event);
    const discounts = (payload.discounts ?? []).map(Discount.fromRow);
    const giftGroups = (payload.gift_groups ?? []).map((g) => ({
      group: GiftGroup.fromRow(g.group),
      options: (g.options ?? []).map(GiftOption.fromRow),
    }));

    return { event: ev, discounts, giftGroups };
  }

  /**
   * 이벤트 생성 (헤더 + discounts + gift_options)
   * RPC: public.create_event_with_discounts_and_gifts(payload jsonb)
   *  - 서버에서 max_discount_rate 자동 계산/반영
   */
  async createEventWithDiscountsAndGifts(
    dto: CreateEventWithDiscountsAndGiftsDTO
  ): Promise<{ eventId: Id }> {
    const payload = toEventCreatePayload(dto);
    const { data, error } = await this.sb.rpc('create_event_with_discounts_and_gifts', {
      payload,
    });
    if (error) throw error;
  
    const eventId = (data as any)?.event_id as string | undefined;
    if (!eventId) throw new Error('RPC did not return event_id');
    return { eventId: eventId as Id };
  }
  

  /**
   * 이벤트 업데이트 (헤더 upsert + discounts/gifts replace-all 전략)
   * RPC: public.update_event_with_discounts_and_gifts(payload jsonb)
   *  - 서버에서 max_discount_rate 재계산/반영
   */
  async updateEventWithDiscountsAndGifts(
    dto: UpdateEventWithDiscountsAndGiftsDTO
  ): Promise<{ eventId: Id }> {
    const payload = toEventUpdatePayload(dto);
    const { data, error } = await this.sb.rpc('update_event_with_discounts_and_gifts', {
      payload,
    });
    if (error) throw error;
  
    const eventId = (data as any)?.event_id as string | undefined;
    if (!eventId) throw new Error('RPC did not return event_id');
    return { eventId: eventId as Id };
  }

  /**
   * 소프트 삭제: 이벤트 비활성화 (children은 그대로 두고, 필요시 별도 정책)
   *  - 별도 RPC 없어도 충분 (단순 플래그 변경)
   *  - 강제 비활성화하므로 is_active=false
   */
  async softDeleteEvent(id: Id): Promise<void> {
    const { error } = await this.sb
      .from('events')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  }
}