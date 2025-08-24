// hooks/stores/store-detail-vm.ts
'use client';

import type {
  StoreDetailResponse,
  ApiMenu,
  ApiEventAggregate,
  ApiEventHeader,
} from '@/hooks/stores/use-get-store-detail';

/* ---------- 타입 ---------- */
export type StoreMenuViewModel = {
  id: string;
  name: string;
  originalPrice: number;
  discountPrice: number;
  discountRate: number;
  discountDisplayText?: string;
  thumbnail: string | null;
  description: string | null;
  category: string | null;
};

export type StoreEventVM = {
  id: string;
  title: string;
  periodText: string;        // 2025.01.01 ~ 2025.01.31
  weekdaysText?: string;     // 월,화,수 ...
  happyHourText?: string;    // 17:00 ~ 19:00
  isActive: boolean;
  description?: string;      // (있으면)
  maxDiscountRate?: number;
};

export type GiftSectionVM = {
  id: string;                // gift_group id
  displayNote: string | null;
  endAt: string;             // 이벤트 종료일 (ISO or YYYY-MM-DD)
  remaining: number | null;  // 그룹 잔여(없으면 null)
  menus: StoreMenuViewModel[]; // 0원 표시된 메뉴들
};

export type StoreDetailViewModel = {
  id: string;
  name: string;
  address: string;
  phone: string;          // pretty 포맷
  category: string;
  storeThumbnail: string;
  partnership: string | null;

  lat: number;
  lng: number;
  distance?: number;      // km
  distanceText?: string;  // "1.2km"

  createdAtText: string;

  events: StoreEventVM[];
  menuCategories: string[];       // 탭에 뿌릴 카테고리들
  menus: StoreMenuViewModel[];    // 전체 메뉴(할인 반영)
  gifts: GiftSectionVM[];         // 증정 섹션
};

/* ---------- 유틸 ---------- */
const weekdaysKo: Record<string, string> = {
  MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일',
};

const fmtDate = (ymd: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd.replace(/-/g, '.') : ymd;

const fmtTime = (hms?: string) => (hms ? hms.slice(0, 5) : undefined);

const toKoDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });

const phonePretty = (raw: string) => {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('02')) {
    if (d.length === 9)  return d.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (d.startsWith('010') && d.length === 11) return d.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  if (d.length === 10) return d.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  if (d.length === 11) return d.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  return raw;
};

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

/* ---------- 내부 가공 ---------- */
function buildEventsVM(
  events: ApiEventHeader[] | undefined,
  aggregates: ApiEventAggregate[] | undefined
): StoreEventVM[] {
  const src: ApiEventHeader[] =
    events ?? aggregates?.map(a => a.event) ?? [];

  return src.map((ev) => ({
    id: ev.id,
    title: ev.title,
    periodText: `${fmtDate(ev.startDate)} ~ ${fmtDate(ev.endDate)}`,
    weekdaysText: ev.weekdays?.length
      ? ev.weekdays.map(w => weekdaysKo[w] ?? w).join(', ')
      : undefined,
    happyHourText:
      ev.happyHourStartTime && ev.happyHourEndTime
        ? `${fmtTime(ev.happyHourStartTime)} ~ ${fmtTime(ev.happyHourEndTime)}`
        : undefined,
    isActive: ev.isActive,
    // description / 요약 필드는 서버에서 내려오면 연결 (없으면 undefined)
    // @ts-ignore - 있으면 쓰고, 없으면 무시
    description: ev.description,
    maxDiscountRate: ev.maxDiscountRate,
  }));
}

function buildMenuDiscountMap(aggregates?: ApiEventAggregate[]) {
  // menuId -> 최대 할인율/최대 가격 정보
  const map = new Map<
    string,
    { maxRate: number; bestFinal?: number; bestOriginal?: number }
  >();

  if (!aggregates) return map;

  for (const ag of aggregates) {
    for (const d of ag.discounts ?? []) {
      const cur = map.get(d.menuId) ?? { maxRate: 0 };
      if (d.discountRate > (cur.maxRate ?? 0)) {
        map.set(d.menuId, {
          maxRate: d.discountRate,
          bestFinal: d.finalPrice,
          // originalPrice는 discounts에 없을 수 있어요. 있으면 채우고, 아니면 나중에 메뉴 원가 사용
          bestOriginal: cur.bestOriginal,
        });
      }
    }
  }

  return map;
}

function buildMenusVM(
  menus: ApiMenu[] | undefined,
  discountMap: Map<string, { maxRate: number; bestFinal?: number; bestOriginal?: number }>
): StoreMenuViewModel[] {
  const base = menus ?? [];
  return base.map<StoreMenuViewModel>((m) => {
    const info = discountMap.get(m.id);
    const rate = info?.maxRate ?? 0;

    const original = m.price;
    const discounted =
      rate > 0
        ? Math.max(0, Math.round(original * (100 - rate) / 100))
        : original;

    return {
      id: m.id,
      name: m.name,
      originalPrice: original,
      discountPrice: discounted,
      discountRate: rate,
      thumbnail: m.thumbnail ?? null,
      description: m.description ?? null,
      category: m.category ?? null,
    };
  });
}

function buildGiftSections(
  aggregates: ApiEventAggregate[] | undefined,
  menusById: Map<string, ApiMenu>
): GiftSectionVM[] {
  if (!aggregates) return [];

  const sections: GiftSectionVM[] = [];

  for (const ag of aggregates) {
    const end = ag.event?.endDate ?? new Date().toISOString().slice(0, 10);
    const displayNote = null; // 서버에서 별도 노트를 준다면 매핑
    const remaining = null;   // 그룹 잔여치가 있다면 매핑

    for (const g of ag.giftGroups ?? []) {
      const vmMenus: StoreMenuViewModel[] = [];

      for (const opt of g.options ?? []) {
        const base = menusById.get(opt.menuId);
        if (!base) continue; // 메뉴가 없으면 스킵

        vmMenus.push({
          id: base.id,
          name: base.name,
          originalPrice: base.price,
          discountPrice: 0,
          discountRate: 100,
          discountDisplayText: '증정',
          thumbnail: base.thumbnail ?? null,
          description: base.description ?? null,
          category: base.category ?? null,
        });
      }

      if (vmMenus.length > 0) {
        sections.push({
          id: g.group.id,
          displayNote,
          endAt: end,
          remaining,
          menus: vmMenus,
        });
      }
    }
  }

  return sections;
}

/* ---------- 빌더 ---------- */
export function buildStoreDetailVM(
  resp: StoreDetailResponse,
  coords?: { lat: number; lng: number } | null
): StoreDetailViewModel {
  const s = resp.store;

  // 이벤트 VM
  const eventsVM = buildEventsVM(resp.events, resp.eventAggregates);

  // 할인 맵(메뉴별 최대 할인율)
  const discountMap = buildMenuDiscountMap(resp.eventAggregates);

  // 메뉴 VM
  const menusVM = buildMenusVM(resp.menus, discountMap);

  // 증정 섹션 VM
  const menusById = new Map((resp.menus ?? []).map(m => [m.id, m]));
  const gifts = buildGiftSections(resp.eventAggregates, menusById);

  // 카테고리 탭 (할인 / 지정 카테고리 / 기타)
  const cats = Array.from(
    new Set([...(s.menuCategory ?? [])].filter(Boolean))
  ) as string[];
  const menuCategories = cats;

  // 거리
  const km = coords ? distanceKm(coords, { lat: s.lat, lng: s.lng }) : undefined;

  return {
    id: s.id,
    name: s.name,
    address: s.address,
    phone: phonePretty(s.phone),
    category: s.category || '기타',
    storeThumbnail: s.storeThumbnail,
    partnership: s.partnership,

    lat: s.lat,
    lng: s.lng,
    distance: km,
    distanceText: distanceText(km),

    createdAtText: toKoDateTime(s.createdAt),

    events: eventsVM,
    menuCategories,
    menus: menusVM,
    gifts,
  };
}