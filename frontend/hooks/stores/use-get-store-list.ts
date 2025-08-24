'use client';

import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';

/** ---------- API DTO ---------- */
export type ApiEventHeader = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  happyHourStartTime?: string;
  happyHourEndTime?: string;
  weekdays?: string[];
  maxDiscountRate?: number;
  maxOriginalPrice?: number;
  maxFinalPrice?: number;
};

export type ApiStore = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  createdAt: string;
  category: string;
  isActive: boolean;
  storeThumbnail: string;
  ownerId: string;
  menuCategory: string[];
  partnership: string | null;
  events?: ApiEventHeader[]; // include=events 일 때
};

export type StoresApiResponse = {
  data: ApiStore[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    sort: { field: 'created_at' | 'name'; order: 'asc' | 'desc' };
    filter: Record<string, unknown>;
    include?: string[];
    eventFilter?: { isActive?: boolean };
  };
};

/** ---------- 서버 필터 ---------- */
export type GetStoreListParams = {
  ownerId?: string;
  isActive?: boolean;
  category?: string;
  search?: string;
  limit?: number;    // default 20
  offset?: number;   // default 0
  sort?: 'created_at:desc' | 'created_at:asc' | 'name:asc' | 'name:desc';

  includeEvents?: boolean;     // default: false
  onlyActiveEvents?: boolean;  // default: true (includeEvents=true일 때 적용)
};

const buildQuery = (p: GetStoreListParams) => {
  const sp = new URLSearchParams();
  if (p.ownerId) sp.set('ownerId', p.ownerId);
  if (typeof p.isActive === 'boolean') sp.set('isActive', p.isActive ? '1' : '0');
  if (p.category) sp.set('category', p.category);
  if (p.search) sp.set('search', p.search);
  sp.set('limit', String(p.limit ?? 20));
  sp.set('offset', String(p.offset ?? 0));
  sp.set('sort', p.sort ?? 'created_at:desc');

  if (p.includeEvents) {
    sp.set('include', 'events');
    sp.set('eventIsActive', (p.onlyActiveEvents ?? true) ? '1' : '0');
  }

  return sp.toString();
};

/** ---------- 범용 fetch 훅 ---------- */
export function useGetStoreList<TSelected = StoresApiResponse>(
  params: GetStoreListParams = {},
  options?: Omit<
    UseQueryOptions<StoresApiResponse, Error, TSelected, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  const q = {
    ...params,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    sort: params.sort ?? 'created_at:desc',
  };

  const key: QueryKey = ['stores', 'list', q];

  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const qs = buildQuery(q);
      const res = await fetch(`/api/stores?${qs}`, { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Failed to fetch stores');
      }
      return (await res.json()) as StoresApiResponse;
    },
    staleTime: 5000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    ...options, // select/placeholderData 등으로 확장
  });
}