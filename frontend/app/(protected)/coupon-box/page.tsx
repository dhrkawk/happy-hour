"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ticket, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/bottom-navigation";
import { useCouponsByUserId, useCancelCoupon } from "@/hooks/usecases/coupons.usecase";
import type { CouponListItemVM } from "@/lib/vm/coupon.vm";
import { useAppContext } from "@/contexts/app-context";

/* ===========================
   Small Ticket chip (for title line)
=========================== */
export function TicketChip() {
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-xl
                 bg-gradient-to-br from-blue-50 to-blue-100 ring-1 ring-blue-200/60
                 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_3px_8px_-4px_rgba(59,130,246,0.35)]"
      aria-hidden
    >
      <Ticket className="h-3.5 w-3.5 text-blue-600" />
    </span>
  );
}

/** 라벨/값 한 줄 - 높이 균일화 */
export function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[13px] min-h-[28px]">
      <span className="inline-flex h-7 items-center rounded-md bg-white/60 px-1.5 text-gray-600 ring-1 ring-gray-200">
        {label}
      </span>
      <span className="flex min-h-[28px] items-center text-gray-700 leading-none whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}

/* ===========================
   Status Badge
=========================== */
function CouponStatusBadge({ vm }: { vm: CouponListItemVM }) {
  if (vm.isExpired) return <Badge variant="destructive" className="text-[10px] px-1">기간 만료</Badge>;
  switch (vm.status) {
    case "redeemed":
      return <Badge className="bg-gray-500 text-white text-[10px] px-1">사용 완료</Badge>;
    case "cancelled":
      return <Badge className="bg-red-500 text-white text-[10px] px-1">취소됨</Badge>;
    case "activating":
      return <Badge className="bg-blue-600 text-white text-[10px] px-1">사용 중</Badge>;
    case "issued":
      return <Badge className="bg-green-600 text-white text-[10px] px-1 ">사용 가능</Badge>;
    default:
      return <Badge variant="outline">알 수 없음</Badge>;
  }
}

/* ===========================
   Page
=========================== */
export default function CouponBoxPage() {
  const { appState } = useAppContext();
  const { user } = appState;
  const router = useRouter();

  const {
    data: coupons,
    isLoading: areCouponsLoading,
    error,
  } = useCouponsByUserId(user.profile?.userId, { enabled: !!user });

  const { mutate: cancelCoupon } = useCancelCoupon(user.profile?.userId);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const WEEKDAYS: Record<string, string> = {
    MON: "월",
    TUE: "화",
    WED: "수",
    THU: "목",
    FRI: "금",
    SAT: "토",
    SUN: "일",
  };
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCouponId, setPendingCouponId] = useState<string | null>(null);

  const handleCancel = (e: React.MouseEvent, couponId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("정말로 이 쿠폰을 취소하시겠습니까?")) {
      setCancelingId(couponId);
      cancelCoupon(couponId, {
        onSettled: () => setCancelingId(null),
      });
    }
  };

  const handleGoStore = (e: React.MouseEvent, coupon: CouponListItemVM) => {
    e.preventDefault();
    e.stopPropagation(); // 카드(쿠폰 상세)로의 네비게이션 방지
    const storeId = coupon.storeId;
    const href = `/store/${storeId}`;
    router.push(href);
  };

  const isLoading = !user || areCouponsLoading;

  const activeCoupons = useMemo(
    () =>
      coupons?.filter(
        (c) => !c.isExpired && (c.statusText === "발급됨" || c.statusText === "사용 중")
      ) ?? [],
    [coupons]
  );

  const usedOrExpiredCoupons = useMemo(
    () =>
      coupons?.filter(
        (c) => c.isExpired || (c.statusText !== "발급됨" && c.statusText !== "사용 중")
      ) ?? [],
    [coupons]
  );

  const renderCouponList = (list: CouponListItemVM[], title: string) => (
    <section className="mb-8">
      <h2 className="px-1 mb-3 text-base font-semibold text-gray-700">{title}</h2>
      <div className="space-y-3">
        {list.map((coupon) => {
          const isCurrentlyCanceling = cancelingId === coupon.id;

          const weekdaysLabel = (coupon.weekdays || [])
            .map((d) => WEEKDAYS[d] ?? d)
            .join(" ");

          return (
            <Link href={`/coupon-box/${coupon.id}`} key={coupon.id} passHref>
              <Card
                className={`group border-gray-200/80 bg-white/95 backdrop-blur transition-all
                            duration-300 hover:-translate-y-[1px] hover:shadow-md mb-3
                            ${isCurrentlyCanceling ? "opacity-50" : ""}`}
              >
                <CardContent className="p-4">
                  {/* 상단: 스토어명 + 티켓 + 가게 보러가기 + 상태/취소 */}
                  <div className="flex-1">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <TicketChip />
                        <h3 className="truncate text-[15px] font-semibold text-gray-900 tracking-tight">
                          {coupon.storeName}
                        </h3>

                        {/* 가게 보러가기 버튼 (storeName 옆) */}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ml-1 h-6 px-2 text-[12px]"
                          onClick={(e) => handleGoStore(e, coupon)}
                        >
                          가게 보기
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <CouponStatusBadge vm={coupon} />
                      {coupon.statusText === "발급됨" && !coupon.isExpired && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => handleCancel(e, coupon.id)}
                          disabled={isCurrentlyCanceling}
                          aria-label="쿠폰 취소"
                        >
                          {isCurrentlyCanceling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  </div>

                  {/* 가운데: 이벤트 조건 박스 */}
                  <div
                    className="rounded-xl border border-gray-200 bg-gray-50/70 p-3
                               shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                  >
                    <div className="mb-1.5 text-sm font-medium text-black-500">
                      {coupon.eventTitle}
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-rows-3">
                      <KV
                        label="사용 가능 시간"
                        value={
                          <>
                            {coupon.happyHourStartTime?.slice(0, 5)} ~{" "}
                            {coupon.happyHourEndTime?.slice(0, 5)}
                          </>
                        }
                      />
                      <KV label="사용 가능 요일" value={weekdaysLabel || "—"} />
                      <KV
                        label="유효기간"
                        value={coupon.expiresAtText ? coupon.expiresAtText : "만료 정보 없음"}
                      />
                      <KV
                        label="설명"
                        value={coupon.eventDescription ? coupon.eventDescription : "정보 없음"}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-3 text-blue-700">쿠폰을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-center">
        <div>
          <h2 className="mb-2 text-xl font-bold text-red-600">오류 발생</h2>
          <p className="mb-4 text-gray-600">쿠폰 정보를 가져오는 데 실패했습니다.</p>
          <Link href="/home">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-800">내 쿠폰함</h1>
        </div>
      </header>

      <main className="px-4 py-5 pb-24">
        {coupons && coupons.length > 0 ? (
          <>
            {activeCoupons.length > 0 &&
              renderCouponList(activeCoupons, "사용 가능한 쿠폰")}
            {usedOrExpiredCoupons.length > 0 &&
              renderCouponList(usedOrExpiredCoupons, "사용 완료 / 만료된 쿠폰")}
          </>
        ) : (
          <div className="py-20 text-center">
            <div className="mb-4 text-5xl">🎟️</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-800">쿠폰이 없습니다</h3>
            <p className="mb-6 text-gray-600">가게에서 할인을 받고 첫 쿠폰을 모아보세요!</p>
            <Link href="/home">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">가게 보러가기</Button>
            </Link>
          </div>
        )}
      </main>

      <BottomNavigation />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="쿠폰 취소"
        message="정말로 이 쿠폰을 취소하시겠습니까?"
        confirmText="취소하기"
        cancelText="돌아가기"
        onCancel={() => setPendingCouponId(null)}
        onConfirm={() => {
          if (!pendingCouponId) return;
          setConfirmOpen(false);
          setCancelingId(pendingCouponId);
          cancelCoupon(pendingCouponId, {
            onSettled: () => {
              setCancelingId(null);
              setPendingCouponId(null);
            }
          });
        }}
      />
    </div>
  );
}
