// domain/event/event.entity.ts
import { Guard } from '../shared/guard';

export class Event {
  private constructor(
    public readonly id: string,
    public readonly storeId: string,
    public dateRange: { start: string; end: string }, // YYYY-MM-DD
    public happyHour: { start: string; end: string }, // HH:MM:SS
    public weekdays: { items: string[] },
    public isActive: boolean,
    public description: string | null,
    public readonly createdAt: string,
    public maxDiscountRate: number | null,
    public title: string,
    public maxFinalPrice: number | null,
    public maxOriginalPrice: number | null
  ) {}

  static create(i: {
    id: string; store_id: string;
    start_date: string; end_date: string;
    happy_hour_start_time: string; happy_hour_end_time: string;
    weekdays: string[]; is_active?: boolean; description?: string | null;
    created_at?: string | Date; max_discount_rate?: number | null;
    title?: string; max_final_price?: number | null; max_original_price?: number | null;
  }): Event {
    return new Event(
      Guard.uuid(i.id, 'events.id'),
      Guard.uuid(i.store_id, 'events.store_id'),
      { start: Guard.dateYMD(i.start_date, 'events.start_date'),
        end: Guard.dateYMD(i.end_date, 'events.end_date') },
      { start: Guard.timeHM(i.happy_hour_start_time, 'events.hh_start'),
        end: Guard.timeHM(i.happy_hour_end_time, 'events.hh_end') },
      { items: Guard.stringArray(i.weekdays, 'events.weekdays') },
      Boolean(i.is_active ?? true),
      i.description ?? null,
      Guard.isoDate(i.created_at ?? new Date().toISOString(), 'events.created_at'),
      i.max_discount_rate ?? null,
      String(i.title ?? ''),
      i.max_final_price ?? null,
      i.max_original_price ?? null
    );
  }

  toRow() {
    return {
      id: this.id,
      store_id: this.storeId,
      start_date: this.dateRange.start,
      end_date: this.dateRange.end,
      happy_hour_start_time: this.happyHour.start,
      happy_hour_end_time: this.happyHour.end,
      weekdays: this.weekdays.items,
      is_active: this.isActive,
      description: this.description,
      created_at: this.createdAt,
      max_discount_rate: this.maxDiscountRate,
      title: this.title,
      max_final_price: this.maxFinalPrice,
      max_original_price: this.maxOriginalPrice
    };
  }
}