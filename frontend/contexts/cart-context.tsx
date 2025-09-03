// lib/contexts/coupon-cart.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
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
      return { ...initialState };
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

// ---- Provider ---------------------------------------------------
export function CouponCartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

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
    } catch {
      // noop
    }
  }, []);

  // 상태 변경 → persist
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      // quota 등 무시
    }
  }, [state]);

  // 최종 전송 DTO: 숫자 보정 + Zod parse
  const toDTO = useMemo(
    () => () => {
      // (필요 시 여기서 숫자형 보정/NULL 처리)
      const prepared: CreateCouponTxDTO = {
        ...state,
        items: state.items.map((it) => ({
          ...it,
          qty: Number(it.qty),
          original_price: it.original_price === undefined ? undefined : Number(it.original_price),
          discount_rate: it.discount_rate === undefined ? undefined : Number(it.discount_rate),
          final_price: it.final_price === undefined ? undefined : Number(it.final_price),
        })),
      };
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
  
    const addItem = (item: CartItem) => dispatch({ type: "ADD_ITEM", payload: item });
    const updateItem = (index: number, patch: Partial<CartItem>) =>
      dispatch({ type: "UPDATE_ITEM", index, payload: patch });
    const removeItem = (index: number) => dispatch({ type: "REMOVE_ITEM", index });
    const clear = () => dispatch({ type: "CLEAR" });
  
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