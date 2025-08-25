'use client';

import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';

export type ApiEventDetail = {
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    happyHourStartTime?: string;
    happyHourEndTime?: string;
    weekdays?: string[];
    description?: string | null;
  };
  discounts?: Array<{
    id: string;
    eventId: string;
    menuId: string;
    discountRate: number;   // %
    finalPrice: number;     // 할인 적용 가격
    isActive: boolean;
    remaining: number | null;
    createdAt: string;
  }>;
  giftGroups?: Array<{
    group: { id: string; eventId: string; createdAt: string; displayNote?: string | null };
    options: Array<{
      id: string;
      giftGroupId: string;
      menuId: string;
      isActive: boolean;
      remaining: number | null;
      createdAt: string;
    }>;
  }>;
};

export type GetEventDetailParams = {
  id: string;
  include?: Array<'discounts' | 'gifts'>;  // 기본: 둘 다
  childActive?: boolean;                   // true면 활성 옵션만 필터
};

const buildQS = (p: GetEventDetailParams) => {
  const sp = new URLSearchParams();
  sp.set('include', (p.include?.length ? p.include : ['discounts','gifts']).join(','));
  if (p.childActive !== undefined) sp.set('childActive', p.childActive ? '1' : '0');
  return sp.toString();
};

export function useGetEventDetail<TSelected = ApiEventDetail>(
  params: GetEventDetailParams,
  options?: Omit<UseQueryOptions<ApiEventDetail, Error, TSelected, QueryKey>, 'queryKey' | 'queryFn'>
) {
  const qs = buildQS(params);
  const key: QueryKey = ['events','detail', params.id, qs];

  return useQuery({
    queryKey: key,
    enabled: !!params.id, // 선택됐을 때만 요청
    queryFn: async () => {
      const res = await fetch(`/api/events/${encodeURIComponent(params.id)}?${qs}`, { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Failed to fetch event detail');
      }
      return (await res.json()) as ApiEventDetail;
    },
    staleTime: 5_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    ...options,
  });
}