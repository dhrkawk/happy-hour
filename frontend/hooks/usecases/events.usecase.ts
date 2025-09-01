// hooks/usecases/use-events.ts
'use client';

import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { Id } from '@/domain/shared/repository';
import { Event, EventWithDiscountsAndGifts } from '@/domain/entities/entities';
import type {
  CreateEventWithDiscountsAndGiftsDTO,
  UpdateEventWithDiscountsAndGiftsDTO,
} from '@/domain/schemas/schemas';
import { jsonFetch } from './json-helper';

/* --------------------- 작은 fetch 유틸 --------------------- */
async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  if (!res.ok) {
    let msg = 'Request failed';
    try {
      const j = await res.json();
      msg = j?.error ?? msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

async function sendJSON<T>(url: string, method: 'POST'|'PATCH'|'DELETE', body?: unknown): Promise<T> {
  return getJSON<T>(url, {
    method,
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

/* --------------------- Query Keys --------------------- */
const qk = {
  eventDetail: (id: Id, onlyActive?: boolean): QueryKey => ['events', 'detail', id, { onlyActive: !!onlyActive }],
  eventsByStore: (storeId?: string) => ["events","by-store",storeId] as const,
};


export function useGetEventsByStoreId(storeId: string, enabled = true) {
    return useQuery({
      queryKey: qk.eventsByStore(storeId),
      enabled: !!storeId && enabled,
      queryFn: async () =>
        jsonFetch<{ events: Event[] }>(`/api/events?storeId=${encodeURIComponent(storeId)}`),
      select: (res): Event[] => (res.events ?? []).map(Event.fromRow),
      // 필요 시 캐시 정책
      staleTime: 60_000,
    });
  }

/* --------------------- 1) GET /api/events/[id] --------------------- */
/**
 * 이벤트(헤더) + discounts + gift_group/options를 조회합니다.
 * opts.onlyActive=true 이면 하위(discounts/gift_options)도 활성만 포함하도록 서버에서 필터합니다.
 *
 * 서버 응답 가정: { data: EventWithDiscountsAndGifts }
 */
export function useGetEventWithDiscountsAndGifts(
  id: Id,
  opts?: { onlyActive?: boolean; enabled?: boolean }
) {
  const onlyActive = !!opts?.onlyActive;
  const key = qk.eventDetail(id, onlyActive);

  return useQuery<EventWithDiscountsAndGifts>({
    queryKey: key,
    enabled: (opts?.enabled ?? true) && !!id,
    queryFn:() => jsonFetch<EventWithDiscountsAndGifts>(`/api/events/${encodeURIComponent(id)}?onlyActive=${onlyActive ? '1' : '0'}`),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/* --------------------- 2) POST /api/events --------------------- */
/**
 * 이벤트 생성 RPC를 호출하는 API 래핑
 * 서버 응답 가정: { eventId: string }
 */
export function useCreateEventWithDiscountsAndGifts() {
  const qc = useQueryClient();

  return useMutation<{ eventId: Id }, Error, CreateEventWithDiscountsAndGiftsDTO>({
    mutationFn: (dto) => sendJSON<{ eventId: Id }>('/api/events', 'POST', dto),
    onSuccess: (res) => {
      // 상세 쿼리 무효화(혹시 이미 보고 있다면)
      qc.invalidateQueries({ queryKey: ['events'] });
      // 방금 생성한 이벤트 상세를 prefetch 하고 싶다면:
      // qc.prefetchQuery(qk.eventDetail(res.eventId, true), () =>
      //   getJSON<{ data: EventWithDiscountsAndGifts }>(`/api/events/${res.eventId}?onlyActive=1`).then(r => r.data)
      // );
    },
  });
}

/* --------------------- 3) PATCH /api/events --------------------- */
/**
 * 이벤트 업데이트 RPC를 호출하는 API 래핑
 * 서버 응답 가정: { eventId: string }
 */
export function useUpdateEventWithDiscountsAndGifts() {
  const qc = useQueryClient();

  return useMutation<{ eventId: Id }, Error, UpdateEventWithDiscountsAndGiftsDTO>({
    mutationFn: (dto) => sendJSON<{ eventId: Id }>('/api/events', 'PATCH', dto),
    onSuccess: (res) => {
      // 해당 이벤트 상세 쿼리들(활성/전체) 무효화
      qc.invalidateQueries({ queryKey: qk.eventDetail(res.eventId, true) });
      qc.invalidateQueries({ queryKey: qk.eventDetail(res.eventId, false) });
      // 목록 화면이 있다면 거기도 invalidate
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/* --------------------- 4) DELETE /api/events/[id] --------------------- */
/**
 * 소프트 삭제
 * 서버 응답 가정: { ok: true }
 */
export function useSoftDeleteEvent() {
  const qc = useQueryClient();

  return useMutation<{ ok: true }, Error, Id>({
    mutationFn: (id) => sendJSON<{ ok: true }>(`/api/events/${encodeURIComponent(id)}`, 'DELETE'),
    onSuccess: (_res, id) => {
      // 상세 무효화
      qc.invalidateQueries({ queryKey: qk.eventDetail(id, true) });
      qc.invalidateQueries({ queryKey: qk.eventDetail(id, false) });
      // 관련 목록 무효화
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}