import { EventFormViewModel } from "@/lib/viewmodels/events/event-form.viewmodel";

export class EventApiClient {
  async registerEvent(payload: EventFormViewModel): Promise<any> {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register event');
    }

    return response.json();
  }

  async deleteEvent(eventId: string): Promise<any> {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete event');
    }

    return response.json();
  }

  async getEventByStoreId(storeId: string): Promise<any> {
    const response = await fetch(`/api/stores/${storeId}/events`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch events');
    }

    return response.json();
  }
}
