// <Array<StoreWithEvents>>를 StoreListItemVM[]으로 변환
// StoreListItemVM은 Store의 정보와 가장 큰 이벤트 하나를 가지고 옴.
// 가장 큰 이벤트라고 하면 최대할인률을 가진 것.
// 1) StoreListItemVM <- event를 내포하고 있음
import { StoreWithEvents, Event, EventWithDiscountsAndGifts, StoreWithEventsAndMenus } from "@/domain/entities/entities";
import { TimeHHMMSS, DateString } from "@/domain/entities/entities";

// =============================================================
// StoreListItemVM -> home, map에서 활용
// =============================================================
export type StoreListItemVM = {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    phone: string;
    category: string;
    thumbnail: string;
    menuCategory: string[] | null;
    partershipText: string | null;

    // 추가된 필드
    hasEvent: boolean;
    // 할인율이 최대인 event를 가지고 온다.
    eventTitle: string | null;
    maxDiscountRate: number | null;

    // 나중에 주입될 값
    distance: number;
    distanceText: string | undefined;
}

export function buildStoreListVMs(
    rows: StoreWithEvents[]
  ): StoreListItemVM[] {
  
    return rows.map(({ store, events }) => {
      const best = pickMaxDiscountEvent(events);
  
      return {
        id: store.id,
        name: store.name,
        address: store.address,
        lat: store.lat,
        lng: store.lng,
        phone: store.phone,
        category: store.category,
        thumbnail: store.storeThumbnail,
        menuCategory: store.menuCategory ?? null,
        partershipText: store.partnership ?? null, // (원문 타입 오타 유지)
  
        hasEvent: events.length > 0,
        eventTitle: best?.title ?? null,
        maxDiscountRate: best?.maxDiscountRate ?? null,
  
        // 나중에 주입
        distance: 0,
        distanceText: '거리 정보 없음',
      };
    });
  }

  function pickMaxDiscountEvent(events: Event[]): Event | null {
    if (!events || events.length === 0) return null;
    let best: Event | null = null;
    for (const e of events) {
      const rate = e.maxDiscountRate ?? null;
      if (rate == null) continue;
      if (!best || (best.maxDiscountRate ?? -Infinity) < rate) {
        best = e;
      }
    }
    // 모두 null일 수도 있으므로 한번 더 처리
    if (!best) {
      // 전부 null이면 그냥 첫 번째를 반환(타이틀만 쓰는 경우 대비)
      return events[0] ?? null;
    }
    return best;
  }

// =============================================================
// StoreDetailVM store 상세페이지에서 활용
// =============================================================
export type StoreDetailVM = {
  id: string;
  name: string
  address: string;
  lat: number;
  lng: number;
  phone: string;
  category: string;
  thumbnail: string;
  menuCategory: string[] | null;
  partershipText: string | null;
  naver_link: string | null;
  event: EventVM | null;
  gifts: GiftVM[] | [];
  menus: MenuWithDiscountVM[] | [];

  // 나중에 주입될 값
  distance: number;
  distanceText: string | undefined;
}

export type EventVM = {
  id: string;
  startDate: DateString;
  endDate: DateString;
  happyHourStartTime: TimeHHMMSS;
  happyHourEndTime: TimeHHMMSS;
  weekdays: string[];
  description: string | null;
  title: string;
}

export type MenuWithDiscountVM = {
  menuId: string;
  name: string;
  price: number;
  thumbnail: string | null;
  description: string | null;
  category: string | null;

  // discount와 관련된 값
  discountId: string | null;
  discountRate: number | null;
  remaining: number | null;
  finalPrice: number | null;

  // finalPrice와 price중 선택
  priceText: string | "정보 없음";
}

export type GiftVM = {
  giftGroupId: string;
  giftOptionId: string | null;
  menuId: string;
  name: string;
  thumbnail: string | null;
  description: string | null;
  remaining: number | null;
}

export function buildStoreDetailVM(base: StoreWithEventsAndMenus): StoreDetailVM {
  const { store, events, menus } = base;

  // 이벤트는 우선 null로 (또는 첫 번째 이벤트 선택도 가능)
  const event: EventVM | null = events.length > 0 ? {
    id: events[0].id,
    startDate: events[0].startDate,
    endDate: events[0].endDate,
    happyHourStartTime: events[0].happyHourStartTime,
    happyHourEndTime: events[0].happyHourEndTime,
    weekdays: events[0].weekdays,
    description: events[0].description,
    title: events[0].title,
  } : null;

  const menusVM: MenuWithDiscountVM[] = menus.map(m => ({
    menuId: m.id,
    name: m.name,
    price: m.price,
    thumbnail: m.thumbnail,
    description: m.description,
    category: m.category,

    // 아직 이벤트 할인 안 채움
    discountId: null,
    discountRate: null,
    remaining: null,
    finalPrice: null,

    priceText: m.price != null ? `${m.price}원` : '정보 없음',
  }));

  return {
    id: store.id,
    name: store.name,
    address: store.address,
    lat: store.lat,
    lng: store.lng,
    phone: store.phone,
    category: store.category,
    thumbnail: store.storeThumbnail,
    menuCategory: store.menuCategory,
    partershipText: store.partnership,
    naver_link: store.naver_link,

    event,
    gifts: [],
    menus: menusVM,

    distance: 0,
    distanceText: '거리 정보 없음',
  };
}

export function enrichStoreDetailVM(
  vm: StoreDetailVM,
  eventBundle: EventWithDiscountsAndGifts
): StoreDetailVM {
  // 1) 이벤트 채우기
  const e = eventBundle.event;
  const event: EventVM = {
    id: e.id,
    startDate: e.startDate,
    endDate: e.endDate,
    happyHourStartTime: e.happyHourStartTime,
    happyHourEndTime: e.happyHourEndTime,
    weekdays: e.weekdays,
    description: e.description,
    title: e.title,
  };

  // 2) 메뉴 할인/최종가 주입
  const menuMap = new Map(vm.menus.map(m => [m.menuId, m]));

  for (const d of eventBundle.discounts) {
    if (!d.isActive) continue;
    const menu = menuMap.get(d.menuId);
    if (menu) {
      menu.discountId = d.id ?? null;
      menu.discountRate = d.discountRate;
      menu.remaining = d.remaining;
      menu.finalPrice = d.finalPrice;
      menu.priceText = d.finalPrice != null ? `${d.finalPrice}원` : `${menu.price}원`;
    }
  }

  // 3) 기프트 주입
  const gifts: GiftVM[] = [];
  for (const groupBundle of eventBundle.giftGroups) {
    for (const option of groupBundle.options) {
      if (!option.isActive) continue;
      const menu = menuMap.get(option.menuId);
      gifts.push({
        giftGroupId: groupBundle.group.id,
        giftOptionId: option.id ?? null,
        menuId: option.menuId,
        name: menu?.name ?? '',
        thumbnail: menu?.thumbnail ?? null,
        description: menu?.description ?? null,
        remaining: option.remaining,
      });
    }
  }

  return {
    ...vm,
    event,
    menus: Array.from(menuMap.values()),
    gifts,
  };
}