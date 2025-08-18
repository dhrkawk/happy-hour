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
}
