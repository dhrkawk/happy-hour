import { StoreMenuInsertDTO, StoreMenuUpdateDTO } from "../schemas/schemas"
import { StoreMenu } from "../entities/entities"
import { Id } from "../shared/repository"

export interface StoreMenuRepository {
    // api/menus : POST
    createMenus(rows: StoreMenuInsertDTO[]): Promise<void>

    // api/menus/[id] : PATCH
    updateMenu(id: Id, dto: StoreMenuUpdateDTO): Promise<void>

    // api/menus/[id] : DELETE
    deleteMenu(id: Id): Promise<void>

    // api/menus/ : GET (parameter storeId)
    getMenusByStoreId(storeId: Id): Promise<StoreMenu[]>
}