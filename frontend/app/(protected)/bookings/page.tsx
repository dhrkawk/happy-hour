"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, MapPin, Hash, Clock, Phone, Loader2, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import BottomNavigation from "@/components/bottom-navigation"
import { createClient } from "@/lib/supabase/client"

// 예약 데이터 타입 정의
interface Booking {
  id: string;
  reserved_time: string;
  status: string;
  stores: {
    name: string;
    address: string;
    phone: string;
  }[] | null;
  reservation_items: {
    quantity: number;
  }[];
}

// 컴포넌트에서 사용할 데이터 타입
interface BookingData {
  id: string;
  bookingNumber: string;
  storeName: string;
  address: string;
  phone: string;
  reserved_time: string;
  visitTime: string;
  status: string;
  totalItems: number;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "active":
      return { label: "예약확정", color: "bg-blue-500 text-white", description: "예약이 확정되었습니다." };
    case "used":
      return { label: "방문완료", color: "bg-green-500 text-white", description: "방문이 완료되었습니다." };
    case "cancelled":
      return { label: "예약취소", color: "bg-red-500 text-white", description: "예약이 취소되었습니다." };
    default:
      return { label: "알 수 없음", color: "bg-gray-500 text-white", description: "" };
  }
};

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
        // 예약 정보와 관련 스토어, 예약 아이템(수량만)을 함께 조회
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            id,
            reserved_time,
            status,
            stores (
              name,
              address,
              phone
            ),
            reservation_items (
              quantity
            )
          `)
          .eq('user_id', user.id)
          .order('reserved_time', { ascending: false });

        if (error) {
          console.error("Error fetching bookings:", error);
          setError("예약 정보를 불러오는 데 실패했습니다.");
          return;
        }

        // 데이터를 프론트엔드에서 사용하기 편한 형태로 가공
        const formattedBookings: BookingData[] = data.map((booking: Booking) => {
          const totalItems = booking.reservation_items.reduce((sum, item) => sum + item.quantity, 0);
          const storeInfo = booking.stores?.[0];
          
          return {
            id: booking.id,
            bookingNumber: booking.id.substring(0, 8),
            storeName: storeInfo?.name || "알 수 없는 가게",
            address: storeInfo?.address || "",
            phone: storeInfo?.phone || "",

            reserved_time: booking.reserved_time,
            visitTime: new Date(booking.reserved_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            status: booking.status,
            totalItems: totalItems,
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
                const statusInfo = getStatusInfo(booking.status);
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
                              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 mb-1">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{booking.address}</span>
                            </div>
                             <p className="text-sm text-gray-500">{statusInfo.description}</p>
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

                        {booking.status === 'active' && (
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
