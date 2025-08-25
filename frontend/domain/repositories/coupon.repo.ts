import { CreateCouponTxDTO } from "../schemas/schemas"
import { Coupon, CouponItem } from "../entities/entities"
import { Id } from "../shared/repository"

export interface CouponRepository {
    createCouponWithItemsByUserId(dto: CreateCouponTxDTO): Promise<{ couponId: Id }>

    redeemCouponById(couponId: Id): Promise<void>

    cancelCouponById(couponId: Id): Promise<void>

    getCouponsByUserId(userId: Id): Promise<Coupon[]>

    getCouponWithItemsById(couponId: Id): Promise<Coupon & { items: CouponItem[] }>
}