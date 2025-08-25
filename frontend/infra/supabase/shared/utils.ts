// utils/rpc-payload.ts
import type {
    CreateEventWithDiscountsAndGiftsDTO,
    UpdateEventWithDiscountsAndGiftsDTO,
  } from "@/domain/schemas/schemas";
  
  type WeekdayLower = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  type WeekdayUpper = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  
  // Date → 'YYYY-MM-DD'
  const toYMD = (d: Date | string) =>
    typeof d === "string" ? d : d.toISOString().slice(0, 10);
  
  // 객체에서 undefined 키 제거
  const stripUndefined = <T extends Record<string, any>>(obj: T): T => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) out[k] = v;
    }
    return out as T;
  };
  
  const upperWeekday = (w: WeekdayLower): WeekdayUpper =>
    w.toUpperCase() as WeekdayUpper;
  
  /** Create DTO → RPC payload (JSON-safe) */
  export function toEventCreatePayload(dto: CreateEventWithDiscountsAndGiftsDTO) {
    return stripUndefined({
      store_id: dto.store_id,
      start_date: toYMD(dto.start_date),
      end_date: toYMD(dto.end_date),
      happy_hour_start_time: dto.happy_hour_start_time ?? null, // 'HH:mm[:ss]' | null
      happy_hour_end_time: dto.happy_hour_end_time ?? null,
      weekdays: dto.weekdays.map(upperWeekday),                 // ["MON", ...]
      is_active: dto.is_active ?? true,
      description: dto.description ?? null,
      title: dto.title,
  
      discounts: dto.discounts.map(d =>
        stripUndefined({
          menu_id: d.menu_id,
          discount_rate: d.discount_rate,
          remaining: d.remaining ?? null,
          is_active: d.is_active ?? true,
          final_price: d.final_price,
        })
      ),
  
      gift_options: (dto.gift_options ?? []).map(g =>
        stripUndefined({
          menu_id: g.menu_id,
          remaining: g.remaining ?? null,
          is_active: g.is_active ?? true,
        })
      ),
    });
  }
  
  /** Update DTO → RPC payload (JSON-safe) */
  export function toEventUpdatePayload(dto: UpdateEventWithDiscountsAndGiftsDTO) {
    return stripUndefined({
      id: dto.id,
      store_id: dto.store_id,
      start_date: toYMD(dto.start_date),
      end_date: toYMD(dto.end_date),
      happy_hour_start_time: dto.happy_hour_start_time ?? null,
      happy_hour_end_time: dto.happy_hour_end_time ?? null,
      weekdays: dto.weekdays.map(upperWeekday),
      is_active: dto.is_active ?? true,
      description: dto.description ?? null,
      title: dto.title,
  
      // upsert: id 있으면 update, 없으면 insert
      discounts: dto.discounts.map(d =>
        stripUndefined({
          id: d.id, // optional
          menu_id: d.menu_id,
          discount_rate: d.discount_rate,
          remaining: d.remaining ?? null,
          is_active: d.is_active ?? true,
          final_price: d.final_price,
        })
      ),
  
      gift_options: (dto.gift_options ?? []).map(g =>
        stripUndefined({
          id: g.id, // optional
          menu_id: g.menu_id,
          remaining: g.remaining ?? null,
          is_active: g.is_active ?? true,
        })
      ),
    });
  }