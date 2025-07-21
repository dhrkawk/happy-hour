"use client"

import { useState } from "react"
import React from "react"
import { ArrowLeft, MapPin, Clock, Heart, Share2, Phone, Plus, Minus, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getStoreById } from "@/lib/store-data"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export default function StorePage({ params }: { params: { id: string } }) {
  const unwrappedParams = React.use(Promise.resolve(params)); // Ensure params is a Promise
  const storeId = Number.parseInt(unwrappedParams.id)
  const storeData = getStoreById(storeId)

  const [selectedImage, setSelectedImage] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [activeTab, setActiveTab] = useState("menu") // 기본값을 "menu"로 변경
  const [cart, setCart] = useState<CartItem[]>([])

  // 가게 데이터가 없으면 404 처리
  if (!storeData) {
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
  const addToCart = (menuItem: any) => {
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
  const removeFromCart = (menuId: number) => {
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
  const getCartQuantity = (menuId: number) => {
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

  // 예약하기 버튼 클릭 시 장바구니 정보를 localStorage에 저장
  const handleReservation = () => {
    if (cart.length > 0) {
      localStorage.setItem("cartItems", JSON.stringify(cart))
      localStorage.setItem(
        "storeInfo",
        JSON.stringify({
          id: storeData.id,
          name: storeData.name,
          address: storeData.address,
          discount: storeData.discount,
        }),
      )
    }
  }

  return (
    <div className="min-h-screen bg-white">
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

      {/* 이미지 갤러리 */}
      <div className="relative">
        <div className="h-48 bg-gray-200">
          <img
            src={storeData.images[selectedImage] || storeData.thumbnail || "/placeholder.svg"}
            alt={storeData.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-2 overflow-x-auto">
            {storeData.images.map((image, index) => (
              <button
                key={index}
                className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                  selectedImage === index ? "border-white" : "border-transparent"
                }`}
                onClick={() => setSelectedImage(index)}
              >
                <img src={image || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 가게 기본 정보 */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800 mb-2">{storeData.name}</h1>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1 text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{storeData.distance}km</span>
              </div>
              <span className="text-gray-500">{storeData.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500 text-white">{storeData.discount}% 할인</Badge>
              <div className="flex items-center gap-1 text-red-500 font-medium">
                <Clock className="w-4 h-4" />
                <span>{storeData.timeLeft} 남음</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed">{storeData.description}</p>
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
            {storeData.menu.map((item) => {
              const quantity = getCartQuantity(item.id)
              return (
                <Card key={item.id} className="border-teal-100">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-400 line-through">
                            {item.originalPrice.toLocaleString()}원
                          </span>
                          <span className="text-lg font-bold text-teal-600">
                            {item.discountPrice.toLocaleString()}원
                          </span>
                          <Badge className="bg-orange-500 text-white text-xs">{storeData.discount}% 할인</Badge>
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
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {activeTab === "info" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">가게 정보</h3>
            <Card className="border-teal-100">
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">주소</h3>
                  <p className="text-gray-600">{storeData.address}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">전화번호</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600">{storeData.phone}</p>
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4 mr-1" />
                      전화
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">카테고리</h3>
                  <p className="text-gray-600">{storeData.category}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 하단 고정 예약 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-teal-100 p-4 shadow-lg">
        {cart.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">선택한 메뉴 {getTotalQuantity()}개</span>
              <span className="font-bold text-lg text-teal-600">{getTotalAmount().toLocaleString()}원</span>
            </div>
            <Link href={`/booking/${storeId}`} onClick={handleReservation}>
              <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-4 text-lg font-semibold">
                {getTotalAmount().toLocaleString()}원으로 예약하기
              </Button>
            </Link>
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
