import { Event, EventWithDiscountsAndGifts } from "../entities/entities"
import { CreateEventWithDiscountsAndGiftsDTO, UpdateEventWithDiscountsAndGiftsDTO } from "../schemas/schemas"
import { Id } from "../shared/repository"

export interface EventRepository {
    // GET api/events/[id]
    getEventWithDiscountsAndGiftsById(id: Id, opts?: { onlyActive?: boolean }): Promise<EventWithDiscountsAndGifts>

    // GET api/events?storeId=...
    getEventsByStoreId(storeId: Id): Promise<Event[]>

    // POST api/events
    createEventWithDiscountsAndGifts(dto: CreateEventWithDiscountsAndGiftsDTO): Promise<{ eventId: Id }>

    // PATCH api/events
    updateEventWithDiscountsAndGifts(dto: UpdateEventWithDiscountsAndGiftsDTO): Promise<{ eventId: Id }>

    // DELETE api/events/[id]
    softDeleteEvent(id: Id): Promise<void>
}