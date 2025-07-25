"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, MapPin, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import BottomNavigation from "@/components/bottom-navigation"
import CategoryFilter from "@/components/category-filter"
import { createClient } from "@/lib/supabase/client"
import KakaoMap from "@/components/map/kakao-map"
import { useAppContext } from "@/contexts/app-context"
import { LocationErrorBanner } from "@/components/location-error-banner"
import { motion, AnimatePresence } from "framer-motion"

// 남은 시간을 계산하여 보기 좋은 형식으로 반환
function formatTimeLeft(endTime: string): string {
  const now = new Date()
  const end = new Date(endTime)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) {
    return "할인 종료"
  }

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}일 남음`
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}시간 ${remainingMinutes}분 남음`
  } else if (minutes > 0) {
    return `${minutes}분 남음`
  } else {
    return `${seconds}초 남음`
  }
}

export default function MapPage() {
  const { appState, fetchLocation } = useAppContext()
  const { coordinates, address, loading: locationLoading, error: locationError, lastUpdated } = appState.location

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("전체")
  const [allFetchedStores, setAllFetchedStores] = useState<any[]>([])
  const [filteredStores, setFilteredStores] = useState<any[]>([])

  // Fetch stores from Supabase
  useEffect(() => {
    const fetchStores = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("stores")
        .select(`
          id,
          name,
          category,
          address,
          store_thumbnail,
          lat,
          lng,
          discounts(
            discount_rate,
            start_time,
            end_time,
            store_menus(price)
          )
        `)
        .eq('activated', true) /* activated == true 인 가게만 표시 */
        .filter('discounts.start_time', 'lte', new Date().toISOString())
        .filter('discounts.end_time', 'gte', new Date().toISOString())
        .order('end_time', { foreignTable: 'discounts', ascending: true })

      if (error) {
        console.error("Error fetching stores:", error)
      } else {
        const formattedData = data
          .map(store => {
            const activeDiscount = store.discounts?.[0] || null
            const menu = activeDiscount?.store_menus || null
            const originalPrice = menu?.price ?? 0
            const discountRate = activeDiscount?.discount_rate ?? 0
            const discountPrice = originalPrice * (1 - discountRate / 100)
            const endTime = activeDiscount?.end_time ?? ""

            // Removed menuThumbnails as thumbnail is no longer selected
            const menuThumbnails = Array.isArray(activeDiscount?.store_menus)
              ? activeDiscount.store_menus.map((menu: any) => menu.thumbnail).filter(Boolean)
              : (activeDiscount?.store_menus?.thumbnail ? [activeDiscount.store_menus.thumbnail] : []);
            const imageThumbnails = [store.store_thumbnail, ...menuThumbnails].filter(Boolean)

            return {
              ...store,
              lat: parseFloat(store.lat),
              lng: parseFloat(store.lng),
              discount: discountRate,
              originalPrice: originalPrice,
              discountPrice: discountPrice,
              timeLeft: endTime ? formatTimeLeft(endTime) : "정보 없음",
              image_thumbnails: imageThumbnails,
            }
          })
        setAllFetchedStores(formattedData)
      }
    }

    fetchStores()
  }, [])

  // 카테고리 필터링
  useEffect(() => {
    if (selectedCategory === "전체") {
      setFilteredStores(allFetchedStores)
    } else {
      setFilteredStores(allFetchedStores.filter((store: any) => store.category === selectedCategory))
    }
    setSelectedStoreId(null)
  }, [selectedCategory, allFetchedStores])

  // 거리 계산 함수 (하버사인 공식)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      return NaN
    }
    const R = 6371 // 지구 반지름 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // 실제 위치 기반으로 거리 업데이트
  const storesWithRealDistance = filteredStores
    .map(store => {
      const distance = coordinates ? calculateDistance(coordinates.lat, coordinates.lng, store.lat, store.lng) : NaN
      return {
        ...store,
        distance: distance,
      }
    })
    .sort((a, b) => a.distance - b.distance)

  const selectedStore = storesWithRealDistance.find(store => store.id === selectedStoreId)

  return (
    <div className="min-h-screen bg-white max-w-xl mx-auto relative overflow-hidden">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-teal-100 relative z-10 safe-area-top">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link href="/home">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-800">할인 가게 지도</h1>
                <p className="text-xs text-gray-500 truncate">
                  {locationLoading ? "위치 찾는 중..." : address || "주소 정보 없음"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end ml-2">
              <Button variant="ghost" size="sm" onClick={() => fetchLocation()} disabled={locationLoading}>
                {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              {lastUpdated && (
                <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                  마지막 업데이트: {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          </div>

          {/* 카테고리 필터 */}
          <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>
      </header>

      {/* 위치 오류 메시지 */}
      {locationError && <LocationErrorBanner></LocationErrorBanner>}

      {/* 지도 영역 */}
      <div className="relative h-[60vh] bg-gray-200">
        <KakaoMap
          userLocation={coordinates}
          stores={storesWithRealDistance}
          selectedStoreId={selectedStoreId}
          onSelectStore={setSelectedStoreId}
        />
      </div>

      {/* 가게 리스트 */}
      <div className="px-4 py-4 space-y-3 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedCategory === "전체" ? "근처 할인 가게" : `근처 ${selectedCategory} 가게`} (
            {storesWithRealDistance.length})
          </h2>
          <Badge variant="secondary" className="bg-teal-100 text-teal-700">
            거리순
          </Badge>
        </div>

        {storesWithRealDistance.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">해당 카테고리의 할인 가게가 없습니다</h3>
            <p className="text-gray-600 mb-4">다른 카테고리를 선택해보세요!</p>
            <Button onClick={() => setSelectedCategory("전체")} className="bg-teal-500 hover:bg-teal-600 text-white">
              전체 가게 보기
            </Button>
          </div>
        ) : (
          storesWithRealDistance.map(store => (
            <Link key={store.id} href={`/store/${store.id}`}>
              <Card
                className={`border-teal-100 hover:shadow-md transition-shadow card-touch ${
                  selectedStoreId === store.id ? "ring-2 ring-teal-400" : ""
                }`}
                onClick={() => setSelectedStoreId(store.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{store.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-orange-500 text-white text-xs">{store.discount}% 할인</Badge>
                        <span className="text-sm text-gray-500">
                          {typeof store.distance === "number" && !isNaN(store.distance)
                            ? `${store.distance.toFixed(1)}km`
                            : "거리 계산 중..."}
                        </span>
                        <span className="text-xs text-gray-400">{store.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-teal-600">
                        {store.discountPrice ? `${store.discountPrice.toLocaleString()}원` : "-"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation />

      {/* 선택된 가게 정보 (슬라이딩 모달) */}
      <AnimatePresence>
        {selectedStore && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-lg shadow-lg max-w-xl mx-auto"
          >
            <div className="relative z-50 p-4 pb-24">
              <Card key={selectedStore.id} className="border-none shadow-none">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{selectedStore.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          {selectedStore.distance.toFixed(1)}km
                        </div>
                        <span className="text-sm text-gray-400">{selectedStore.category}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                          {selectedStore.discount}% 할인
                        </Badge>
                        <span className="text-sm text-gray-500">{selectedStore.timeLeft}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 line-through">
                        {selectedStore.originalPrice.toLocaleString()}원
                      </div>
                      <div className="text-lg font-bold text-teal-600">
                        {selectedStore.discountPrice.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                  {/* Image Gallery */}
                  {selectedStore.image_thumbnails && selectedStore.image_thumbnails.length > 0 && (
                    <div className="flex overflow-x-auto space-x-2 p-2 -mx-2 mt-4">
                      {selectedStore.image_thumbnails.map((imageUrl: string, index: number) => (
                        <img
                          key={index}
                          src={imageUrl}
                          alt={`${selectedStore.name} image ${index + 1}`}
                          className="w-40 h-32 object-cover rounded-md flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}
                  <Link href={`/store/${selectedStore.id}`}>
                    <Button className="w-full mt-3 bg-teal-500 hover:bg-teal-600 text-white">
                      자세히 보기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}