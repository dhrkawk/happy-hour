'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { type MenuWithDiscountVM } from '@/lib/vm/store.vm';
import { useCreateCouponWithItems } from '@/hooks/usecases/coupons.usecase';
import { useUser } from '@/hooks/use-user';

// 스키마 기반 2차검증을 위해 스키마와 타입을 임포트
import { CreateCouponTxSchema, type CreateCouponTxDTO } from '@/domain/schemas/schemas';

export interface Cart {
  storeId: string;
  storeName: string;
  items: CartItem[]; // 같은 가게 내 여러 이벤트 허용
}
type CartState = Cart | null;

interface CartContextType {
  cart: CartState;
  addMenu: (store: { id: string; name: string }, item: CartItem) => void;
  removeMenu: (menuId: string) => void;
  clearCart: () => void;
  createCoupon: () => Promise<void>; // 여러 RPC 호출 가능성 → Promise로
  isCreating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// --- 유틸: eventId별 그룹핑 ---
function groupByEventId(items: CartItem[]): Record<string, CartItem[]> {
  return items.reduce<Record<string, CartItem[]>>((acc, it) => {
    const key = it.eventId;
    if (!key) return acc;
    (acc[key] ??= []).push(it);
    return acc;
  }, {});
}

// --- Provider 컴포넌트 ---
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(() => {
    try {
      const storedCart = window.localStorage.getItem('happyhour:cart');
      return storedCart ? JSON.parse(storedCart) : null;
    } catch { return null; }
  });

  const { toast } = useToast();
  const { user } = useUser();

  // ✅ 여러 이벤트를 순차/병렬로 생성해야 하므로 mutateAsync 사용 (훅이 지원해야 함)
  //    훅에서 return { mutate, mutateAsync, ... } 형태로 노출되어야 합니다.
  const { mutateAsync: createCouponAsync, isPending: isCreating } = useCreateCouponWithItems();

  useEffect(() => {
    try {
      if (cart) window.localStorage.setItem('happyhour:cart', JSON.stringify(cart));
      else window.localStorage.removeItem('happyhour:cart');
    } catch (error) { console.error('장바구니 저장 실패', error); }
  }, [cart]);

  const addMenu = useCallback((store: { id: string; name: string }, item: CartItem) => {
    setCart(prevCart => {
      if (!item.eventId) {
        // 이벤트 없는 메뉴는 쿠폰을 만들 수 없으므로 방지
        toast({ title: '이벤트 정보가 없는 메뉴입니다.', variant: 'destructive' });
        return prevCart ?? null;
      }

      if (!prevCart) {
        toast({ title: `'${item.name}' 메뉴를 담았습니다.` });
        return { storeId: store.id, storeName: store.name, items: [item] };
      }

      // 가게 단일 제약은 유지
      if (prevCart.storeId !== store.id) {
        toast({
          title: '다른 가게의 메뉴는 담을 수 없습니다.',
          description: `현재 '${prevCart.storeName}'의 메뉴가 담겨 있습니다.`,
          variant: 'destructive',
        });
        return prevCart;
      }

      // 같은 메뉴 중복 방지
      if (prevCart.items.some(cartItem => cartItem.menuId === item.menuId)) {
        toast({ title: '이미 장바구니에 담긴 메뉴입니다.' });
        return prevCart;
      }

      toast({ title: `'${item.name}' 메뉴를 담았습니다.` });
      const newItems = [...prevCart.items, item];
      return { ...prevCart, items: newItems };
    });
  }, [toast]);

  const removeMenu = useCallback((menuId: string) => {
    setCart(prevCart => {
      if (!prevCart) return null;
      const newItems = prevCart.items.filter(item => item.menuId !== menuId);
      if (newItems.length === 0) return null;
      return { ...prevCart, items: newItems };
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart(null);
  }, []);

  // ✅ 핵심: 여러 이벤트를 한 번에 처리 (이벤트별로 RPC 1회)
  const createCoupon = useCallback(async () => {
    if (!cart || cart.items.length === 0) {
      toast({ title: '메뉴를 먼저 담아주세요.' });
      return;
    }
    if (!user) {
      toast({ title: '로그인이 필요합니다.' });
      return;
    }

    // 1) eventId별로 그룹핑
    const groups = groupByEventId(cart.items);
    const eventIds = Object.keys(groups);
    if (eventIds.length === 0) {
      toast({ title: '이벤트 정보가 없어 쿠폰을 생성할 수 없습니다.', variant: 'destructive' });
      return;
    }

    // 2) 각 이벤트 그룹에 대해 DTO 작성 → 2차 검증 → RPC 호출
    let successCnt = 0;
    let failCnt = 0;

    for (const eventId of eventIds) {
      const items = groups[eventId];

      // (안전) discountId 누락 아이템 방지
      const invalid = items.find(it => !it.discountId);
      if (invalid) {
        toast({
          title: '쿠폰 생성 불가',
          description: '할인 적용 메뉴만 쿠폰으로 만들 수 있어요.',
          variant: 'destructive',
        });
        failCnt++;
        continue;
      }

      // 2-1) Meta 일관 계산(0..1 rate 가정) + Core 채우기
      const txItems = items.map(it => {
        const rate = Number(it.discountRate ?? 0);                 
        const final = Math.floor(it.price * (1 - rate));           // final_price 계산
        return {
          type: 'discount' as const,
          ref_id: it.discountId!,                                  // Core
          menu_id: it.menuId,
          qty: 1,
          // Meta (서버는 신뢰하지 않지만 UX/선검증용으로 전송)
          menu_name: it.name,
          original_price: it.price,
          discount_rate: rate,
          final_price: final,
        };
      });

      // 2-2) DTO 작성: RPC는 event_id만 필요 (store_id 불필요)
      const draft: Omit<CreateCouponTxDTO, 'items'> & { items: typeof txItems } = {
        user_id: user.id,
        // ✅ RPC가 파싱하는 키와 일치시킴
        event_id: eventId,
        items: txItems,
        // (선택) 체크섬을 쓰고 싶다면 schemas에 필드가 정의되어 있어야 합니다.
        // items_count: txItems.reduce((a, i) => a + i.qty, 0),
        // items_total: txItems.reduce((a, i) => a + i.final_price * i.qty, 0),
      } as any;

      // 2-3) 2차 검증(safeParse)
      const parsed = CreateCouponTxSchema.safeParse(draft);
      if (!parsed.success) {
        const msg = parsed.error.errors.at(0)?.message ?? '유효성 검사 실패';
        toast({ title: '쿠폰 생성 실패', description: msg, variant: 'destructive' });
        failCnt++;
        continue;
      }

      // 2-4) RPC 호출(이벤트별 1회)
      try {
        await createCouponAsync(parsed.data);
        successCnt++;
      } catch (err: any) {
        failCnt++;
        toast({
          title: '쿠폰 생성 실패',
          description: err?.message ?? '서버 요청에 실패했습니다.',
          variant: 'destructive',
        });
      }
    }

    // 3) 결과 요약
    if (successCnt > 0 && failCnt === 0) {
      toast({ title: '성공', description: `${successCnt}개 이벤트의 쿠폰이 생성되었습니다.` });
      clearCart();
    } else if (successCnt > 0 && failCnt > 0) {
      toast({
        title: '일부 성공',
        description: `${successCnt}개 성공 / ${failCnt}개 실패`,
      });
      // 일부 남은 아이템만 유지하고 싶다면, 실패 그룹만 남기도록 후처리 가능
      // 여기서는 단순히 성공한 이벤트의 아이템을 제거
      setCart(prev => {
        if (!prev) return prev;
        const keepItems = prev.items.filter(it => !eventIds.slice(0, successCnt).includes(it.eventId));
        return keepItems.length ? { ...prev, items: keepItems } : null;
      });
    } else {
      // 모두 실패
      // 카트는 그대로 두고 사용자에게 수정 유도
    }
  }, [cart, user, toast, clearCart, createCouponAsync]);

  const value = { cart, addMenu, removeMenu, clearCart, createCoupon, isCreating };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// --- Custom Hook ---
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
