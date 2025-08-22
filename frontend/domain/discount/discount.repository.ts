import type { Id, Page, Sort } from '@/domain/shared/repository';
import { Discount } from './discount.entity';

export type DiscountFilter = {
  eventId?: Id;
  menuId?: Id;
  isActive?: boolean;
  priceMax?: number;            // final_price 상한
  priceMin?: number;            // final_price 하한
  discountRateGte?: number;     // 할인율 하한
  discountRateLte?: number;     // 할인율 상한
  hasRemaining?: boolean;       // 남은 수량(remaining > 0)만
};

export interface DiscountRepository {
  /** 단건 조회 */
  getById(id: Id): Promise<Discount | null>;

  /** 목록 조회 (필터/페이지/정렬) */
  list(
    filter?: DiscountFilter,
    page?: Page,
    sort?: Sort<'created_at' | 'final_price' | 'discount_rate'>
  ): Promise<Discount[]>;

  /** 이벤트 기준 */
  listByEvent(
    eventId: Id,
    page?: Page,
    sort?: Sort<'created_at' | 'final_price' | 'discount_rate'>,
    opt?: { onlyActive?: boolean; onlyInStock?: boolean }
  ): Promise<Discount[]>;

  /** 메뉴 기준 */
  listByMenu(
    menuId: Id,
    page?: Page,
    sort?: Sort<'created_at' | 'final_price' | 'discount_rate'>,
    opt?: { onlyActive?: boolean; onlyInStock?: boolean }
  ): Promise<Discount[]>;

  /** 배치 조회 */
  listByIds(ids: Id[]): Promise<Discount[]>;

  /** 개수 */
  count(filter?: DiscountFilter): Promise<number>;

  /** 생성/수정 (엔티티 → toRow → upsert 통일) */
  save(discount: Discount): Promise<void>;

  /** 활성/비활성 토글 (선택) */
  setActive(id: Id, active: boolean): Promise<void>;

  /**
   * 재고 감소 (원자적 연산 권장: RPC 또는 update ... set remaining = greatest(coalesce(remaining,0)-by, 0))
   */
  decrementRemaining(id: Id, by: number): Promise<void>;

  /** 삭제 */
  delete(id: Id): Promise<void>;
}