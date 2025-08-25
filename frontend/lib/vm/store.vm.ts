// lib/vm/store.vm.ts
import type {
    Store,
    Event,
    StoreMenu,
    StoreWithEvents,
    StoreWithEventsAndMenus,
  } from '@/domain/entities/entities';
  
  /* ---------- 공통 유틸 ---------- */
  const weekdaysKo: Record<string, string> = {
    MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일',
  };
  
  const fmtDate = (ymd: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd.replace(/-/g, '.') : ymd;
  
  const fmtTime = (hms?: string | null) => (hms ? hms.slice(0, 5) : undefined);
  
  /* ---------- (상세에서 사용) Event VM ---------- */
  export type EventVM = {
    id: string;
    title: string;
    periodText: string;
    weekdaysText?: string;
    happyHourText?: string;
    isActive: boolean;
    maxDiscountRate?: number | null;
  };
  
  export const buildEventVM = (ev: Event): EventVM => ({
    id: ev.id,
    title: ev.title,
    periodText: `${fmtDate(ev.startDate)} ~ ${fmtDate(ev.endDate)}`,
    weekdaysText: ev.weekdays?.length ? ev.weekdays.map(w => weekdaysKo[w] ?? w).join(', ') : undefined,
    happyHourText:
      ev.happyHourStartTime && ev.happyHourEndTime
        ? `${fmtTime(ev.happyHourStartTime)} ~ ${fmtTime(ev.happyHourEndTime)}`
        : undefined,
    isActive: ev.isActive,
    maxDiscountRate: ev.maxDiscountRate ?? null,
  });
  
  /* ---------- 리스트용 VM (요청 필드 고정) ---------- */
  export type StoreListItemVM = {
    id: string;
    name: string;
    category: string;
    address: string;
    thumbnail: string;            // storeThumbnail
    partnership: string | null;   // 제휴 문자열(없으면 null)
    lat: number;
    lng: number;
    hasEvent: boolean;
    maxDiscountRate: number | null; // 활성 이벤트 중 최대 할인율
    distance?: number;
    distanceText?: string;
  };
  
  export type StoresWithEventsVM = StoreListItemVM[];
  
  export const buildStoreListItemVM = (row: StoreWithEvents): StoreListItemVM => {
    const activeRates = (row.events ?? [])
      .filter(e => e.isActive)
      .map(e => e.maxDiscountRate ?? 0);
  
    const hasEvent = (row.events?.length ?? 0) > 0;
    const maxDiscountRate = activeRates.length > 0
      ? Math.max(...activeRates)
      : null;
    
    return {
      id: row.store.id,
      name: row.store.name,
      category: row.store.category || '기타',
      address: row.store.address,
      thumbnail: row.store.storeThumbnail,
      partnership: row.store.partnership ?? null,
      lat: row.store.lat,
      lng: row.store.lng,
      hasEvent,
      maxDiscountRate,
    };
  };
  
  export const buildStoresWithEventsVM = (rows: StoreWithEvents[]): StoresWithEventsVM => {
    const mapped = rows.map(buildStoreListItemVM);
    return mapped;
  };
  
  /* ---------- 상세용 VM ---------- */
  export type MenuVM = {
    id: string;
    name: string;
    price: number;
    thumbnail: string | null;
    description: string | null;
    category: string | null;
  };
  
  export type StoreDetailVM = {
    id: string;
    name: string;
    address: string;
    phone: string;
    category: string;
    storeThumbnail: string;
    partnership: string | null;
    menuCategories: string[];
    events: EventVM[];
    menus: MenuVM[];
  };
  
  export const buildMenuVM = (m: StoreMenu): MenuVM => ({
    id: m.id,
    name: m.name,
    price: m.price,
    thumbnail: m.thumbnail ?? null,
    description: m.description ?? null,
    category: m.category ?? null,
  });
  
  export const buildStoreDetailVM = (data: StoreWithEventsAndMenus): StoreDetailVM => {
    const events = (data.events ?? []).map(buildEventVM);
    const menus  = (data.menus ?? []).map(buildMenuVM);
  
    const cats = Array.from(new Set((data.store.menuCategory ?? []).filter(Boolean))) as string[];
  
    return {
      id: data.store.id,
      name: data.store.name,
      address: data.store.address,
      phone: data.store.phone,
      category: data.store.category || '기타',
      storeThumbnail: data.store.storeThumbnail,
      partnership: data.store.partnership ?? null,
      menuCategories: cats,
      events,
      menus,
    };
  };