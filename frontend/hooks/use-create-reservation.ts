//reservation
import { useState } from 'react';
import { ReservationApiClient } from '@/lib/services/reservations/reservation.api-client';
import { Cart } from '@/contexts/app-context';

const apiClient = new ReservationApiClient();

export function useCreateReservation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createReservation = async (cart: Cart) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.registerReservation(cart);
      setIsLoading(false);
      return result;
    } catch (err) {
      setIsLoading(false);
      setError(err as Error);
      throw err; // Re-throw the error to be caught in the component
    }
  };

  return {
    createReservation,
    isLoading,
    error,
  };
}
