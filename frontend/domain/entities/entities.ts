// MVP Entities simplified: only classes with fromRow(any)
// - No separate Row interfaces (use supabase gen types if needed)
// - Just hydrate from DB object → camelCase fields

export type UUID = string;
export type Timestamp = string;
export type TimeHHMMSS = string;
export type DateString = string;
export type CouponStatus = string;
export type UserRole = string;

// =============================================================
// CouponItem
// =============================================================
export class CouponItem {
  constructor(
    public readonly id: UUID,
    public couponId: UUID,
    public quantity: number,
    public originalPrice: number,
    public discountRate: number,
    public menuName: string,
    public isGift: boolean,
    public finalPrice: number,
  ) {}
  static fromRow(r: any): CouponItem {
    return new CouponItem(
      r.id,
      r.coupon_id,
      r.quantity,
      r.original_price,
      r.discount_rate,
      r.menu_name,
      r.is_gift,
      r.final_price,
    );
  }
}

// =============================================================
// Coupon
// =============================================================
export class Coupon {
  constructor(
    public readonly id: UUID,
    public userId: UUID,
    public storeId: UUID,
    public expectedVisitTime: Timestamp | null,
    public createdAt: Timestamp | null,
    public updatedAt: Timestamp | null,
    public expiredTime: Timestamp,
    public status: CouponStatus,
    public happyHourStartTime: TimeHHMMSS,
    public happyHourEndTime: TimeHHMMSS,
    public weekdays: string[],
    public eventTitle: string,
    public activatedAt: Timestamp | null, // 추가된 필드
  ) {}
  static fromRow(r: any): Coupon {
    return new Coupon(
      r.id,
      r.user_id,
      r.store_id,
      r.expected_visit_time,
      r.created_at,
      r.updated_at,
      r.expired_time,
      r.status,
      r.happy_hour_start_time,
      r.happy_hour_end_time,
      r.weekdays,
      r.event_title,
      r.activated_at // 추가된 매핑
    );
  }
}

// =============================================================
// Discount
// =============================================================
export class Discount {
  constructor(
    public readonly id: UUID,
    public discountRate: number,
    public remaining: number | null,
    public createdAt: Timestamp,
    public menuId: UUID,
    public isActive: boolean,
    public finalPrice: number,
    public eventId: UUID,
  ) {}
  static fromRow(r: any): Discount {
    return new Discount(
      r.id,
      r.discount_rate,
      r.remaining,
      r.created_at,
      r.menu_id,
      r.is_active,
      r.final_price,
      r.event_id,
    );
  }
}

// =============================================================
// Event
// =============================================================
export class Event {
  constructor(
    public readonly id: UUID,
    public storeId: UUID,
    public startDate: DateString,
    public endDate: DateString,
    public happyHourStartTime: TimeHHMMSS,
    public happyHourEndTime: TimeHHMMSS,
    public weekdays: string[],
    public isActive: boolean,
    public description: string | null,
    public createdAt: Timestamp,
    public maxDiscountRate: number | null,
    public title: string,
  ) {}
  static fromRow(r: any): Event {
    return new Event(
      r.id,
      r.store_id,
      r.start_date,
      r.end_date,
      r.happy_hour_start_time,
      r.happy_hour_end_time,
      r.weekdays,
      r.is_active,
      r.description,
      r.created_at,
      r.max_discount_rate,
      r.title,
    );
  }
}

// =============================================================
// GiftGroup
// =============================================================
export class GiftGroup {
  constructor(
    public readonly id: UUID,
    public eventId: UUID,
    public createdAt: Timestamp,
  ) {}
  static fromRow(r: any): GiftGroup {
    return new GiftGroup(r.id, r.event_id, r.created_at);
  }
}

// =============================================================
// GiftOption
// =============================================================
export class GiftOption {
  constructor(
    public readonly id: UUID,
    public giftGroupId: UUID,
    public menuId: UUID,
    public remaining: number | null,
    public isActive: boolean,
    public createdAt: Timestamp,
  ) {}
  static fromRow(r: any): GiftOption {
    return new GiftOption(
      r.id,
      r.gift_group_id,
      r.menu_id,
      r.remaining,
      r.is_active,
      r.created_at,
    );
  }
}

// =============================================================
// StoreMenu
// =============================================================
export class StoreMenu {
  constructor(
    public readonly id: UUID,
    public storeId: UUID,
    public name: string,
    public price: number,
    public thumbnail: string | null,
    public createdAt: Timestamp | null,
    public description: string | null,
    public category: string | null,
  ) {}
  static fromRow(r: any): StoreMenu {
    return new StoreMenu(
      r.id,
      r.store_id,
      r.name,
      r.price,
      r.thumbnail,
      r.created_at,
      r.description,
      r.category,
    );
  }
}

// =============================================================
// Store
// =============================================================
export class Store {
  constructor(
    public readonly id: UUID,
    public name: string,
    public address: string,
    public lat: number,
    public lng: number,
    public phone: string,
    public createdAt: Timestamp,
    public category: string,
    public isActive: boolean,
    public storeThumbnail: string,
    public ownerId: UUID,
    public menuCategory: string[] | null,
    public partnership: string | null,
    public naver_link: string | null,
  ) {}
  static fromRow(r: any): Store {
    return new Store(
      r.id,
      r.name,
      r.address,
      r.lat,
      r.lng,
      r.phone,
      r.created_at,
      r.category,
      r.is_active,
      r.store_thumbnail,
      r.owner_id,
      r.menu_category,
      r.partnership,
      r.naver_link,
    );
  }
}

// =============================================================
// UserProfile
// =============================================================
export class UserProfile {
  constructor(
    public readonly userId: UUID,
    public email: string,
    public providerId: string | null,
    public name: string,
    public phoneNumber: string,
    public totalBookings: number,
    public totalSavings: number,
    public createdAt: Timestamp,
    public updatedAt: Timestamp,
    public role: UserRole,
    public provider: string | null,
    public marketingConsent: boolean,
  ) {}
  static fromRow(r: any): UserProfile {
    return new UserProfile(
      r.user_id,
      r.email,
      r.provider_id,
      r.name,
      r.phone_number,
      r.total_bookings,
      r.total_savings,
      r.created_at,
      r.updated_at,
      r.role,
      r.provider,
      r.marketing_consent,
    );
  }
}

// =============================================================
// ReadModels + Builders (compose multiple entities)
// =============================================================

// 1) StoreWithEvents
export type StoreWithEvents = {
    store: Store;
    events: Event[];
  };
  
  export function buildStoreWithEvents(params: {
    storeRow: any;
    eventRows: any[]; // events.*
  }): StoreWithEvents {
    const store = Store.fromRow(params.storeRow);
    const events = (params.eventRows ?? []).map(Event.fromRow);
    return { store, events };
  }
  
  // 2) EventWithDiscountsAndGifts
  export type EventWithDiscountsAndGifts = {
    event: Event;
    discounts: Discount[];
    giftGroups: Array<{
      group: GiftGroup;
      options: GiftOption[];
    }>;
  };
  
  // 3) CouponWithItems
  export type CouponWithItems = {
    coupon: Coupon;
    items: CouponItem[];
    // 편의 집계
    totalQuantity: number;
    totalFinalPrice: number;
  };
  
  export function buildCouponWithItems(params: {
    couponRow: any;       // coupons.*
    itemRows: any[];      // coupon_items.* (WHERE coupon_id = ...)
  }): CouponWithItems {
    const coupon = Coupon.fromRow(params.couponRow);
    const items = (params.itemRows ?? []).map(CouponItem.fromRow);
    const totalQuantity = items.reduce((acc, it) => acc + (it.quantity ?? 0), 0);
    const totalFinalPrice = items.reduce((acc, it) => acc + (it.finalPrice ?? 0), 0);
    return { coupon, items, totalQuantity, totalFinalPrice };
  }
  
  // 4) StoreWithEventsAndMenus
  // - menus는 StoreMenu 배열만 포함
  export type StoreWithEventsAndMenus = {
    store: Store;
    events: Event[];
    menus: StoreMenu[];
  };

  export function buildStoreWithEventsAndMenus(params: {
    storeRow: any;             // stores.*
    eventRows: any[];          // events.* (WHERE store_id = ...)
    menuRows: any[];           // store_menus.* (WHERE store_id = ...)
  }): StoreWithEventsAndMenus {
    const store = Store.fromRow(params.storeRow);
    const events = (params.eventRows ?? []).map(Event.fromRow);
    const menus = (params.menuRows ?? []).map(StoreMenu.fromRow);

    return { store, events, menus };
  }