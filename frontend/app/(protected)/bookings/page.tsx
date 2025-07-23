"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, MapPin, Hash, Clock, Phone, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import BottomNavigation from "@/components/bottom-navigation"
import { createClient } from "@/lib/supabase/client"

interface BookingData {
  id: string;
  bookingNumber: string;
  storeName: string;
  address: string;
  phone: string;
  reserved_at: string;
  visitTime: string;
  menuName: string;
  totalAmount: number;
  status: string;
  timeLeft: string;
  discountRate: number;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "active":
      return {
        label: "예약확정",
        color: "bg-blue-500 text-white",
        description: "예약이 확정되었습니다",
        icon: "✅",
      };
    case "used":
      return {
        label: "방문완료",
        color: "bg-green-500 text-white",
        description: "방문이 완료되었습니다",
        icon: "🎉",
      };
    case "cancelled":
      return {
        label: "예약취소",
        color: "bg-red-500 text-white",
        description: "예약이 취소되었습니다",
        icon: "❌",
      };
    default:
      return {
        label: "알 수 없음",
        color: "bg-gray-500 text-white",
        description: "",
        icon: "❓",
      };
  }
};

function formatTimeLeft(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return "할인 종료";
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}일 남음`;
  } else if (hours > 0) {
    return `${hours}시간 남음`;
  } else if (minutes > 0) {
    return `${minutes}분 남음`;
  } else {
    return `${seconds}초 남음`;
  }
}

export default function BookingsPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(
            `
            id,
            reserved_at,
            status,
            discounts (
              id,
              discount_rate,
              start_time,
              end_time,
              stores (
                name,
                address,
                phone
              ),
              store_menus (
                name,
                price
              )
            )
            `
          )
          .eq('user_id', user.id)
          .order('reserved_at', { ascending: false });

        if (error) {
          console.error("Error fetching bookings:", error);
          setError("예약 정보를 불러오는 데 실패했습니다.");
          setLoading(false);
          return;
        }

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

        const formattedBookings: BookingData[] = data
          .filter(booking => {
            // Filter out cancelled bookings older than 24 hours
            if (booking.status === 'cancelled') {
              const reservedAt = new Date(booking.reserved_at);
              return reservedAt > twentyFourHoursAgo;
            }
            return true;
          })
          .map((booking: any) => {
            const discount = booking.discounts;
            const store = discount?.stores;
            const menu = discount?.store_menus;

            const originalPrice = menu?.price || 0;
            const discountRate = discount?.discount_rate || 0;
            const discountPrice = originalPrice * (1 - discountRate / 100);

            return {
              id: booking.id,
              bookingNumber: booking.id.substring(0, 8), // 예약번호는 예약 ID의 앞 8자리 사용
              storeName: store?.name || "",
              address: store?.address || "",
              phone: store?.phone || "",
              reserved_at: booking.reserved_at,
              visitTime: new Date(discount?.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) || "",
              menuName: menu?.name || "",
              totalAmount: discountPrice,
              status: booking.status,
              timeLeft: formatTimeLeft(discount?.end_time || ""),
              discountRate: discountRate,
            };
          });

        setBookings(formattedBookings);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // 예약 취소 함수
  const handleCancelBooking = async (bookingId: string) => {
    setCancelingBookingId(bookingId);
    try {
      const res = await fetch('/api/reservations/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservation_id: bookingId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '예약 취소에 실패했습니다.');
      }

      // UI 업데이트: 취소된 예약의 상태를 변경
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        )
      );
      alert('예약이 취소되었습니다.');
    } catch (error: any) {
      console.error('Failed to cancel booking:', error);
      alert(`예약 취소 실패: ${error.message}`);
    } finally {
      setCancelingBookingId(null);
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error}</h1>
          <Link href="/home">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white max-w-xl mx-auto">
      {/* 헤더 */}
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
        {/* 현재 예약 현황 */}
        <div className="space-y-4 pb-24">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">현재 예약된 식당이 없습니다</h3>
              <p className="text-gray-600 mb-4">할인 중인 가게를 찾아 첫 예약을 해보세요!</p>
              <Link href="/home">
                <Button className="bg-teal-500 hover:bg-teal-600 text-white">할인 가게 찾기</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">예약된 식당 ({bookings.length})</h2>
                <div className="text-sm text-gray-500">오늘 방문 예정</div>
              </div>

              {bookings.map((booking) => {
                const statusInfo = getStatusInfo(booking.status);
                const isCanceling = cancelingBookingId === booking.id;

                return (
                  <Card
                    key={booking.id}
                    className={`border-teal-100 hover:shadow-md transition-all duration-300 ${
                      isCanceling ? "opacity-50 scale-95" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-800 text-lg">{booking.storeName}</h3>
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{booking.address}</span>
                          </div>
                          <p className="text-sm text-gray-500">{statusInfo.description}</p>
                          {booking.status === "active" && (
                            <div className="flex items-center gap-1 text-orange-600 font-medium mt-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">할인 시간 {booking.timeLeft}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                            <Hash className="w-6 h-6 text-teal-600" />
                          </div>
                          <span className="text-xs text-gray-500">예약번호</span>
                        </div>
                      </div>

                      {/* 예약번호 강조 표시 */}
                      <div className="bg-teal-50 rounded-lg p-3 mb-3 text-center">
                        <p className="text-sm text-gray-600 mb-1">예약번호</p>
                        <p className="text-2xl font-bold text-teal-600 tracking-wider">{booking.bookingNumber}</p>
                      </div>

                      {/* 예약 상세 정보 */}
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">방문 시간</span>
                          <p className="font-medium">{booking.visitTime}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">메뉴명</span>
                          <p className="font-medium">{booking.menuName}</p>
                        </div>
                      </div>

                      <div className="border-t pt-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">할인 적용 금액</span>
                            <Badge className="bg-orange-500 text-white text-xs">{booking.discountRate}% 할인</Badge>
                          </div>
                          <span className="text-xl font-bold text-teal-600">
                            {booking.totalAmount.toLocaleString()}원
                          </span>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent" disabled={isCanceling || booking.status === 'cancelled'}>
                          <Phone className="w-4 h-4 mr-1" />
                          가게 전화
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex-1 ${booking.status === 'cancelled' ? 'text-gray-500 border-gray-300' : 'text-red-600 border-red-300 bg-transparent hover:bg-red-50'}`}
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={isCanceling || booking.status === 'cancelled'}
                        >
                          {isCanceling ? "취소 중..." : (booking.status === 'cancelled' ? "예약 취소됨" : "예약 취소")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* 안내 메시지 */}
              <Card className="border-orange-200 bg-orange-50 mt-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-orange-700 mb-2">💡 이용 안내</h3>
                  <ul className="space-y-1 text-sm text-orange-600">
                    <li>• 예약 시간에 맞춰 방문해주세요</li>
                    <li>• 방문 시 예약번호를 직원에게 말씀해주세요</li>
                    <li>• 할인 시간이 지나면 할인 혜택을 받을 수 없습니다</li>
                    <li>• 예약 취소는 방문 30분 전까지 가능합니다</li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  );
}
