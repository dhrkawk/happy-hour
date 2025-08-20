import { useState, useEffect } from 'react';
import { EventApiClient } from '@/lib/services/events/event.api-client';
import { StoreEventViewModel } from '@/lib/viewmodels/store-detail.viewmodel';

const apiClient = new EventApiClient();

export function useGetEventsByStoreId(storeId: string | null) {
  const [events, setEvents] = useState<StoreEventViewModel[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!storeId) {
        setEvents(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.getEventByStoreId(storeId);
        setEvents(data);
        console.log('Fetched events:', data);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
    
  }, [storeId]);

  return {
    events,
    isLoading,
    error,
  };
}
