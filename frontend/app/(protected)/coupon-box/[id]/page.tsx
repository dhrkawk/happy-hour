"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Store, Calendar, CheckCircle, XCircle, Loader2, Info, QrCode, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCouponWithItems, useActivateCoupon, useCancelCoupon } from "@/hooks/usecases/coupons.usecase";
import { CouponVM, CouponItemVM } from "@/lib/vm/coupon.vm";
import { TicketChip } from "../page";
import { useCouponCart } from "@/contexts/cart-context";
import { useAppContext } from "@/contexts/app-context";

// 5분 타이머 및 활성화 상태를 보여주는 배너 컴포넌트
function ActivationTimerBanner({ vm, onTimeEnd }: { vm: CouponVM, onTimeEnd: () => void }) {
  const [timeLeft, setTimeLeft] = useState("05:00");

  useEffect(() => {
    if (!vm.activatedAt) return;

    const activatedTime = new Date(vm.activatedAt).getTime();
    const expiryTime = activatedTime + 5 * 60 * 1000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiryTime - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft("00:00");
        onTimeEnd(); // 시간이 다 되면 부모 컴포넌트에 알림
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 정리
  }, [vm.activatedAt, onTimeEnd]);

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6 text-center">
      <p className="text-sm text-blue-700 mb-2">아래 쿠폰 번호를 점원에게 보여주세요.</p>
      <div className="bg-white text-blue-600 font-mono text-2xl tracking-widest p-3 rounded-lg mb-4 inline-block">
        {vm.id}
      </div>
      <div className="text-blue-800">
        <p className="text-sm">남은 시간</p>
        <p className="text-3xl font-bold">{timeLeft}</p>
      </div>
    </div>
  );
}

function CouponStatusHeader({ vm }: { vm: CouponVM }) {
  if (vm.isExpired) {
    return (
      <div className="bg-gray-100 text-gray-600 p-4 text-center rounded-lg">
        <p className="font-semibold">만료된 쿠폰입니다.</p>
      </div>
    );
  }

  switch (vm.status) {
    case 'redeemed':
      return (
        <div className="bg-green-50 text-green-800 p-4 text-center rounded-lg">
          <p className="font-semibold">사용 완료된 쿠폰입니다.</p>
        </div>
      );
    case 'cancelled':
      return (
        <div className="bg-red-50 text-red-700 p-4 text-center rounded-lg">
          <p className="font-semibold">취소된 쿠폰입니다.</p>
        </div>
      );
    default:
      return null;
  }
}

export default function CouponDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { appState } = useAppContext();
  const { user } = appState;
  const {clear} = useCouponCart();
  useEffect(() => {
    clear();
  }, []);

  const { data: vm, isLoading, error, refetch } = useCouponWithItems(id, { enabled: !!id });

  const { mutate: activateCoupon, isPending: isActivating } = useActivateCoupon(user?.profile?.userId);
  const { mutate: cancelCoupon, isPending: isCanceling } = useCancelCoupon(user?.profile?.userId);
  const WEEKDAYS: Record<string, string> = {
    MON: "월",
    TUE: "화",
    WED: "수",
    THU: "목",
    FRI: "금",
    SAT: "토",
    SUN: "일",
  };

  const handleGoStore = (e: React.MouseEvent, vm: CouponVM) => {
    e.preventDefault();
    e.stopPropagation(); // 카드(쿠폰 상세)로의 네비게이션 방지
    const storeId = vm.storeId;
    const href = `/store/${storeId}`;
    router.push(href);
  };
  const [confirmActivateOpen, setConfirmActivateOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const handleActivate = () => {
    if (confirm("쿠폰 사용을 시작하시겠습니까? 5분 내로 사용해야 합니다.")) {
      activateCoupon(id, { onSuccess: () => {
        console.log("[DEBUG] handleActivate: Mutation successful, calling refetch()");
        refetch();
      } });
    }
  };

  const handleCancel = () => {
    if (confirm("정말로 이 쿠폰을 취소하시겠습니까?")) {
      cancelCoupon(id, { onSuccess: () => refetch() });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-3 text-blue-700">쿠폰 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !vm) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-bold text-red-600 mb-2">쿠폰을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">요청하신 쿠폰 정보를 가져오는 데 실패했습니다.</p>
          <Link href="/coupon-box">
            <Button>내 쿠폰함으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canActivate = vm.status === 'issued' && !vm.isExpired;
  const canCancel = vm.status === 'issued' && !vm.isExpired;

  return (
    <div className="min-h-screen bg-gray-50 max-w-xl mx-auto">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/coupon-box">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-800 truncate">쿠폰 상세</h1>
          </div>
          <Link href="/coupon-box">
            <Button variant="outline" size="sm">내 쿠폰함</Button>
          </Link>
        </div>
      </header>

      <main className="px-4 py-5 pb-24">
        {vm.status === 'activating' && <ActivationTimerBanner vm={vm} onTimeEnd={() => refetch()} />}
        <Card>
          <CardHeader>
            <CouponStatusHeader vm={vm} />
            <div className="flex items-center gap-2 text-sm text-gray-600 pt-2">
              <TicketChip />
              <CardTitle className="text-lg text-black">
                {vm.storeName}
              </CardTitle>
              <Button
                size="sm"
                variant="secondary"
                className="ml-1 h-6 px-2 text-[12px]"
                onClick={(e) => handleGoStore(e, vm)}
              >
                가게 보기
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 pt-2">
              <Info className="w-4 h-4" />
              <span>{vm.eventTitle || '가게 정보 없음'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>사용 가능 시각: {vm.happyHourStartTime.slice(0,5)} ~ {vm.happyHourEndTime.slice(0,5)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>사용 가능 요일: {(vm.weekdays || []).map((d) => WEEKDAYS[d] ?? d).join(" ")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{vm.expiresAtText ? `만료일: ${vm.expiresAtText}` : "만료 정보 없음"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{vm.eventDescription ? `설명: ${vm.eventDescription}` : "정보 없음"}</span>
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold text-md text-gray-800 mb-3 border-t pt-4">쿠폰 내역</h4>
            <div className="space-y-3">
              {vm.items.map((item: CouponItemVM, index) => {
                const showDiscount = !item.isGift && typeof item.originalPrice === 'number' && typeof item.finalPrice === 'number' && item.originalPrice > item.finalPrice;
                const itemQty = item.qty ?? 1;
                const finalPrice = (item.finalPrice ?? item.originalPrice ?? 0) * itemQty;
                const originalPrice = (item.originalPrice ?? 0) * itemQty;

                return (
                  <div key={item.id || index} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium text-gray-700">{item.name || '이름 없는 메뉴'}</span>
                      <span className="text-gray-500 ml-2">x{itemQty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.discountBadge && <Badge variant="secondary">{item.discountBadge}</Badge>}
                      <div className="flex items-center gap-2 font-semibold">
                        {showDiscount && (
                          <span className="text-gray-400 line-through">
                            {originalPrice.toLocaleString()}원
                          </span>
                        )}
                        <span className="text-gray-900">
                          {item.isGift ? '무료' : `${finalPrice.toLocaleString()}원`}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between items-center font-bold text-lg border-t mt-4 pt-4">
              <span>총 합계</span>
              <div className="flex items-center gap-3">
                {(vm.totalOriginalPrice ?? 0) > (vm.totalPrice ?? 0) && (
                  <span className="text-gray-400 font-normal line-through">
                    {vm.totalOriginalPrice?.toLocaleString()}원
                  </span>
                )}
                <span className="text-blue-600">{vm.totalPrice?.toLocaleString() ?? 0}원</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-4">
            {canActivate && (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setConfirmActivateOpen(true)}
                disabled={isActivating}
              >
                {isActivating ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4 mr-2" />} 
                {isActivating ? '활성화 중...' : '쿠폰 사용하기'}
              </Button>
            )}
            {canCancel && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setConfirmCancelOpen(true)}
                disabled={isCanceling}
              >
                {isCanceling ? <Loader2 className="w-4 h-4 animate-spin"/> : <XCircle className="w-4 h-4 mr-2" />} 
                {isCanceling ? '취소 처리 중...' : '쿠폰 취소하기'}
              </Button>
            )}
          </CardFooter>
        </Card>
        <Card className="border-blue-200 bg-blue-50 mt-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-700 mb-2">💡 쿠폰 사용 안내</h3>
              <ul className="space-y-1 text-sm text-blue-600">
                <li>• 가게 방문 시 쿠폰 번호를 직원에게 제시하세요</li>
                <li>• 쿠폰별로 사용 가능한 시간대와 요일이 다를 수 있습니다</li>
                <li>• 쿠폰은 1회만 사용 가능하며, 사용 후 복구할 수 없습니다</li>
                <li>• 만료된 쿠폰은 사용할 수 없습니다</li>
              </ul>
            </CardContent>
          </Card>
      </main>
      <ConfirmDialog
        open={confirmActivateOpen}
        onOpenChange={setConfirmActivateOpen}
        title="쿠폰 사용"
        message="쿠폰 사용을 시작하시겠습니까? 5분 이내 사용해야 합니다."
        confirmText="사용 시작"
        cancelText="돌아가기"
        onConfirm={() => {
          setConfirmActivateOpen(false);
          activateCoupon(id, { onSuccess: () => refetch() });
        }}
        onCancel={() => setConfirmActivateOpen(false)}
      />
      <ConfirmDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="쿠폰 취소"
        message="정말로 이 쿠폰을 취소하시겠습니까?"
        confirmText="취소하기"
        cancelText="돌아가기"
        onConfirm={() => {
          setConfirmCancelOpen(false);
          cancelCoupon(id, { onSuccess: () => refetch() });
        }}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </div>
  );
}
