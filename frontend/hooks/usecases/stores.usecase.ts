// hooks/stores/use-get-stores-with-events.ts
'use client';

import { useQuery, useMutation, type QueryKey } from '@tanstack/react-query';
import { jsonFetch } from './json-helper';
import type { StoreWithEvents, StoreWithEventsAndMenus } from '@/domain/entities/entities';
import { buildStoreDetailVM, buildStoreListVMs, enrichStoreDetailVM, StoreListItemVM } from '@/lib/vm/store.vm';
import { Id } from '@/domain/shared/repository';
import { useAppContext } from '@/contexts/app-context';
import { distanceKm, distanceText } from '@/lib/vm/utils/utils';
import { useGetEventWithDiscountsAndGifts } from './events.usecase';
import { StoreDetailVM } from '@/lib/vm/store.vm';
import { useMemo } from 'react';
import { createClient } from '@/infra/supabase/shared/client';
import { jsonPost } from './json-helper';
import { StoreInsertDTO } from '@/domain/schemas/schemas';


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
  opts?: { onlyActive?: boolean; choose?: 'current' | 'first' }
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

export function useGetMyStoreId() {
  const key: QueryKey = ['stores', 'mine', 'id'];

  return useQuery({
    queryKey: key,
    queryFn: () => jsonFetch<string[]>('/api/stores/mine'),
    select: (d) => d ?? null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetMyStores() {
  const key: QueryKey = ['stores', 'mine', 'details'];

  return useQuery({
    queryKey: key,
    queryFn: () => jsonFetch<{id: string, name: string}[]>('/api/stores/mine?details=true'),
    select: (d) => d ?? null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}


/** POST /api/store (insert) */
const BUCKET = "store-thumbnails";

export async function uploadStoreThumbnail(file: File): Promise<string> {
  const sb = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `store/${crypto.randomUUID()}.${ext}`;

  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}


export function useCreateStore() {
  return useMutation({
    mutationFn: async (dto: StoreInsertDTO) => {
      if (!dto) throw new Error('store dto is required')
      return jsonPost<{id: String}>('/api/stores', dto)
    },
  })
}

export type SortKey = "거리순" | "할인순" | "할인만" | "제휴만";
export function useSortedAndFilteredStoreList(
  stores: StoreListItemVM[] | undefined,
  selectedCategory: string,          // "전체" | "한식" | ...
  selectedSorting: SortKey       // "거리순" | "할인순" | "할인만" | "제휴만"
) {
  const items = useMemo(() => {
    if (!stores) return [];

    let arr = stores.slice();

    // 1) 카테고리 필터
    if (selectedCategory !== "전체") {
      if (selectedCategory === "기타") {
        // '기타'는 '식당'과 '카페'를 제외한 모든 카테고리
        arr = arr.filter((s) => s.category !== "식당" && s.category !== "카페");
      } else {
        arr = arr.filter((s) => s.category === selectedCategory);
      }
    }

    // 2) 정렬키에 따른 추가 필터
    if (selectedSorting === "할인만") {
      arr = arr.filter((s) => s.hasEvent && (s.maxDiscountRate ?? 0) > 0);
    }
    if (selectedSorting === "제휴만") {
      arr = arr.filter((s) => !!s.partershipText);
    }

    // 3) 정렬
    switch (selectedSorting) {
      case "거리순":
      case "할인만": // 필터만 다르고 정렬은 거리 기준
      case "제휴만":
        arr.sort((a, b) => a.distance - b.distance);
        break;
      case "할인순":
        arr.sort(
          (a, b) =>
            (b.maxDiscountRate ?? 0) - (a.maxDiscountRate ?? 0) ||
            a.distance - b.distance // 동률이면 가까운 순
        );
        break;
    }

    return arr;
  }, [stores, selectedCategory, selectedSorting]);

  return items;
}