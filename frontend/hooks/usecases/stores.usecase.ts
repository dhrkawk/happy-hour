// hooks/stores/use-get-stores-with-events.ts
'use client';

import { useQuery, type QueryKey } from '@tanstack/react-query';
import { jsonFetch } from './fetcher';
import type { StoreWithEvents, StoreWithEventsAndMenus } from '@/domain/entities/entities';
import { buildStoreDetailVM, buildStoreListVMs, enrichStoreDetailVM, StoreListItemVM } from '@/lib/vm/store.vm';
import { Id } from '@/domain/shared/repository';
import { useAppContext } from '@/contexts/app-context';
import { distanceKm, distanceText } from '@/lib/vm/utils/utils';
import { useGetEventDetail } from '../events/use-get-event-detail';
import { useGetEventWithDiscountsAndGifts } from './events.usecase';
import { StoreDetailVM } from '@/lib/vm/store.vm';
import { useMemo } from 'react';


export function useGetStoresWithEvents(onlyActive: boolean) {
    const { appState } = useAppContext();
    const coords = appState.location?.coordinates; // {lat, lng} | undefined
  
    return useQuery({
      queryKey: ['stores','list-with-events',{ onlyActive }],
      queryFn: () => jsonFetch<unknown>(`/api/stores?onlyActive=${onlyActive?'1':'0'}`),
      select: (d) => {
        // 1) 서버 rows → 리스트 VM
        const rows = Array.isArray(d) ? (d as any[]) : ((d as any)?.rows ?? []);
        const vms  = buildStoreListVMs(rows);
  
        // 2) 사용자 좌표가 있으면 거리 파생값 추가
        if (!coords) return vms;
        return vms.map(vm => {
          const km = distanceKm(coords, { lat: vm.lat, lng: vm.lng });
          return { ...vm, distance: km, distanceText: distanceText(km) };
        });
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    });
}

type GetStoreWithEventsAndMenusResponse = {
  data: StoreWithEventsAndMenus;
};

export function useGetStoreWithEventsAndMenus(id: Id, opts?: { onlyActiveEvents?: boolean }) {
  const onlyActiveEvents = !!opts?.onlyActiveEvents;
  const key: QueryKey = ['stores', 'detail-with-events-menus', { id, onlyActiveEvents }];
  const { appState } = useAppContext();
  const coords = appState.location?.coordinates; // {lat, lng} | undefined

  return useQuery({
    queryKey: key,
    queryFn: () =>
      jsonFetch<GetStoreWithEventsAndMenusResponse>(
        `/api/stores/${encodeURIComponent(id)}?onlyActiveEvents=${onlyActiveEvents ? '1' : '0'}`
      ),
      select: (d) => {
        // 1) 서버 rows → 리스트 VM
        const vm  = buildStoreDetailVM(d as unknown as StoreWithEventsAndMenus);
  
        // 2) 사용자 좌표가 있으면 거리 파생값 추가
        if (!coords) return vm;
        const km = distanceKm(coords, { lat: vm.lat, lng: vm.lng });
        const detailVM = { ...vm, distance: km, distanceText: distanceText(km) };
        return detailVM;
      },
    enabled: !!id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetStoreDetail(
  id: Id,
  opts?: { onlyActive?: boolean; choose?: 'current' | 'first' } // choose는 필요시 확장
) {
  const onlyActive = !!opts?.onlyActive;

  // 1) 베이스: store + events + menus
  const baseQ = useGetStoreWithEventsAndMenus(id, { onlyActiveEvents: onlyActive });

  // 2) 베이스 → 기본 VM
  const baseVM: StoreDetailVM | null = useMemo(() => {
    if (!baseQ.data) return null;
    return baseQ.data;
  }, [baseQ.data]);

  // 3) 상세 이벤트 ID 선택 (여기서는 baseVM.event를 그대로 사용)
  const selectedEventId: Id | null = baseVM?.event?.id ?? null;

  // 4) 이벤트 상세(할인/기프트) — 의존 쿼리
  const eventQ = useGetEventWithDiscountsAndGifts(selectedEventId as Id, {
    onlyActive,
    enabled: !!selectedEventId, // baseVM이 준비된 경우에만 실행
  });

  // 5) enrich: 상세가 오면 합치고, 아니면 baseVM 그대로
  const data: StoreDetailVM | null = useMemo(() => {
    if (!baseVM) return null;
    if (eventQ.data) return enrichStoreDetailVM(baseVM, eventQ.data);
    return baseVM;
  }, [baseVM, eventQ.data]);

  // 6) 상태 합치기
  const isLoading = baseQ.isLoading || (!!selectedEventId && eventQ.isLoading);
  const isFetching = baseQ.isFetching || eventQ.isFetching;
  const error = baseQ.error ?? eventQ.error ?? null;

  return {
    data,              // StoreDetailVM | null
    isLoading,
    isFetching,
    error,
    refetchBase: baseQ.refetch,
    refetchEvent: eventQ.refetch,
  };
}

type GetMyStoreIdResponse = {
  storeId: Id | null;
};

export function useGetMyStoreId() {
  const key: QueryKey = ['stores', 'mine', 'id'];

  return useQuery({
    queryKey: key,
    queryFn: () => jsonFetch<GetMyStoreIdResponse>('/api/stores/mine'),
    select: (d) => d.storeId ?? null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}