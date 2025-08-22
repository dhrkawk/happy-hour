import type { Id, Page, Sort } from '@/domain/shared/repository';
import { Event } from './event.entity';

export type EventFilter = {
  storeId?: Id;
  isActive?: boolean;                // 현재 활성 상태만
  // 기간 필터 (둘 다 주면 [from, to] 구간에 걸치는 이벤트)
  fromDate?: string;                 // 'YYYY-MM-DD'
  toDate?: string;                   // 'YYYY-MM-DD'
  // 특정 요일 포함 여부 (예: ['MON','TUE'])
  weekdays?: string[];
};

export interface EventRepository {
  /** 단건 조회 */
  getById(id: Id): Promise<Event | null>;

  /** 목록 조회 (필터/페이지/정렬) */
  list(
    filter?: EventFilter,
    page?: Page,
    sort?: Sort<'created_at' | 'start_date' | 'end_date' | 'title'>
  ): Promise<Event[]>;

  /** 매장 기준 슈거 */
  listByStore(
    storeId: Id,
    page?: Page,
    sort?: Sort<'created_at' | 'start_date' | 'end_date' | 'title'>,
    opt?: { onlyActive?: boolean }
  ): Promise<Event[]>;

  /** 배치 조회 */
  listByIds(ids: Id[]): Promise<Event[]>;

  /** 개수(페이지네이션용) */
  count(filter?: EventFilter): Promise<number>;

  /** 생성/수정 (엔티티 → toRow → upsert 통일) */
  save(event: Event): Promise<void>;

  /** 활성/비활성 토글이 자주 필요하면 제공 (선택) */
  setActive(id: Id, active: boolean): Promise<void>;

  /** 삭제 */
  delete(id: Id): Promise<void>;
}