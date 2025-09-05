"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ticket, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/bottom-navigation";
import { useUser } from "@/hooks/use-user";
import { useCouponsByUserId, useCancelCoupon } from "@/hooks/usecases/coupons.usecase";
import type { CouponListItemVM } from "@/lib/vm/coupon.vm";
import { useAppContext } from "@/contexts/app-context";

function CouponStatusBadge({ vm }: { vm: CouponListItemVM }) {
  if (vm.isExpired) {
    return <Badge variant="destructive">만료</Badge>;
  }

  switch (vm.status) {
    case 'redeemed':
      return <Badge className="bg-gray-400 text-white">사용 완료</Badge>;
    case 'cancelled': // 'canceled' -> 'cancelled'로 변경
      return <Badge variant="destructive">취소됨</Badge>; // 빨간색으로 변경
    case 'activating':
      return <Badge className="bg-blue-600 text-white">사용 중</Badge>;
    case 'issued':
      return <Badge className="bg-green-600 text-white">사용 가능</Badge>;
    default:
      return <Badge variant="outline">알 수 없음</Badge>;
  }
}

export default function CouponBoxPage() {

  const { appState } = useAppContext();
  const { user } = appState;
  const { data: coupons, isLoading: areCouponsLoading, error } = useCouponsByUserId(user.profile?.userId, { enabled: !!user });
  
  const { mutate: cancelCoupon, isPending: isCanceling } = useCancelCoupon(user.profile?.userId);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleCancel = (e: React.MouseEvent, couponId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("정말로 이 쿠폰을 취소하시겠습니까?")) {
      setCancelingId(couponId);
      cancelCoupon(couponId, {
        onSettled: () => {
          setCancelingId(null);
        }
      });
    }
  };

  const isLoading = !user || areCouponsLoading;

  const activeCoupons = useMemo(() => coupons?.filter(c => !c.isExpired && (c.statusText === '발급됨' || c.statusText === '사용 중')) ?? [], [coupons]);
  const usedOrExpiredCoupons = useMemo(() => coupons?.filter(c => c.isExpired || (c.statusText !== '발급됨' && c.statusText !== '사용 중')) ?? [], [coupons]);

  const renderCouponList = (list: CouponListItemVM[], title: string) => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-700 mb-3 px-1">{title}</h2>
      <div className="space-y-3">
        {list.map((coupon) => {
          const isCurrentlyCanceling = cancelingId === coupon.id;
          return (
            <Link href={`/coupon-box/${coupon.id}`} key={coupon.id} passHref>
              <Card className={`hover:shadow-md transition-all duration-300 ${isCurrentlyCanceling ? 'opacity-50' : ''}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Ticket className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{coupon.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {coupon.expiresAtText ? `만료일: ${coupon.expiresAtText}` : "만료 정보 없음"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CouponStatusBadge vm={coupon} />
                    {coupon.statusText === '발급됨' && !coupon.isExpired && (
                       <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600 p-2"
                          onClick={(e) => handleCancel(e, coupon.id)}
                          disabled={isCurrentlyCanceling}
                        >
                          {isCurrentlyCanceling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5"/>}
                       </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-3 text-blue-700">쿠폰을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-bold text-red-600 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">쿠폰 정보를 가져오는 데 실패했습니다.</p>
          <Link href="/home">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-xl mx-auto">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <Link href="/home">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">내 쿠폰함</h1>
        </div>
      </header>

      <main className="px-4 py-5 pb-24">
        {coupons && coupons.length > 0 ? (
          <>
            {activeCoupons.length > 0 && renderCouponList(activeCoupons, "사용 가능한 쿠폰")}
            {usedOrExpiredCoupons.length > 0 && renderCouponList(usedOrExpiredCoupons, "사용 완료 / 만료된 쿠폰")}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎟️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">쿠폰이 없습니다</h3>
            <p className="text-gray-600 mb-6">가게에서 할인을 받고 첫 쿠폰을 모아보세요!</p>
            <Link href="/home">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">가게 보러가기</Button>
            </Link>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}