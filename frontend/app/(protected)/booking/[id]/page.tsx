"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Check, Clock, MapPin, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface StoreInfo {
  id: number
  name: string
  address: string
  discount: number
}

// 8자리 예약번호 생성 함수
const generateBookingNumber = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

export default function BookingPage({ params }: { params: { id: string } }) {
  const [isBooked, setIsBooked] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [bookingNumber, setBookingNumber] = useState("")

  useEffect(() => {
    // localStorage에서 장바구니 정보와 가게 정보 가져오기
    const savedCartItems = localStorage.getItem("cartItems")
    const savedStoreInfo = localStorage.getItem("storeInfo")

    if (savedCartItems) {
      setCartItems(JSON.parse(savedCartItems))
    }

    if (savedStoreInfo) {
      setStoreInfo(JSON.parse(savedStoreInfo))
    }

    // 예약번호 생성
    setBookingNumber(generateBookingNumber())
  }, [])

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalQuantity = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const bookingData = {
    visitTime: "2024-01-15 14:30",
  }

  const handleBooking = () => {
    setIsBooked(true)
    // 예약 완료 후 localStorage 정리
    localStorage.removeItem("cartItems")
    localStorage.removeItem("storeInfo")
  }

  if (isBooked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-mint-50 to-white">
        {/* 헤더 */}
        <header className="bg-white shadow-sm border-b border-mint-100">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold text-gray-800">예약 완료</h1>
            </div>
          </div>
        </header>

        <div className="px-4 py-8">
          {/* 성공 메시지 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-mint-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">예약이 완료되었습니다!</h2>
            <p className="text-gray-600">가게에서 확인 후 최종 승인됩니다.</p>
          </div>

          {/* 예약번호 카드 */}
          <Card className="border-mint-200 mb-6 bg-mint-50">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-mint-700 mb-4">예약번호</h3>
              <div className="text-4xl font-bold text-mint-600 mb-4 tracking-wider">{bookingNumber}</div>
              <p className="text-sm text-gray-600">가게에서 이 번호를 말씀해주세요</p>
            </CardContent>
          </Card>

          {/* 예약 정보 */}
          <Card className="border-mint-200 mb-6">
            <CardHeader className="bg-mint-50">
              <CardTitle className="text-lg text-mint-700">예약 정보</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">{storeInfo?.name}</h3>
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{storeInfo?.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-500 text-white">{storeInfo?.discount}% 할인</Badge>
                  <span className="text-lg font-bold text-mint-600">{getTotalAmount().toLocaleString()}원</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">예약번호</p>
                    <p className="font-semibold">{bookingNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">방문 예정 시간</p>
                    <p className="font-semibold">{bookingData.visitTime}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주문 메뉴 */}
          <Card className="border-mint-200 mb-6">
            <CardHeader className="bg-mint-50">
              <CardTitle className="text-lg text-mint-700 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                주문 메뉴
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        {item.price.toLocaleString()}원 × {item.quantity}개
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-mint-600">
                        {(item.price * item.quantity).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between font-bold">
                    <span>총 {getTotalQuantity()}개</span>
                    <span className="text-lg text-mint-600">{getTotalAmount().toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 안내사항 */}
          <Card className="border-mint-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">이용 안내</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-mint-500">•</span>
                  <span>할인 시간이 종료되기 전에 방문해주세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mint-500">•</span>
                  <span>방문 시 예약번호를 직원에게 말씀해주세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mint-500">•</span>
                  <span>예약 취소는 방문 30분 전까지 가능합니다</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 버튼들 */}
          <div className="flex gap-3 mt-6">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                홈으로
              </Button>
            </Link>
            <Link href="/bookings" className="flex-1">
              <Button className="w-full bg-mint-500 hover:bg-mint-600 text-white">예약 현황 보기</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-mint-50 to-white">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-mint-100">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/store/${params.id}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-800">예약 확인</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* 가게 정보 */}
        <Card className="border-mint-200 mb-6">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{storeInfo?.name}</h2>
            <div className="flex items-center gap-1 text-gray-600 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{storeInfo?.address}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-orange-500 text-white">{storeInfo?.discount}% 할인</Badge>
              <div className="flex items-center gap-1 text-red-500 font-medium">
                <Clock className="w-4 h-4" />
                <span>2시간 15분 남음</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 주문 메뉴 */}
        <Card className="border-mint-200 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              주문 메뉴
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-mint-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    {item.price.toLocaleString()}원 × {item.quantity}개
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-mint-600">{(item.price * item.quantity).toLocaleString()}원</span>
                </div>
              </div>
            ))}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>총 {getTotalQuantity()}개</span>
                <span className="text-mint-600">{getTotalAmount().toLocaleString()}원</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 방문 안내 */}
        <Card className="border-mint-200 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">방문 안내</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-mint-50 p-4 rounded-lg">
              <h3 className="font-semibold text-mint-700 mb-2">지금 바로 방문</h3>
              <p className="text-sm text-gray-600">
                할인 시간 내에 가게에 방문하여 할인 혜택을 받으세요. 방문 시 예약번호를 직원에게 말씀해주시면 됩니다.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-mint-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <span className="text-gray-700">가게에 도착 후 직원에게 할인 이용 의사를 전달</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-mint-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <span className="text-gray-700">예약번호를 직원에게 알려주세요</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-mint-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <span className="text-gray-700">주문한 메뉴를 할인된 가격으로 결제 완료</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 주의사항 */}
        <Card className="border-orange-200 bg-orange-50 mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-orange-700 mb-2">주의사항</h3>
            <ul className="space-y-1 text-sm text-orange-600">
              <li>• 할인 시간이 종료되면 할인 혜택을 받을 수 없습니다</li>
              <li>• 주문한 메뉴 외 추가 주문 시 할인이 적용되지 않을 수 있습니다</li>
              <li>• 가게 사정에 따라 할인이 조기 종료될 수 있습니다</li>
            </ul>
          </CardContent>
        </Card>

        {/* 확인 버튼 */}
        <Button
          onClick={handleBooking}
          className="w-full bg-mint-500 hover:bg-mint-600 text-white py-3 text-lg font-semibold"
        >
          {getTotalAmount().toLocaleString()}원으로 예약 확정하기
        </Button>
      </div>
    </div>
  )
}
