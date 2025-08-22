// domain/discount/discount.entity.ts
import { Guard } from '../shared/guard';

export class Discount {
  private constructor(
    public readonly id: string,
    public discountRate: number,           // 0..100
    public remaining: number | null,       // 재고 없으면 null 허용
    public readonly createdAt: string,
    public readonly menuId: string,
    public isActive: boolean,
    public finalPrice: number,             // > 0
    public readonly eventId: string
  ) {}

  static create(i: {
    id: string; discount_rate: number; remaining?: number | null;
    created_at?: string | Date; menu_id: string; is_active?: boolean;
    final_price: number; event_id: string;
  }): Discount {
    return new Discount(
      Guard.uuid(i.id, 'discounts.id'),
      Guard.percentage(i.discount_rate, 'discounts.discount_rate'),
      i.remaining == null ? null : Guard.nonNegInt(i.remaining, 'discounts.remaining'),
      Guard.isoDate(i.created_at ?? new Date().toISOString(), 'discounts.created_at'),
      Guard.uuid(i.menu_id, 'discounts.menu_id'),
      Boolean(i.is_active ?? false),
      Guard.posInt(i.final_price, 'discounts.final_price'),
      Guard.uuid(i.event_id, 'discounts.event_id')
    );
  }

  toRow() {
    return {
      id: this.id,
      discount_rate: this.discountRate,
      remaining: this.remaining,
      created_at: this.createdAt,
      menu_id: this.menuId,
      is_active: this.isActive,
      final_price: this.finalPrice,
      event_id: this.eventId
    };
  }
}