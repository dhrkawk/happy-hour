import useSWR from 'swr';
import { StoreApiClient } from '@/lib/services/stores/store.api-client';
import { StoreDetailViewModel } from '@/lib/viewmodels/store-detail.viewmodel';

const apiClient = new StoreApiClient();

export function useGetStoreById(id: string | null, userLocation: { lat: number; lng: number; } | null) {
  const fetcher = async (url: string) => {
    if (!id || !userLocation) return null;
    const storeData = await apiClient.getStoreById(id, userLocation);
    return storeData;
  };

  const { data, error, isLoading, mutate } = useSWR<StoreDetailViewModel | null>(
    id && userLocation ? `/api/stores/${id}` : null, // Only fetch if ID and location are available
    fetcher,
    { revalidateOnFocus: false } // Optional: to prevent re-fetching on window focus
  );

  return {
    store: data,
    isLoading,
    error,
    mutate,
  };
}
