// domain/coupon/coupon-repository.ts
import { Id, Page } from '../shared/repository';
import { Coupon, CouponItem, CouponStatus } from './coupon.entity';

export type CouponWithItems = { coupon: Coupon; items: CouponItem[] };

export interface CouponRepository {
  /** 쿠폰 + 아이템을 함께 생성 (트랜잭션) */
  create(coupon: Coupon, items: CouponItem[]): Promise<void>;

  /** 단건 조회 (아이템 포함) */
  getWithItems(id: Id): Promise<CouponWithItems | null>;

  /** 사용자별 목록 (요약 or 전체) */
  listByUser(userId: Id, page?: Page, opt?: { status?: CouponStatus }): Promise<Coupon[]>;

  /** 상태만 변경 (원자적 업데이트) */
  updateStatus(id: Id, status: CouponStatus): Promise<void>;

  /** 아이템 추가/수정/삭제 (필요 시 쪼개서 제공) */
  addItems(couponId: Id, items: CouponItem[]): Promise<void>;
  removeItem(itemId: Id): Promise<void>;

  /** 전체 삭제 */
  delete(id: Id): Promise<void>;
}