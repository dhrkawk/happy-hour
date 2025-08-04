"use client"

import { useParams } from "next/navigation";
import useSWR from 'swr';
import { ArrowLeft, MapPin, Clock, Phone, Loader2, ShoppingCart, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import BottomNavigation from "@/components/bottom-navigation"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react";
import { ReservationDetailViewModel } from '@/lib/viewmodels/reservation-detail.viewmodel';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('데이터를 불러오는 데 실패했습니다.');
  }
  return res.json();
});

export default function BookingDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;
  const [isCanceling, setIsCanceling] = useState(false);

  const { data: booking, error, mutate } = useSWR<ReservationDetailViewModel>(`/api/reservations/${id}`, fetcher);

  const handleCancelBooking = async () => {
    if (!booking) return;

    setIsCanceling(true);
    try {
      const res = await fetch(`/api/reservations/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: booking.id, status: 'cancelled' }), // Send status update
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '예약 취소에 실패했습니다.');
      }

      mutate(); // 성공 시 SWR 캐시를 갱신하여 UI를 업데이트합니다.
      toast({ title: "예약 취소", description: "예약이 성공적으로 취소되었습니다." });

    } catch (err: any) {
      toast({ variant: "destructive", title: "오류", description: err.message });
    } finally {
      setIsCanceling(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">오류 발생</h2>
        <p className="text-gray-600 text-center mb-6">{error.message}</p>
        <Link href="/bookings">
          <Button>예약 목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="ml-2 text-teal-600">예약 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white max-w-xl mx-auto">
      <header className="bg-white shadow-sm border-b border-teal-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/bookings">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-800">예약 상세 정보</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        <Card className="border-teal-100 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-xl mb-2">{booking.store.name}</h3>
                <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{booking.store.address}</span>
                </div>
                 <div className="flex items-center gap-1.5 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">예약시간: {new Date(booking.reservedTime).toLocaleString('ko-KR')}</span>
                </div>
              </div>
              <Badge className={booking.statusColor}>{booking.statusLabel}</Badge>
            </div>

            <div className="bg-teal-50 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm text-gray-600 mb-1">예약번호</p>
              <p className="text-2xl font-bold text-teal-600 tracking-wider">{booking.bookingNumber}</p>
            </div>
            
            <Separator className="my-4"/>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center"><ShoppingCart className="w-5 h-5 mr-2 text-teal-600"/>예약 메뉴</h4>
              <div className="space-y-3">
                {booking.items.map((item, index) => {
                  const finalPrice = item.price * (1 - (item.discountRate || 0) / 100);
                  return (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                      <div>
                        <p className="font-medium text-gray-800">{item.menuName}</p>
                        <p className="text-sm text-gray-500">수량: {item.quantity}개</p>
                      </div>
                      <div className="text-right">
                        {item.discountRate > 0 && (
                          <Badge variant="destructive">{item.discountRate}% 할인</Badge>
                        )}
                        <p className="font-semibold text-gray-800 mt-1">{(finalPrice * item.quantity).toLocaleString()}원</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator className="my-4"/>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-700">총 결제 금액</span>
                <span className="text-2xl font-bold text-teal-600">
                  {booking.totalAmount.toLocaleString()}원
                </span>
              </div>
            </div>

            {(booking.status === 'confirmed' || booking.status === 'pending') && (
              <div className="flex gap-2 mt-5">
                <a href={`tel:${booking.store.phone}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Phone className="w-4 h-4 mr-1" />
                    가게 전화
                  </Button>
                </a>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={handleCancelBooking}
                  disabled={isCanceling}
                >
                  {isCanceling ? <Loader2 className="w-4 h-4 animate-spin"/> : "예약 취소"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}


