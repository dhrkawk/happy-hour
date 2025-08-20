import useSWR from 'swr';
import { StoreApiClient } from '@/lib/services/stores/store.api-client';
import { StoreDetailViewModel } from '@/lib/viewmodels/store-detail.viewmodel';

const apiClient = new StoreApiClient();

export function useGetStoreById(id: string | null, userLocation: { lat: number; lng: number } | null) {
  const key =
    id && userLocation
      ? `/api/stores/${id}?lat=${userLocation.lat}&lng=${userLocation.lng}`
      : null;

  const fetcher = async () => {
    return await apiClient.getStoreById(id!, userLocation!);
  };

  const { data, error, isLoading, mutate } = useSWR<StoreDetailViewModel | null>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    store: data,
    isLoading,
    error,
    mutate,
  };
}