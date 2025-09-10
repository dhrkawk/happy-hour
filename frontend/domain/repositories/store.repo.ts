import { StoreWithEventsAndMenus, StoreWithEvents } from "../entities/entities"
import { StoreInsertDTO, StoreUpdateDTO } from "../schemas/schemas"
import { Id } from "../shared/repository"

export interface StoreRepository {
    // GET api/stores?onlyActive=...
    getStoresWithEvents(onlyActive: boolean): Promise<Array<StoreWithEvents>>

    // GET api/stores/[id]?onlyActiveEvents=...
    getStoreWithEventsAndMenusByStoreId(id: Id, opts?: { onlyActiveEvents?: boolean}): Promise<StoreWithEventsAndMenus>

    // POST api/stores
    createStore(dto: StoreInsertDTO): Promise<{ id: Id }>

    // PATCH api/stores/[id]
    updateStore(id: Id, dto: StoreUpdateDTO): Promise<void>

    // GET api/stores/mine
    getMyStoreIds(): Promise<Id[]>;
}