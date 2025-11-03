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
export function useCouponWithItems(couponId: Id, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: couponId ? couponKeys.detail(couponId) : (['coupons', 'detail', 'none'] as QueryKey),
    enabled: !!couponId && (opts?.enabled ?? true),
    queryFn: async () => {
      const data = await jsonFetch<CouponWithItems>(`/api/coupons/${encodeURIComponent(couponId)}?_t=${Date.now()}`);
      return data;
    },
    select: (data) => {
      const vm = buildCouponWithItemsVM(data);
      return vm;
    },
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

/** PATCH api/coupons/[id]/activate */
export function useActivateCoupon(userIdForInvalidate?: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (couponId: Id) =>
      jsonFetch<void>(`/api/coupons/${encodeURIComponent(couponId)}/activate`, { method: 'PATCH' }),
    
    // 낙관적 업데이트 시작
    onMutate: async (couponId) => {
      // 쿼리 캐시 취소 (진행 중인 refetch 방지)
      await qc.cancelQueries({ queryKey: couponKeys.detail(couponId) });

      // 이전 데이터 스냅샷 저장
      const previousCoupon = qc.getQueryData(couponKeys.detail(couponId));

      // 캐시를 낙관적으로 업데이트
      qc.setQueryData(couponKeys.detail(couponId), (old: any) => {
        if (!old) return old; // 데이터가 없으면 업데이트하지 않음
        return {
          ...old,
          coupon: {
            ...old.coupon,
            status: 'activating',
            activated_at: new Date().toISOString(), // 현재 시간으로 설정 (정확한 시간은 서버 응답에서)
          },
        };
      });

      return { previousCoupon }; // context로 이전 데이터 반환
    },

    onError: (err, couponId, context) => {
      // 에러 발생 시 이전 상태로 롤백
      if (context?.previousCoupon) {
        qc.setQueryData(couponKeys.detail(couponId), context.previousCoupon);
      }
    },

    onSettled: (data, error, couponId) => {
      // 성공/실패 여부와 관계없이 최종적으로 쿼리 무효화 및 재조회
      qc.invalidateQueries({ queryKey: couponKeys.detail(couponId) });
      if (userIdForInvalidate) {
        qc.invalidateQueries({ queryKey: couponKeys.list(userIdForInvalidate) });
      }
    },
  });
}