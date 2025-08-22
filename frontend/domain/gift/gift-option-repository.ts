// domain/gift/gift-option-repository.ts
import type { Id, Page } from '@/domain/shared/repository';
import { GiftOption } from './gift-option.entity';

export type GiftOptionFilter = {
  giftGroupId?: Id;        // 특정 그룹의 옵션
  giftGroupIds?: Id[];     // 여러 그룹의 옵션(배치)
  menuId?: Id;             // 특정 메뉴와 연결된 옵션
  isActive?: boolean;      // 활성 옵션만
};

export interface GiftOptionRepository {
  /** 단건 조회 */
  getById(id: Id): Promise<GiftOption | null>;

  /** 목록 조회 (필터+페이지) */
  list(filter?: GiftOptionFilter, page?: Page): Promise<GiftOption[]>;

  /** 그룹 단위 sugar */
  listByGroup(giftGroupId: Id, page?: Page): Promise<GiftOption[]>;
  listByGroupIds(giftGroupIds: Id[]): Promise<GiftOption[]>;

  /** 메뉴 기준 조회 (선택) */
  listByMenu(menuId: Id, page?: Page): Promise<GiftOption[]>;

  /** 개수(필요 시) */
  count(filter?: GiftOptionFilter): Promise<number>;

  /** 생성/수정: 엔티티 → toRow → upsert 통일 */
  save(option: GiftOption): Promise<void>;

  /** 삭제 */
  delete(id: Id): Promise<void>;

  /**
   * 남은 수량 감소 (원자적 연산). -> atomic
   * 구현체에서 Postgres RPC 또는 update ... set remaining = greatest(remaining - $by, 0)
   * 같은 방식으로 경쟁조건을 방지하도록 한다.
   */
  decrementRemaining(id: Id, by: number): Promise<void>;
}