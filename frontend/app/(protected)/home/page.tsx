"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, RefreshCw, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoreCard } from "@/components/store-card";
import { StoreCardSkeleton } from "@/components/store-card-skeleton";
import BottomNavigation from "@/components/bottom-navigation";
import CategoryFilter from "@/components/category-filter";

import { useAppContext } from "@/contexts/app-context";
import { useOnboardingCheck } from "@/hooks/use-onboarding-check";
import { useGetStoresWithEvents } from "@/hooks/usecases/use-stores";
import { distanceKm } from "@/lib/utils";

export default function HomePage() {
  const { appState, fetchLocation } = useAppContext();
  const { address, loading: locationLoading, error: locationError, lastUpdated, coordinates } =
    appState.location ?? {};
  const { isReady: isOnboardingComplete } = useOnboardingCheck();
  

  // 화면 상태 (카테고리/정렬)
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [selectedSorting, setSelectedSorting] = useState<"거리순" | "할인순" | "할인만" | "제휴만">("거리순");

  // 서버에서 최소 데이터만: 활성 스토어 + 활성 이벤트 포함
  const {data, isLoading, error} = useGetStoresWithEvents(true);

  const filteredAndSorted = useMemo(() => {
    let rows = [...(data ?? [])];
  
    // 1) 카테고리 필터
    if (selectedCategory !== "전체") {
      rows = rows.filter(r => (r.category ?? "기타") === selectedCategory);
    }
  
    // 2) “할인만” / “제휴만” 토글 필터
    if (selectedSorting === "할인만") {
      rows = rows.filter(r => (r.maxDiscountRate ?? 0) > 0);
    }
    if (selectedSorting === "제휴만") {
      rows = rows.filter(r => !!r.partnership);
    }
  
    // 3) 정렬
    if (selectedSorting === "거리순") {
      // 훅에서 distance를 이미 넣어줬으면 그 값 사용, 없으면 여기서 계산
      if (coordinates) {
        rows = rows
          .map(r => {
            const dist = (r as any).distance ?? distanceKm(
              { lat: coordinates.lat, lng: coordinates.lng },
              { lat: r.lat,        lng: r.lng }
            );
            return { ...r, _dist: dist };
          })
          .sort((a:any, b:any) => (a._dist ?? Infinity) - (b._dist ?? Infinity))
          .map(({ _dist, ...rest }) => rest);
      } else {
        // 좌표 없으면 이름순 등 안정적인 fallback
        rows.sort((a, b) => a.name.localeCompare(b.name));
      }
    } else if (selectedSorting === "할인순") {
      rows.sort((a, b) => {
        const da = a.maxDiscountRate ?? 0;
        const db = b.maxDiscountRate ?? 0;
        if (db !== da) return db - da; // 할인 높은 순
        // 동률이면 가까운 순(좌표 있을 때만)
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

  const isSkeletonLoading = !isOnboardingComplete || locationLoading || isLoading;

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
                <span className="truncate">
                  {locationLoading ? "위치 찾는 중..." : address || locationError || "위치 정보 없음"}
                </span>
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
                  마지막 업데이트:{" "}
                  {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
          </div>
        </div>
      </header>

      {/* 가게 리스트 */}
      <main className="px-4 py-4 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedCategory === "전체" ? "지금 할인 중인 가게" : `${selectedCategory} 할인 가게`}
          </h2>
          <div className="flex items-center gap-2">
            {(["거리순", "할인순", "할인만", "제휴만"] as const).map((label) => (
              <Badge key={label} variant="secondary" className="bg-white vorder-gray-700 px-3 py-1 rounded-full">
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
        ) : filteredAndSorted.length==0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">해당 카테고리의 할인 가게가 없습니다</h3>
            <p className="text-gray-600 mb-4">다른 카테고리를 선택해보세요!</p>
            <Button onClick={() => setSelectedCategory("전체")} className="bg-teal-500 hover:bg-teal-600 text-white">
              전체 가게 보기
            </Button>
          </div>
        ) : (
          filteredAndSorted.map((item) => (
            <Link key={item.id} href={`/store/${item.id}`}>
              <StoreCard vm={item} />
            </Link>
          ))
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}