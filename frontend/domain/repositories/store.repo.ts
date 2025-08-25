import { StoreWithEventsAndMenus, StoreWithEvents } from "../entities/entities"
import { StoreInsertDTO, StoreUpdateDTO } from "../schemas/schemas"
import { Id } from "../shared/repository"

export interface StoreRepository {
    getStoresWithEvents(onlyActive: boolean): Promise<Array<StoreWithEvents>>

    getStoreWithEventsAndMenusByStoreId(id: Id, opts?: { onlyActiveEvents?: boolean}): Promise<StoreWithEventsAndMenus>

    createStore(dto: StoreInsertDTO): Promise<{ id: Id }>

    updateStore(id: Id, dto: StoreUpdateDTO): Promise<void>

    getStoreIdByOwnerId(ownerId: Id): Promise<Id | null>
}