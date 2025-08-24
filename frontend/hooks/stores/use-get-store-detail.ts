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

/** 할인/증정(옵션) 요약 */
export type ApiDiscount = {
  id: string;
  eventId: string;
  menuId: string;
  discountRate: number;
  finalPrice: number;
  isActive: boolean;
  remaining: number | null;
  createdAt: string;
};

export type ApiGiftOption = {
  id: string;
  giftGroupId: string;
  menuId: string;
  isActive: boolean;
  remaining: number | null;
  createdAt: string;
};

export type ApiGiftGroup = {
  group: { id: string; eventId: string; createdAt: string };
  options: ApiGiftOption[];
};

/** aggregate 모드일 때 이벤트 + 할인 + 기프트를 묶은 형태 */
export type ApiEventAggregate = {
  event: ApiEventHeader;
  discounts: ApiDiscount[];
  giftGroups: ApiGiftGroup[];
};

/* ---------- 서버 응답 (include에 따라 일부 필드가 선택적으로 존재) ---------- */
export type StoreDetailResponse = {
  store: ApiStore;
  menus?: ApiMenu[];
  events?: ApiEventHeader[];          // include=events & (discounts/gifts 미포함)
  eventAggregates?: ApiEventAggregate[]; // include=events,discounts,gifts (aggregate 모드)
};

/* ---------- 훅 파라미터 ---------- */
export type GetStoreDetailParams = {
  id: string;

  include?: Array<'menus' | 'events' | 'discounts' | 'gifts'>;

  /** include에 events가 있을 때만 의미 있음 */
  eventIsActive?: boolean;   // 기본 undefined(서버 기본값 따름)
  fromDate?: string;         // 'YYYY-MM-DD'
  toDate?: string;           // 'YYYY-MM-DD'
  weekdays?: string[];       // ['MON','TUE',...]
  /** aggregate(child) 필터: discounts/gifts까지 포함 요청 시만 의미 */
  childActive?: boolean;     // true면 discount/gift options 중 active만 남김
};

/* ---------- 쿼리스트링 생성 ---------- */
const buildQueryString = (p: GetStoreDetailParams) => {
  const sp = new URLSearchParams();

  if (p.include?.length) {
    sp.set('include', p.include.join(','));
  }

  if (p.eventIsActive !== undefined) {
    sp.set('eventIsActive', p.eventIsActive ? '1' : '0');
  }
  if (p.fromDate) sp.set('fromDate', p.fromDate);
  if (p.toDate) sp.set('toDate', p.toDate);
  if (p.weekdays?.length) sp.set('weekdays', p.weekdays.join(','));

  if (p.childActive !== undefined) {
    sp.set('childActive', p.childActive ? '1' : '0');
  }

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
      const res = await fetch(`/api/stores/${encodeURIComponent(id)}?${qs}`, {
        cache: 'no-store',
      });
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
  ({
    id,
    include: ['events'],
    eventIsActive: onlyActive,
  } satisfies GetStoreDetailParams);

export const includeFullAggregate = (id: string, onlyActive = true) =>
  ({
    id,
    include: ['events', 'discounts', 'gifts'],
    eventIsActive: onlyActive,
    childActive: onlyActive,
  } satisfies GetStoreDetailParams);