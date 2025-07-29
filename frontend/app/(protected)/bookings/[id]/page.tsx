"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MapPin, Hash, Clock, Phone, Loader2, ShoppingCart, AlertCircle, Tag } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import BottomNavigation from "@/components/bottom-navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

// 타입 정의
interface ReservationDetails {
  id: string;
  bookingNumber: string;
  reserved_time: string;
  status: string;
  store: {
    name: string;
    address: string;
    phone: string;
  } | null;
  items: {
    quantity: number;
    menu: {
      name: string;
      price: number;
    } | null;
    discount: {
      discount_rate: number;
    } | null;
  }[];
  totalAmount: number;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "active": return { label: "예약확정", color: "bg-blue-500 text-white", description: "예약이 확정되었습니다." };
    case "used": return { label: "방문완료", color: "bg-green-500 text-white", description: "방문이 완료되었습니다." };
    case "cancelled": return { label: "예약취소", color: "bg-red-500 text-white", description: "예약이 취소되었습니다." };
    default: return { label: "알 수 없음", color: "bg-gray-500 text-white", description: "" };
  }
};

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const supabase = createClient();
  const id = params.id as string;

  const [booking, setBooking] = useState<ReservationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!id) return;

      setLoading(true)
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("로그인이 필요합니다.")
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            id,
            reserved_time,
            status,
            stores (name, address, phone),
            reservation_items (
              quantity,
              menu_id,
              store_menus (name, price),
              discounts (discount_rate)
            )
          `)
          .eq('id', id)
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          throw new Error(error.message || "예약 정보를 불러오지 못했습니다.")
        }

        if (!data) {
          throw new Error("해당 예약이 없거나 접근 권한이 없습니다.")
        }

        let totalAmount = 0;
        data.reservation_items.forEach((item: any) => {
          const price = item.store_menus?.price || 0;
          const discountRate = item.discounts?.discount_rate || 0;
          const discountedPrice = price * (1 - discountRate / 100);
          totalAmount += discountedPrice * item.quantity;
        });

        const formattedBooking: ReservationDetails = {
          id: data.id,
          bookingNumber: data.id.substring(0, 8),
          reserved_time: data.reserved_time,
          status: data.status,
          store: Array.isArray(data.stores) ? data.stores[0] : data.stores,
          items: data.reservation_items.map((item: any) => ({
            quantity: item.quantity,
            menu: item.store_menus,
            discount: item.discounts,
          })),
          totalAmount: totalAmount,
        };

        setBooking(formattedBooking)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    };

    fetchBookingDetails()
  }, [id, supabase])

  const handleCancelBooking = async () => {
    if (!booking) return;

    setIsCanceling(true)
    try {
      const res = await fetch('/api/reservations/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservation_id: booking.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '예약 취소에 실패했습니다.');
      }

      setBooking({ ...booking, status: 'cancelled' });
      toast({ title: "예약 취소", description: "예약이 취소되었습니다." });

    } catch (err: any) {
      toast({ variant: "destructive", title: "오류", description: err.message })
    } finally {
      setIsCanceling(false)
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="ml-2 text-teal-600">예약 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">오류 발생</h2>
        <p className="text-gray-600 text-center mb-6">{error || "예약을 찾을 수 없습니다."}</p>
        <Link href="/bookings">
          <Button>예약 목록으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  const statusInfo = getStatusInfo(booking.status)

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
            {/* 가게 정보 및 상태 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-xl mb-2">{booking.store?.name}</h3>
                <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{booking.store?.address}</span>
                </div>
                 <div className="flex items-center gap-1.5 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">예약시간: {new Date(booking.reserved_time).toLocaleString('ko-KR')}</span>
                </div>
              </div>
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            </div>

            {/* 예약번호 */}
            <div className="bg-teal-50 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm text-gray-600 mb-1">예약번호</p>
              <p className="text-2xl font-bold text-teal-600 tracking-wider">{booking.bookingNumber}</p>
            </div>
            
            <Separator className="my-4"/>

            {/* 예약 메뉴 목록 */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center"><ShoppingCart className="w-5 h-5 mr-2 text-teal-600"/>예약 메뉴</h4>
              <div className="space-y-3">
                {booking.items.map((item, index) => {
                  const finalPrice = (item.menu?.price || 0) * (1 - (item.discount?.discount_rate || 0) / 100);
                  return (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                      <div>
                        <p className="font-medium text-gray-800">{item.menu?.name}</p>
                        <p className="text-sm text-gray-500">수량: {item.quantity}개</p>
                      </div>
                      <div className="text-right">
                        {item.discount?.discount_rate ? (
                          <Badge variant="destructive">{item.discount.discount_rate}% 할인</Badge>
                        ) : <Badge variant="secondary">할인 없음</Badge>}
                        <p className="font-semibold text-gray-800 mt-1">{(finalPrice * item.quantity).toLocaleString()}원</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator className="my-4"/>

            {/* 총 결제 금액 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-700">총 결제 금액</span>
                <span className="text-2xl font-bold text-teal-600">
                  {booking.totalAmount.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 액션 버튼 */}
            {booking.status === 'active' && (
              <div className="flex gap-2 mt-5">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Phone className="w-4 h-4 mr-1" />
                  가게 전화
                </Button>
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
