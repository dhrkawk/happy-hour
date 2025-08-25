import { EventWithDiscountsAndGifts } from "../entities/entities"
import { CreateEventWithDiscountsAndGiftsDTO, UpdateEventWithDiscountsAndGiftsDTO } from "../schemas/schemas"
import { Id } from "../shared/repository"

export interface EventRepository {
    // api/events/[id] : GET
    getEventWithDiscountsAndGiftsById(id: Id, opts?: { onlyActive?: boolean }): Promise<EventWithDiscountsAndGifts>

    // api/events : POST
    createEventWithDiscountsAndGifts(dto: CreateEventWithDiscountsAndGiftsDTO): Promise<{ eventId: Id }>

    // api/events : PUT or PATCH
    updateEventWithDiscountsAndGifts(dto: UpdateEventWithDiscountsAndGiftsDTO): Promise<{ eventId: Id }>

    // api/events/[id] : DELETE
    softDeleteEvent(id: Id): Promise<void>
}