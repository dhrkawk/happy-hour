import useSWR from 'swr';
import { StoreApiClient } from '@/lib/services/stores/store.api-client';
import { StoreDetailViewModel } from '@/lib/viewmodels/store-detail.viewmodel';

const apiClient = new StoreApiClient();

export function useGetStoreById(id: string | null) {
  const fetcher = async (url: string) => {
    if (!id) return null;
    const storeData = await apiClient.getStoreById(id);
    return storeData;
  };

  const { data, error, isLoading, mutate } = useSWR<StoreDetailViewModel | null>(
    id ? `/api/stores/${id}` : null, // Only fetch if ID is available
    fetcher
  );

  return {
    store: data,
    isLoading,
    error,
    mutate,
  };
}
