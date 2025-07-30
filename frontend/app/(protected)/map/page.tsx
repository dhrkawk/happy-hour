"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowLeft, MapPin, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import BottomNavigation from "@/components/bottom-navigation"
import CategoryFilter from "@/components/category-filter"
import KakaoMap from "@/components/map/kakao-map"
import { useAppContext } from "@/contexts/app-context"
import { LocationErrorBanner } from "@/components/location-error-banner"
import { motion, AnimatePresence } from "framer-motion"
import { StoreCardViewModel, createStoreCardViewModel } from "@/lib/viewmodels/store-card.viewmodel"
import type { StoreEntity } from "@/lib/entities/store.entity"
import { StoreCard } from "@/components/store-card"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MapPage() {
  const { appState, fetchLocation } = useAppContext()
  const { coordinates, address, loading: locationLoading, error: locationError, lastUpdated } = appState.location

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("전체")
  const [allViewModels, setAllViewModels] = useState<StoreCardViewModel[]>([])
  const [selectedSorting, setSelectedSorting] = useState<"거리순"|"할인순">("할인순");


  // Fetch stores from Supabase
  const shouldFetch = !!coordinates
  const { data: storeEntities, isLoading: loadingStores } = useSWR<StoreEntity[]>(
    shouldFetch ? "/api/store" : null,
    fetcher
  )

    // 3. 가져온 StoreEntity를 StoreCardViewModel로 변환합니다.
    useEffect(() => {
      if (storeEntities && coordinates) {
        const storeList = storeEntities.map((entity) =>
          createStoreCardViewModel(entity, coordinates)
        )
        const viewModels_distance = StoreCardViewModel.sortByDistance(storeList)
        const viewModels = StoreCardViewModel.sortByDiscount(viewModels_distance)
        setAllViewModels(viewModels)
      }
    }, [storeEntities, coordinates])

    // 필터링 + 정렬을 통합 처리한 최종 ViewModel 리스트
    const finalViewModels = useMemo(() => {
    // 1. 카테고리 필터링
    const categoryFiltered = StoreCardViewModel.filterByCategory(allViewModels, selectedCategory);

    // 2. 정렬
    if (selectedSorting === "거리순") {
      return StoreCardViewModel.sortByDistance(categoryFiltered);
    } else if (selectedSorting === "할인순") {
      return StoreCardViewModel.sortByDiscount(categoryFiltered);
    } else {
      return categoryFiltered;
    }
  }, [selectedCategory, selectedSorting, allViewModels, coordinates]);


  const selectedStore = finalViewModels.find(store => store.id === selectedStoreId)

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
          stores={finalViewModels}
          selectedStoreId={selectedStoreId}
          onSelectStore={setSelectedStoreId}
        />
      </div>

      {/* 가게 리스트 */}
      <div className="px-4 py-4 space-y-3 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedCategory === "전체" ? "근처 할인 가게" : `근처 ${selectedCategory} 가게`} (
            {finalViewModels.length})
          </h2>
          <div className="flex items-center gap-2">
            {(["거리순", "할인순"] as const).map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="bg-teal-100 px-3 py-1 rounded-full"
              >
                <Button
                  variant="link"
                  className={`text-sm p-0 h-auto ${
                    selectedSorting === label ? "text-teal-600 font-semibold" : "text-gray-500"
                  }`}
                  onClick={() => setSelectedSorting(label)}
                >
                  {label}
                </Button>
              </Badge>
            ))}
          </div>
        </div>

        {finalViewModels.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">해당 카테고리의 할인 가게가 없습니다</h3>
            <p className="text-gray-600 mb-4">다른 카테고리를 선택해보세요!</p>
            <Button onClick={() => setSelectedCategory("전체")} className="bg-teal-500 hover:bg-teal-600 text-white">
              전체 가게 보기
            </Button>
          </div>
        ) : (
          finalViewModels.map(store => (
            <Link key={store.id} href={`/store/${store.id}`}>
              <StoreCard vm={store}></StoreCard>
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
              <StoreCard vm={selectedStore} />
              <Link href={`/store/${selectedStore.id}`}>
                <Button className="w-full mt-3 bg-teal-500 hover:bg-teal-600 text-white">
                  자세히 보기
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}