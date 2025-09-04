// hooks/coupons/use-coupons.ts
'use client';

import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { Id } from '@/domain/shared/repository';
import type { CreateCouponTxDTO } from '@/domain/schemas/schemas';
import { type Coupon, type CouponWithItems } from '@/domain/entities/entities';
import { buildCouponListVM, buildCouponWithItemsVM } from '@/lib/vm/coupon.vm';
import { jsonFetch } from './json-helper';

/* ---------------- Query Keys ---------------- */
export const couponKeys = {
  all: ['coupons'] as const,
  list: (userId: Id) => [...couponKeys.all, 'list', userId] as const,
  detail: (couponId: Id) => [...couponKeys.all, 'detail', couponId] as const,
};

/* ---------------- Queries ---------------- */

/** GET api/coupons?userId=... */
export function useCouponsByUserId(userId: Id | null | undefined, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userId ? couponKeys.list(userId) : (['coupons', 'list', 'anon'] as QueryKey),
    enabled: !!userId && (opts?.enabled ?? true),
    queryFn: () => jsonFetch<{ coupons: Coupon[] }>(`/api/coupons?userId=${encodeURIComponent(userId!)}`),
    select: (data) => buildCouponListVM(data.coupons || []),
    staleTime: 5_000,
  });
}

/** GET api/coupons/[id] */
export function useCouponWithItems(couponId: Id | null | undefined, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: couponId ? couponKeys.detail(couponId) : (['coupons', 'detail', 'none'] as QueryKey),
    enabled: !!couponId && (opts?.enabled ?? true),
    queryFn: () => jsonFetch<CouponWithItems>(`/api/coupons/${encodeURIComponent(couponId!)}`),
    select: buildCouponWithItemsVM,
    staleTime: 5_000,
  });
}

/* ---------------- Mutations ---------------- */

/** POST api/coupons */
export function useCreateCouponWithItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCouponTxDTO) =>
      jsonFetch<{ couponId: Id }>(`/api/coupons`, { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: async (data, dto) => {
      // 목록/상세 무효화
      if (dto.user_id) {
        await qc.invalidateQueries({ queryKey: couponKeys.list(dto.user_id) });
      }
      if (data?.couponId) {
        await qc.invalidateQueries({ queryKey: couponKeys.detail(data.couponId) });
      }
    },
  });
}

/** PATCH api/coupons/[id]/redeem */
export function useRedeemCoupon(userIdForInvalidate?: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (couponId: Id) =>
      jsonFetch<void>(`/api/coupons/${encodeURIComponent(couponId)}/redeem`, { method: 'PATCH' }),
    onSuccess: async (_data, couponId) => {
      await qc.invalidateQueries({ queryKey: couponKeys.detail(couponId) });
      if (userIdForInvalidate) {
        await qc.invalidateQueries({ queryKey: couponKeys.list(userIdForInvalidate) });
      }
    },
  });
}

/** PATCH api/coupons/[id]/cancel */
export function useCancelCoupon(userIdForInvalidate?: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (couponId: Id) =>
      jsonFetch<void>(`/api/coupons/${encodeURIComponent(couponId)}/cancel`, { method: 'PATCH' }),
    onSuccess: async (_data, couponId) => {
      await qc.invalidateQueries({ queryKey: couponKeys.detail(couponId) });
      if (userIdForInvalidate) {
        await qc.invalidateQueries({ queryKey: couponKeys.list(userIdForInvalidate) });
      }
    },
  });
}