import { EventFormViewModel } from "@/lib/viewmodels/events/event-form.viewmodel";
import { EventEntity } from "@/lib/entities/events/event.entity";

export class EventApiClient {
    static async registerEvent(eventData: EventFormViewModel): Promise<EventEntity> {
    const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register event');
    }
    return response.json();
    }
}