"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MapPin, Clock, ShoppingCart, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

// 타입 정의
interface CartItem {
  id: string // menu_id
  name: string
  price: number
  quantity: number
  discount_id: string | null // 할인 ID 추가
}

interface StoreInfo {
  id: string // store_id
  name: string
  address: string
}

export default function BookingCreationPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const storeId = params.id as string;

  // 상태 관리
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = () => {
      try {
        const savedCartItems = localStorage.getItem('cartItems');
        const savedStoreInfo = localStorage.getItem('storeInfo');

        if (savedCartItems && savedStoreInfo) {
          const cart = JSON.parse(savedCartItems);
          const store = JSON.parse(savedStoreInfo);

          // 데이터 형식 및 유효성 검증 강화
          if (!store || typeof store !== 'object' || !store.id) {
            setError("가게 정보가 올바르지 않습니다. 다시 시도해주세요.");
            return;
          }
          if (!Array.isArray(cart)) {
            setError("장바구니 정보가 올바르지 않습니다. 다시 시도해주세요.");
            return;
          }

          // 현재 페이지의 storeId와 localStorage의 store.id가 일치하는지 확인
          if (store.id !== storeId) {
            setError("장바구니 정보가 현재 가게와 일치하지 않습니다. 장바구니를 비우고 다시 시도해주세요.");
            setCartItems([]);
            setStoreInfo(null);
          } else {
            setError(null); // 데이터가 유효하면 기존 에러 메시지 제거
            setCartItems(cart);
            setStoreInfo(store);
          }
        } else {
          setError("장바구니에 담긴 메뉴가 없습니다. 가게 페이지로 돌아가 메뉴를 담아주세요.");
        }
      } catch (e) {
        setError("예약 정보를 불러오는 중 오류가 발생했습니다. 장바구니를 비워주세요.");
        console.error("Failed to parse localStorage data:", e);
      }
    };

    loadData();

    // 다른 탭/창에서의 localStorage 변경 감지
    window.addEventListener('storage', loadData);

    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, [storeId]);

  // 총 결제 금액 및 수량 계산
  const getTotalAmount = () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const getTotalQuantity = () => cartItems.reduce((total, item) => total + item.quantity, 0)

  // 예약 확정 핸들러
  const handleBooking = async () => {
    if (!storeInfo || cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "가게 정보 또는 장바구니에 담긴 메뉴가 없습니다.",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    // API에 보낼 데이터 구성
    const payload = {
      store_id: storeInfo.id,
      reserved_time: new Date().toISOString(),
      items: cartItems.map(item => ({
        quantity: item.quantity,
        price: item.price, // 예: 15000
        discount_rate: 0, // 예: 20 (20%)
      })),
    }

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "알 수 없는 오류로 예약에 실패했습니다.")
      }

      // 예약 성공 시 localStorage 정리 및 상세 페이지로 이동
      localStorage.removeItem('cartItems');
      localStorage.removeItem('storeInfo');

      toast({
        title: "예약 완료!",
        description: "예약이 성공적으로 완료되었습니다. 상세 페이지로 이동합니다.",
        className: "bg-green-500 text-white",
      })

      router.push(`/bookings/${result.reservation_id}`)

    } catch (err: any) {
      setError(err.message)
      toast({
        variant: "destructive",
        title: "예약 실패",
        description: err.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">오류 발생</h2>
        <p className="text-gray-600 text-center mb-6">{error}</p>
        <Link href="/home">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    )
  }

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
        {/* 가게 정보 */}
        <Card className="border-teal-200 mb-6">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">{storeInfo?.name}</h2>
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{storeInfo?.address}</span>
            </div>
          </CardContent>
        </Card>

        {/* 주문 메뉴 */}
        <Card className="border-teal-200 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-teal-600" />
              주문 메뉴
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                <span>총 {getTotalQuantity()}개</span>
                <span className="text-teal-600">{getTotalAmount().toLocaleString()}원</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 주의사항 */}
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

        {/* 예약 확정 버튼 */}
        <Button
          onClick={handleBooking}
          disabled={isLoading || cartItems.length === 0}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 text-lg font-semibold"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            `${getTotalAmount().toLocaleString()}원 예약 확정하기`
          )}
        </Button>
      </main>
    </div>
  )
}
