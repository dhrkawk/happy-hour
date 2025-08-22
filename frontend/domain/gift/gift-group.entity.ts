// domain/gift/gift-group.entity.ts
import { Guard } from '../shared/guard';

export class GiftGroup {
  private constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly createdAt: string
  ) {}

  static create(i: { id: string; event_id: string; created_at?: string | Date }): GiftGroup {
    return new GiftGroup(
      Guard.uuid(i.id, 'gift_groups.id'),
      Guard.uuid(i.event_id, 'gift_groups.event_id'),
      Guard.isoDate(i.created_at ?? new Date().toISOString(), 'gift_groups.created_at')
    );
  }

  toRow() {
    return { id: this.id, event_id: this.eventId, created_at: this.createdAt };
  }
}