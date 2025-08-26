'use client';

import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';

/** ====== API DTO (GET /api/events) ====== */
export type ApiDiscount = {
  id: string;
  event_id: string;
  menu_id: string;
  discount_rate: number;
  final_price: number;
  remaining: number | null;
  is_active: boolean;
  created_at: string;
};

export type ApiGiftOption = {
  id: string;
  gift_group_id: string;
  menu_id: string;
  remaining: number | null;
  is_active: boolean;
  created_at: string;
};

export type ApiGiftGroup = {
  id: string;
  event_id: string;
  created_at: string;
};

export type ApiGiftGroupAggregate = {
  group: ApiGiftGroup;
  options: ApiGiftOption[];
};

export type ApiEvent = {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  start_date: string;            // YYYY-MM-DD
  end_date: string;              // YYYY-MM-DD
  weekdays: string[];            // ["MON","TUE",...]
  happy_hour_start_time?: string; // HH:mm:ss
  happy_hour_end_time?: string;   // HH:mm:ss
  is_active: boolean;
  created_at: string;
  max_discount_rate: number | null;
  max_final_price: number | null;
  max_original_price: number | null;
};

export type ApiEventAggregate = {
  event: ApiEvent;
  discounts: ApiDiscount[];
  giftGroups: ApiGiftGroupAggregate[];
};

export type EventsListResponse_Light = {
  data: ApiEvent[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    sort: { field: 'created_at'|'start_date'|'end_date'|'title'; order: 'asc'|'desc' };
    filter: Record<string, unknown>;
    include?: string[];
  };
};

export type EventsListResponse_Aggregate = {
  data: ApiEventAggregate[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    sort: { field: 'created_at'|'start_date'|'end_date'|'title'; order: 'asc'|'desc' };
    filter: Record<string, unknown>;
    include?: string[];
    childActive?: boolean;
  };
};

export type EventsListResponse = EventsListResponse_Light | EventsListResponse_Aggregate;

/** ====== 요청 파라미터 ====== */
export type GetEventsParams = {
  storeId: string;                         // 필수
  includeAggregate?: boolean;              // include=aggregate
  childActiveOnly?: boolean;               // aggregate일 때만: discounts/options 활성만
  isActive?: boolean;                      // 이벤트 활성 필터
  fromDate?: string;                       // YYYY-MM-DD
  toDate?: string;                         // YYYY-MM-DD
  weekdays?: string[];                     // ["mon","tue",...]
  limit?: number;                          // default 20
  offset?: number;                         // default 0
  sort?: 'created_at:desc' | 'created_at:asc' | 'start_date:asc' | 'start_date:desc' | 'end_date:asc' | 'end_date:desc' | 'title:asc' | 'title:desc';
};

const buildQuery = (p: GetEventsParams) => {
  const sp = new URLSearchParams();
  sp.set('storeId', p.storeId);
  sp.set('limit', String(p.limit ?? 20));
  sp.set('offset', String(p.offset ?? 0));
  sp.set('sort', p.sort ?? 'created_at:desc');

  if (p.includeAggregate) sp.set('include', 'aggregate');
  if (typeof p.childActiveOnly === 'boolean') sp.set('childActive', p.childActiveOnly ? '1' : '0');
  if (typeof p.isActive === 'boolean') sp.set('isActive', p.isActive ? '1' : '0');
  if (p.fromDate) sp.set('fromDate', p.fromDate);
  if (p.toDate) sp.set('toDate', p.toDate);
  if (p.weekdays?.length) sp.set('weekdays', p.weekdays.join(','));

  return sp.toString();
};

/** ====== useGetEvents 훅 ====== */
export function useGetEvents<TSelected = EventsListResponse>(
  params: GetEventsParams,
  options?: Omit<
    UseQueryOptions<EventsListResponse, Error, TSelected, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  const q = {
    ...params,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    sort: params.sort ?? 'created_at:desc',
  };

  const key: QueryKey = ['events', 'list', q];

  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const qs = buildQuery(q);
      const res = await fetch(`/api/events?${qs}`, { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Failed to fetch events');
      }
      return (await res.json()) as EventsListResponse;
    },
    staleTime: 5_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    ...options, // select 등 전달 가능
  });
}