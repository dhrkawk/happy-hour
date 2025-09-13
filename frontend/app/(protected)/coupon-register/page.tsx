// app/cart/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Gift,
  Percent,
  Users,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreateCouponWithItems } from "@/hooks/usecases/coupons.usecase";
import { KV } from "../coupon-box/page";

// 전역 장바구니(Context)
import { useCouponCart } from "@/contexts/cart-context";
import AlertDialogBasic from "@/components/alert-dialog-basic";

// 이벤트 타입 아이콘
function getEventIcon(type?: "discount" | "gift" | "combo") {
  switch (type) {
    case "gift":
      return <Gift className="w-5 h-5" />;
    case "combo":
      return <Users className="w-5 h-5" />;
    default:
      return <Percent className="w-5 h-5" />;
  }
}

export default function CouponRegisterPage() {
  const router = useRouter();
  const { state: cart, toDTO, clear } = useCouponCart();
  const weekdayLabels: Record<string, string> = {
    MON: "월",
    TUE: "화",
    WED: "수",
    THU: "목",
    FRI: "금",
    SAT: "토",
    SUN: "일",
  };

  const WEEKDAYS: Record<string, string> = {
    MON: "월",
    TUE: "화",
    WED: "수",
    THU: "목",
    FRI: "금",
    SAT: "토",
    SUN: "일",
  };

  // 빈 카트 처리
  const isEmpty = (cart.items?.length ?? 0) === 0;

  // 주문/합계 계산 (gift는 금액 0)
  const { menuItems, totalPrice, originalPrice, totalDiscount } = useMemo(() => {
    let total = 0;
    let original = 0;

    const items =
      (cart.items ?? []).map((it: any, idx: number) => {
        if (it.type === "gift") {
          // gift는 수량 1, 금액 0
          return {
            id: `gift-${it.gitf_option_id ?? idx}`,
            name: it.menu_name ?? "증정",
            description: "증정 혜택",
            originalPrice: 0,
            finalPrice: 0,
            quantity: 1,
            isGift: true,
          };
        }
        const qty = Number(it.qty) || 0;
        const orig = Number(it.original_price ?? 0);
        const fin = Number((it.final_price ?? it.original_price) ?? 0);

        original += orig * qty;
        total += fin * qty;

        return {
          id: it.menu_id ?? idx,
          name: it.menu_name ?? "메뉴",
          description: "",
          originalPrice: orig,
          finalPrice: fin,
          quantity: qty,
          isGift: false,
        };
      }) ?? [];

    const discount = original > total ? original - total : 0;

    return {
      menuItems: items,
      totalPrice: total,
      originalPrice: original,
      totalDiscount: discount,
    };
  }, [cart.items]);

  const createMutate = useCreateCouponWithItems();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 이벤트 메타
  const eventType: "discount" | "gift" | "combo" | undefined = (() => {
    // 간단 추론: 카트에 gift만 있으면 gift, 할인 아이템 있으면 discount
    const hasDiscount = (cart.items ?? []).some((it: any) => it.type === "discount");
    const hasGift = (cart.items ?? []).some((it: any) => it.type === "gift");
    if (hasDiscount && hasGift) return "combo";
    if (hasGift) return "gift";
    if (hasDiscount) return "discount";
    return undefined;
  })();

  // 발급 페이지가 읽을 localStorage 포맷으로 싱크 후 이동
  const handleGoIssue = async () => {
    try {
      setSubmitError(null);
      const dto = toDTO();
      const res = await createMutate.mutateAsync(dto); // { couponId }
      const couponId = (res as any)?.couponId;
      // 상세로 이동(권장) 또는 보관함으로 이동
      if (couponId) router.push(`/coupon-box/${couponId}`);
      else router.push(`/coupons`);
    } catch (e: any) {
      setSubmitError(e?.message ?? "교환권 발급에 실패했습니다.");
      if(e?.message.includes("STOCK")) {
        alert("선택하신 메뉴의 재고가 부족합니다.");
        const storeId = cart.store_id;
        clear();
        router.push(`/store/${storeId}`);
      }
    }
  };

  // 빈 장바구니 뷰
  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-xl mx-auto relative">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Link href="/home">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold text-gray-800">장바구니</h1>
            </div>
          </div>
        </header>

        <div className="px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">장바구니가 비었습니다</h2>
          <p className="text-gray-600 mb-6">메뉴를 담고 교환권을 발급받아 보세요.</p>
          <Link href="/home">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white">가게 보러가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-xl mx-auto relative">
      {/* 헤더 */}
      <header className="bg-white sticky top-0 z-20 border-b border-gray-200 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/store/${cart.store_id ?? ""}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-800">장바구니</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* 주문 내역 */}
        <Card className="border-gray-200 mb-6">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-lg text-gray-700">주문 내역</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    수량: {item.isGift ? 1 : item.quantity}개
                    {item.isGift && <span className="ml-2 text-green-600">(증정)</span>}
                  </p>
                </div>
                <div className="text-right">
                  {!item.isGift && item.originalPrice !== item.finalPrice && (
                    <div className="text-sm text-gray-400 line-through">
                      {(item.originalPrice * item.quantity).toLocaleString()}원
                    </div>
                  )}
                  <div className="font-semibold text-gray-800">
                    {item.isGift
                      ? "0원"
                      : (item.finalPrice * item.quantity).toLocaleString() + "원"}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-800">총 금액</span>
              <span className="text-xl font-bold text-blue-600">
                {totalPrice.toLocaleString()}원
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 가게/이벤트 정보 */}

        <div
          className="rounded-xl border border-gray-200 bg-white p-3
                            shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] mb-6"
        >
          <div className="mb-1.5 text-m font-medium text-500">
            {cart.event_title}
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm m:grid-cols-3">
            <KV
              label="사용 가능 시간"
              value={
                <>
                  {cart.happy_hour_start_time?.slice(0, 5)} ~{" "}
                  {cart.happy_hour_end_time?.slice(0, 5)}
                </>
              }
            />
            <div className="sm:col-span-1">
              <KV
                label="사용 가능 요일"
                value={(cart.weekdays || [])
                  .map((d) => WEEKDAYS[d] ?? d)
                  .join(" ")}
              />
            </div>
            <KV
              label="쿠폰 유효기간"
              value={
                <>
                  {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 10)}
                </>
              }
            />
             <KV
              label="설명"
              value={(cart.event_description)
              }
            />
          </div>
        </div>

        {/* 적용된 혜택 안내 */}
        {totalDiscount > 0 && (
          <Card className="border-blue-200 bg-blue-50 mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-700 mb-3">할인 안내</h3>
              <p className="text-sm text-blue-700">
                총 {totalDiscount.toLocaleString()}원의 할인이 적용되어&nbsp;
                <span className="font-semibold">
                  {originalPrice.toLocaleString()}원
                </span>
                이&nbsp;
                <span className="font-semibold">
                  {totalPrice.toLocaleString()}원
                </span>
                으로 결제됩니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 주의사항 */}
        <Card className="border-orange-200 bg-orange-50 mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-orange-700 mb-2">주의사항</h3>
            <ul className="space-y-1 text-sm text-orange-600">
              <li>• 교환권 만료일이 지나면 사용할 수 없습니다</li>
              {cart.happy_hour_start_time && cart.happy_hour_end_time && (
                <li>
                  • 지정된 시간({cart.happy_hour_start_time} ~ {cart.happy_hour_end_time}) 외에는 사용할 수 없습니다
                </li>
              )}
              {cart.weekdays?.length ? (
                <li>• 지정된 요일({cart.weekdays.map(day => weekdayLabels[day] ?? day).join(", ")})에만 사용 가능합니다</li>
              ) : null}
              <li>• 교환권은 1회만 사용 가능하며, 사용 후 복구할 수 없습니다</li>
            </ul>
          </CardContent>
        </Card>

        {/* 발급 버튼 */}
        <Button
          onClick={handleGoIssue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
          disabled={createMutate.isPending}
        >
          {createMutate.isPending ? "발급 중..." : "교환권 발급받기"}
        </Button>
      </div>
    </div>
  );
}