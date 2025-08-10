//page bookings에서 호출
import useSWR from 'swr';
import { ReservationApiClient } from '@/lib/services/reservations/reservation.api-client';

const apiClient = new ReservationApiClient();

const fetcher = (url: string) => {
  if (url === '/api/reservations') {
    return apiClient.getMyReservations();
  }
  throw new Error('Unknown API Route');
};

export function useGetMyReservations() {
  const { data, error, isLoading, mutate } = useSWR('/api/reservations', fetcher);

  return {
    bookings: data || [],
    isLoading,
    error,
    mutate, // Pass mutate function for re-validation
  };
}
