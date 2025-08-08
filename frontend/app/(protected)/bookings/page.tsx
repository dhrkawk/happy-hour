"use client"

import { useState } from "react"
import { ArrowLeft, MapPin, Hash, Clock, Phone, Loader2, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import BottomNavigation from "@/components/bottom-navigation"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"
import { BookingCardViewModel, createBookingCardViewModel } from "@/lib/viewmodels/reservation-card.viewmodel"
import { ReservationService } from "@/lib/services/reservations/reservation.service"

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function BookingsPage() {
  const supabase = createClient();
  const reservationService = new ReservationService(supabase);

  const fetcher = async (key: string) => {
    if (key === '/api/reservations') {
      return await reservationService.getMyReservations();
    }
    throw new Error('Unknown fetch key');
  };

  const { data, error, isLoading, mutate } = useSWR('/api/reservations', fetcher);
  const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);
  const bookings: BookingCardViewModel[] = data
    ? data.map(createBookingCardViewModel)
    : [];

  console.log("Bookings data:", bookings);
  bookings.forEach(booking => {
    console.log(`Booking ID: ${booking.id}, Status: ${booking.status}, Status Label: ${booking.statusLabel}, Status Color: ${booking.statusColor}`);
  });

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("정말로 이 예약을 취소하시겠습니까?")) return;
  
    setCancelingBookingId(bookingId);
  
    try {
      await reservationService.cancelReservation(bookingId, 'cancelled');
      alert('예약이 성공적으로 취소되었습니다.');
      mutate(); // 데이터 갱신
    } catch (error: any) {
      console.error('예약 취소 오류:', error);
      alert(`예약 취소 실패: ${error.message}`);
    } finally {
      setCancelingBookingId(null);
    }
  };

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error.message}</h1>
          <Link href="/home">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white max-w-xl mx-auto">
      <header className="bg-white shadow-sm border-b border-teal-100">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/home">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-800">예약 현황</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="space-y-4 pb-24">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">현재 예약된 내역이 없습니다</h3>
              <p className="text-gray-600 mb-4">할인 중인 가게를 찾아 첫 예약을 해보세요!</p>
              <Link href="/home">
                <Button className="bg-teal-500 hover:bg-teal-600 text-white">할인 가게 찾기</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">예약 내역 ({bookings.length})</h2>
              </div>

              {bookings.map((booking) => {
                const isCanceling = cancelingBookingId === booking.id;

                return (
                  <Link href={`/bookings/${booking.id}`} key={booking.id} passHref>
                    <Card
                      className={`border-teal-100 hover:shadow-md transition-all duration-300 ${
                        isCanceling ? "opacity-50 scale-95" : ""
                      }`}
                    >
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

                        {/* 예약번호 강조 표시 */}
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

                        {booking.status === 'confirmed' || booking.status === 'pending' && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-red-600 border-red-300 bg-transparent hover:bg-red-50"
                              onClick={(e) => { 
                                e.preventDefault(); // Link 이동 방지
                                handleCancelBooking(booking.id); 
                              }}
                              disabled={isCanceling}
                            >
                              {isCanceling ? "취소 중..." : "예약 취소"}
                            </Button>
                          </div>
                        )}

                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
