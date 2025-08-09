"use client"

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ShoppingCart, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from "@/contexts/app-context";
import { useCreateReservation } from "@/hooks/use-create-reservation";

export default function BookingCreationPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { appState, getCartTotals } = useAppContext();
  const { createReservation, isLoading } = useCreateReservation();
  const storeId = params.id as string;

  const { cart } = appState;
  const { totalItems, totalPrice } = getCartTotals();

  const handleBooking = async () => {
    if (!cart) return;

    try {
      const result = await createReservation(cart);
      router.push(`/bookings/${result.reservation_id}`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "예약 실패", description: err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="ml-2 text-teal-600">예약을 생성하는 중...</p>
      </div>
    );
  }

  let validationError: string | null = null;
  if (!cart) {
    validationError = "장바구니가 비어있습니다. 가게 페이지로 돌아가 메뉴를 담아주세요.";
  } else if (cart.storeId !== storeId) {
    validationError = "장바구니 정보가 현재 가게와 일치하지 않습니다. 장바구니를 비우고 다시 시도해주세요.";
  }

  if (validationError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">오류 발생</h2>
        <p className="text-gray-600 text-center mb-6">{validationError}</p>
        <Link href={`/store/${storeId}`}>
          <Button>가게 페이지로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  if (!cart) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <header className="bg-white shadow-sm border-b border-teal-100">
        <div className="px-4 py-4 max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="p-2" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-800">예약 확인</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-xl mx-auto">
        <Card className="border-teal-200 mb-6">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">{cart.storeName}</h2>
          </CardContent>
        </Card>

        <Card className="border-teal-200 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-teal-600" />
              주문 메뉴
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.menuId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    {item.price.toLocaleString()}원 × {item.quantity}개
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-teal-600">{(item.price * item.quantity).toLocaleString()}원</span>
                </div>
              </div>
            ))}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>총 {totalItems}개</span>
                <span className="text-teal-600">{totalPrice.toLocaleString()}원</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-orange-700 mb-2">주의사항</h3>
            <ul className="space-y-1 text-sm text-orange-600 list-disc list-inside">
              <li>예약 시간은 현재 시간으로 자동 설정됩니다.</li>
              <li>방문 시 가게에 예약 내역을 보여주세요.</li>
              <li>할인 메뉴의 경우, 재고가 소진되면 예약이 취소될 수 있습니다.</li>
            </ul>
          </CardContent>
        </Card>

        <Button
          onClick={handleBooking}
          disabled={isLoading || cart.items.length === 0}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 text-lg font-semibold"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            `${totalPrice.toLocaleString()}원 예약 확정하기`
          )}
        </Button>
      </main>
    </div>
  );
}
