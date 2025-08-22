// domain/coupon/coupon-repository.ts
import { Id, Page } from '../shared/repository';
import { Coupon, CouponItem, CouponStatus } from './coupon.entity';

export type CouponWithItems = { coupon: Coupon; items: CouponItem[] };

export interface CouponRepository {
  /**
   * 쿠폰 + 아이템을 함께 생성 (원자적 트랜잭션)
   * 구현체에서는 반드시 DB 트랜잭션(RPC 등)을 사용해야 함.
   */
  create(coupon: Coupon, items: CouponItem[]): Promise<void>;

  /**
   * 단건 조회 (아이템 포함)
   * 조회 전용 조립. 조인은 레포지토리 내부에서 두 번 호출해도 무방.
   */
  getWithItems(id: Id): Promise<CouponWithItems | null>;

  /**
   * 사용자별 목록 (요약 or 전체)
   * status 필터가 있으면 해당 상태만.
   * 페이지네이션은 서버 사이드에서 처리.
   */
  listByUser(
    userId: Id,
    page?: Page,
    opt?: { status?: CouponStatus }
  ): Promise<Coupon[]>;

  /** 상태만 변경 (원자적 업데이트) */
  updateStatus(id: Id, status: CouponStatus): Promise<void>;

  /** 아이템 추가(배치) — Aggregate 내부 변경(원자성 보장) */
  addItems(couponId: Id, items: CouponItem[]): Promise<void>;

  /** 아이템 단건 삭제 */
  removeItem(itemId: Id): Promise<void>;

  /** 전체 삭제 (아이템 포함) */
  delete(id: Id): Promise<void>;
}