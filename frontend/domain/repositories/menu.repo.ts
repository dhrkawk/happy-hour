import { StoreMenuInsertDTO, StoreMenuUpdateDTO } from "../schemas/schemas"
import { StoreMenu } from "../entities/entities"
import { Id } from "../shared/repository"

export interface StoreMenuRepository {
    // POST api/menus
    createMenus(rows: StoreMenuInsertDTO[]): Promise<void>

    // PATCH api/menus/[id]
    updateMenu(id: Id, dto: StoreMenuUpdateDTO): Promise<void>

    // DELETE api/menus/[id]
    deleteMenu(id: Id): Promise<void>

    // GET api/menus?storeId=...
    getMenusByStoreId(storeId: Id): Promise<StoreMenu[]>
}