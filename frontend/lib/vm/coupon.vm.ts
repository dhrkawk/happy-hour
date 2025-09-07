// lib/coupon-vm.ts
'use client';

import type { Coupon, CouponItem, CouponWithItems } from '@/domain/entities/entities';

/* ---------------------------------- Types --------------------------------- */

export type CouponStatus = 'issued' | 'redeemed' | 'cancelled' | 'expired' | 'activating';

export type CouponItemVM = {
  id?: string;
  isGift: boolean;
  qty: number;

  name?: string | null;
  originalPrice?: number | null;
  finalPrice?: number | null;
  discountRate?: number | null;

  // 표시 전용
  priceText: string;       // 예: "5,000원", "무료", "-"
  discountBadge?: string;  // 예: "20% 할인", "증정"
};

export type CouponVM = {
  id: string;

  eventTitle?: string | null;
  storeName?: string | null;

  status: CouponStatus;
  statusText: string;
  isExpired: boolean;

  createdAtText: string;
  updatedAtText?: string;
  expiresAtText?: string;
  expectedVisitText?: string;
  activatedAt?: string; // 추가된 필드

  totalQty: number;
  totalPrice?: number | null;
  totalPriceText: string;

  items: CouponItemVM[];
};

/* --------------------------------- Helpers -------------------------------- */

const fmtMoney = (v?: number | null) =>
  typeof v === 'number' && Number.isFinite(v)
    ? `${v.toLocaleString()}원`
    : '-';

const fmtDateTime = (
  iso?: string | null,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
) => (iso ? new Date(iso).toLocaleString('ko-KR', opts) : undefined);

const isPast = (iso?: string | null) =>
  iso ? new Date(iso).getTime() < Date.now() : false;

const statusText = (s: string): string => {
  switch (s) {
    case 'issued':   return '발급됨';
    case 'redeemed': return '사용완료';
    case 'cancelled': return '취소됨'; // 'canceled' -> 'cancelled'로 변경
    case 'activating': return '사용 중'; // 추가
    case 'expired':  return '만료됨';
    default:         return s;
  }
};

const buildItemPriceText = (it: CouponItem): string => {
  if (it.isGift) return '무료';

  if (typeof (it as any).finalPrice === 'number') {
    return fmtMoney((it as any).finalPrice);
  }
  if (typeof (it as any).originalPrice === 'number') {
    return fmtMoney((it as any).originalPrice);
  }
  return '-';
};

const buildItemDiscountBadge = (it: CouponItem): string | undefined => {
  if (it.isGift) return '증정';
  const rate = (it as any).discountRate as number | undefined;
  if (typeof rate === 'number' && rate > 0) return `${rate}% 할인`;
  return undefined;
};

/* --------------------------------- Builders -------------------------------- */

export function buildCouponWithItemsVM(data: CouponWithItems): CouponVM {
  const { coupon, items } = data;

  const isExpiredFlag =
    coupon.status === 'expired' || isPast((coupon as any).expiredTime);

  const itemVMs: CouponItemVM[] = (items ?? []).map((it) => ({
    id: (it as any).id,
    isGift: !!it.isGift,
    qty: it.quantity ?? (it as any).qty ?? 1,
    name: (it as any).menuName ?? (it as any).menu_name ?? null,
    originalPrice: (it as any).originalPrice ?? (it as any).original_price ?? null,
    finalPrice: (it as any).finalPrice ?? (it as any).final_price ?? null,
    discountRate: (it as any).discountRate ?? (it as any).discount_rate ?? null,
    priceText: buildItemPriceText(it),
    discountBadge: buildItemDiscountBadge(it),
  }));

  const totalQty = itemVMs.reduce((s, i) => s + (i.qty ?? 0), 0);
  const totalPriceRaw = itemVMs.reduce((sum, i) => {
    if (i.isGift) return sum; // 증정은 합계에서 제외
    const unit = typeof i.finalPrice === 'number'
      ? i.finalPrice
      : typeof i.originalPrice === 'number'
        ? i.originalPrice
        : 0;
    return sum + unit * (i.qty ?? 0);
  }, 0);
  const totalPrice = Number.isFinite(totalPriceRaw) ? totalPriceRaw : null;
  const totalPriceText = totalPrice === 0 ? '무료' : fmtMoney(totalPrice ?? undefined);

  return {
    id: coupon.id,
    eventTitle: (coupon as any).eventTitle ?? (coupon as any).event_title ?? undefined,
    storeName: (coupon as any).storeName ?? (coupon as any).store_name ?? undefined,

    status: coupon.status as CouponStatus,
    statusText: statusText(coupon.status),
    isExpired: isExpiredFlag,

    createdAtText: fmtDateTime((coupon as any).createdAt ?? (coupon as any).created_at) ?? '',
    updatedAtText: fmtDateTime((coupon as any).updatedAt ?? (coupon as any).updated_at),
    expiresAtText: fmtDateTime((coupon as any).expiredTime ?? (coupon as any).expired_time, { dateStyle: 'medium' }),
    expectedVisitText: fmtDateTime((coupon as any).expectedVisitTime ?? (coupon as any).expected_visit_time),
    activatedAt: (coupon as any).activatedAt ?? (coupon as any).activated_at, // 추가된 매핑

    totalQty,
    totalPrice,
    totalPriceText,

    items: itemVMs,
  };
}

export type CouponListItemVM = {
  id: string;
  storeId: string;
  eventTitle: string;
  storeName: string;
  status: CouponStatus; // 추가
  statusText: string;
  isExpired: boolean;
  createdAtText: string;
  expiresAtText?: string;
  happyHourStartTime: string;
  happyHourEndTime: string;
  weekdays: string[];
};

export function buildCouponListVM(coupons: Coupon[]): CouponListItemVM[] {
  return (coupons ?? []).map((c) => {
    const expired = c.status === 'expired' || isPast((c as any).expiredTime);
    const eventTitle = (c as any).eventTitle ?? (c as any).event_title ?? '이벤트 쿠폰';
    const storeName = (c as any).storeName ?? (c as any).store_name;
    return {
      id: c.id,
      storeId: c.storeId,
      eventTitle: eventTitle,
      storeName: storeName,
      status: c.status as CouponStatus, // 추가
      statusText: statusText(c.status),
      isExpired: expired,
      createdAtText: fmtDateTime((c as any).createdAt ?? (c as any).created_at) ?? '',
      expiresAtText: fmtDateTime((c as any).expiredTime ?? (c as any).expired_time, { dateStyle: 'medium' }),
      happyHourStartTime: c.happyHourStartTime,
      happyHourEndTime: c.happyHourEndTime,
      weekdays: c.weekdays,
    };
  });
}
