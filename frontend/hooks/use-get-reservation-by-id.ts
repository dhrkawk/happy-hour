
import useSWR from 'swr';
import { ReservationApiClient } from '@/lib/services/reservations/reservation.api-client';
import { ReservationDetailViewModel } from '@/lib/viewmodels/reservation-detail.viewmodel';

const apiClient = new ReservationApiClient();

export function useGetReservationById(id: string | null) {
  const fetcher = (url: string) => {
    if (!id) return null;
    return apiClient.getReservationById(id);
  };

  const { data, error, isLoading, mutate } = useSWR<ReservationDetailViewModel | null>(
    id ? `/api/reservations/${id}` : null, // Only fetch if ID is available
    fetcher
  );

  return {
    booking: data,
    isLoading,
    error,
    mutate,
  };
}
