// vm-utils.ts
import type { StoresApiResponse, ApiStore } from '@/hooks/stores/use-get-store-list';

// ---------- 타입 ----------
export type SortMode = 'distance' | 'discount' | 'onlyDiscount' | 'onlyPartnership' | 'none';

export type BuildOptions = {
  coords?: { lat: number; lng: number } | null;
  category?: string;
  sort?: SortMode;
};

export type StoreListItemVM = {
  id: string;
  name: string;
  addressText: string;
  categoryText: string;
  thumbnailUrl: string;
  isActiveBadge: string;

  // 파생 정보
  distanceKm?: number;
  distanceText?: string;
  partnershipText?: string | null;

  // 원천 좌표 (정렬/지도용)
  lat: number;
  lng: number;

  // 이벤트 요약 (★ max_* 필드 포함)
  events: Array<{
    id: string;
    title: string;

    // ← 여기 추가: 서버가 내려주는 값을 그대로 전달(없으면 undefined)
    maxDiscountRate?: number | null;
  }>;

  // 스토어 레벨 파생 “최대 할인 요약” (★ 추가)
  storeMaxDiscountRate?: number;     // 가장 큰 할인율
  storeTopEventId?: string;          // 최대 할인 이벤트 id
};

export type StoreListVM = {
  items: StoreListItemVM[];
  total: number;
  hasMore: boolean;
};

// ---------- 유틸 ----------

const fmtDate = (ymd: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd.replace(/-/g, '.') : ymd;


// 하버사인 (km)
const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1  = (a.lat * Math.PI) / 180;
  const la2  = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
};

const distanceText = (km?: number) => {
  if (km == null || !Number.isFinite(km)) return undefined;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

// 이벤트 개수를 “할인 강도”의 대략치로 사용
const discountScore = (evs?: Array<unknown>) => evs?.length ?? 0;

// ---------- 메인 셀렉터 ----------
export const buildStoreListVM = (
  resp: StoresApiResponse,
  opts?: BuildOptions
): StoreListVM => {
  const { coords, category, sort = 'none' } = opts ?? {};

  const itemsBase = (resp.data ?? []).map<StoreListItemVM>((s: ApiStore) => {
    // 1) 이벤트 → VM
    const events = (s.events ?? []).map(ev => {
      const item = {
        id: ev.id,
        title: ev.title,

        // ★ 서버가 내려주는 헤더 필드 그대로 연결
        maxDiscountRate: ev.maxDiscountRate ?? null,
      };
      return item;
    });

    // 2) 스토어 레벨 최대 할인 파생 계산
    //    - 우선순위: maxDiscountRate 가장 큰 이벤트
    //    - 동률이면 (maxOriginalPrice - maxFinalPrice) 차이가 큰 쪽
    let storeMaxDiscountRate: number | undefined;
    let storeTopEventId: string | undefined;

    if (events.length) {
      storeTopEventId = events[0].id;
      storeMaxDiscountRate = events[0].maxDiscountRate!;
    }

    // 3) 스토어 VM 기본 필드
    const vm: StoreListItemVM = {
      id: s.id,
      name: s.name,
      addressText: s.address,
      categoryText: s.category || '기타',
      thumbnailUrl: s.storeThumbnail,
      isActiveBadge: s.isActive ? '영업중' : '비활성',

      lat: s.lat,
      lng: s.lng,

      partnershipText: s.partnership ?? null,
      events,

      // ★ 파생 추가
      storeMaxDiscountRate,
      storeTopEventId,
    };

    // 거리 파생
    if (coords) {
      const km = distanceKm(coords, { lat: s.lat, lng: s.lng });
      vm.distanceKm   = km;
      vm.distanceText = distanceText(km);
    }

    return vm;
  });

  // 4) 클라 필터
  let filtered = itemsBase;
  if (category && category !== '전체') {
    filtered = filtered.filter(v => v.categoryText === category);
  }
  if (sort === 'onlyDiscount') {
    filtered = filtered.filter(v => (v.events?.length ?? 0) > 0);
  }
  if (sort === 'onlyPartnership') {
    filtered = filtered.filter(v => !!v.partnershipText);
  }

  // 5) 정렬
  if (sort === 'distance' && opts?.coords) {
    filtered = [...filtered].sort((a, b) => {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      return da - db;
    });
  } else if (sort === 'discount') {
    // 이벤트 수 기반 기본 정렬 → 같은 경우엔 storeMaxDiscountRate 크게
    filtered = [...filtered].sort((a, b) => {
      const byCount = discountScore(b.events) - discountScore(a.events);
      if (byCount !== 0) return byCount;
      const ar = a.storeMaxDiscountRate ?? -1;
      const br = b.storeMaxDiscountRate ?? -1;
      return br - ar;
    });
  }

  return {
    items: filtered,
    total: resp.meta?.total ?? filtered.length,
    hasMore: Boolean(resp.meta?.hasMore),
  };
};