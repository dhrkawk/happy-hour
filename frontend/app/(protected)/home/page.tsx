"use client"

import { useState, useEffect } from "react"
import { MapPin, Clock, RefreshCw, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import BottomNavigation from "@/components/bottom-navigation"
import CategoryFilter from "@/components/category-filter"
import { StoreCardSkeleton } from "@/components/store-card-skeleton"
import { useAppContext } from "@/contexts/app-context"
import { createClient } from "@/lib/supabase/client"
import { calculateDistance } from "@/lib/utils"
import type { StoreEntity } from "@/lib/entities/store.entity"
import { StoreCardViewModel, createStoreCardViewModel } from "@/lib/viewmodels/store-card.viewmodel"

// SWR을 위한 fetcher 함수
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const { appState, fetchLocation } = useAppContext()
  const { coordinates, address, loading: locationLoading, error: locationError, lastUpdated } = appState.location
  
  const [selectedCategory, setSelectedCategory] = useState<string>("전체")
  const [allViewModels, setAllViewModels] = useState<StoreCardViewModel[]>([])
  const [filteredViewModels, setFilteredViewModels] = useState<StoreCardViewModel[]>([])
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  // 1. 온보딩/로그인 여부 확인
  useEffect(() => {
    const checkOnboarding = async () => {
      if (localStorage.getItem("onboardingChecked") === "true") {
        setOnboardingChecked(true)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!profile) {
        router.push("/onboarding")
      } else {
        localStorage.setItem("onboardingChecked", "true")
        setOnboardingChecked(true)
      }
    }
    checkOnboarding()
  }, [router, supabase])

  // 2. SWR을 사용하여 API로부터 StoreEntity 데이터를 가져옵니다.
  // 온보딩이 확인되고, 사용자 위치가 있을 때만 데이터를 요청합니다.
  const shouldFetch = onboardingChecked && !!coordinates
  const { data: storeEntities, isLoading: loadingStores } = useSWR<StoreEntity[]>(
    shouldFetch ? "/api/store" : null,
    fetcher
  )

  // 3. 가져온 StoreEntity를 StoreCardViewModel로 변환합니다.
  useEffect(() => {
    if (storeEntities && coordinates) {
      // 거리순으로 정렬 후 ViewModel로 변환
      const sortedEntities = [...storeEntities].sort((a, b) => {
        const distA = calculateDistance(coordinates.lat, coordinates.lng, a.lat, a.lng)
        const distB = calculateDistance(coordinates.lat, coordinates.lng, b.lat, b.lng)
        return distA - distB
      })

      const viewModels = sortedEntities.map((entity) =>
        createStoreCardViewModel(entity, coordinates)
      )
      setAllViewModels(viewModels)
    }
  }, [storeEntities, coordinates])

  // 4. 카테고리에 따라 ViewModel을 필터링합니다.
  useEffect(() => {
    if (selectedCategory === "전체") {
      setFilteredViewModels(allViewModels)
    } else {
      setFilteredViewModels(
        allViewModels.filter((vm) => vm.category === selectedCategory)
      )
    }
  }, [selectedCategory, allViewModels])
  
  const isDataReady =
  onboardingChecked &&
  !locationLoading &&
  !!coordinates &&
  !!storeEntities &&
  !loadingStores

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
      <main className="px-4 py-4 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedCategory === "전체" ? "지금 할인 중인 가게" : `${selectedCategory} 할인 가게`} ({filteredViewModels.length})
          </h2>
          <Badge variant="secondary" className="bg-teal-100 text-teal-700">
            거리순
          </Badge>
        </div>

        {!isDataReady ? (
          Array.from({ length: 5 }).map((_, index) => <StoreCardSkeleton key={index} />)
        ) : filteredViewModels.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">해당 카테고리의 할인 가게가 없습니다</h3>
            <p className="text-gray-600 mb-4">다른 카테고리를 선택해보세요!</p>
            <Button onClick={() => setSelectedCategory("전체")} className="bg-teal-500 hover:bg-teal-600 text-white">
              전체 가게 보기
            </Button>
          </div>
        ) : (
          filteredViewModels.map((vm) => (
            <Link key={vm.id} href={`/store/${vm.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow border-teal-100">
                <CardContent className="p-0">
                  <div className="flex items-center">
                    <div className="w-20 h-20 bg-gray-200 flex-shrink-0">
                      <img
                        src={vm.thumbnailUrl}
                        alt={vm.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm">{vm.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {vm.distance}
                            </div>
                            <span className="text-xs text-gray-400">{vm.category}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                              {vm.maxDiscountRate ? <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs">최대 {vm.maxDiscountRate}% 할인</Badge> : null}
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {vm.timeLeftText}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400 line-through">
                            {vm.originalPrice?.toLocaleString()}원
                          </div>
                          <div className="text-sm font-bold text-teal-600">
                            {vm.discountPrice?.toLocaleString()}원
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
      </main>

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  )
}