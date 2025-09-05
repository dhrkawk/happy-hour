// app/store/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { ArrowLeft, MapPin, Clock, Gift, Percent, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { useGetStoreDetail } from "@/hooks/usecases/stores.usecase";
import type { StoreDetailVM, MenuWithDiscountVM, GiftVM } from "@/lib/vm/store.vm";

// 전역 장바구니 Context 훅
import { useCouponCart } from "@/contexts/cart-context";

import { formatTimeLeft } from "@/lib/vm/utils/utils";
import { useAppContext } from "@/contexts/app-context";

export default function StorePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: vm, isLoading, error } = useGetStoreDetail(id, { onlyActive: true });
  const { appState } = useAppContext()
  const { user } = appState
  // 장바구니 훅
  const { state: cart, setHeader, addItem, updateItem, removeItem, clear } = useCouponCart();


  // 스토어/이벤트 정보가 로드되면 헤더(공통 값) 세팅
  useEffect(() => {
    if (!vm || !user.isAuthenticated || !user.profile) return;
    if (!vm) return;
    setHeader({
      user_id: user.profile?.userId,
      store_id: vm.id,
      event_id: vm.event?.id,
      // 필요 시 user_id는 로그인 세션에서 setHeader로 주입
      event_title: vm.event?.title ?? "",
      happy_hour_start_time: (vm.event?.happyHourStartTime ?? "00:00:00").slice(0, 5), // HH:MM
      happy_hour_end_time: (vm.event?.happyHourEndTime ?? "00:00:00").slice(0, 5), // HH:MM
      weekdays: vm.event?.weekdays?.length ? vm.event.weekdays : ["MON"],
    });
  }, [vm?.id, user]);

  // 유틸: 현재 장바구니에서 특정 메뉴의 수량 찾기 (할인 아이템)
  const getMenuQty = (menuId: string) => {
    const idx = cart.items.findIndex((it: any) => it.type === "discount" && it.menu_id === menuId);
    return idx >= 0 ? Number(cart.items[idx].qty) || 0 : 0;
  };

  const setMenuQty = (menu: MenuWithDiscountVM, qty: number) => {
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
      addItem(payload as any);
    }
  };

  // gift: 체크 여부 + 토글
  const isGiftChecked = (gift: GiftVM) => {
    const idx = cart.items.findIndex((it: any) => it.type === "gift" && it.ref_id === gift.giftOptionId);
    return idx >= 0;
  };

  const toggleGift = (gift: GiftVM, checked: boolean) => {
    const idx = cart.items.findIndex((it: any) => it.type === "gift" && it.ref_id === gift.giftOptionId);
    if (checked) {
      if (idx >= 0) return;
      addItem({
        type: "gift",
        qty: 1, // 고정 1개
        // 메타
        ref_id: gift.giftOptionId,
        menu_id: gift.menuId,
        menu_name: gift.name,
      } as any);
    } else {
      if (idx >= 0) removeItem(idx);
    }
  };

  // ===== 하단 푸터 요약 계산 =====
  const { totalItems, totalOriginal, totalPayable, discountPercent } = useMemo(() => {
    // gifts: 금액 0, 수량 1
    let items = 0;
    let original = 0;
    let payable = 0;

    for (const it of cart.items as any[]) {
      if (it.type === "gift") {
        items += 1;
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

    const percent =
      original > 0 && payable >= 0 && payable < original
        ? Math.round(((original - payable) / original) * 100)
        : 0;

    return {
      totalItems: items,
      totalOriginal: original,
      totalPayable: payable,
      discountPercent: percent,
    };
  }, [cart.items]);

  const handleSubmit = () => {
    router.push("/coupon-register")
  };

  // 장바구니 라인아이템 요약 (메뉴명, 수량, 합계)
  const cartLines = useMemo(() => {
    return (cart.items as any[]).map((it) => {
      const qty = Number(it.qty ?? (it.type === "gift" ? 1 : 0));
      const unit = Number((it.final_price ?? it.original_price ?? 0) as number);
      const total = it.type === "gift" ? 0 : unit * qty;
      return {
        key: `${it.type}:${it.menu_id}:${it.ref_id ?? ''}`,
        name: it.menu_name ?? (it.type === "gift" ? "증정 상품" : "메뉴"),
        qty,
        total,
        isGift: it.type === "gift",
      };
    });
  }, [cart.items]);

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
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{vm.address}</span>
              </div>
              <Badge variant="outline" className="border-gray-300 text-gray-600">{vm.category}</Badge>
            </div>
            <div className="text-sm text-gray-500">
              {typeof vm.distanceText === "string" ? vm.distanceText : "거리 정보 없음"}
            </div>
          </div>
        </div>
      </div>

      {/* 이벤트 요약 */}
      {vm.event && (
        <div className="px-4 pt-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-700" />
                <h4 className="font-bold text-blue-900">{vm.event.title}</h4>
              </div>
              <div className="flex items-center gap-1 text-orange-600 font-medium">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{formatTimeLeft(vm.event.endDate)}</span>
              </div>
            </div>
            {vm.event.description && (
              <p className="text-sm text-blue-900 mt-2">{vm.event.description}</p>
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

      {/* 메뉴 리스트: 이미지 좌측 + 담기/수량 컨트롤 */}
      <div className="px-4 py-6 pb-40"> {/* 푸터와 여백 확보 */}
        <h3 className="text-xl font-bold text-gray-800 mb-6">메뉴</h3>
        <div className="space-y-4">
          {vm.menus.map((m: MenuWithDiscountVM) => {
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
                    {/* 이미지 왼쪽 */}
                    {m.thumbnail ? (
                      <img src={m.thumbnail} alt="" className="w-20 h-20 object-cover rounded-lg shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0" />
                    )}

                    {/* 내용 우측 */}
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

                        {/* 담기 / 수량 컨트롤 */}
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
      </div>

      {/* ===== 하단 고정 푸터: cart가 비어있지 않을 때만 렌더 ===== */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-30">
          <div className="mx-auto max-w-xl px-4 py-3 space-y-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
            {/* 헤더: 카트 아이콘, 선택 개수, 비우기 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-base">
                  <span className="font-semibold">{totalItems}</span>개 선택
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={clear} className="gap-1">
                <Trash2 className="w-4 h-4" /> 장바구니 비우기
              </Button>
            </div>

            {/* 아이템 내역 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-40 overflow-auto">
              {cartLines.map((line) => (
                <div key={line.key} className="flex items-center justify-between py-1 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {line.isGift && <Gift className="w-4 h-4 text-green-700 shrink-0" />}
                    <span className="truncate text-gray-800">{line.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-gray-600">x{line.qty}</span>
                    <span className="font-semibold text-gray-900">{line.total.toLocaleString()}원</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 합계 영역 */}
            <div className="flex items-end justify-between">
              <div className="text-sm text-gray-600">
                {discountPercent > 0 ? (
                  <span className="text-blue-600 font-medium">{discountPercent}% 할인 적용됨</span>
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

            {/* 전송 버튼 */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl text-base font-semibold"
              onClick={handleSubmit}
            >
              🎟️&nbsp; 교환권 발급받기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
