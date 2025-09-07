// app/store/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Clock, Gift, Percent, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { KV } from "../../coupon-box/page";

import { useGetStoreDetail } from "@/hooks/usecases/stores.usecase";
import { useCouponsByUserId } from "@/hooks/usecases/coupons.usecase";
import type { StoreDetailVM, MenuWithDiscountVM, GiftVM } from "@/lib/vm/store.vm";

// 전역 장바구니 Context 훅
import { useCouponCart } from "@/contexts/cart-context";

import { formatTimeLeft } from "@/lib/vm/utils/utils";
import { useAppContext } from "@/contexts/app-context";
import { GoToStoreButton } from "@/components/naver-link";

export default function StorePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: vm, isLoading, error } = useGetStoreDetail(id, { onlyActive: true });

  const { appState } = useAppContext();
  const { user } = appState;
  const userId = user?.profile?.userId;
  const WEEKDAYS: Record<string, string> = {
    MON: "월",
    TUE: "화",
    WED: "수",
    THU: "목",
    FRI: "금",
    SAT: "토",
    SUN: "일",
  };
  // 장바구니 훅

  const { state: cart, setHeader, addItem, updateItem, removeItem, clear } = useCouponCart();
  const [openCart, setOpenCart] = useState(false);

  // 이미 사용 가능한 쿠폰이 있는 경우
  // 지금은 가지고 있는 쿠폰을 다 가지고 왔지만 나중에는 store_id,user_id로 한번에 필터링해서 가져오는
  // 방식도 생각해보자!
  const { data: coupons, isLoading: isCouponsLoading } = useCouponsByUserId(
    userId,
    { enabled: !!user }
  );
  const hasUsableCoupon = (coupons ?? []).some(c => {
    return c.storeId === id && c.status === 'issued' && !c.isExpired;
  });

  // 1) 스토어/이벤트 공통 헤더는 로그인 여부와 무관하게 먼저 세팅
  useEffect(() => {
    if (!vm) return;
    setHeader({
      store_id: vm.id,
      event_id: vm.event?.id,
      event_title: vm.event?.title ?? "",
      happy_hour_start_time: (vm.event?.happyHourStartTime ?? "00:00:00").slice(0, 5), // HH:MM
      happy_hour_end_time: (vm.event?.happyHourEndTime ?? "00:00:00").slice(0, 5), // HH:MM
      weekdays: vm.event?.weekdays?.length ? vm.event.weekdays : ["MON"],
    });
  }, [vm?.id]);

  // 2) 사용자 정보는 준비되면 별도로 세팅
  useEffect(() => {
    if (!user?.isAuthenticated || !user?.profile) return;
    setHeader({ user_id: user.profile.userId });
  }, [user?.isAuthenticated, user?.profile?.userId]);

  // 유틸: 현재 장바구니에서 특정 메뉴의 수량 찾기 (할인 아이템)
  const getMenuQty = (menuId: string) => {
    const idx = cart.items.findIndex((it: any) => it.type === "discount" && it.menu_id === menuId);
    return idx >= 0 ? Number(cart.items[idx].qty) || 0 : 0;
  };

  const setMenuQty = (menu: MenuWithDiscountVM, qty: number) => {
    if (!vm) return; // TS: vm may be null during early render
    const idx = cart.items.findIndex((it: any) => it.type === "discount" && it.menu_id === menu.menuId);
    if (qty <= 0) {
      if (idx >= 0) removeItem(idx);
      return;
    }
    const payload = {
      type: "discount" as const,
      qty,
      ref_id: menu.discountId ?? null,
      menu_id: menu.menuId,
      menu_name: menu.name,
      original_price: menu.price,
      discount_rate: menu.discountRate ?? undefined,
      final_price: menu.finalPrice ?? undefined,
    };
    if (idx >= 0) {
      updateItem(idx, payload);
    } else {
      try {
        if (!vm) throw new Error('STORE_NOT_SELECTED');
        // store_id가 혹시라도 비어있다면 즉시 보강
        if (!cart.store_id) {
          setHeader({
            store_id: vm.id,
            event_id: vm.event?.id,
            event_title: vm.event?.title ?? "",
            happy_hour_start_time: (vm.event?.happyHourStartTime ?? "00:00:00").slice(0, 5),
            happy_hour_end_time: (vm.event?.happyHourEndTime ?? "00:00:00").slice(0, 5),
            weekdays: vm.event?.weekdays?.length ? vm.event.weekdays : ["MON"],
          });
        }
        addItem(payload as any);
      } catch (e: any) {
        const code = e?.message ?? String(e);
        if (code === 'DIFFERENT_STORE_ITEMS') {
          alert('다른 가게 상품이 장바구니에 있습니다. 비우고 다시 시도해주세요.');
        } else if (code === 'STORE_NOT_SELECTED') {
          alert('가게 정보가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
        }
        return;
      }
    }
  };

  // gift: 체크 여부 + 토글
  const isGiftChecked = (gift: GiftVM) => {
    const idx = cart.items.findIndex((it: any) => it.type === "gift" && it.ref_id === gift.giftOptionId);
    return idx >= 0;
  };

  const toggleGift = (gift: GiftVM, checked: boolean) => {
    if (!vm) return; // TS: vm may be null during early render
    const idx = cart.items.findIndex((it: any) => it.type === "gift" && it.ref_id === gift.giftOptionId);
    if (checked) {
      if (idx >= 0) return;
      try {
        if (!vm) throw new Error('STORE_NOT_SELECTED');
        if (!cart.store_id) {
          setHeader({
            store_id: vm.id,
            event_id: vm.event?.id,
            event_title: vm.event?.title ?? "",
            happy_hour_start_time: (vm.event?.happyHourStartTime ?? "00:00:00").slice(0, 5),
            happy_hour_end_time: (vm.event?.happyHourEndTime ?? "00:00:00").slice(0, 5),
            weekdays: vm.event?.weekdays?.length ? vm.event.weekdays : ["MON"],
          });
        }
        addItem({
          type: "gift",
          qty: 1, // 고정 1개
          // 메타
          ref_id: gift.giftOptionId,
          menu_id: gift.menuId,
          menu_name: gift.name,
        } as any);
      } catch (e: any) {
        const code = e?.message ?? String(e);
        if (code === 'DIFFERENT_STORE_ITEMS') {
          alert('다른 가게 상품이 장바구니에 있습니다. 비우고 다시 시도해주세요.');
        } else if (code === 'STORE_NOT_SELECTED') {
          alert('가게 정보가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
        }
        return;
      }
    } else {
      if (idx >= 0) removeItem(idx);
    }
  };

  // ===== 하단 푸터 요약 계산 =====
  const { totalItems, totalOriginal, totalPayable, totalDiscount, hasGift } = useMemo(() => {
    // vm이 아직 없으면 계산하지 않음
    if (!vm || !vm.menus) {
      return {
        totalItems: 0,
        totalOriginal: 0,
        totalPayable: 0,
        totalDiscount: 0,
        hasGift: false,
      };
    }

    // gifts: 금액 0, 수량 1
    let items = 0;
    let original = 0;
    let payable = 0;
    let giftValue = 0;
    let hasGiftItem = false;

    for (const it of cart.items as any[]) {
      if (it.type === "gift") {
        items += 1;
        hasGiftItem = true;
        const giftMenu = vm.menus.find((m) => m.menuId === it.menu_id);
        if (giftMenu) {
          giftValue += giftMenu.price;
        }
        continue;
      }
      // discount item
      const qty = Number(it.qty) || 0;
      const orig = Number(it.original_price ?? 0);
      const fin = Number((it.final_price ?? it.original_price) ?? 0);
      items += qty;
      original += orig * qty;
      payable += fin * qty;
    }

    const priceDiscount = original > payable ? original - payable : 0;
    const totalDiscount = priceDiscount + giftValue;

    return {
      totalItems: items,
      totalOriginal: original,
      totalPayable: payable,
      totalDiscount,
      hasGift: hasGiftItem,
    };
  }, [cart.items, vm?.menus]);

  const handleSubmit = () => {
    if (hasUsableCoupon) {
      alert('이미 사용 가능한 교환권이 있어요. 보관함에서 사용해주세요.');
      return;
    }
    router.push('/coupon-register');
  };

  // 장바구니 라인아이템 요약 (메뉴명, 수량, 합계)
  const cartLines = useMemo(() => {
    return (cart.items as any[]).map((it) => {
      const qty = Number(it.qty ?? (it.type === "gift" ? 1 : 0));
      const originalPrice = Number(it.original_price ?? 0);
      const finalPrice = Number(it.final_price ?? originalPrice);

      const isGift = it.type === "gift";
      const showDiscount = !isGift && finalPrice < originalPrice;

      return {
        key: `${it.type}:${it.menu_id}:${it.ref_id ?? ''}`,
        name: it.menu_name ?? (isGift ? "증정 상품" : "메뉴"),
        qty,
        isGift,
        showDiscount,
        originalTotal: isGift ? 0 : originalPrice * qty,
        finalTotal: isGift ? 0 : finalPrice * qty,
      };
    });
  }, [cart.items]);

  const categoryGroupedMenus = useMemo(() => {
    if (!vm) return null;

    const officialCategories = vm.menuCategory ?? [];
    const menuCategories = vm.menus.map(m => m.category ?? '기타');
    const allCategoryNames = Array.from(new Set([...officialCategories, ...menuCategories]));

    return allCategoryNames.map(category => {
      const itemsInCategory = vm.menus.filter(m => (m.category ?? '기타') === category);
      return (
        <div key={category}>
          <h4 className="text-lg font-semibold text-gray-700 mb-4">{category}</h4>
          {itemsInCategory.length > 0 ? (
            <div className="space-y-4">
              {itemsInCategory.map((m: MenuWithDiscountVM) => {
                const showDiscount =
                  typeof m.finalPrice === "number" &&
                  Number.isFinite(m.finalPrice) &&
                  m.finalPrice! < m.price;

                const qty = getMenuQty(m.menuId);
                const handleAddOne = () => setMenuQty(m, qty + 1);
                const handleSubOne = () => setMenuQty(m, qty - 1 <= 0 ? 0 : qty - 1);

                return (
                  <Card key={m.menuId} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {m.thumbnail ? (
                          <img src={m.thumbnail} alt="" className="w-20 h-20 object-cover rounded-lg shrink-0" />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-3">
                              <h4 className="font-bold text-gray-800 text-lg mb-2">{m.name}</h4>
                              {m.description && <p className="text-gray-600 mb-3">{m.description}</p>}
                              <div className="flex items-center gap-3">
                                {showDiscount ? (
                                  <>
                                    <span className="text-gray-400 line-through font-medium">
                                      {m.price.toLocaleString()}원
                                    </span>
                                    <span className="text-xl font-bold text-blue-600">
                                      {m.finalPrice!.toLocaleString()}원
                                    </span>
                                    {typeof m.discountRate === "number" && (
                                      <Badge className="bg-blue-600 text-white font-medium">
                                        {m.discountRate}% 할인
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xl font-bold text-gray-900">
                                    {m.price.toLocaleString()}원
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {qty <= 0 ? (
                                <Button size="sm" onClick={() => setMenuQty(m, 1)} className="bg-gray-900 hover:bg-gray-800 text-white">
                                  담기
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="icon" onClick={handleSubOne}>
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className="w-6 text-center font-semibold">{qty}</span>
                                  <Button variant="outline" size="icon" onClick={handleAddOne}>
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 pl-2">이 카테고리에 등록된 메뉴가 없습니다.</p>
          )}
        </div>
      );
    });
  }, [vm, getMenuQty, setMenuQty]);

  // 로딩/에러 화면
  if (isLoading || !vm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">불러오는 중…</h1>
          <p className="text-gray-600">가게 정보를 준비하고 있어요</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">가게를 찾을 수 없습니다</h1>
          <Link href="/home">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasPartnership = !!vm.partershipText;

  return (
    <div className="min-h-screen bg-white max-w-xl mx-auto relative">
      {/* 헤더 */}
      <header className="bg-white sticky top-0 z-20 border-b border-gray-200 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/home">
                <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-800">가게 정보</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 상단 이미지 & 기본 정보 */}
      <div className="relative">
        <div className="h-64 bg-gray-200 relative overflow-hidden">
          <img
            src={vm.thumbnail || "/placeholder.svg"}
            alt={vm.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      </div>

      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h1 className="text-2xl font-bold text-gray-800">{vm.name}</h1>
              {hasPartnership && (
                <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">
                  제휴
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{vm.address}</span>
              </div>
              <Badge variant="outline" className="border-gray-300 text-gray-600">{vm.category}</Badge>
            </div>
          </div>
          <GoToStoreButton naverLink={vm.naver_link} />
        </div>
      </div>

      {/* 이벤트 요약 */}
      {vm.event && (
      <div
        className="rounded-xl border border-gray-200 bg-gray-50/70 p-3
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
      >
        <div className="mb-1.5 text-sm font-medium text-gray-500">
          {vm.event.title || "이벤트 조건"}
        </div>

        <div className="space-y-2 text-sm">
          {/* 기간: 한 줄 */}
          <KV
            label="기간"
            value={
              vm.event.startDate && vm.event.endDate
                ? `${vm.event.startDate} ~ ${vm.event.endDate}`
                : "—"
            }
          />

          {/* 시간 + 요일: 같은 줄 */}
          <div className="flex flex-wrap gap-4">
            <KV
              label="시간"
              value={
                vm.event.happyHourStartTime && vm.event.happyHourEndTime
                  ? `${vm.event.happyHourStartTime.slice(0, 5)} ~ ${vm.event.happyHourEndTime.slice(0, 5)}`
                  : "—"
              }
            />
            <KV
              label="요일"
              value={(vm.event.weekdays ?? [])
                .map((d: string) => WEEKDAYS[d] ?? d)
                .join(", ") || "—"}
            />
          </div>

          {/* 설명: 한 줄 */}
          {vm.event.description && (
            <KV label="설명" value={vm.event.description} />
          )}
        </div>
      </div>
    )}

      {/* === Gift 섹션: 상단 배치 + 토글 체크박스 (수량 1 고정) === */}
      {(vm.gifts?.length ?? 0) > 0 && (
        <div className="px-4 py-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">증정</h3>
          <div className="space-y-3">
            {vm.gifts.map((g) => {
              const checked = isGiftChecked(g);
              return (
                <div
                  key={g.giftOptionId}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={checked} onCheckedChange={(c) => toggleGift(g, Boolean(c))} />
                    <Gift className="w-5 h-5 text-green-700" />
                    <div>
                      <div className="font-medium text-gray-900">{g.name}</div>
                      {g.description && <div className="text-sm text-gray-600">{g.description}</div>}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {g.remaining != null ? `잔여 ${g.remaining}` : "재고 정보 없음"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 메뉴 리스트: 카테고리별 그룹 */}
      <div className="px-4 py-6 pb-40"> {/* 푸터와 여백 확보 */}
        <h3 className="text-xl font-bold text-gray-800 mb-6">메뉴</h3>
        <div className="space-y-8">
          {categoryGroupedMenus}
        </div>
      </div>

      {/* 플로팅 장바구니 버튼 */}
      {totalItems > 0 && (
        <Button
          aria-label="장바구니 열기"
          className="fixed h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white z-40"
          style={{
            bottom: '1rem',
            // align button with the right edge of the centered max-w-xl container
            // max-w-xl = 36rem; keep 1rem inset from container edge, min 1rem from viewport edge
            right: 'max(1rem, calc((100vw - 36rem) / 2 + 1rem))',
          }}
          onClick={() => setOpenCart((v) => !v)}
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          </div>
        </Button>
      )}

      {/* 장바구니 드로어 (bottom sheet) */}
      <Sheet open={openCart} onOpenChange={setOpenCart}>
        <SheetContent side="bottom" className="max-w-xl mx-auto">
          <SheetHeader>
            <SheetTitle>장바구니</SheetTitle>
            <SheetDescription>
              메뉴를 확인해주세요
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-64 overflow-auto">
              {cartLines.length === 0 ? (
                <div className="text-center text-gray-500 py-6">장바구니가 비어 있습니다.</div>
              ) : (
                cartLines.map((line) => (
                  <div key={line.key} className="flex items-center justify-between py-1 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {line.isGift && <Gift className="w-4 h-4 text-green-700 shrink-0" />}
                      <span className="truncate text-gray-800">{line.name}</span>
                      <span className="text-gray-600">x{line.qty}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2 font-semibold text-gray-900">
                        {line.showDiscount && (
                          <span className="text-gray-400 line-through">
                            {line.originalTotal.toLocaleString()}원
                          </span>
                        )}
                        <span>{line.finalTotal.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-end justify-between">
              <div className="text-sm text-gray-600">
                {(totalDiscount > 0 || hasGift) ? (
                  <span className="text-blue-600 font-medium">
                    {totalDiscount.toLocaleString()}원 할인/증정 적용됨
                  </span>
                ) : (
                  <span>할인 없음</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold text-gray-900">
                  {totalPayable.toLocaleString()}원
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="mt-4 gap-2 sm:gap-2">
            <Button variant="outline" onClick={clear} className="gap-1">
              <Trash2 className="w-4 h-4" /> 장바구니 비우기
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit}>
              🎟️ 교환권 발급받기
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
