// hooks/stores/use-get-store-detail.ts
'use client';

import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';

/* ---------- API DTO들 (서버 응답 기준) ---------- */
export type ApiEventHeader = {
  id: string;
  title: string;
  startDate: string;           // 'YYYY-MM-DD'
  endDate: string;             // 'YYYY-MM-DD'
  isActive: boolean;
  happyHourStartTime?: string; // 'HH:MM:SS'
  happyHourEndTime?: string;   // 'HH:MM:SS'
  weekdays?: string[];         // ['MON', ...]
  // (선택) 서버에서 내려줄 수 있는 요약값
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
};

export type ApiMenu = {
  id: string;
  storeId: string;
  name: string;
  price: number;
  thumbnail: string | null;
  description: string | null;
  category: string | null;
  createdAt: string | null;
};

/* ---------- 서버 응답 (이제 events + menus까지만) ---------- */
export type StoreDetailResponse = {
  store: ApiStore;
  menus?: ApiMenu[];
  events?: ApiEventHeader[];   // include=events
};

/* ---------- 훅 파라미터 ---------- */
export type GetStoreDetailParams = {
  id: string;

  /** 포함 가능한 값: 'menus' | 'events' */
  include?: Array<'menus' | 'events'>;

  /** include에 events가 있을 때만 의미 있음 */
  eventIsActive?: boolean;   // 기본 undefined(서버 기본값 따름)
  fromDate?: string;         // 'YYYY-MM-DD'
  toDate?: string;           // 'YYYY-MM-DD'
  weekdays?: string[];       // ['MON','TUE',...]
};

/* ---------- 쿼리스트링 생성 ---------- */
const buildQueryString = (p: GetStoreDetailParams) => {
  const sp = new URLSearchParams();

  if (p.include?.length) sp.set('include', p.include.join(','));

  if (p.eventIsActive !== undefined) sp.set('eventIsActive', p.eventIsActive ? '1' : '0');
  if (p.fromDate) sp.set('fromDate', p.fromDate);
  if (p.toDate) sp.set('toDate', p.toDate);
  if (p.weekdays?.length) sp.set('weekdays', p.weekdays.join(','));

  return sp.toString();
};

/* ---------- React Query 훅 ---------- */
export function useGetStoreDetail<TSelected = StoreDetailResponse>(
  params: GetStoreDetailParams,
  options?: Omit<
    UseQueryOptions<StoreDetailResponse, Error, TSelected, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  const { id } = params;
  const qs = buildQueryString(params);
  const key: QueryKey = ['stores', 'detail', id, qs];

  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const res = await fetch(`/api/stores/${encodeURIComponent(id)}?${qs}`, { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Failed to fetch store detail');
      }
      return (await res.json()) as StoreDetailResponse;
    },
    staleTime: 5_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    ...options, // select / placeholderData 등
  });
}

/* ---------- 사용 편의 프리셋 ---------- */
export const includeMenus = (id: string) =>
  ({ id, include: ['menus'] } satisfies GetStoreDetailParams);

export const includeEventsOnly = (id: string, onlyActive = true) =>
  ({ id, include: ['events'], eventIsActive: onlyActive } satisfies GetStoreDetailParams);

/** 서버는 이제 discounts/gifts를 반환하지 않으므로,
 *  전체 상세 조회는 menus + events 조합으로 대체합니다. */
export const includeMenusAndEvents = (id: string, onlyActive = true) =>
  ({ id, include: ['events', 'menus'], eventIsActive: onlyActive } satisfies GetStoreDetailParams);