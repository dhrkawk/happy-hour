"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

// ===== Types =====
export type GiftMenuSnapshot = {
  id: string;             // menuId
  name: string;
  thumbnail?: string | null;
  originalPrice?: number | null;
  description?: string | null;
  category?: string | null;
};

export type GiftSelection = {
  storeId: string;        // 각 가게별로 격리
  giftId: string;         // store_gifts.id
  menu: GiftMenuSnapshot; // 선택된 메뉴 스냅샷
  displayNote?: string | null;
  endAt?: string | null;
  remaining?: number | null;
};

type GiftState = {
  // storeId 기준으로 giftId -> GiftSelection
  byStore: Record<string /*storeId*/, Record<string /*giftId*/, GiftSelection>>;
};

type GiftContextType = {
  // 조회
  getSelectionsForStore: (storeId: string) => GiftSelection[];
  getSelectedMenuId: (storeId: string, giftId: string) => string | undefined;
  // 쓰기
  selectGift: (sel: GiftSelection) => void;             // giftId 당 1개 선택 강제
  unselectGift: (storeId: string, giftId: string) => void;
  clearStoreGifts: (storeId: string) => void;
  // 직렬화/역직렬화(예약 페이지 전달 시 유용)
  toQueryParam: (storeId: string) => string;            // JSON string
  fromQueryParam: (storeId: string, raw: string) => void;
};

const GiftContext = createContext<GiftContextType | undefined>(undefined);

// ===== persistence (sessionStorage) =====
const KEY = "giftSelections:v1";

function loadPersist(): GiftState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GiftState) : null;
  } catch {
    return null;
  }
}
function savePersist(state: GiftState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export const GiftProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<GiftState>({ byStore: {} });

  // 초기 로드
  useEffect(() => {
    const saved = loadPersist();
    if (saved) setState(saved);
  }, []);

  // 저장
  useEffect(() => {
    savePersist(state);
  }, [state]);

  const getSelectionsForStore = useCallback((storeId: string) => {
    return Object.values(state.byStore[storeId] ?? {});
  }, [state]);

  const getSelectedMenuId = useCallback((storeId: string, giftId: string) => {
    return state.byStore[storeId]?.[giftId]?.menu.id;
  }, [state]);

  const selectGift = useCallback((sel: GiftSelection) => {
    setState(prev => {
      const current = prev.byStore[sel.storeId] ?? {};
      // 같은 giftId에 대해 한 개만 선택되도록 강제
      const nextStore = { ...current, [sel.giftId]: sel };
      return { byStore: { ...prev.byStore, [sel.storeId]: nextStore } };
    });
  }, []);

  const unselectGift = useCallback((storeId: string, giftId: string) => {
    setState(prev => {
      const current = prev.byStore[storeId] ?? {};
      if (!current[giftId]) return prev;
      const nextStore = { ...current };
      delete nextStore[giftId];
      return { byStore: { ...prev.byStore, [storeId]: nextStore } };
    });
  }, []);

  const clearStoreGifts = useCallback((storeId: string) => {
    setState(prev => {
      if (!prev.byStore[storeId]) return prev;
      const next = { ...prev.byStore };
      delete next[storeId];
      return { byStore: next };
    });
  }, []);

  // 직렬화: 예약 페이지로 넘길 때 사용 (이름/썸네일까지 포함됨)
  const toQueryParam = useCallback((storeId: string) => {
    const arr = Object.values(state.byStore[storeId] ?? {});
    return JSON.stringify(
      arr.map(s => ({
        giftId: s.giftId,
        storeId: s.storeId,
        menuId: s.menu.id,
        name: s.menu.name,
        thumbnail: s.menu.thumbnail ?? undefined,
        displayNote: s.displayNote ?? undefined,
        endAt: s.endAt ?? undefined,
      }))
    );
  }, [state]);

  // 역직렬화: 외부에서 파라미터로 받은 경우 복원 (선택사항)
  const fromQueryParam = useCallback((storeId: string, raw: string) => {
    try {
      const arr = JSON.parse(raw) as Array<{
        giftId: string;
        storeId?: string;
        menuId: string;
        name?: string;
        thumbnail?: string;
        displayNote?: string;
        endAt?: string;
      }>;
      setState(prev => {
        const base = prev.byStore[storeId] ?? {};
        const nextStore = { ...base };
        for (const g of arr) {
          nextStore[g.giftId] = {
            storeId,
            giftId: g.giftId,
            displayNote: g.displayNote ?? null,
            endAt: g.endAt ?? null,
            remaining: null,
            menu: {
              id: g.menuId,
              name: g.name ?? `메뉴 ${g.menuId.slice(0, 6)}…`,
              thumbnail: g.thumbnail ?? null,
            },
          };
        }
        return { byStore: { ...prev.byStore, [storeId]: nextStore } };
      });
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<GiftContextType>(() => ({
    getSelectionsForStore,
    getSelectedMenuId,
    selectGift,
    unselectGift,
    clearStoreGifts,
    toQueryParam,
    fromQueryParam,
  }), [
    getSelectionsForStore,
    getSelectedMenuId,
    selectGift,
    unselectGift,
    clearStoreGifts,
    toQueryParam,
    fromQueryParam,
  ]);

  return <GiftContext.Provider value={value}>{children}</GiftContext.Provider>;
};

export const useGiftContext = () => {
  const ctx = useContext(GiftContext);
  if (!ctx) throw new Error("useGiftContext must be used within a GiftProvider");
  return ctx;
};