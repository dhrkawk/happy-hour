'use client';

import { useState, useEffect } from "react";
import { StoreApiClient } from "@/lib/services/stores/store.api-client";
import { StoreCardViewModel } from "@/lib/viewmodels/store-card.viewmodel";
import { useAppContext } from "@/contexts/app-context"; // AppContext에서 useAppContext 훅을 가져옵니다.

const storeApiClient = new StoreApiClient();

export function useGetStoreList() {
  // 1. Context를 통해 직접 위치 정보에 접근합니다.
  const { appState } = useAppContext();
  const { coordinates } = appState.location;

  // 훅의 내부 상태 관리는 기존과 동일합니다.
  const [stores, setStores] = useState<StoreCardViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 2. Context의 coordinates가 변경될 때마다 이펙트가 실행됩니다.
    if (!coordinates) {
      // 아직 좌표를 가져오지 못했다면 로딩을 멈추고 데이터를 비웁니다.
      setIsLoading(false);
      setStores([]);
      return;
    }

    const fetchStores = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const viewModels = await storeApiClient.getAllStores(coordinates);
        setStores(viewModels);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching stores:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, [coordinates]); // 의존성 배열에 Context에서 가져온 coordinates를 사용합니다.

  return { stores, isLoading, error };
}