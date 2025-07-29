"use client"
import useSWR from "swr"
import React, { useState, useEffect } from "react"
import { ArrowLeft, MapPin, Clock, Heart, Share2, Phone, Plus, Minus, ShoppingCart, Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"
import { useAppContext } from "@/contexts/app-context"
import type { StoreDetailEntity } from "@/lib/entities/store-detail.entity";
import { StoreDetailViewModel, createStoreDetailViewModel } from "@/lib/viewmodels/store-detail.viewmodel"; 

interface StoreMenu {
  id: string
  name: string
  originalPrice: number
  discountPrice: number
  description: string
  thumbnail?: string
  discountId: string | null; // 추가된 필드
  discountRate: number;
  discountEndTime: string;
}
  interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
  }

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StorePage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;
  const { coordinates } = useAppContext().appState.location;

  const [viewmodel, setViewModel] = useState<StoreDetailViewModel>();
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState("menu");
  const [isLiked, setIsLiked] = useState(false);

  const { data: storeData, error: swrError, isValidating } = useSWR<StoreDetailEntity>(
    `/api/store/${storeId}`,
    fetcher,
    {
      onSuccess: (data) => {
        const vm = createStoreDetailViewModel(data, coordinates);
        setViewModel(vm);
      },
      onError: () => {
        setError("가게 정보를 불러오는 데 실패했습니다.");
      },
    }
  );

  useEffect(() => {
    if (storeData) {
      const viewModel = createStoreDetailViewModel(storeData, coordinates)
      setViewModel(viewModel)
    }
  }, [storeData, coordinates])

  if (!viewmodel) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="ml-2 text-teal-600">가게 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">가게를 찾을 수 없습니다</h1>
          <Link href="/">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  // 장바구니에 메뉴 추가
  const addToCart = (menuItem: StoreMenu) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === menuItem.id)
      if (existingItem) {
        return prevCart.map((item) => (item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [
          ...prevCart,
          {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.discountPrice,
            quantity: 1,
          },
        ]
      }
    })
  }

  // 장바구니에서 메뉴 제거
  const removeFromCart = (menuId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === menuId)
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) => (item.id === menuId ? { ...item, quantity: item.quantity - 1 } : item))
      } else {
        return prevCart.filter((item) => item.id !== menuId)
      }
    })
  }

  // 장바구니에서 특정 메뉴의 수량 가져오기
  const getCartQuantity = (menuId: string) => {
    const item = cart.find((item) => item.id === menuId)
    return item ? item.quantity : 0
  }

  // 총 금액 계산
  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // 총 수량 계산
  const getTotalQuantity = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // 예약하기 버튼 클릭 시 장바구니 정보를 localStorage에 저장하고 예약 페이지로 이동
  const handleReservation = () => {
    if (cart.length === 0 || !storeData) {
      // 장바구니가 비었거나 가게 정보가 없으면 아무것도 하지 않음
      return;
    }

    // localStorage에 저장할 데이터 준비
    const cartToSave = cart.map(item => ({
      ...item,
      // 각 메뉴에 대한 할인 ID를 찾아서 추가
      discount_id: viewmodel.menu?.find(m => m.id === item.id)?.discountId || null,
    }));

    const storeInfoToSave = {
      id: storeData.id,
      name: storeData.name,
      address: storeData.address,
    };

    // localStorage에 데이터 저장
    localStorage.setItem('cartItems', JSON.stringify(cartToSave));
    localStorage.setItem('storeInfo', JSON.stringify(storeInfoToSave));

    // 예약 생성 페이지로 이동
    router.push(`/booking/${storeData.id}`);
  };

  return (
    <div className="min-h-screen bg-white max-w-xl mx-auto">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-teal-100 relative z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold text-gray-800">가게 정보</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="p-2">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2" onClick={() => setIsLiked(!isLiked)}>
                <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 가게 썸네일 */}
      <div className="relative">
        <div className="h-64 bg-gray-200">
          <img
            src={viewmodel.storeThumbnail || "/no-image.jpg"}
            alt={viewmodel.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 가게 기본 정보 */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{viewmodel.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <MapPin className="w-4 h-4" />
              <span>{viewmodel.distance}</span>
              <span>•</span>
              <span>{viewmodel.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500 text-white text-sm">{viewmodel.discount}% 할인</Badge>
              <div className="flex items-center gap-1 text-red-500 font-medium text-sm">
                <Clock className="w-4 h-4" />
                <span>{viewmodel.timeLeft}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed">{viewmodel.description}</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "menu" ? "bg-white text-teal-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            🍽️ 메뉴
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "info" ? "bg-white text-teal-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            📍 정보
          </button>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="px-4 py-4 pb-32">
        {activeTab === "menu" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">할인 메뉴</h3>
              {cart.length > 0 && (
                <div className="flex items-center gap-2 text-teal-600">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="text-sm font-medium">{getTotalQuantity()}개 선택</span>
                </div>
              )}
            </div>
            {(viewmodel.menu ?? []).length > 0 ? (
              (viewmodel.menu ?? []).map((item) => {
                const quantity = getCartQuantity(item.id)
                return (
                  <Card key={item.id} className="border-teal-100">
                    <CardContent className="p-4 flex items-center">
                      <div className="w-20 h-20 flex-shrink-0 mr-4">
                        <img
                          src={item.thumbnail || "/no-image.jpg"}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-400 line-through">
                            {item.originalPrice.toLocaleString()}원
                          </span>
                          <span className="text-lg font-bold text-teal-600">
                            {item.discountPrice.toLocaleString()}원
                          </span>
                          <Badge className="bg-orange-500 text-white text-xs">{item.discountRate}% 할인</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {quantity > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-8 h-8 p-0 bg-transparent"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-8 h-8 p-0 bg-transparent"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToCart(item)}
                            className="bg-teal-50 border-teal-200 text-teal-600 hover:bg-teal-100"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            담기
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">😅</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">아직 등록된 할인 메뉴가 없습니다.</h3>
                <p className="text-gray-600">새로운 메뉴가 곧 추가될 예정입니다!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">가게 정보</h3>
            <Card className="border-teal-100">
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">주소</h3>
                  <p className="text-gray-600">{viewmodel.address}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">전화번호</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{viewmodel.phone}</p>
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4 mr-1" />
                      전화
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">카테고리</h3>
                  <p className="text-gray-600">{viewmodel.category}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 하단 고정 예약 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-teal-100 p-4 shadow-lg max-w-xl mx-auto">
        {cart.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">선택한 메뉴 {getTotalQuantity()}개</span>
              <span className="font-bold text-lg text-teal-600">{getTotalAmount().toLocaleString()}원</span>
            </div>
            <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-4 text-lg font-semibold" onClick={handleReservation}>
              {getTotalAmount().toLocaleString()}원으로 예약하기
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-3">메뉴를 선택해주세요</p>
            <Button disabled className="w-full bg-gray-300 text-gray-500 py-4 text-lg font-semibold cursor-not-allowed">
              메뉴 선택 후 예약 가능
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}