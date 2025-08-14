"use client";

import { get } from "http";
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
  activeGiftStoreId?: string | null; // New: Tracks the storeId for which gifts are currently active
};

type GiftContextType = {
  // 조회
  getSelectionsForStore: (storeId: string) => GiftSelection[];
  getSelectedMenuId: (storeId: string, giftId: string) => string | undefined;
  // 쓰기
  selectGift: (sel: GiftSelection) => void;             // giftId 당 1개 선택 강제
  unselectGift: (storeId: string, giftId: string) => void;
  clearStoreGifts: (storeId: string) => void;
  totalSavings: (storeId: string) => number;        // 해당 가게에서 선택된 메뉴들의 절약 금액 합계
  activeGiftStoreId: string | null | undefined; // Expose activeGiftStoreId, allow undefined
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
  const [state, setState] = useState<GiftState>({ byStore: {}, activeGiftStoreId: null }); // Initialize activeGiftStoreId

  // 초기 로드
  useEffect(() => {
    const saved = loadPersist();
    if (saved) setState(saved);
  }, []);

  // 저장
  useEffect(() => {
    console.log("GiftContext: Saving state to sessionStorage:", state);
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
      console.log("GiftContext: selectGift - selecting for storeId:", sel.storeId, "giftId:", sel.giftId);
      console.log("GiftContext: selectGift - previous state.byStore:", prev.byStore);

      let nextByStore = { ...prev.byStore };
      let nextActiveGiftStoreId = sel.storeId; // Set active store to current selection

      // "한 번에 한 가게의 증정품만 선택 가능" 제약을 강제
      const currentStoreIds = Object.keys(prev.byStore);
      if (currentStoreIds.length > 0 && !currentStoreIds.includes(sel.storeId)) {
        // 새로운 선택이 다른 가게의 증정품이라면, 기존의 모든 증정품을 지웁니다.
        nextByStore = {};
      }

      const current = nextByStore[sel.storeId] ?? {};
      // 같은 giftId에 대해 한 개만 선택되도록 강제
      const nextStore = { ...current, [sel.giftId]: sel };
      const newState = {
        byStore: { ...nextByStore, [sel.storeId]: nextStore },
        activeGiftStoreId: nextActiveGiftStoreId, // Update activeGiftStoreId
      };
      console.log("GiftContext: selectGift - new state.byStore:", newState.byStore);
      console.log("GiftContext: selectGift - new activeGiftStoreId:", newState.activeGiftStoreId);
      return newState;
    });
  }, []);

  const unselectGift = useCallback((storeId: string, giftId: string) => {
    setState(prev => {
      console.log("GiftContext: unselectGift - unselecting for storeId:", storeId, "giftId:", giftId);
      console.log("GiftContext: unselectGift - previous state.byStore:", prev.byStore);
      const current = prev.byStore[storeId] ?? {};
      if (!current[giftId]) return prev;
      const nextStore = { ...current };
      delete nextStore[giftId];
      const newState = {
        byStore: { ...prev.byStore, [storeId]: nextStore },
        activeGiftStoreId: Object.keys(nextStore).length === 0 ? null : prev.activeGiftStoreId, // Clear activeGiftStoreId if no gifts left for this store
      };
      console.log("GiftContext: unselectGift - new state.byStore:", newState.byStore);
      console.log("GiftContext: unselectGift - new activeGiftStoreId:", newState.activeGiftStoreId);
      return newState;
    });
  }, []);

  const clearStoreGifts = useCallback((storeId: string) => {
    setState(prev => {
      console.log("GiftContext: clearStoreGifts - clearing for storeId:", storeId);
      console.log("GiftContext: clearStoreGifts - previous state.byStore:", prev.byStore);
      if (!prev.byStore[storeId]) return prev;
      const next = { ...prev.byStore };
      delete next[storeId];
      const newState = {
        byStore: next,
        activeGiftStoreId: prev.activeGiftStoreId === storeId ? null : prev.activeGiftStoreId, // Clear activeGiftStoreId if the cleared store was the active one
      };
      console.log("GiftContext: clearStoreGifts - new state.byStore:", newState.byStore);
      console.log("GiftContext: clearStoreGifts - new activeGiftStoreId:", newState.activeGiftStoreId);
      return newState;
    });
  }, []);

  // Add logging to the useEffect that saves state
  useEffect(() => {
    console.log("GiftContext: Saving state to sessionStorage:", state);
    savePersist(state);
  }, [state]);

  const totalSavings = useCallback((storeId: string) => {
    const selections = getSelectionsForStore(storeId);
    return selections.reduce((total, sel) => {
      if (sel.menu.originalPrice && sel.menu.originalPrice > 0) {
        return sel.menu.originalPrice + total;
      }
      return total;
    }, 0);
  }, [getSelectionsForStore]);

  const value = useMemo<GiftContextType>(() => ({
    getSelectionsForStore,
    getSelectedMenuId,
    selectGift,
    unselectGift,
    clearStoreGifts,
    totalSavings,
    activeGiftStoreId: state.activeGiftStoreId, // Expose activeGiftStoreId
  }), [
    getSelectionsForStore,
    getSelectedMenuId,
    selectGift,
    unselectGift,
    clearStoreGifts,
    totalSavings,
    state.activeGiftStoreId, // Add to dependencies
  ]);

  return <GiftContext.Provider value={value}>{children}</GiftContext.Provider>;
};

export const useGiftContext = () => {
  const ctx = useContext(GiftContext);
  if (!ctx) throw new Error("useGiftContext must be used within a GiftProvider");
  return ctx;
};