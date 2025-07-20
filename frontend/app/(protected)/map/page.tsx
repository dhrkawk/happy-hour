"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, MapPin, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import BottomNavigation from "@/components/bottom-navigation"
import CategoryFilter from "@/components/category-filter"
import { storesData } from "@/lib/store-data"
import NaverMap from "@/components/map/naver-map"
import NaverMapScript from "@/components/map/naver-map-script"

// 더미 데이터 (거리순으로 정렬)
const allStores = Object.values(storesData)
  .map((store) => ({
    ...store,
    lat: 37.5665 + (Math.random() - 0.5) * 0.01, // 랜덤 위치
    lng: 126.978 + (Math.random() - 0.5) * 0.01,
  }))
  .sort((a, b) => a.distance - b.distance)

interface UserLocation {
  lat: number
  lng: number
  address?: string
}

export default function MapPage() {
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("전체")
  const [filteredStores, setFilteredStores] = useState(allStores)

  // 사용자 위치 가져오기
  const getUserLocation = () => {
    setLocationLoading(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("위치 서비스가 지원되지 않습니다")
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const address = data.address
          const locationString = `${address.city || ""} ${address.road || address.suburb || address.neighbourhood || ""}`.trim()

          setUserLocation({
            lat: latitude,
            lng: longitude,
            address: locationString || "위치를 찾을 수 없습니다.",
          })
        } catch (error) {
          console.error("주소 변환 실패:", error)
          setUserLocation({
            lat: latitude,
            lng: longitude,
            address: `위도: ${latitude.toFixed(4)}, 경도: ${longitude.toFixed(4)}`,
          })
        }

        setLocationLoading(false)
      },
      (error) => {
        let errorMessage = "위치를 가져올 수 없습니다"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "위치 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "위치 정보를 사용할 수 없습니다"
            break
          case error.TIMEOUT:
            errorMessage = "위치 요청 시간이 초과되었습니다"
            break
        }

        setLocationError(errorMessage)
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5분
      },
    )
  }

  // 컴포넌트 마운트 시 위치 가져오기
  useEffect(() => {
    getUserLocation()
  }, [])

  // 카테고리 필터링
  useEffect(() => {
    if (selectedCategory === "전체") {
      setFilteredStores(allStores)
    } else {
      setFilteredStores(allStores.filter((store) => store.category === selectedCategory))
    }
    // 필터링 시 선택된 가게 초기화
    setSelectedStore(null)
  }, [selectedCategory])

  // 거리 계산 함수 (하버사인 공식)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
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
  const storesWithRealDistance = userLocation
    ? filteredStores
        .map((store) => ({
          ...store,
          distance: calculateDistance(userLocation.lat, userLocation.lng, store.lat, store.lng),
        }))
        .sort((a, b) => a.distance - b.distance)
    : filteredStores

  return (
    <>
      <NaverMapScript />
      <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-teal-100 relative z-10 safe-area-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link href="/home">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">할인 가게 지도</h1>
                {userLocation && <p className="text-xs text-gray-500">{userLocation.address}</p>}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={getUserLocation} disabled={locationLoading}>
              {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>

          {/* 카테고리 필터 */}
          <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>
      </header>

      {/* 위치 오류 메시지 */}
      {locationError && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{locationError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={getUserLocation}
            className="mt-2 text-red-600 border-red-300 bg-transparent"
          >
            다시 시도
          </Button>
        </div>
      )}

      {/* 지도 영역 */}
      <div className="relative h-[60vh] bg-gray-200">
        <NaverMap userLocation={userLocation} />

        {/* 가게 핀들 */}
        {storesWithRealDistance.map((store, index) => (
          <button
            key={store.id}
            className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg transition-transform ${
              selectedStore === store.id ? "bg-orange-500 scale-125" : "bg-teal-500"
            }`}
            style={{
              left: `${25 + index * 15}%`,
              top: `${35 + index * 12}%`,
            }}
            onClick={() => setSelectedStore(selectedStore === store.id ? null : store.id)}
          >
            {store.discount}%
          </button>
        ))}

        {/* 내 위치 핀 */}
        {userLocation && (
          <div
            className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"
            style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
          >
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
          </div>
        )}
      </div>

      {/* 선택된 가게 정보 */}
      {selectedStore && (
        <div className="absolute bottom-24 left-4 right-4 z-10">
          <div className="mobile-container mx-auto px-4">
            {storesWithRealDistance
              .filter((store) => store.id === selectedStore)
              .map((store) => (
                <Card key={store.id} className="border-teal-200 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{store.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            {store.distance.toFixed(1)}km
                          </div>
                          <span className="text-sm text-gray-400">{store.category}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white">{store.discount}% 할인</Badge>
                          <span className="text-sm text-gray-500">{store.timeLeft} 남음</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400 line-through">
                          {store.originalPrice.toLocaleString()}원
                        </div>
                        <div className="text-lg font-bold text-teal-600">{store.discountPrice.toLocaleString()}원</div>
                      </div>
                    </div>
                    <Link href={`/store/${store.id}`}>
                      <Button className="w-full mt-3 bg-teal-500 hover:bg-teal-600 text-white">자세히 보기</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

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
          storesWithRealDistance.map((store) => (
            <Link key={store.id} href={`/store/${store.id}`}>
              <Card className="border-teal-100 hover:shadow-md transition-shadow card-touch">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{store.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-orange-500 text-white text-xs">{store.discount}% 할인</Badge>
                        <span className="text-sm text-gray-500">{store.distance.toFixed(1)}km</span>
                        <span className="text-xs text-gray-400">{store.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-teal-600">{store.discountPrice.toLocaleString()}원</div>
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
    </div>
    </>
  )
}
