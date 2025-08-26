// <Array<StoreWithEvents>>를 StoreListItemVM[]으로 변환
// StoreListItemVM은 Store의 정보와 가장 큰 이벤트 하나를 가지고 옴.
// 가장 큰 이벤트라고 하면 최대할인률을 가진 것.
// 1) StoreListItemVM <- event를 내포하고 있음
import { StoreWithEvents, Event } from "@/domain/entities/entities";
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

// StoreWithEventsAndMenus를 VM으로 변환
