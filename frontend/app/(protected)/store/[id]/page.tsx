// app/store/[id]/page.tsx
"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Clock,
  Heart,
  Share2,
  Ticket,
  Gift,
  Percent,
  Users,
  ChevronDown,
  Plus,
  Minus,
  ShoppingCart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useParams } from "next/navigation"

import {
  useGetStoreDetail,
  includeMenusAndEvents,
} from "@/hooks/stores/use-get-store-detail"
import {
  buildStoreDetailVM,
  type StoreDetailViewModel,
  type StoreMenuViewModel,
} from "@/lib/store-detail-vm"
import { useGetEventDetail } from "@/hooks/events/use-get-event-detail"
import { applyDiscountsToMenus } from "@/helpers/price"

type EventType = "discount" | "gift" | "combo"

const getEventIcon = (type: EventType) => {
  switch (type) {
    case "discount":
      return <Percent className="w-4 h-4" />
    case "gift":
      return <Gift className="w-4 h-4" />
    case "combo":
      return <Users className="w-4 h-4" />
    default:
      return <Percent className="w-4 h-4" />
  }
}

const getTimeLeft = (endDate: string) => {
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return "종료"
  if (days === 1) return "오늘 마감"
  return `${days}일 남음`
}

export default function StorePage() {
  const params = useParams();
  const storeId = params.id as string;

  // 1) 초기: store + menus + events 헤더만
  const { data, isLoading, error } = useGetStoreDetail(
    includeMenusAndEvents(storeId, true),
    { select: (resp) => buildStoreDetailVM(resp, null) }
  )
  const vm = data as StoreDetailViewModel | undefined

  // 이미지 갤러리(서버가 여러 이미지를 주지 않으면 썸네일 하나만 사용)
  const images = useMemo(() => {
    if (!vm) return ["/placeholder.svg"]
    return [vm.storeThumbnail || "/placeholder.svg"]
  }, [vm])
  const [selectedImage, setSelectedImage] = useState(0)

  // 좋아요/이벤트 선택/카트
  const [isLiked, setIsLiked] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [cart, setCart] = useState<Record<string, number>>({})

  // 2) 이벤트 상세는 선택 시에만 조회
  const { data: eventDetail } = useGetEventDetail(
    { id: selectedEventId || "", childActive: true },
    { enabled: !!selectedEventId }
  )

  // 이벤트 타입 추론 (상세에 따라)
  const selectedEventType: EventType | null = useMemo(() => {
    if (!eventDetail) return null
    const hasD = (eventDetail.discounts?.length ?? 0) > 0
    const hasG = (eventDetail.giftGroups?.length ?? 0) > 0
    if (hasD && hasG) return "combo"
    if (hasD) return "discount"
    if (hasG) return "gift"
    return "discount" // 기본
  }, [eventDetail])

  // 3) 선택 이벤트의 할인으로 메뉴 가격 재계산
  const menusForRender: StoreMenuViewModel[] = useMemo(() => {
    if (!vm) return []
    if (!eventDetail?.discounts?.length) return vm.menus
    const base = vm.menus.map((m) => ({
      id: m.id,
      name: m.name,
      originalPrice: m.originalPrice,
      thumbnail: m.thumbnail,
      description: m.description,
      category: m.category,
    }))
    const mixed = applyDiscountsToMenus(base, eventDetail.discounts)
    return mixed.map((m) => ({
      id: m.id,
      name: m.name,
      originalPrice: m.originalPrice,
      discountPrice: m.discountPrice,
      discountRate: m.discountRate,
      thumbnail: m.thumbnail,
      description: m.description,
      category: m.category,
    }))
  }, [vm, eventDetail])

  // 카트 조작/합계
  const addToCart = (menuId: string) => setCart((p) => ({ ...p, [menuId]: (p[menuId] || 0) + 1 }))
  const removeFromCart = (menuId: string) =>
    setCart((p) => {
      const n = { ...p }
      if ((n[menuId] ?? 0) > 1) n[menuId] -= 1
      else delete n[menuId]
      return n
    })
  const getTotalItems = () => Object.values(cart).reduce((s, c) => s + c, 0)
  const getTotalPrice = () =>
    menusForRender.reduce((sum, m) => sum + (cart[m.id] ?? 0) * m.discountPrice, 0)

  const handleGetCoupon = () => {
    if (!vm) return
    const selectedMenuItems = Object.entries(cart).map(([menuId, count]) => {
      const menu = menusForRender.find((m) => m.id === menuId)!
      return {
        id: menu.id,
        name: menu.name,
        quantity: count,
        finalPrice: menu.discountPrice,
        originalPrice: menu.originalPrice,
        thumbnail: menu.thumbnail,
      }
    })
    localStorage.setItem("selectedEvent", JSON.stringify(eventDetail ?? null))
    localStorage.setItem("selectedMenuItems", JSON.stringify(selectedMenuItems))
    localStorage.setItem("totalPrice", JSON.stringify(getTotalPrice()))
    localStorage.setItem(
      "storeInfo",
      JSON.stringify({ id: vm.id, name: vm.name, address: vm.address })
    )
  }

  if (isLoading || !vm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">불러오는 중…</h1>
          <p className="text-gray-600">가게 정보를 준비하고 있어요</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">가게를 찾을 수 없습니다</h1>
          <Link href="/home">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  const hasPartnership = !!vm.partnership

  return (
    <div className="min-h-screen bg-white max-w-xl mx-auto relative">
      {/* 헤더 */}
      <header className="bg-white sticky top-0 z-20 border-b border-gray-200 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/home">
                <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-800">가게 정보</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-lg">
                <Share2 className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsLiked((v) => !v)}
              >
                <Heart className={`w-6 h-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 이미지 갤러리 */}
      <div className="relative">
        <div className="h-64 bg-gray-200 relative overflow-hidden">
          <img
            src={images[selectedImage] || "/placeholder.svg"}
            alt={vm.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={index}
                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                  selectedImage === index ? "border-white shadow-lg" : "border-white/50"
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
      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h1 className="text-2xl font-bold text-gray-800">{vm.name}</h1>
              {hasPartnership && (
                <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">
                  제휴
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{vm.distanceText ?? "거리 정보 없음"}</span>
              </div>
              <Badge variant="outline" className="border-gray-300 text-gray-600">
                {vm.category}
              </Badge>
            </div>
          </div>
        </div>

        {/* 설명이 필요하다면 VM에 description을 추가해 렌더하세요 */}
        {/* <p className="text-gray-600 leading-relaxed">{vm.description}</p> */}
      </div>

      {/* 이벤트 선택 */}
      <div className="px-4 py-6 pb-24">
        {vm.events.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">이벤트 선택</h3>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-lg bg-white text-gray-800 font-medium appearance-none cursor-pointer hover:border-blue-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="">이벤트를 선택하세요</option>
                {vm.events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                    {typeof event.maxDiscountRate === "number" && event.maxDiscountRate > 0
                      ? ` - 최대 ${event.maxDiscountRate}%`
                      : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {selectedEventId && eventDetail && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">{eventDetail.event.title}</h4>
                    {("description" in eventDetail.event) && (eventDetail as any).event.description && (
                      <p className="text-sm text-blue-700">{(eventDetail as any).event.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-blue-600 text-white flex items-center gap-1">
                        {getEventIcon(selectedEventType ?? "discount")}
                        {selectedEventType === "discount" &&
                          `할인 적용 (${eventDetail.discounts?.length ?? 0}개 메뉴)`}
                        {selectedEventType === "gift" &&
                          `증정 (${eventDetail.giftGroups?.length ?? 0}개 그룹)`}
                        {selectedEventType === "combo" && `할인 + 증정`}
                      </Badge>
                      <div className="flex items-center gap-1 text-orange-600 font-medium">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{getTimeLeft(eventDetail.event.endDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 메뉴 */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 mb-6">메뉴</h3>
          {menusForRender.map((item) => {
            const cartCount = cart[item.id] || 0
            const showDiscount = (item.discountRate ?? 0) > 0

            return (
              <Card key={item.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-lg mb-2">{item.name}</h4>
                      {item.description && <p className="text-gray-600 mb-4">{item.description}</p>}
                      <div className="flex items-center gap-3">
                        {showDiscount ? (
                          <>
                            <span className="text-gray-400 line-through font-medium">
                              {item.originalPrice.toLocaleString()}원
                            </span>
                            <span className="text-xl font-bold text-blue-600">
                              {item.discountPrice.toLocaleString()}원
                            </span>
                            <Badge className="bg-blue-600 text-white font-medium">
                              {item.discountRate}% 할인
                            </Badge>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-gray-900">
                            {item.originalPrice.toLocaleString()}원
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {cartCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 bg-transparent"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{cartCount}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 bg-transparent"
                            onClick={() => addToCart(item.id)}
                            disabled={!selectedEventId}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToCart(item.id)}
                          disabled={!selectedEventId}
                          className="disabled:opacity-50"
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

        {/* 카트 요약 및 쿠폰 생성 버튼 */}
        {getTotalItems() > 0 && (
          <div className="min-h-screen bg-white max-w-xl mx-auto relative fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-800">{getTotalItems()}개 선택</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div />
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">{getTotalPrice().toLocaleString()}원</div>
                {selectedEventType === "discount" && (
                  <div className="text-sm text-blue-600">할인 적용됨</div>
                )}
              </div>
            </div>
            <Link href={`/coupon/${vm.id}`} onClick={handleGetCoupon}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={!selectedEventId}>
                <Ticket className="w-4 h-4 mr-2" />
                교환권 발급받기
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}