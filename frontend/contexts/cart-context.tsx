// lib/contexts/coupon-cart.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { z } from "zod";
import {
  CreateCouponTxSchema,
  type CreateCouponTxDTO,
  CouponItemInput,
} from "@/domain/schemas/schemas"; // 네가 올려둔 스키마 경로로 맞춰줘

// ---- 상태 타입 -------------------------------------------------
type CartItem = z.infer<typeof CouponItemInput>;
type CartState = Omit<CreateCouponTxDTO, "items"> & { items: CartItem[] };

// 초기 상태 (필요 시 기본값 조정)
const initialState: CartState = {
  user_id: "" as any,
  store_id: "" as any,
  event_id: "" as any,
  expected_visit_time: null,
  expired_time: undefined,
  status: undefined,
  happy_hour_start_time: "00:00",
  happy_hour_end_time: "00:00",
  weekdays: ["MON"],
  event_title: "",
  items: [],
};

// ---- 액션 정의 -------------------------------------------------
type CartAction =
  | { type: "SET_HEADER"; payload: Partial<Omit<CartState, "items">> }
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "UPDATE_ITEM"; index: number; payload: Partial<CartItem> }
  | { type: "REMOVE_ITEM"; index: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; payload: CartState };

// ---- 리듀서 ----------------------------------------------------
function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_HEADER":
      return { ...state, ...action.payload };
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload] };
    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((it, i) => (i === action.index ? { ...it, ...action.payload } : it)),
      };
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((_, i) => i !== action.index) };
    case "CLEAR":
      return { ...state, items: [], expected_visit_time: null };
    case "HYDRATE":
      return action.payload;
    default:
      return state;
  }
}

// ---- Context 인터페이스 ----------------------------------------
type CartContextValue = {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  // 전송 직전 DTO 빌더 (Zod 검증 포함)
  toDTO: () => CreateCouponTxDTO;
};

const CartContext = createContext<CartContextValue | null>(null);

// ---- 로컬 스토리지 키 ------------------------------------------
const LS_KEY = "coupon-cart-v1";
const LS_META_KEY = "coupon-cart-v1-meta";
const CART_TTL_MS = 30 * 60 * 1000; // 30분

type CartMeta = {
  startedAt: number;
  lockedStoreId?: string;
};

// ---- Provider ---------------------------------------------------
export function CouponCartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ttlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 하이드레이션: 클라이언트에서만
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // 런타임 안전망: 스키마로 1차 검증/보정
        const dto = CreateCouponTxSchema.safeParse(parsed);
        if (dto.success) {
          dispatch({ type: "HYDRATE", payload: dto.data });
        } else {
          // 구조가 달라졌다면 초기화
          localStorage.removeItem(LS_KEY);
        }
      }

      // TTL 메타 확인 및 타이머 설정
      const metaRaw = localStorage.getItem(LS_META_KEY);
      if (metaRaw) {
        const meta = JSON.parse(metaRaw) as CartMeta | null;
        if (meta?.startedAt) {
          const now = Date.now();
          const expiry = meta.startedAt + CART_TTL_MS;
          if (now >= expiry) {
            // 이미 만료됨 → 즉시 초기화
            dispatch({ type: "CLEAR" });
            localStorage.removeItem(LS_KEY);
            localStorage.removeItem(LS_META_KEY);
          } else {
            const msLeft = expiry - now;
            ttlTimerRef.current = setTimeout(() => {
              dispatch({ type: "CLEAR" });
              localStorage.removeItem(LS_KEY);
              localStorage.removeItem(LS_META_KEY);
            }, msLeft);
          }
        }
      }
    } catch {
      // noop
    }

    return () => {
      if (ttlTimerRef.current) {
        clearTimeout(ttlTimerRef.current);
        ttlTimerRef.current = null;
      }
    };
  }, []);

  // 상태 변경 → persist
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      // quota 등 무시
    }

    // 메타 동기화: 타이머만 관리, 락(store) 결정은 addItem에서만
    try {
      const metaRaw = localStorage.getItem(LS_META_KEY);
      const meta: CartMeta | null = metaRaw ? (JSON.parse(metaRaw) as CartMeta) : null;

      if (state.items.length > 0 && meta?.startedAt) {
        if (!ttlTimerRef.current) {
          const now = Date.now();
          const expiry = meta.startedAt + CART_TTL_MS;
          if (now < expiry) {
            ttlTimerRef.current = setTimeout(() => {
              dispatch({ type: "CLEAR" });
              localStorage.removeItem(LS_KEY);
              localStorage.removeItem(LS_META_KEY);
            }, expiry - now);
          } else {
            // 만료된 경우 즉시 정리
            dispatch({ type: "CLEAR" });
            localStorage.removeItem(LS_KEY);
            localStorage.removeItem(LS_META_KEY);
          }
        }
      } else {
        // 비워지면 메타/타이머 정리
        localStorage.removeItem(LS_META_KEY);
        if (ttlTimerRef.current) {
          clearTimeout(ttlTimerRef.current);
          ttlTimerRef.current = null;
        }
      }
    } catch {
      // noop
    }
  }, [state]);

  // 최종 전송 DTO: 숫자 보정 + Zod parse
  const toDTO = useMemo(
    () => () => {
      // 1) 필수 체크(사용자/스토어/시간/요일/아이템)
      if (!state.user_id) throw new Error("로그인이 필요합니다.");
      if (!state.store_id) throw new Error("가게 정보가 없습니다.");
      if (!state.happy_hour_start_time || !state.happy_hour_end_time)
        throw new Error("해피아워 시간이 없습니다.");
      if (!state.weekdays?.length) throw new Error("사용 가능 요일이 비어 있습니다.");
      if (!state.items?.length) throw new Error("장바구니가 비어 있습니다.");
      // 2) 숫자형 보정
      const prepared: CreateCouponTxDTO = {
        user_id: state.user_id,
        store_id: state.store_id,
        event_id: state.event_id,
        expected_visit_time: state.expected_visit_time ?? null,
        expired_time: state.expired_time ?? undefined, // 없으면 서버에서 +7일 처리
        status: state.status ?? "issued",
        happy_hour_start_time: state.happy_hour_start_time!,
        happy_hour_end_time: state.happy_hour_end_time!,
        weekdays: state.weekdays!, // 서버에서 문자열/숫자 모두 허용(정규화)
        event_title: state.event_title ?? "",

        items: state.items.map((it) =>
          it.type === "gift"
            ? {
                type: "gift" as const,
                ref_id: it.ref_id,
                menu_id: it.menu_id,
                qty: 1,
                menu_name: it.menu_name,
                original_price: 0,
                discount_rate: 0,
                final_price: 0,
              }
            : {
                type: "discount" as const,
                ref_id: it.ref_id,
                menu_id: it.menu_id,
                qty: Number(it.qty),
                menu_name: it.menu_name,
                original_price: Number(it.original_price ?? 0),
                discount_rate:
                  it.discount_rate === undefined ? undefined : Number(it.discount_rate),
                final_price: Number(
                  (it.final_price ?? it.original_price ?? 0) as number
                ),
              }
        ),
      };
      // 3) Zod 검증 (형식 불일치 시 throw)
      try {
        return CreateCouponTxSchema.parse(prepared);
      } catch(e) {
        console.log(e);
      }
      return CreateCouponTxSchema.parse(prepared);
    },
    [state]
  );

  const value: CartContextValue = { state, dispatch, toDTO };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCouponCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCouponCart must be used within CouponCartProvider");
    const { state, dispatch, toDTO } = ctx;
  
    // 편의 액션
    const setHeader = (patch: Partial<Omit<CartState, "items">>) =>
      dispatch({ type: "SET_HEADER", payload: patch });
  
    const addItem = (item: CartItem) => {
      const itemsCount = state.items?.length ?? 0;
      try {
        const metaRaw = localStorage.getItem(LS_META_KEY);
        const meta = metaRaw ? (JSON.parse(metaRaw) as CartMeta) : null;

        if (itemsCount === 0) {
          // 첫 담기: 가게 정보가 반드시 있어야 하며, 이때 락 설정
          if (!state.store_id) throw new Error("STORE_NOT_SELECTED");
          const newMeta: CartMeta = {
            startedAt: Date.now(),
            lockedStoreId: state.store_id as string,
          };
          localStorage.setItem(LS_META_KEY, JSON.stringify(newMeta));
        } else {
          // 이미 담긴 상태: 다른 가게면 차단
          if (!meta || !meta.lockedStoreId) {
            throw new Error("CART_NOT_LOCKED");
          }
          if (state.store_id && meta.lockedStoreId !== state.store_id) {
            throw new Error("DIFFERENT_STORE_ITEMS");
          }
        }
      } catch (e) {
        throw e instanceof Error ? e : new Error("CART_GUARD_FAILED");
      }

      dispatch({ type: "ADD_ITEM", payload: item });
    };
    const updateItem = (index: number, patch: Partial<CartItem>) =>
      dispatch({ type: "UPDATE_ITEM", index, payload: patch });
    const removeItem = (index: number) => dispatch({ type: "REMOVE_ITEM", index });
    const clear = () => {
      dispatch({ type: "CLEAR" });
      try {
        localStorage.removeItem(LS_KEY);
        localStorage.removeItem(LS_META_KEY);
      } catch {
        // noop
      }
    };
  
    return {
      state,
      setHeader,
      addItem,
      updateItem,
      removeItem,
      clear,
      toDTO,
    };
  }
