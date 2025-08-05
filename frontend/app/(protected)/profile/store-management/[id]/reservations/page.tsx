"use client"

import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, MapPin, Clock, ShoppingCart, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/bottom-navigation";
import { ReservationEntity } from "@/lib/entities/reservation.entity";
import { BookingCardViewModel, createBookingCardViewModel } from "@/lib/viewmodels/reservation-card.viewmodel";

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('데이터를 불러오는 데 실패했습니다.');
  }
  return res.json();
});

export default function StoreReservationsPage() {
  const params = useParams();
  const storeId = params.id as string;

  // API Route: /api/stores/[storeId]/reservations (아직 구현되지 않음)
  const { data, error, isLoading } = useSWR<ReservationEntity[]>(`/api/stores/${storeId}/reservations`, fetcher);

  const bookings: BookingCardViewModel[] = data
    ? data.map(createBookingCardViewModel)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="ml-2 text-teal-600">예약 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">오류 발생</h2>
        <p className="text-gray-600 text-center mb-6">{error.message || "예약 목록을 불러오지 못했습니다."}</p>
        <Link href="/profile/store-management">
          <Button>가게 관리로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white max-w-xl mx-auto">
      <header className="bg-white shadow-sm border-b border-teal-100">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/profile/store-management/${storeId}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-800">{bookings[0]?.storeName || "가게"} 예약 현황</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="space-y-4 pb-24">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">현재 예약된 내역이 없습니다</h3>
              <p className="text-gray-600 mb-4">아직 예약이 없거나, 예약 정보를 불러오지 못했습니다.</p>
              <Link href={`/store/${storeId}`}>
                <Button className="bg-teal-500 hover:bg-teal-600 text-white">가게 페이지로 이동</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">예약 내역 ({bookings.length})</h2>
              </div>

              {bookings.map((booking) => (
                <Link href={`/profile/store-management/${storeId}/reservations/${booking.id}`} key={booking.id} passHref>
                  <Card className="border-teal-100 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-800 text-lg">{booking.storeName}</h3>
                            <Badge className={booking.statusColor}>{booking.statusLabel}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{booking.address}</span>
                          </div>
                          <p className="text-sm text-gray-500">{booking.statusDescription}</p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                            <Hash className="w-6 h-6 text-teal-600" />
                          </div>
                          <span className="text-xs text-gray-500">예약번호</span>
                        </div>
                      </div>

                      <div className="bg-teal-50 rounded-lg p-3 my-3 text-center">
                        <p className="text-sm text-gray-600 mb-1">예약번호</p>
                        <p className="text-2xl font-bold text-teal-600 tracking-wider">{booking.bookingNumber}</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="w-4 h-4 mr-1.5" />
                                방문 예정 시간: <span className="font-medium text-gray-800 ml-1">{booking.visitTime}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <ShoppingCart className="w-4 h-4 mr-1.5" />
                                예약 메뉴: <span className="font-medium text-gray-800 ml-1">총 {booking.totalItems}개</span>
                              </div>
                            </div>
                            <div className="text-teal-600 text-sm font-medium pr-4">
                              상세 보기
                            </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
