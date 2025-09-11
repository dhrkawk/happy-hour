"use client";

import { useRef, useState } from "react";
import { Loader2, RefreshCw, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/bottom-navigation";
import CategoryFilter from "@/components/category-filter";
import KakaoMap from "@/components/map/kakao-map";
import { StoreCardSkeleton } from "@/components/store-card-skeleton";
import { LocationErrorBanner } from "@/components/location-error-banner";
import { useAppContext } from "@/contexts/app-context";
import { useGetStoresWithEvents, useSortedAndFilteredStoreList } from "@/hooks/usecases/stores.usecase";
import { StoreCard2 } from "@/components/store-card2";

export default function MapPage() {
  const { appState, fetchLocation } = useAppContext();
  const { coordinates, address, loading: locationLoading, error: locationError, lastUpdated } =
    appState.location ?? {};

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedSorting, setSelectedSorting] =
    useState<"거리순" | "할인순" | "할인만" | "제휴만">("할인순");

  const { data, isLoading: storesLoading } = useGetStoresWithEvents(true);
  const storeList = useSortedAndFilteredStoreList(data ?? [], selectedCategory, selectedSorting);
  const isLoading = locationLoading || storesLoading;


  // ✅ 스크롤 컨테이너(main)와 지도 앵커 ref
  const mainRef = useRef<HTMLDivElement>(null);
  const mapTopRef = useRef<HTMLDivElement>(null);

  const handleSelectFromList = (id: string) => {
    setSelectedStoreId(id);

    // 1) 앵커 기준 스크롤 (컨테이너/윈도우 어느 쪽이든 잘 동작)
    mapTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    // 2) 컨테이너 직접 스크롤 (컨테이너가 main일 때)
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
      // smooth 미지원/먹히지 않을 때 즉시 이동 fallback
      setTimeout(() => {
        if (mainRef.current && mainRef.current.scrollTop > 0) {
          mainRef.current.scrollTop = 0;
        }
      }, 250);
    }

    // 3) 그래도 안되면 window 스크롤 (스크롤이 window에 걸린 경우)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto max-w-xl bg-gray-50 grid min-h-[100dvh] grid-rows-[auto,1fr,auto]">
      {/* 상단 고정: 헤더 + 카테고리 필터 */}
      <div className="bg-white border-b border-teal-100 shadow-sm sticky top-0 z-10">
        <header className="px-4 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">할인 가게 지도</h1>
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1 truncate">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {locationLoading ? "위치 찾는 중..." : address || locationError || "위치 정보 없음"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchLocation()}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            {lastUpdated && (
              <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                마지막 업데이트:{" "}
                {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        </header>

        <div className="px-4 pb-3">
          <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>
      </div>

      {/* ✅ 스크롤 영역: 지도 + 리스트 */}
      <main ref={mainRef} className="overflow-y-auto">

        {locationError && (
          <div className="px-4 pt-3">
            <LocationErrorBanner />
          </div>
        )}
        <div ref={mapTopRef} className="scroll-mt-20" />

        {/* 지도 */}
        <div className="px-4 pt-3">
          <div className="relative h-[56vh] sm:h-[60vh]">
            <KakaoMap
              userLocation={coordinates}
              stores={storeList}
              selectedStoreId={selectedStoreId}
              onSelectStore={setSelectedStoreId}
            />
          </div>
        </div>

        {/* 리스트 */}
        <div className="px-4 py-4 space-y-3 pb-28">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-m font-semibold text-gray-800">가게 목록</h2>
            <div className="flex items-center gap-2">
              {(["할인순", "할인만", "제휴만", "거리순"] as const).map((label) => (
                <Badge key={label} variant="secondary" className="bg-white px-3 py-1 rounded-full">
                  <button
                    className={`text-sm p-0 h-auto ${
                      selectedSorting === label ? "text-gray-800 font-semibold" : "text-gray-500"
                    }`}
                    onClick={() => setSelectedSorting(label)}
                  >
                    {label}
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StoreCardSkeleton key={i} />)
          ) : storeList.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-gray-600">근처에 표시할 가게가 없어요.</p>
            </div>
          ) : (
            storeList.map((item) => (
              <StoreCard2
                key={item.id}
                vm={item}
                selected={selectedStoreId === item.id}
                onSelect={handleSelectFromList}
              />
            ))
          )}
        </div>
      </main>

      {/* 하단 네비 고정 */}
      <div className="bg-white border-t border-gray-100">
        <BottomNavigation />
      </div>
    </div>
  );
}