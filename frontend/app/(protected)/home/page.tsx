"use client"

import { useState, useEffect } from "react"
import { MapPin, Clock, Map, Plus, RefreshCw, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import BottomNavigation from "@/components/bottom-navigation"
import CategoryFilter from "@/components/category-filter"
import { useAppContext } from "@/contexts/app-context"
import { createClient } from "@/lib/supabase/client"
import { StoreCardSkeleton } from "@/components/store-card-skeleton"

import { calculateDistance } from "@/lib/utils"

interface StoreData {
  id: string
  name: string
  category: string
  address: string
  thumbnail: string
  distance: number
  discount: number
  originalPrice: number
  discountPrice: number
  timeLeft: string
  lat: number
  lng: number
}

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
    return `${hours}시간 남음`
  } else if (minutes > 0) {
    return `${minutes}분 남음`
  } else {
    return `${seconds}초 남음`
  }
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const { appState, fetchLocation } = useAppContext()
  const { coordinates, address, loading: locationLoading, error: locationError, lastUpdated } = appState.location

  const [selectedCategory, setSelectedCategory] = useState<string>("전체")
  const [allStores, setAllStores] = useState<StoreData[]>([])
  const [filteredStores, setFilteredStores] = useState<StoreData[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      const cached = localStorage.getItem('onboardingChecked')
      if (cached === 'true') {
        setOnboardingChecked(true)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!profile) {
        router.push('/onboarding')
      } else {
        localStorage.setItem('onboardingChecked', 'true')
        setOnboardingChecked(true)
      }
    }

    checkOnboarding()
  }, [router, supabase])

  // 스토어 정보 불러오기 및 거리 계산
  useEffect(() => {
    if (!onboardingChecked) return

    const fetchStores = async () => {
      setLoadingStores(true)
      const { data, error } = await supabase
        .from("stores")
        .select("*, discounts(*, store_menus(*))")
        .eq('activated', true) //activated == true 인 가게만 home page에 표시

      if (error) {
        console.error("Error fetching stores from DB:", error)
        setAllStores([])
      } else {
        const userLat = coordinates?.lat
        const userLng = coordinates?.lng

        const transformedStores: StoreData[] = (data || []).map((store: any) => {
          const discount = store.discounts?.[0] || null
          const menu = discount?.store_menus || null
          const originalPrice = menu?.price ?? 0
          const discountRate = discount?.discount_rate ?? 0
          const discountPrice = originalPrice * (1 - discountRate / 100)

          const storeLat = store.lat ?? 0
          const storeLng = store.lng ?? 0
          const endTime = discount?.end_time ?? ""

          return {
            id: store.id,
            name: store.name,
            category: store.category,
            address: store.address,
            thumbnail: menu?.thumbnail || "/no-image.jpg",
            distance: coordinates ? calculateDistance(coordinates.lat, coordinates.lng, storeLat, storeLng) : 0,
            discount: discountRate,
            originalPrice: originalPrice,
            discountPrice: discountPrice,
            timeLeft: endTime ? formatTimeLeft(endTime) : "정보 없음",
            lat: storeLat,
            lng: storeLng,
          }
        }).sort((a, b) => a.distance - b.distance)

        setAllStores(transformedStores)
      }
      setLoadingStores(false)
    }

    if (coordinates) {
      fetchStores()
    }
  }, [onboardingChecked, coordinates, supabase])

  // 카테고리 필터링
  useEffect(() => {
    if (!onboardingChecked) return

    if (selectedCategory === "전체") {
      setFilteredStores(allStores)
    } else {
      setFilteredStores(allStores.filter((store) => store.category === selectedCategory))
    }
  }, [selectedCategory, allStores, onboardingChecked])

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white max-w-xl mx-auto relative">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-teal-100 sticky top-0 z-10">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-teal-600">해피아워</h1>
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1 truncate">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{locationLoading ? "위치 찾는 중..." : address || locationError}</span>
              </div>
            </div>
            <div className="flex flex-col items-end ml-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => fetchLocation()} disabled={locationLoading}>
                  {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
              </div>
              {lastUpdated && (
                <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                  마지막 업데이트: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>

      {/* 카테고리 필터 */}
      <div className="flex items-center gap-2 flex-wrap">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>
    </div>
      </header>

      {/* 가게 리스트 */}
      <div className="px-4 py-4 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedCategory === "전체" ? "지금 할인 중인 가게" : `${selectedCategory} 할인 가게`} ({filteredStores.length})
          </h2>
          <Badge variant="secondary" className="bg-teal-100 text-teal-700">
            거리순
          </Badge>
        </div>

        {loadingStores ? (
          Array.from({ length: 5 }).map((_, index) => <StoreCardSkeleton key={index} />)
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">해당 카테고리의 할인 가게가 없습니다</h3>
            <p className="text-gray-600 mb-4">다른 카테고리를 선택해보세요!</p>
            <Button onClick={() => setSelectedCategory("전체")} className="bg-teal-500 hover:bg-teal-600 text-white">
              전체 가게 보기
            </Button>
          </div>
        ) : (
          filteredStores.map((store) => (
            <Link key={store.id} href={`/store/${store.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow border-teal-100">
                <CardContent className="p-0">
                  <div className="flex items-center">
                    <div className="w-20 h-20 bg-gray-200 flex-shrink-0">
                      <img
                        src={store.thumbnail || "/no-image.jpg"}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm">{store.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {store.distance.toFixed(1)}km
                            </div>
                            <span className="text-xs text-gray-400">{store.category}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                              {store.discount}% 할인
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {store.timeLeft}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400 line-through">
                            {store.originalPrice?.toLocaleString()}원
                          </div>
                          <div className="text-sm font-bold text-teal-600">
                            {(store.originalPrice && store.discount)
                              ? (store.originalPrice * (1 - store.discount / 100)).toLocaleString()
                              : store.discountPrice.toLocaleString()
                            }원
                          </div>
                        </div>
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

      {/* 등록 버튼 (플로팅) */}
      <Link href="/home/create">
        <Button
          className="absolute bottom-24 right-4 w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-lg flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  )
}
