"use client"

import { MapPin, RefreshCw, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StoreCard } from "@/components/store-card"
import BottomNavigation from "@/components/bottom-navigation"
import CategoryFilter from "@/components/category-filter"
import { StoreCardSkeleton } from "@/components/store-card-skeleton"
import { useAppContext } from "@/contexts/app-context"
import { useOnboardingCheck } from "@/hooks/use-onboarding-check"
import { useGetStoreList } from "@/hooks/use-get-store-list"
import { useFilteredStores } from "@/hooks/use-filtered-stores"

export default function HomePage() {
  const { appState, fetchLocation } = useAppContext()
  const { address, loading: locationLoading, error: locationError, lastUpdated } = appState.location;
  const { isReady: isOnboardingComplete } = useOnboardingCheck();
  const { stores: allViewModels, isLoading: storesLoading } = useGetStoreList();

    const { 
    finalViewModels, 
    selectedCategory, 
    setSelectedCategory, 
    selectedSorting, 
    setSelectedSorting 
  } = useFilteredStores(allViewModels);

  const isSkeletonLoading = !isOnboardingComplete || locationLoading || storesLoading;

  return (
    <div className="min-h-screen bg-white max-w-xl mx-auto relative">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-teal-600">아워캠퍼스</h1>
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
            {selectedCategory === "전체" ? "지금 할인 중인 가게" : `${selectedCategory} 할인 가게`} ({finalViewModels.length})
          </h2>
          <div className="flex items-center gap-2">
            {(["거리순", "할인순", "할인만", "제휴만"] as const).map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="bg-white vorder-gray-700 px-3 py-1 rounded-full"
              >
                <Button
                  variant="link"
                  className={`text-sm p-0 h-auto ${
                    selectedSorting === label ? "text-gray-800 font-semibold" : "text-gray-500"
                  }`}
                  onClick={() => setSelectedSorting(label)}
                >
                  {label}
                </Button>
              </Badge>
            ))}
          </div>
        </div>

        {isSkeletonLoading ? (
          Array.from({ length: 5 }).map((_, index) => <StoreCardSkeleton key={index} />)
        ) : finalViewModels.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">해당 카테고리의 할인 가게가 없습니다</h3>
            <p className="text-gray-600 mb-4">다른 카테고리를 선택해보세요!</p>
            <Button onClick={() => setSelectedCategory("전체")} className="bg-teal-500 hover:bg-teal-600 text-white">
              전체 가게 보기
            </Button>
          </div>
        ) : (
          finalViewModels.map((vm) => (
            <Link key={vm.id} href={`/store/${vm.id}`}>
              <StoreCard vm={vm} />
            </Link>
          ))
        )}
      </main>

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  )
}