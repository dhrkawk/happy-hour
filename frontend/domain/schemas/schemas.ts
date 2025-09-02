// shared/schemas.ts
// Zod form schemas shared by client & server (MVP)
// - Insert/Update DTOs for all tables
// - Handles coercion from form inputs (strings) to numbers/booleans
// - Weekdays are text[] => string[]

import { z } from 'zod';

// ---------------- Common helpers ----------------
export const UUID = z.string().uuid();
export const NonEmpty = z.string().min(1);
export const Int = z.coerce.number().int();
export const IntPos = z.coerce.number().int().positive();
export const IntNonNeg = z.coerce.number().int().nonnegative();
export const Bool = z.coerce.boolean();

// ISO timestamp (allow string; keep as string for DB passthrough)
export const IsoTimestamp = z.string().min(1);
export const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD
export const TimeHHMM = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/); // HH:mm or HH:mm:ss

// Comma-or-array -> string[]
export const StringArray = z.preprocess((v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  if (v == null) return [];
  return v;
}, z.array(z.string()));

// Non-empty variant (use when DB requires at least one element)
export const StringArrayNonEmpty = z.preprocess((v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  if (v == null) return [];
  return v;
}, z.array(z.string()).min(1));

// ---------------- stores ----------------
export const StoreInsertSchema = z.object({
  name: NonEmpty,
  address: NonEmpty,
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  phone: NonEmpty,
  category: z.string().default(''),
  store_thumbnail: NonEmpty,
  owner_id: UUID,
  menu_category: StringArray.optional().transform((a) => (a && a.length ? a : null)),
  partnership: z.string().nullable().optional().default(null),
  is_active: Bool.default(true),
});
export type StoreInsertDTO = z.infer<typeof StoreInsertSchema>;

export const StoreUpdateSchema = z.object({
  name: NonEmpty,
  address: NonEmpty,
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  phone: NonEmpty,
  category: z.string(),
  store_thumbnail: NonEmpty,
  menu_category: StringArray.optional().transform((a) => (a && a.length ? a : null)),
  partnership: z.string().nullable().optional(),
  is_active: Bool,
});
export type StoreUpdateDTO = z.infer<typeof StoreUpdateSchema>;

// ---------------- store_menus ----------------
export const StoreMenuInsertSchema = z.object({
  store_id: UUID,
  name: NonEmpty,
  price: Int,
  thumbnail: z.string().nullable().optional().default(null),
  description: z.string().nullable().optional().default(null),
  category: z.string().optional().default('기타'),
});
export type StoreMenuInsertDTO = z.infer<typeof StoreMenuInsertSchema>;

export const StoreMenuUpdateSchema = z.object({
  name: NonEmpty,
  price: Int,
  thumbnail: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.string().optional(),
});
export type StoreMenuUpdateDTO = z.infer<typeof StoreMenuUpdateSchema>;

// ---------------- events ----------------
export const EventInsertSchema = z.object({
  store_id: UUID,
  start_date: DateString,
  end_date: DateString,
  happy_hour_start_time: TimeHHMM,
  happy_hour_end_time: TimeHHMM,
  weekdays: StringArrayNonEmpty, // text[]
  is_active: Bool.default(true),
  description: z.string().nullable().optional().default(null),
  max_discount_rate: Int.nullable().optional().default(null),
  title: z.string().optional().default(''),
});
export type EventInsertDTO = z.infer<typeof EventInsertSchema>;

export const EventUpdateSchema = z.object({
  start_date: DateString,
  end_date: DateString,
  happy_hour_start_time: TimeHHMM,
  happy_hour_end_time: TimeHHMM,
  weekdays: StringArrayNonEmpty,
  is_active: Bool,
  description: z.string().nullable().optional(),
  max_discount_rate: Int.nullable().optional(),
  title: z.string().optional(),
});
export type EventUpdateDTO = z.infer<typeof EventUpdateSchema>;

// ---------------- discounts ----------------
export const DiscountInsertSchema = z.object({
  discount_rate: Int,
  remaining: Int.nullable().optional().default(null),
  menu_id: UUID,
  is_active: Bool.default(true),
  final_price: IntPos,
  event_id: UUID,
});
export type DiscountInsertDTO = z.infer<typeof DiscountInsertSchema>;

export const DiscountUpdateSchema = z.object({
  discount_rate: Int,
  remaining: Int.nullable().optional(),
  is_active: Bool,
  final_price: IntPos,
  event_id: UUID,
});
export type DiscountUpdateDTO = z.infer<typeof DiscountUpdateSchema>;

// ---------------- coupons ----------------
export const CouponInsertSchema = z.object({
  user_id: UUID,
  event_id: UUID,                 // ← 추가 (필수)
  store_id: UUID,                 // 상황에 따라 유지/제거
  expected_visit_time: IsoTimestamp.nullable().optional().default(null),
  expired_time: IsoTimestamp.optional(),
  status: z.string().optional(),
  happy_hour_start_time: TimeHHMM,
  happy_hour_end_time: TimeHHMM,
  weekdays: StringArrayNonEmpty,
});
export type CouponInsertDTO = z.infer<typeof CouponInsertSchema>;

export const CouponUpdateSchema = z.object({
  expected_visit_time: IsoTimestamp.nullable().optional(),
  expired_time: IsoTimestamp.optional(),
  status: z.string().optional(),
});
export type CouponUpdateDTO = z.infer<typeof CouponUpdateSchema>;

// ---------------- coupon_items ----------------
export const CouponItemInsertSchema = z.object({
  coupon_id: UUID,
  quantity: Int.min(1),
  original_price: IntNonNeg,
  discount_rate: Int,
  menu_name: NonEmpty,
  is_gift: Bool.default(false),
  final_price: IntPos,
});
export type CouponItemInsertDTO = z.infer<typeof CouponItemInsertSchema>;

export const CouponItemUpdateSchema = z.object({
  quantity: Int.min(1),
  original_price: IntNonNeg,
  discount_rate: Int,
  menu_name: NonEmpty,
  is_gift: Bool,
  final_price: IntPos,
});
export type CouponItemUpdateDTO = z.infer<typeof CouponItemUpdateSchema>;

// ---------------- gift_groups ----------------
export const GiftGroupInsertSchema = z.object({
  event_id: UUID,
});
export type GiftGroupInsertDTO = z.infer<typeof GiftGroupInsertSchema>;

// No update schema (usually immutable), add if needed

// ---------------- gift_options ----------------
export const GiftOptionInsertSchema = z.object({
  gift_group_id: UUID,
  menu_id: UUID,
  remaining: Int.nullable().optional().default(null),
  is_active: Bool.default(true),
});
export type GiftOptionInsertDTO = z.infer<typeof GiftOptionInsertSchema>;

export const GiftOptionUpdateSchema = z.object({
  remaining: Int.nullable().optional(),
  is_active: Bool,
});
export type GiftOptionUpdateDTO = z.infer<typeof GiftOptionUpdateSchema>;

// ---------------- user_profiles ----------------
export const UserProfileInsertSchema = z.object({
  user_id: UUID,
  email: z.string().email(),
  provider_id: z.string().nullable().optional().default(null),
  name: NonEmpty,
  phone_number: NonEmpty,
  total_bookings: Int.default(0),
  total_savings: z.coerce.number().default(0), // bigint in DB; keep as number for MVP
  role: z.string().default('customer'),
  provider: z.string().nullable().optional().default(null),
  marketing_consent: Bool.default(false),
});
export type UserProfileInsertDTO = z.infer<typeof UserProfileInsertSchema>;

export const UserProfileUpdateSchema = z.object({
  email: z.string().email(),
  provider_id: z.string().nullable().optional(),
  name: NonEmpty,
  phone_number: NonEmpty,
  total_bookings: Int.optional(),
  total_savings: z.coerce.number().optional(),
  role: z.string().optional(),
  provider: z.string().nullable().optional(),
  marketing_consent: Bool.optional(),
});
export type UserProfileUpdateDTO = z.infer<typeof UserProfileUpdateSchema>;

// ---------------- coupon_create_transaction_schema ----------------
/* 서버가 실제로 소비하는 코어 필드 */
export const CouponItemCore = z.object({
  type: z.enum(["discount", "gift"]), // ← is_gift 대체
  ref_id: UUID,                      // discounts.id or gift_options.id
  menu_id: UUID,                     // store_menus.id
  qty: z.coerce.number().int().min(1),
});

/* 클라이언트 표시/저장용 메타(서버 로직과 무관, 선택) */
export const CouponItemMeta = z.object({
  menu_name: z.string().min(1).optional(),
  original_price: z.coerce.number().int().nonnegative().optional(),
  discount_rate: z.coerce.number().int().min(0).max(100).optional(),
  final_price: z.coerce.number().int().nonnegative().optional(),
});

/* 최종 아이템 입력: 코어 + 메타 */
export const CouponItemInput = CouponItemCore.merge(CouponItemMeta);

/**
 * 최종 쿠폰 생성 트랜잭션 스키마
 * - CouponInsertSchema 안에 user_id, event_id 등이 포함되어 있어야 합니다.
 *   (만약 없다면 아래처럼 확장해서 넣어주세요)
 *     const CouponInsertSchema = z.object({ user_id: UUID, event_id: UUID });
 */
export const CreateCouponTxSchema = CouponInsertSchema.extend({
  items: z.array(CouponItemInput).min(1),
});
export type CreateCouponTxDTO = z.infer<typeof CreateCouponTxSchema>;
  
// ---------------- event_create_transaction_schema ----------------
 /* ---------- Input Types ---------- */
export const GiftOptionInput = z.object({
  menu_id: UUID,
  remaining: z.coerce.number().int().nullable().optional().default(null),
  is_active: z.coerce.boolean().default(true),
});

export const DiscountInput = z.object({
  menu_id: UUID,
  discount_rate: z.coerce.number().int().min(1).max(100),
  remaining: z.coerce.number().int().nullable().optional().default(null),
  is_active: z.coerce.boolean().default(true),
  final_price: z.coerce.number().int().positive(),
});

/* ---------- Event Insert Base ---------- */
export const EventInput = z.object({
  store_id: UUID,
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  happy_hour_start_time: z.string().time().optional().nullable(),
  happy_hour_end_time: z.string().time().optional().nullable(),
  weekdays: z.array(z.enum(["MON","TUE","WED","THU","FRI","SAT","SUN"])).min(1),
  is_active: z.coerce.boolean().default(true),
  description: z.string().nullable().optional(),
  title: z.string().min(1),
  // ⛔ max_discount_rate는 제거됨 (서버가 자동 계산)
});

/* ---------- Extended with Discounts & Gifts ---------- */
export const CreateEventWithDiscountsAndGiftsSchema = EventInput.extend({
  discounts: z.array(DiscountInput).min(1), // 적어도 하나 필요
  gift_options: z.array(GiftOptionInput).optional().default([]),
});

export type CreateEventWithDiscountsAndGiftsDTO = z.infer<typeof CreateEventWithDiscountsAndGiftsSchema>;

// ---------------- event_update_transaction_schema ----------------
export const GiftOptionUpsertInput = z.object({
  id: UUID.optional(),                     // ← 기존 옵션이면 포함
  menu_id: UUID,
  remaining: z.coerce.number().int().nullable().optional().default(null),
  is_active: z.coerce.boolean().default(true),
});

export const DiscountUpsertInput = z.object({
  id: UUID.optional(),                     // ← 기존 할인이면 포함
  menu_id: UUID,
  discount_rate: z.coerce.number().int().min(1).max(100),
  remaining: z.coerce.number().int().nullable().optional().default(null),
  is_active: z.coerce.boolean().default(true),
  final_price: z.coerce.number().int().positive(),
});

/* ---- Event 입력 (create와 거의 동일) ---- */
export const EventUpdateInput = z.object({
  id: UUID,                                 // ← 업데이트 대상 이벤트
  store_id: UUID,                           // 변경 허용 여부는 정책에 따라
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  happy_hour_start_time: z.string().time().optional().nullable(),
  happy_hour_end_time: z.string().time().optional().nullable(),
  weekdays: z.array(z.enum(["MON","TUE","WED","THU","FRI","SAT","SUN"])).min(1),
  is_active: z.coerce.boolean().default(true),
  description: z.string().nullable().optional(),
  title: z.string().min(1),
});

/* ---- 최종 업데이트 DTO: replace-all 전략 ---- */
export const UpdateEventWithDiscountsAndGiftsSchema = EventUpdateInput.extend({
  discounts: z.array(DiscountUpsertInput).min(1),
  gift_options: z.array(GiftOptionUpsertInput).optional().default([]),
});

export type UpdateEventWithDiscountsAndGiftsDTO = z.infer<typeof UpdateEventWithDiscountsAndGiftsSchema>;

// ---------------- Usage snippets (server) ----------------
// import { createClient } from '@supabase/supabase-js';
// const dto = StoreInsertSchema.parse(formData);
// await supabase.from('stores').insert(dto).select('*');

// ---------------- Usage snippets (client) ----------------
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// const form = useForm<StoreInsertDTO>({ resolver: zodResolver(StoreInsertSchema) });
