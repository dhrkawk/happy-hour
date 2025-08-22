// domain/coupon/coupon.entity.ts
import { Guard } from '../shared/guard';

export type CouponStatus = 'expired' | 'cancelled' | 'available' | undefined;

export class Coupon {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly storeId: string,
    public expectedVisitTime: string, // ISO
    public status: CouponStatus,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public expiredTime: string        // ISO
  ) {}

  static create(i: {
    id: string; user_id: string; store_id: string; expected_visit_time: string | Date;
    status?: CouponStatus; created_at?: string | Date; updated_at?: string | Date; expired_time: string | Date;
  }): Coupon {
    return new Coupon(
      Guard.uuid(i.id, 'coupons.id'),
      Guard.uuid(i.user_id, 'coupons.user_id'),
      Guard.uuid(i.store_id, 'coupons.store_id'),
      Guard.isoDate(i.expected_visit_time, 'coupons.expected_visit_time'),
      (i.status ?? 'pending') as CouponStatus,
      Guard.isoDate(i.created_at ?? new Date().toISOString(), 'coupons.created_at'),
      Guard.isoDate(i.updated_at ?? new Date().toISOString(), 'coupons.updated_at'),
      Guard.isoDate(i.expired_time, 'coupons.expired_time')
    );
  }

  toRow() {
    return {
      id: this.id,
      user_id: this.userId,
      store_id: this.storeId,
      expected_visit_time: this.expectedVisitTime,
      status: this.status,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      expired_time: this.expiredTime
    };
  }
}

export class CouponItem {
  private constructor(
    public readonly id: string,
    public readonly couponId: string,
    public quantity: number,
    public originalPrice: number,
    public discountRate: number,
    public menuName: string,
    public isGift: boolean,
    public finalPrice: number
  ) {}

  static create(i: {
    id: string; coupon_id: string; quantity: number; original_price: number;
    discount_rate: number; menu_name: string; is_gift?: boolean; final_price: number;
  }): CouponItem {
    return new CouponItem(
      Guard.uuid(i.id, 'coupon_items.id'),
      Guard.uuid(i.coupon_id, 'coupon_items.coupon_id'),
      Guard.posInt(i.quantity, 'coupon_items.quantity'),
      Guard.posInt(i.original_price, 'coupon_items.original_price'),
      Guard.percentage(i.discount_rate, 'coupon_items.discount_rate'),
      Guard.nonEmpty(i.menu_name, 'coupon_items.menu_name'),
      Boolean(i.is_gift ?? false),
      Guard.posInt(i.final_price, 'coupon_items.final_price')
    );
  }

  toRow() {
    return {
      id: this.id,
      coupon_id: this.couponId,
      quantity: this.quantity,
      original_price: this.originalPrice,
      discount_rate: this.discountRate,
      menu_name: this.menuName,
      is_gift: this.isGift,
      final_price: this.finalPrice
    };
  }
}