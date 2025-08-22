// domain/gift/gift-group-repository.ts
import type { Id, Page } from '@/domain/shared/repository';
import { GiftGroup } from './gift-group.entity';

export interface GiftGroupRepository {
  /** 단건 조회 */
  getById(id: Id): Promise<GiftGroup | null>;

  /** 이벤트 기준 조회 */
  listByEvent(eventId: Id, page?: Page): Promise<GiftGroup[]>;

  /** 배치(N+1 방지용): 여러 이벤트의 그룹 한 번에 */
  listByEventIds(eventIds: Id[]): Promise<GiftGroup[]>;

  /** 개수 (운영/페이지네이션용) */
  countByEvent(eventId: Id): Promise<number>;

  /** 생성/수정: 엔티티 → toRow → upsert 통일 */
  save(group: GiftGroup): Promise<void>;

  /** 삭제 */
  delete(id: Id): Promise<void>;
}