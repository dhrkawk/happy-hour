import { CreateCouponTxDTO } from "../schemas/schemas"
import { Coupon, CouponItem } from "../entities/entities"
import { Id } from "../shared/repository"

export interface CouponRepository {
    // POST api/coupons
    createCouponWithItemsByUserId(dto: CreateCouponTxDTO): Promise<{ couponId: Id }>

    // PATCH api/coupons/[id]/redeem
    redeemCouponById(couponId: Id): Promise<void>

    // PATCH api/coupons/[id]/cancel
    cancelCouponById(couponId: Id): Promise<void>

    // GET api/coupons?userId=...
    getCouponsByUserId(userId: Id): Promise<Coupon[]>

    // GET api/coupons/[id]
    getCouponWithItemsById(couponId: Id): Promise<Coupon & { items: CouponItem[] }>
}