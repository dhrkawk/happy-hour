// hooks/stores/use-get-stores-with-events.ts
'use client';

import { useQuery, type QueryKey } from '@tanstack/react-query';
import { jsonFetch } from './fetcher';
import type { StoreWithEvents, StoreWithEventsAndMenus } from '@/domain/entities/entities';
import { buildStoresWithEventsVM, buildStoreDetailVM } from '@/lib/vm/store.vm';
import { Id } from '@/domain/shared/repository';
import { useAppContext } from '@/contexts/app-context';
import { distanceKm, distanceText } from '@/lib/utils';

export function useGetStoresWithEvents(onlyActive: boolean) {
    const { appState } = useAppContext();
    const coords = appState.location?.coordinates; // {lat, lng} | undefined
  
    return useQuery({
      queryKey: ['stores','list-with-events',{ onlyActive }],
      queryFn: () => jsonFetch<unknown>(`/api/stores?onlyActive=${onlyActive?'1':'0'}`),
      select: (d) => {
        // 1) 서버 rows → 리스트 VM
        const rows = Array.isArray(d) ? (d as any[]) : ((d as any)?.rows ?? []);
        const vms  = buildStoresWithEventsVM(rows);
  
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

  return useQuery({
    queryKey: key,
    queryFn: () =>
      jsonFetch<GetStoreWithEventsAndMenusResponse>(
        `/api/stores/${encodeURIComponent(id)}?onlyActiveEvents=${onlyActiveEvents ? '1' : '0'}`
      ),
    select: (d) => buildStoreDetailVM(d.data),
    enabled: !!id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
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