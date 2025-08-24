// domain/event/event-aggregate-repository.ts
import type { Id, Page, Sort } from '@/domain/shared/repository';
import { Event } from './event.entity';
import { Discount } from '@/domain/discount/discount.entity';
import { GiftGroup } from '@/domain/gift/gift-group.entity';
import { GiftOption } from '@/domain/gift/gift-option.entity';

export type EventAggregate = {
  event: Event;
  discounts: Discount[];
  giftGroups: Array<{ group: GiftGroup; options: GiftOption[] }>;
};

export type EventFilter = {
  // 전역/스토어 공통 필터
  isActive?: boolean;
  fromDate?: string;    // 'YYYY-MM-DD' (기간 겹침: end_date >= fromDate)
  toDate?: string;      // 'YYYY-MM-DD' (기간 겹침: start_date <= toDate)
  weekdays?: string[];  // overlaps
};

export interface EventRepository {
  // ================= Commands (트랜잭션 경계) =================
  /** Event + Discounts + Gifts를 한 번에 생성 (원자적) */
  create(aggregate: EventAggregate): Promise<void>;

  /** Event 속성만 수정 */
  updateEvent(event: Event): Promise<void>;

  /** 활성/비활성 토글 */
  setActive(eventId: Id, active: boolean): Promise<void>;

  /** 할인 동기화(전량 교체) 혹은 upsert */
  replaceDiscounts(eventId: Id, discounts: Discount[]): Promise<void>;
  upsertDiscounts(eventId: Id, discounts: Discount[]): Promise<void>;

  /** 기프트 그룹/옵션 일괄 upsert 및 제거 */
  upsertGiftGroupsWithOptions(
    eventId: Id,
    groups: Array<{ group: GiftGroup; options: GiftOption[] }>
  ): Promise<void>;
  removeGiftGroup(groupId: Id): Promise<void>;
  removeGiftOption(optionId: Id): Promise<void>;

  /** 이벤트 전체 삭제 (하위 엔티티 포함) */
  deleteCascade(eventId: Id): Promise<void>;

  // ================= Queries (읽기) =================
  /** ID로 단건 집합 조회 */
  getAggregate(eventId: Id): Promise<EventAggregate | null>;

  /** 스토어 단위 헤더 목록 (가벼운 조회) */
  listEventsByStore(
    storeId: Id,
    page?: Page,
    sort?: Sort<'created_at' | 'start_date' | 'end_date' | 'title'>,
    filter?: EventFilter
  ): Promise<Event[]>;

  /** 스토어 단위 개수 */
  countEventsByStore(storeId: Id, filter?: EventFilter): Promise<number>;

  /** 스토어 단위 집합 조회(상세까지 한 번에) — 주의: 무거움, 필요 화면에서만 사용 */
  listAggregatesByStore(
    storeId: Id,
    page?: Page,
    sort?: Sort<'created_at' | 'start_date' | 'end_date' | 'title'>,
    filter?: EventFilter
  ): Promise<EventAggregate[]>;

  /** 특정 날짜에 유효한 활성 이벤트(스토어 단위) — 운영/검색 편의 */
  listActiveOnDate(
    storeId: Id,
    ymd: string /* 'YYYY-MM-DD' */,
    weekdays?: string[] // 특정 요일 제한이 필요하면
  ): Promise<Event[]>;

  listEventsByStoreIds(
    storeIds: Id[],
    sort?: Sort<'created_at' | 'start_date' | 'end_date' | 'title'>,
    filter?: { isActive?: boolean }
  ): Promise<{ storeId: Id; events: Event[] }[]>;
}