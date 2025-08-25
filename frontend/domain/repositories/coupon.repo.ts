import { CreateCouponTxDTO } from "../schemas/schemas"
import { Coupon, CouponItem } from "../entities/entities"
import { Id } from "../shared/repository"

export interface CouponRepository {
    // api/coupons : POST
    createCouponWithItemsByUserId(dto: CreateCouponTxDTO): Promise<{ couponId: Id }>

    // api/coupons/[id] : PATCH (parameter redeem)
    redeemCouponById(couponId: Id): Promise<void>

    // api/coupons/[id] : PATCH (parameter cancel)
    cancelCouponById(couponId: Id): Promise<void>

    // api/coupons : GET (parameter userId)
    getCouponsByUserId(userId: Id): Promise<Coupon[]>

    // api/coupons/[id] : GET
    getCouponWithItemsById(couponId: Id): Promise<Coupon & { items: CouponItem[] }>
}