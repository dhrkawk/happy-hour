// domain/gift/gift-option.entity.ts
import { Guard } from '../shared/guard';

export class GiftOption {
  private constructor(
    public readonly id: string,
    public readonly giftGroupId: string,
    public readonly menuId: string,
    public remaining: number | null,
    public isActive: boolean,
    public readonly createdAt: string
  ) {}

  static create(i: {
    id: string; gift_group_id: string; menu_id: string;
    remaining?: number | null; is_active?: boolean; created_at?: string | Date;
  }): GiftOption {
    return new GiftOption(
      Guard.uuid(i.id, 'gift_options.id'),
      Guard.uuid(i.gift_group_id, 'gift_options.gift_group_id'),
      Guard.uuid(i.menu_id, 'gift_options.menu_id'),
      i.remaining == null ? null : Guard.nonNegInt(i.remaining, 'gift_options.remaining'),
      Boolean(i.is_active ?? true),
      Guard.isoDate(i.created_at ?? new Date().toISOString(), 'gift_options.created_at')
    );
  }

  toRow() {
    return {
      id: this.id,
      gift_group_id: this.giftGroupId,
      menu_id: this.menuId,
      remaining: this.remaining,
      is_active: this.isActive,
      created_at: this.createdAt
    };
  }
}