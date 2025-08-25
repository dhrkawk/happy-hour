"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/bottom-navigation";
import CategoryFilter from "@/components/category-filter";
import KakaoMap from "@/components/map/kakao-map";
import { StoreCard } from "@/components/store-card";
import { StoreCardSkeleton } from "@/components/store-card-skeleton";
import { LocationErrorBanner } from "@/components/location-error-banner";

import { useAppContext } from "@/contexts/app-context";
import { useOnboardingCheck } from "@/hooks/use-onboarding-check";
import { useGetStoresWithEvents } from "@/hooks/usecases/use-stores";
import { distanceKm } from "@/lib/utils";
import { type StoreListItemVM } from "@/lib/vm/store.vm";

export default function MapPage() {
  const { appState, fetchLocation } = useAppContext();
  const { coordinates, address, loading: locationLoading, error: locationError, lastUpdated } =
    appState.location ?? {};
  const { isReady: isOnboardingComplete } = useOnboardingCheck();

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedSorting, setSelectedSorting] =
    useState<"거리순" | "할인순" | "할인만" | "제휴만">("거리순");

  // 서버 데이터 (VM으로 변환됨)
  const { data, isLoading: storesLoading } = useGetStoresWithEvents(true);

  // ⭐ 여기서 필터링/정렬
  const filteredAndSorted: StoreListItemVM[] = useMemo(() => {
    let rows = [...(data ?? [])];

    // 카테고리 필터
    if (selectedCategory !== "전체") {
      rows = rows.filter((r) => (r.category ?? "기타") === selectedCategory);
    }

    // “할인만” / “제휴만”
    if (selectedSorting === "할인만") {
      rows = rows.filter((r) => (r.maxDiscountRate ?? 0) > 0);
    }
    if (selectedSorting === "제휴만") {
      rows = rows.filter((r) => !!r.partnership);
    }

    // 정렬
    if (selectedSorting === "거리순") {
      if (coordinates) {
        rows = rows
          .map((r) => {
            const dist = distanceKm(coordinates, { lat: r.lat, lng: r.lng });
            return { ...r, _dist: dist };
          })
          .sort((a: any, b: any) => (a._dist ?? Infinity) - (b._dist ?? Infinity))
          .map(({ _dist, ...rest }) => rest);
      } else {
        rows.sort((a, b) => a.name.localeCompare(b.name));
      }
    } else if (selectedSorting === "할인순") {
      rows.sort((a, b) => {
        const da = a.maxDiscountRate ?? 0;
        const db = b.maxDiscountRate ?? 0;
        if (db !== da) return db - da;
        if (coordinates) {
          const ad = distanceKm(coordinates, { lat: a.lat, lng: a.lng });
          const bd = distanceKm(coordinates, { lat: b.lat, lng: b.lng });
          return ad - bd;
        }
        return a.name.localeCompare(b.name);
      });
    }

    return rows;
  }, [data, selectedCategory, selectedSorting, coordinates]);

  const isLoading = !isOnboardingComplete || locationLoading || storesLoading;
  const selectedStore = filteredAndSorted.find((s) => s.id === selectedStoreId) ?? null;

  return (
    <div className="min-h-screen bg-white max-w-xl mx-auto relative overflow-hidden">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-teal-100 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">할인 가게 지도</h1>
              <p className="text-xs text-gray-500 truncate">
                {locationLoading ? "위치 찾는 중..." : address || "주소 정보 없음"}
              </p>
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
                {new Date(lastUpdated).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>
        </div>
        <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      </header>

      {locationError && <LocationErrorBanner />}

      {/* 지도 */}
      <div className="px-4 relative h-[60vh]">
        <KakaoMap
          userLocation={coordinates}
          stores={filteredAndSorted}
          selectedStoreId={selectedStoreId}
          onSelectStore={setSelectedStoreId}
        />
      </div>

      {/* 리스트 */}
      <div className="px-4 py-4 space-y-3 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedCategory === "전체" ? "근처 할인 가게" : `근처 ${selectedCategory} 가게`}{" "}
            ({filteredAndSorted.length})
          </h2>
          <div className="flex items-center gap-2">
            {(["거리순", "할인순", "할인만", "제휴만"] as const).map((label) => (
              <Badge key={label} variant="secondary" className="bg-white px-3 py-1 rounded-full">
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

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StoreCardSkeleton key={i} />)
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-gray-600">근처에 표시할 가게가 없어요.</p>
          </div>
        ) : (
          filteredAndSorted.map((item) => (
            <Link key={item.id} href={`/store/${item.id}`}>
              <StoreCard vm={item} />
            </Link>
          ))
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}