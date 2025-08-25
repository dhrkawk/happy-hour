// hooks/stores/store-detail-vm.ts
'use client';

import type {
  StoreDetailResponse,
  ApiMenu,
  ApiEventHeader,
} from '@/hooks/stores/use-get-store-detail';

/* ---------- 타입 ---------- */
export type StoreMenuViewModel = {
  id: string;
  name: string;
  originalPrice: number;
  discountPrice: number;     // 초기에는 이벤트 상세를 모름 → 원가와 동일
  discountRate: number;      // 초기 0
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

/** 서버에서 events/menus만 내려오므로, gifts는 항상 빈 배열로 둡니다(호환성). */
export type GiftSectionVM = {
  id: string;
  displayNote: string | null;
  endAt: string;
  remaining: number | null;
  menus: StoreMenuViewModel[];
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
  menus: StoreMenuViewModel[];    // 전체 메뉴(초기엔 할인 미반영)
  gifts: GiftSectionVM[];         // 항상 []
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

/* ---------- 내부 가공 (이제 aggregates 의존성 제거) ---------- */
function buildEventsVM(events?: ApiEventHeader[]): StoreEventVM[] {
  const src = events ?? [];
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
    // 서버가 주면 연결
    // @ts-ignore
    description: ev.description,
    maxDiscountRate: ev.maxDiscountRate,
  }));
}

function buildMenusVM(menus?: ApiMenu[]): StoreMenuViewModel[] {
  const base = menus ?? [];
  return base.map<StoreMenuViewModel>((m) => ({
    id: m.id,
    name: m.name,
    originalPrice: m.price,
    discountPrice: m.price,   // 초기엔 할인 정보 없음 → 원가와 동일
    discountRate: 0,
    thumbnail: m.thumbnail ?? null,
    description: m.description ?? null,
    category: m.category ?? null,
  }));
}

/* ---------- 빌더 ---------- */
export function buildStoreDetailVM(
  resp: StoreDetailResponse,
  coords?: { lat: number; lng: number } | null
): StoreDetailViewModel {
  const s = resp.store;

  // 이벤트 VM (헤더만)
  const eventsVM = buildEventsVM(resp.events);

  // 메뉴 VM (할인 미반영)
  const menusVM = buildMenusVM(resp.menus);

  // 카테고리 탭
  const cats = Array.from(new Set([...(s.menuCategory ?? [])].filter(Boolean))) as string[];
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

    // 서버에선 더 이상 증정/할인 aggregate를 주지 않으므로 빈 배열 유지
    gifts: [],
  };
}