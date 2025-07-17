"use client"

import { useState } from "react"
import { ArrowLeft, MapPin, Hash, Clock, Phone } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import BottomNavigation from "@/components/bottom-navigation"

// 현재 예약된 식당만 (진행중인 예약)
const initialBookings = [
  {
    id: 1,
    bookingNumber: "12345678",
    storeName: "맛있는 김치찌개",
    address: "서울시 강남구 역삼동 123-45",
    phone: "02-1234-5678",
    bookingDate: "2024-01-15",
    visitTime: "14:30",
    peopleCount: 2,
    totalAmount: 16800,
    status: "confirmed", // confirmed, ready
    timeLeft: "1시간 30분",
    discount: 30,
  },
  {
    id: 2,
    bookingNumber: "87654321",
    storeName: "카페 브루잉",
    address: "서울시 강남구 역삼동 456-78",
    phone: "02-2345-6789",
    bookingDate: "2024-01-15",
    visitTime: "16:00",
    peopleCount: 1,
    totalAmount: 7500,
    status: "ready",
    timeLeft: "30분",
    discount: 25,
  },
]

const getStatusInfo = (status: string) => {
  switch (status) {
    case "confirmed":
      return {
        label: "예약확정",
        color: "bg-blue-500 text-white",
        description: "예약이 확정되었습니다",
        icon: "✅",
      }
    case "ready":
      return {
        label: "방문가능",
        color: "bg-green-500 text-white",
        description: "지금 방문하시면 됩니다",
        icon: "🎉",
      }
    default:
      return {
        label: "알 수 없음",
        color: "bg-gray-500 text-white",
        description: "",
        icon: "❓",
      }
  }
}

export default function BookingsPage() {
  const [currentBookings, setCurrentBookings] = useState(initialBookings)
  const [cancelingBookingId, setCancelingBookingId] = useState<number | null>(null)

  // 예약 취소 함수
  const handleCancelBooking = async (bookingId: number) => {
    setCancelingBookingId(bookingId)

    // 실제로는 서버에 취소 요청을 보내야 합니다
    // 여기서는 시뮬레이션으로 1초 후 삭제
    setTimeout(() => {
      setCurrentBookings((prevBookings) => prevBookings.filter((booking) => booking.id !== bookingId))
      setCancelingBookingId(null)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
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
          {currentBookings.length === 0 ? (
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
                <h2 className="text-lg font-semibold text-gray-800">예약된 식당 ({currentBookings.length})</h2>
                <div className="text-sm text-gray-500">오늘 방문 예정</div>
              </div>

              {currentBookings.map((booking) => {
                const statusInfo = getStatusInfo(booking.status)
                const isCanceling = cancelingBookingId === booking.id

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
                          {booking.status === "ready" && (
                            <div className="flex items-center gap-1 text-orange-600 font-medium mt-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">할인 시간 {booking.timeLeft} 남음</span>
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
                          <span className="text-gray-600">인원 수</span>
                          <p className="font-medium">{booking.peopleCount}명</p>
                        </div>
                      </div>

                      <div className="border-t pt-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">할인 적용 금액</span>
                            <Badge className="bg-orange-500 text-white text-xs">{booking.discount}% 할인</Badge>
                          </div>
                          <span className="text-xl font-bold text-teal-600">
                            {booking.totalAmount.toLocaleString()}원
                          </span>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent" disabled={isCanceling}>
                          <Phone className="w-4 h-4 mr-1" />
                          가게 전화
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 border-red-300 bg-transparent hover:bg-red-50"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={isCanceling}
                        >
                          {isCanceling ? "취소 중..." : "예약 취소"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
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
  )
}
