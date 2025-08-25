import { StoreMenuInsertDTO, StoreMenuUpdateDTO } from "../schemas/schemas"
import { StoreMenu } from "../entities/entities"
import { Id } from "../shared/repository"

export interface StoreMenuRepository {
    createMenus(rows: StoreMenuInsertDTO[]): Promise<void>

    updateMenu(id: Id, dto: StoreMenuUpdateDTO): Promise<void>

    deleteMenu(id: Id): Promise<void>

    getMenusByStoreId(storeId: Id): Promise<StoreMenu[]>
}