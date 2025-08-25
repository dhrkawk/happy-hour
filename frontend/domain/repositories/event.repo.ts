import { EventWithDiscountsAndGifts } from "../entities/entities"
import { CreateEventWithDiscountsAndGiftsDTO, UpdateEventWithDiscountsAndGiftsDTO } from "../schemas/schemas"
import { Id } from "../shared/repository"

export interface EventRepository {
    getEventWithDiscountsAndGiftsById(id: Id, opts?: { onlyActive?: boolean }): Promise<EventWithDiscountsAndGifts>

    createEventWithDiscountsAndGifts(dto: CreateEventWithDiscountsAndGiftsDTO): Promise<{ eventId: Id }>

    updateEventWithDiscountsAndGifts(dto: UpdateEventWithDiscountsAndGiftsDTO): Promise<{ eventId: Id }>

    softDeleteEvent(id: Id): Promise<void>
}